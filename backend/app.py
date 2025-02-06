import os
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from werkzeug.utils import secure_filename
import pdfplumber
import groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
groq_api_key = os.getenv("GROQ_API_KEY")

# Initialize Flask app
app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

UPLOAD_FOLDER = "backend/PDFs"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16MB limit

# Initialize Groq Client
client = groq.Client(api_key=groq_api_key)

# Function to extract text from PDF
def load_pdf_text(pdf_path):
    try:
        text = ""
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() + "\n"

        if not text.strip():
            print("No readable content extracted.")
            return []

        print("Extracted Text:", text)  # Debugging
        return [{"page_content": text}]

    except Exception as e:
        print(f"Error loading PDF: {e}")
        return []

# Serve Frontend
@app.route("/")
def index():
    return render_template("index.html")

# Upload PDF Endpoint
@app.route("/upload-pdf", methods=["POST"])
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
        print(f"Error during PDF upload: {e}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

# Chat Endpoint
@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.json
        user_query = data.get("query")
        pdf_filename = data.get("pdf_filename")

        if not user_query or not pdf_filename:
            return jsonify({"error": "Invalid input data!"}), 400

        pdf_path = os.path.join(UPLOAD_FOLDER, pdf_filename)
        if not os.path.exists(pdf_path):
            return jsonify({"error": "PDF file not found!"}), 400

        pdf_chunks = load_pdf_text(pdf_path)
        if not pdf_chunks:
            return jsonify({"error": "No readable content found in the PDF."}), 400

        text_content = " ".join([chunk["page_content"] for chunk in pdf_chunks])

        # Stronger prompt for structured responses
        system_prompt = (
            "You are a helpful AI assistant. "
            "Follow this format strictly:\n\n"
            "✅ **For Summaries:**\n"
            "- Provide key points in **bullet points**.\n"
            "- Keep each point **clear and concise**.\n\n"
            "✅ **For Explanations:**\n"
            "- Use **subheadings** for sections.\n"
            "- Separate ideas into **short paragraphs**.\n"
            "- Use **bullet points** for key details.\n\n"
            "⚠️ **Do NOT return a single paragraph. Always format the response properly.**"
        )

        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Document Content: {text_content}\n\nUser Query: {user_query}"}
            ]
        )

        print("Response from Groq API:", response)
        return jsonify({"response": response.choices[0].message.content})

    except Exception as e:
        print(f"Error during chat processing: {e}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True)
