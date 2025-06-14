# 💬 ChatWithPDF – Interact with Your PDFs Using AI

[![Live Site](https://img.shields.io/badge/Live_Website-Visit-green?style=for-the-badge&logo=google-chrome)](https://chatwithpdf.infinityfreeapp.com)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Source_Code-000?style=for-the-badge&logo=github)](https://github.com/HyderPre/chatwithpdfweb)

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

## 🧪 How to Use

1. 🔐 Log in securely using **Google** or **GitHub** (OAuth 2.0)
2. 📄 Upload up to **4 PDF files** using the intuitive **drag-and-drop** interface
3. 💬 Type your questions in **natural language**
4. 🧠 View accurate, AI-generated responses and scroll through your **recent chats**
5. 🔁 Continue the conversation or upload new PDFs anytime

---

## 📦 Tech Stack

- 🐍 **Backend**: Python Flask  
- 🤖 **AI Engine**: OpenAI API (GPT models)  
- 📄 **PDF Parsing**: pdfplumber  
- 🔐 **Authentication**: OAuth 2.0 via Google & GitHub (Authlib)  
- 🎨 **Frontend**: HTML, CSS, JavaScript  

---

## ✅ Testing Checklist

- ✅ Google & GitHub OAuth login functioning correctly  
- ✅ Upload and preview support for **up to 4 PDFs**  
- ✅ Accurate, **context-aware** chat responses  
- ✅ Fully working **drag-and-drop** file upload  
- ✅ **Recent chats** preserved across session  

---

## 🤝 Contributing

We welcome contributions from the community!  
To contribute:

1. 🍴 Fork this repository  
2. 🌿 Create a new feature branch (`git checkout -b feature-name`)  
3. 🛠️ Make your changes and **test locally**  
4. ✅ Write clear and meaningful commit messages  
5. 📩 Open a pull request with a detailed explanation  

Let’s build something useful together! 🙌

---

## 📄 License

You **must obtain written permission** before copying, reusing, modifying, or distributing any part of this project for personal, academic, or commercial purposes.

📧 Contact the authors:  
- **Hyder Presswala** – hyder.p@somaiya.edu  
- **Hamza Kapasi** – hamza.kapasi@somaiya.edu

⚠️ Unauthorized use is strictly prohibited.


## #️⃣ Hashtags for SEO
#ChatWithPDF #PDFChatbot #ChatWithDocuments #PDFtoText #PDFQuery #PDFInsights #PDFSummarizer #AskYourPDF #AIPDFReader #OpenAIPDF #FlaskApp #FlaskWebApp #PythonFlask #FlaskProject #ChatPDFApp #ChatWithPDFs #PDFBot #OpenAIIntegration #OAuthLogin #GoogleLogin #GitHubLogin #SecureLogin #MultipleFileUpload #DragAndDropUpload #RecentChats #PDFSearch #AIWebApp #NLPApp #OpenAIPowered #NaturalLanguageChat #SmartDocumentReader #PDFQA #AskDocs #FlaskOAuth #AIFlaskApp #AIPoweredApp #GPTIntegration #OpenAISDK #LLMChatApp #PythonWebProject #AcademicTool #StudyAssistant #DocumentChatbot #StudentTool #FlaskFrontend #ResponsiveFlaskApp #JinjaTemplates #FlaskAuth #FlaskOAuth2 #SemanticSearchPDF #MultifileUpload #DragDropPDF #ChatbotWebApp #ModernWebApp #InteractivePDFTool #PDFChatSystem #ReadPDFWithAI #ChatWithPDFFiles #FlaskAIApp #FileUploadFlask #OpenSourceFlask #PDFInterface #CollegeProject #FinalYearProject #HackathonProject #FlaskHackathon #OpenAIChatbot #StudyWithAI #EduTechTool #AIDocumentChat #SmartPDFUploader #FlaskBasedApp #MinimalWebApp #CleanUI #AIUseCase #OpenAIAssistant #EducationalAI #FileChatAI #IntelligentChatbot #DocumentAssistant #PythonMiniProject #OpenSourceTool #FlaskOpenAI #OpenAIFlaskBot #PDFBotAI #ChatPDF #FlaskGPT #FlaskAppWithLogin #OAuth2Login #FileReaderAI #AskMyPDF #QueryPDF #SummarizePDF #FlaskWebTool #HTMLCSSJSFlask #FlaskUploadTool #UploadPDFandChat #DragDropFiles #LoginWithGoogle #LoginWithGitHub #PythonDocumentBot #InteractiveDocs #DocsWithAI #LLMWebApp #PDFAIChat #ChatAssistant #SmartPDFTool #OpenSourceAIApp #AIAssistedReading #FlaskToolbox #EduPDFChat #FlaskUIApp #FlaskPDFProcessor #CustomPDFBot #ContextAwareChat #RecentChatFlask #DocumentInteraction #LLMWithPDF #AIFlaskLogin #FlaskUIMagic #FlaskProjectTemplate #OpenAIBot #FlaskFormApp #AIChatPlatform #GPTPDFAssistant #SmartReaderWebApp #OpenAIDocumentBot #PDFAnalyzerAI #PythonOAuthApp #FlaskJinjaApp #UploadNChat #PDFConverterBot #EdTechFlaskTool #PythonAIProjects #ChatBotFlaskOpenAI #OpenAIInWebApp #FlaskBeginnerProject #OpenAIAssistantBot #DragDropChat #FileUploadTool #InteractiveDocsApp #OpenAIPDFChat #EducationalPDFChat #AskYourDocuments #PDFChatSolution #FlaskGPTBot #SmartPDFApp #SimplePDFChatApp #MiniFlaskProject #GitHubTrendingProject #AIPDFAnalyzer
