import os
from flask import Flask, request, jsonify, render_template, redirect, url_for, session
from flask_cors import CORS
from werkzeug.utils import secure_filename
import pdfplumber
import groq
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy
from flask_dance.contrib.google import make_google_blueprint, google
from datetime import datetime
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
import re
from flask_dance.contrib.github import make_github_blueprint, github
from flask_dance.consumer import oauth_authorized
import requests
from flask import Flask, flash  # Add 'flash' to your existing Flask imports


# Load environment variables
load_dotenv()
groq_api_key = os.getenv("GROQ_API_KEY")
google_client_id = os.getenv("GOOGLE_CLIENT_ID")
google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
github_client_id = os.getenv("GITHUB_CLIENT_ID")
github_client_secret = os.getenv("GITHUB_CLIENT_SECRET")
database_url = os.getenv("DATABASE_URL")  # PostgreSQL URL for Render

# Flask App Setup
app = Flask(__name__, static_folder="static", template_folder="templates")
app.secret_key = os.getenv("FLASK_SECRET_KEY", "supersecret")
# print(f"App secret key set: {bool(app.secret_key)}")  # Debug print
app.config["UPLOAD_FOLDER"] = "backend/PDFs"
app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16MB limit
CORS(app)

# DB + Login Manager
db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)

# Create Uploads Folder
if not os.path.exists(app.config["UPLOAD_FOLDER"]):
    os.makedirs(app.config["UPLOAD_FOLDER"])

# Groq Client
client = groq.Client(api_key=groq_api_key)


def revoke_github_token():
    try:
        if not github.authorized:
            print("⚠️ No authorized GitHub session to revoke")
            return False

        client_id = os.getenv("GITHUB_CLIENT_ID")
        client_secret = os.getenv("GITHUB_CLIENT_SECRET")
        token_data = github.token

        if not token_data or 'access_token' not in token_data:
            print("⚠️ Invalid GitHub token data")
            return False

        url = f"https://api.github.com/applications/{client_id}/token"
        auth = (client_id, client_secret)
        data = {"access_token": token_data['access_token']}

        # Make the revocation request
        response = requests.delete(
            url,
            auth=auth,
            json=data,
            headers={"Accept": "application/vnd.github+json"},
            timeout=5
        )

        if response.status_code == 204:
            print("✅ GitHub token revoked successfully")
            return True
        else:
            print(f"⚠️ GitHub token revocation failed: {response.status_code} - {response.text}")
            return False

    except requests.exceptions.RequestException as e:
        print(f"⚠️ GitHub revocation request failed: {str(e)}")
        return False
    except Exception as e:
        print(f"⚠️ Unexpected error during GitHub revocation: {str(e)}")
        return False

# Google OAuth Setup
google_bp = make_google_blueprint(
    client_id=google_client_id,
    client_secret=google_client_secret,
    scope=[
        "openid",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email"
    ],
    # Fix the redirect URL to remove the double login path
    redirect_url="/google/authorized",
    # Also update the authorized path
    authorized_url="/google/authorized"
)
app.register_blueprint(google_bp, url_prefix="/login")


# GitHub OAuth Setup

github_bp = make_github_blueprint(
    client_id=os.getenv("GITHUB_CLIENT_ID"),  # Changed from GITHUB_CLIENT_ID to os.getenv()
    client_secret=os.getenv("GITHUB_CLIENT_SECRET"),  # Changed from GITHUB_CLIENT_SECRET to os.getenv()
    scope="read:user,user:email",  # Use GitHub's preferred format
    redirect_to="index"  # Where to redirect after auth
)
app.register_blueprint(github_bp, url_prefix="/login")

# User Model
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(200), unique=True, nullable=False)
    name = db.Column(db.String(200))
    profile_pic = db.Column(db.String(500))


# Add new ChatSession
class ChatSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Add new ChatMessage
class ChatMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('chat_session.id'), nullable=False)
    sender = db.Column(db.String(10))  # 'user' or 'bot'
    message = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)


with app.app_context():
    db.create_all()

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Helper function to clean up and enhance Markdown formatting
def clean_markdown_formatting(text):
    # Fix heading syntax (ensure space after # symbols)
    text = re.sub(r'(#{1,6})([^#\s])', r'\1 \2', text)
    
    # Make sure bold syntax has proper spacing
    text = re.sub(r'(\*\*)([^*\s])([^*]*?)([^*\s])(\*\*)', r'\1\2\3\4\5', text)
    
    # Ensure bullet points have proper spacing
    text = re.sub(r'^(\s*)-([^\s])', r'\1- \2', text, flags=re.MULTILINE)
    
    # Convert numbered lists with inconsistent formats
    text = re.sub(r'^(\s*)(\d+)\.\s*', r'\1\2. ', text, flags=re.MULTILINE)
    
    # Ensure paragraphs have proper spacing
    text = re.sub(r'([^\n])\n([^\n])', r'\1\n\n\2', text)
    
    return text

# Extract text from PDF
def load_pdf_text(pdf_path):
    try:
        text = ""
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        return [{"page_content": text}] if text.strip() else []
    except Exception as e:
        print(f"Error loading PDF: {e}")
        return []



@app.route("/")
def index():
    # Redirect to login choice page if not authenticated
    if not current_user.is_authenticated:
        return render_template("login_choice.html")
    # Otherwise show the main page
    user_data = session.get('user', {
        'name': current_user.name,
        'email': current_user.email,
        'photo': current_user.profile_pic
    })
    return render_template("index.html", user_data=user_data)

@app.route("/login")
def login():
    """Redirect to the login choice page"""
    return redirect(url_for("login_choice"))

@app.route("/login-choice")
def login_choice():
    return render_template("login_choice.html")

@app.route("/google/authorized")
def google_authorized():
    print("Callback hit")  # Debug print
    
    if not google.authorized:
        print("Not authorized, redirecting to login")  # Debug print
        return redirect(url_for("google.login"))

    try:
        resp = google.get("https://www.googleapis.com/oauth2/v2/userinfo")
        print(f"Response status: {resp.status_code}")  # Debug print
        
        if not resp.ok:
            print(f"Error response: {resp.text}")  # Debug print
            return "Failed to fetch user info from Google.", 400

        user_info = resp.json()
        print(f"Got user info: {user_info.get('email')}")  # Debug print
        
        email = user_info["email"]
        name = user_info.get("name")
        profile_pic = user_info.get("picture")
        # print(f"Setting session user: {email}")


        # PASTE THE SESSION STORAGE CODE HERE
        session['user'] = {
            "name": name,
            "email": email,
            "photo": profile_pic  # Using profile_pic variable which is the same as picture
        }
        session.modified = True
        # END OF PASTED CODE

        # Debug table structure before query
        try:
            inspector = db.inspect(db.engine)
            user_table_columns = [col["name"] for col in inspector.get_columns("user")]
            print(f"User table columns: {user_table_columns}")
        except Exception as e:
            print(f"Error inspecting table: {str(e)}")

        try:
            user = User.query.filter_by(email=email).first()
            if not user:
                # create new user
                user = User(email=email, name=name, profile_pic=profile_pic)
                db.session.add(user)
                db.session.commit()
                print(f"Created new user: {email}")  # Debug print
            else:
                print(f"Found existing user: {email}")  # Debug print

            login_user(user)
            print("User logged in, redirecting to index")  # Debug print
            return redirect(url_for("index"))
        except Exception as e:
            print(f"DB operation error: {str(e)}")
            return f"Database error: {str(e)}", 500
            
    except Exception as e:
        print(f"Exception in callback: {str(e)}")  # Debug print
        return f"Error during authentication: {str(e)}", 500


@oauth_authorized.connect_via(github_bp)
def github_logged_in(blueprint, token):
    if not token:
        flash("Failed to log in with GitHub.", category="error")
        return False

    # Get user info
    resp = github.get("/user")
    if not resp.ok:
        flash("Failed to fetch GitHub user info.", category="error")
        return False
    user_info = resp.json()

    # Get user email
    email_resp = github.get("/user/emails")
    if not email_resp.ok:
        flash("Failed to fetch email from GitHub.", category="error")
        return False
    email_data = email_resp.json()
    email = next((e["email"] for e in email_data if e.get("primary") and e.get("verified")), None)

    name = user_info.get("name") or user_info.get("login")
    profile_pic = user_info.get("avatar_url")

    if not email:
        flash("No verified email found for GitHub account.", category="error")
        return False

    # Store session
    session['user'] = {
        "name": name,
        "email": email,
        "photo": profile_pic
    }
    session.modified = True

    # Check or create user
    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(email=email, name=name, profile_pic=profile_pic)
        db.session.add(user)
        db.session.commit()

    login_user(user)
    flash("Successfully signed in with GitHub.", category="success")
    return False  # Prevent Flask-Dance from storing token in DB


# Google OAuth Callback

@app.route("/simple-login")
def simple_login():
    try:
        # Create a test user directly
        email = "test@example.com"
        test_user = User.query.filter_by(email=email).first()
        
        if not test_user:
            test_user = User(email=email, name="Test User", profile_pic="")
            db.session.add(test_user)
            db.session.commit()
            
        login_user(test_user)
        return jsonify({"success": True, "message": "Test user logged in"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    


@app.route("/logout")
def logout():
    try:
        # Revoke GitHub token if exists
        if github.authorized:
            revoke_github_token()

        # Clear Flask-Login session
        logout_user()

        # Clear all session data
        session.clear()

        # Explicitly remove OAuth tokens
        for key in ['google_oauth_token', 'github_oauth_token']:
            session.pop(key, None)

        # Create redirect response with cache control
        response = redirect(url_for("login_choice"))  # Redirect to login choice page
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        
        return response

    except Exception as e:
        print(f"Logout error: {str(e)}")
        flash("An error occurred during logout", "error")
        return redirect(url_for("index"))

@app.route("/start-chat", methods=["POST"])
@login_required
def start_chat():
    session = ChatSession(user_id=current_user.id)
    db.session.add(session)
    db.session.commit()
    return jsonify({"session_id": session.id})


# Upload PDF
@app.route("/upload-pdf", methods=["POST"])
@login_required
def upload_pdf():
    try:
        if "pdf" not in request.files:
            return jsonify({"error": "No file uploaded!"}), 400

        pdf_file = request.files["pdf"]
        if pdf_file.filename == "":
            return jsonify({"error": "No selected file!"}), 400

        filename = secure_filename(pdf_file.filename)
        pdf_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        pdf_file.save(pdf_path)

        return jsonify({"message": "PDF uploaded successfully!", "filename": filename})
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500
    

@app.route("/oauth-debug")
def oauth_debug():
    return jsonify({
        "authorized": google.authorized,
        "redirect_url": url_for("google_authorized", _external=True),
        "session_keys": list(session.keys()) if session else [],
        "session_cookie": request.cookies.get("session", "Not found")
    })

@app.route("/db-status")
def db_status():
    try:
        # Get list of all tables
        inspector = db.inspect(db.engine)
        tables = inspector.get_table_names()
        
        # For each table, get column info
        table_info = {}
        for table in tables:
            columns = inspector.get_columns(table)
            table_info[table] = [{"name": col["name"], "type": str(col["type"])} for col in columns]
        
        return jsonify({
            "status": "connected",
            "tables": tables,
            "schema": table_info
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/reset-db")
def reset_db():
    try:
        with app.app_context():
            db.drop_all()
            db.create_all()
        return jsonify({"message": "Database reset successful"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/upload-multiple-pdfs", methods=["POST"])
@login_required
def upload_multiple_pdfs():
    try:
        if 'pdfs' not in request.files:
            return jsonify({"error": "No files uploaded!"}), 400

        files = request.files.getlist('pdfs')
        if not files or len(files) == 0:
            return jsonify({"error": "No files found in request!"}), 400

        saved_filenames = []
        for file in files:
            if file.filename == "":
                continue
            filename = secure_filename(file.filename)
            pdf_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
            file.save(pdf_path)
            saved_filenames.append(filename)

        if len(saved_filenames) == 0:
            return jsonify({"error": "No valid PDF files uploaded."}), 400

        return jsonify({"message": "PDFs uploaded successfully!", "filenames": saved_filenames})
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500


@app.route("/chat", methods=["POST"])
@login_required
def chat():
    try:
        data = request.json
        user_query = data.get("query")
        pdf_filenames = data.get("pdf_filenames", [])
        session_id = data.get("session_id")

        if not user_query or not pdf_filenames or not session_id:
            return jsonify({"error": "Missing query, files or session_id"}), 400

        pdf_chunks = []
        for fname in pdf_filenames:
            pdf_path = os.path.join(app.config["UPLOAD_FOLDER"], fname)
            if os.path.exists(pdf_path):
                pdf_chunks.extend(load_pdf_text(pdf_path))

        if not pdf_chunks:
            return jsonify({"error": "No readable content in uploaded PDFs."}), 400

        text_content = " ".join([chunk["page_content"] for chunk in pdf_chunks])

        system_prompt = (
            "You are a helpful AI assistant that provides answers about PDF content. "
            "Format your responses with proper Markdown syntax and ensure it renders correctly.\n\n"
            "✅ **For Summaries:**\n"
            "- Use ## for main headings and ### for subheadings\n"
            "- Provide key points in bullet form using '- ' for each point\n"
            "- Make important keywords and concepts **bold** using **double asterisks**\n"
            "- Separate paragraphs with blank lines\n\n"
            "✅ **For Explanations:**\n"
            "- Organize your answer with clear sections and proper headings (## or ###)\n"
            "- Use bullet points (- ) for listing items and features\n"
            "- Make important terms and concepts **bold**\n"
            "- Create proper paragraphs with blank lines between them\n\n"
            "⚠️ **Important:** Properly format your response to ensure it renders correctly with Markdown. "
            "Avoid plain text dumps. Use proper spacing between Markdown elements."
        )


        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Document Content: {text_content}\n\nUser Query: {user_query}"}
            ]
        )

        reply = response.choices[0].message.content
        formatted_reply = clean_markdown_formatting(reply)

        # Save user & bot messages
        db.session.add(ChatMessage(session_id=session_id, sender='user', message=user_query))
        db.session.add(ChatMessage(session_id=session_id, sender='bot', message=formatted_reply))

        # Auto-title if this is the first message in the session
        chat_session = ChatSession.query.get(session_id)
        if chat_session and not chat_session.title:
           title_prompt = f"""You are an assistant that generates concise, 3–5 word titles for chat sessions. Based on the user’s question and the assistant’s reply, generate a descriptive title.

       User: {user_query}
       Assistant: {formatted_reply}
       """

           try:
               title_response = client.chat.completions.create(
                   model="llama3-8b-8192",
                   messages=[
                       {"role": "user", "content": title_prompt}
                   ]
             )

            #    title_text = title_response.choices[0].message.content.strip().strip('"')
               raw_title = title_response.choices[0].message.content.strip()

            # Try to extract title from quotes (e.g., "Electric Vehicle Rules")
               match = re.search(r'"([^"]+)"', raw_title)
               if match:
                        title_text = match.group(1)
               else:
               # fallback: remove prefix if present
                    title_text = re.sub(r'^(Here is a 3-5 word title.*?:)', '', raw_title, flags=re.IGNORECASE).strip()
               chat_session.title = title_text[:50] if title_text else user_query[:50]
           except Exception as e:
              print("Auto-title generation failed:", e)
              chat_session.title = user_query[:50]


        db.session.commit()

        return jsonify({"response": formatted_reply})
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500
    
@app.route("/chat-sessions", methods=["GET"])
@login_required
def get_chat_sessions():
    sessions = ChatSession.query.filter_by(user_id=current_user.id).order_by(ChatSession.updated_at.desc()).all()
    return jsonify([
        {
            "id": s.id,
            "title": s.title or "Untitled",
            "created_at": s.created_at.isoformat(),
            "updated_at": s.updated_at.isoformat()
        }
        for s in sessions
    ])
@app.route("/chat-messages/<int:session_id>", methods=["GET"])
@login_required
def get_chat_messages(session_id):
    messages = ChatMessage.query.filter_by(session_id=session_id).order_by(ChatMessage.timestamp).all()
    return jsonify([
        {
            "sender": m.sender,
            "message": m.message,
            "timestamp": m.timestamp.isoformat()
        }
        for m in messages
    ])

@app.route("/rename-session", methods=["POST"])
@login_required
def rename_session():
    data = request.json
    session_id = data.get("session_id")
    new_title = data.get("new_title")

    session = ChatSession.query.filter_by(id=session_id, user_id=current_user.id).first()
    if session:
        session.title = new_title
        db.session.commit()
        return jsonify({"success": True})
    return jsonify({"success": False}), 404



if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
