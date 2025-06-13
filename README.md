# ChatWithPDF

**ChatWithPDF** is a Flask-based web application that allows users to interact with PDF documents using AI. With support for Google and GitHub login, drag-and-drop uploads, multiple PDF processing, and recent chat history, this app provides an intuitive interface to explore and query documents efficiently.

## 🚀 Features

- 🔐 Login using **Google** and **GitHub** (OAuth 2.0)
- 📄 Upload up to **4 PDF documents at once**
- 📥 Drag-and-drop file upload support
- 💬 Chat with your documents using **natural language**
- 🧠 Powered by **OpenAI** language models
- 💾 **Recent chats** displayed for continued context
- 🎯 Simple, clean, and responsive web interface

## 🗂️ Project Structure<br>
chatwithpdf/ <br>
├── backend/<br>
│ ├── PDFs/ → Stores uploaded PDF files<br>
│ ├── static/ → Contains CSS, JS, images<br>
│ ├── templates/ → HTML Jinja templates<br>
│ ├── app.py → Main Flask backend logic<br>
├── .gitignore<br>
├── README.md<br>
└── requirements.txt<br>

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/HyderPre/chatwithpdfweb.git
cd chatwithpdfweb/backend
```
### 2. Create and Activate Virtual Environment
Windows:
```bash
python -m venv venv
venv\Scripts\activate
```
### 3. Install Dependencies
```bash
pip install -r requirements.txt
```
### 4. Add Environment Variables
```env
Create a .env file in the backend/ folder:
GROQ_API_KEY=your_groq_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
SECRET_KEY=your_flask_secret_key
```
### 5. Run the Application
Windows:
```bash
set FLASK_APP=app.py
set FLASK_ENV=development
flask run
```
Open your browser and go to: http://localhost:5000

🧪 How to Use<br>
Log in using Google or GitHub.<br>

Upload up to 4 PDFs using the drag-and-drop interface.<br>

Ask questions in plain language.<br>

View responses and scroll through recent chats.<br>

Continue the conversation or upload new PDFs anytime.<br>

📦 Tech Stack<br><br>
Backend: Flask (Python)<br>

AI: OpenAI API (GPT)  <br>

PDF Parsing: PyMuPDF or pdfplumber<br>

Auth: OAuth2 with Google and GitHub (Authlib)<br>

Frontend: HTML, CSS, JavaScript<br>

✅ Testing Checklist<br><br>
 Google & GitHub Login working<br>

 Upload and preview up to 4 PDFs<br>

 Chat responses accurate and contextual<br>

 Drag-and-drop works for multiple PDFs<br>

 Recent chats preserved and displayed<br>

🤝 Contributing<br>
Contributions are welcome!<br>
Fork this repo, create a feature branch, and open a pull request.<br>
Make sure to include clear commit messages and test your changes locally.<br>

📄 License<br>
This project is licensed under the MIT License – see the LICENSE file for details.<br>


