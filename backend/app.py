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

# Load environment variables
load_dotenv()
groq_api_key = os.getenv("GROQ_API_KEY")
google_client_id = os.getenv("GOOGLE_CLIENT_ID")
google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
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


# User Model
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(200), unique=True, nullable=False)
    name = db.Column(db.String(200))
    profile_pic = db.Column(db.String(500))


# Chat History Model
class ChatHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(200), nullable=False)
    query = db.Column(db.Text, nullable=False)
    response = db.Column(db.Text, nullable=False)
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

# Home Page
@app.route("/")
def index():
    if current_user.is_authenticated:
        return render_template("index.html", email=current_user.email)
    return redirect(url_for("google.login"))

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
@login_required
def logout():
    logout_user()
    session.clear()  # Clear all session data
    # Clear Google OAuth token specifically
    if 'google_oauth_token' in session:
        del session['google_oauth_token']
    # Redirect to Google login with cache control
    response = redirect(url_for("google.login"))
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate'
    return response

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

# Chat Endpoint - Updated for proper Markdown formatting
@app.route("/chat", methods=["POST"])
@login_required
def chat():
    try:
        data = request.json
        user_query = data.get("query")
        pdf_filename = data.get("pdf_filename")

        if not user_query or not pdf_filename:
            return jsonify({"error": "Invalid input!"}), 400

        pdf_path = os.path.join(app.config["UPLOAD_FOLDER"], pdf_filename)
        if not os.path.exists(pdf_path):
            return jsonify({"error": "PDF not found!"}), 404

        pdf_chunks = load_pdf_text(pdf_path)
        if not pdf_chunks:
            return jsonify({"error": "No readable content in PDF."}), 400

        text_content = " ".join([chunk["page_content"] for chunk in pdf_chunks])

        # Updated system prompt for better formatting
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
        
        # Clean up any potential Markdown formatting issues
        formatted_reply = clean_markdown_formatting(reply)

        # Save to DB
        chat_entry = ChatHistory(email=current_user.email, query=user_query, response=formatted_reply)
        db.session.add(chat_entry)
        db.session.commit()

        return jsonify({"response": formatted_reply})
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

# Get Chat History
@app.route("/chat-history", methods=["GET"])
@login_required
def get_chat_history():
    try:
        chats = ChatHistory.query.filter_by(email=current_user.email).order_by(ChatHistory.timestamp.desc()).all()
        return jsonify([
            {"query": chat.query, "response": chat.response, "timestamp": chat.timestamp.isoformat()}
            for chat in chats
        ])
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500


# if __name__ == "__main__":
#     with app.app_context():
#         db.create_all()
#     app.run(debug=True)

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
