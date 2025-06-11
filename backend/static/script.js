// Store selected files (max 4)
let selectedPDFFiles = [];
let currentSessionId = null; 
const chatHistory = document.getElementById('chat-history');
const chatMessages = document.getElementById('chat-messages');

document.addEventListener('DOMContentLoaded', function() {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const fileInput = document.getElementById('pdf-file');
    const uploadBtn = document.getElementById('upload-btn');
   


const fileListContainer = document.getElementById('file-list');
const addFilesBtn = document.getElementById('add-files-btn');

// Handle "Add Files" button click
addFilesBtn.addEventListener('click', () => {
    fileInput.click();
});

// Handle file selection
fileInput.addEventListener('change', () => {
    const files = Array.from(fileInput.files);
    const total = selectedPDFFiles.length + files.length;

    if (total > 4) {
        addMessage('bot', 'You can only upload up to 4 PDFs.');
        return;
    }

    // Add new files without duplicates
    files.forEach(file => {
        if (!selectedPDFFiles.some(f => f.name === file.name)) {
            selectedPDFFiles.push(file);
        }
    });

    renderFileList();
});


        const sidebar = document.querySelector('.sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const mobileToggleBtn = document.getElementById('mobile-menu-toggle');

// Desktop toggle collapse
sidebarToggle.addEventListener('click', () => {
  if (window.innerWidth > 768) {
    sidebar.classList.toggle('collapsed');
    sidebarToggle.textContent = sidebar.classList.contains('collapsed') ? '⇨' : '⇦';
  } else {
    sidebar.classList.toggle('show');
  }
});

// Mobile menu toggle (☰)
mobileToggleBtn.addEventListener('click', () => {
  sidebar.classList.toggle('show');
});

// Optional: auto-close on mobile when clicking outside
document.addEventListener('click', (e) => {
  const isMobile = window.innerWidth <= 768;
  if (
    isMobile &&
    sidebar.classList.contains('show') &&
    !sidebar.contains(e.target) &&
    !mobileToggleBtn.contains(e.target)
  ) {
    sidebar.classList.remove('show');
  }
});

     

// Render list of selected files
function renderFileList() {
    fileListContainer.innerHTML = '';

    selectedPDFFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span class="file-name">${file.name}</span>
            <button class="remove-btn" data-index="${index}">×</button>
        `;
        fileListContainer.appendChild(fileItem);
    });

    // Add event listeners for remove buttons
    fileListContainer.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const index = parseInt(this.getAttribute('data-index'));
            selectedPDFFiles.splice(index, 1);
            renderFileList();
        });
    });
}

const toggleText = document.getElementById('toggle-control-text');
const controlPanel = document.querySelector('.control-panel');

let isCollapsed = false;

toggleText.addEventListener('click', () => {
    isCollapsed = !isCollapsed;
    controlPanel.classList.toggle('collapsed', isCollapsed);
    toggleText.textContent = isCollapsed ? 'Show More ▼' : 'Show Less ▲';
});




    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            sendMessage();
        }
    });

    uploadBtn.addEventListener('click', uploadPDF);

    function addMessage(sender, text, type = 'text') {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
    
        if (type === 'markdown') {
            messageDiv.innerHTML = convertMarkdownToHTML(text); // Assuming this function exists
        } else {
            messageDiv.innerHTML = `<p>${text}</p>`;
        }
    
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    
        // Aiyaiyo, hide that welcome dosa if chat has begun
        if (typeof welcomeContainer !== 'undefined' && welcomeContainer && chatMessages.children.length > 0) {
            welcomeContainer.style.display = 'none';
        }
    }
    

    async function uploadPDF() {
        const welcomeContainer = document.getElementById('welcome-container');
            if (welcomeContainer) {
                welcomeContainer.style.display = 'none';
            }

        if (selectedPDFFiles.length === 0) {
            addMessage('bot', 'No files to upload.');
            return;
        }
    
        if (selectedPDFFiles.length > 4) {
            addMessage('bot', 'You can only upload up to 4 PDFs.');
            return;
        }
    
        const formData = new FormData();
        selectedPDFFiles.forEach(file => {
            formData.append('pdfs', file);
        });
    
        try {
            const response = await fetch('/upload-multiple-pdfs', {
                method: 'POST',
                body: formData
            });
    
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Upload failed');
            }
    
            const names = data.filenames || [];
            addMessage('bot', `Uploaded ${names.length} PDF(s) Successfully :- ${names.join('\n- ')}`);
            
            // Save filenames for chat
            sessionStorage.setItem('pdf_filenames', JSON.stringify(names));
    
        } catch (error) {
            console.error('Upload Error:', error);
            addMessage('bot', 'Failed to upload PDF(s).');
        }
    }
    
    
    // First, add a script tag to include the Marked library (a popular Markdown parser)
    const markedScript = document.createElement('script');
    markedScript.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
    document.head.appendChild(markedScript);
    
    // Then add highlight.js for code syntax highlighting (optional but nice)
    const highlightCSS = document.createElement('link');
    highlightCSS.rel = 'stylesheet';
    highlightCSS.href = 'https://cdn.jsdelivr.net/npm/highlight.js@11.7.0/styles/github.min.css';
    document.head.appendChild(highlightCSS);
    
    const highlightJS = document.createElement('script');
    highlightJS.src = 'https://cdn.jsdelivr.net/npm/highlight.js@11.7.0/lib/highlight.min.js';
    document.head.appendChild(highlightJS);
    
    // Wait for the Marked library to load
    markedScript.onload = function() {
        // Configure Marked options for security and features
        marked.setOptions({
            breaks: true,                // Convert line breaks to <br>
            gfm: true,                   // Enable GitHub Flavored Markdown
            headerIds: false,            // Disable header IDs for security
            mangle: false,               // Disable mangling for security
            sanitize: false,             // Modern versions handle sanitization differently
            silent: true,                // Don't throw errors for invalid markdown
            smartLists: true,            // Use smarter list behavior than markdown
            smartypants: true,           // Use "smart" typographic punctuation
            xhtml: false                 // Don't close void elements with a slash
        });
        
        // Add a custom renderer for better control
        const renderer = new marked.Renderer();
        
        // Set up highlight.js for code blocks
        highlightJS.onload = function() {
            marked.setOptions({
                highlight: function(code, lang) {
                    if (lang && hljs.getLanguage(lang)) {
                        try {
                            return hljs.highlight(code, { language: lang }).value;
                        } catch (err) {}
                    }
                    return code;
                }
            });
        };
        
        // Override existing or create the addMessage function
        window.addMessage = function(sender, text) {
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message', sender);
            
            // Apply Markdown rendering only to bot messages
            if (sender === 'bot') {
                // Sanitize the input to prevent XSS attacks
                // This is important when rendering HTML from markdown
                messageDiv.innerHTML = DOMPurify.sanitize(marked.parse(text));
            } else {
                // For user messages, escape HTML
                const p = document.createElement('p');
                p.textContent = text;
                messageDiv.appendChild(p);
            }
            
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // Hide welcome message when chat starts
            const welcomeContainer = document.getElementById('welcome-container');
            if (welcomeContainer && chatMessages.children.length > 0) {
                welcomeContainer.style.display = 'none';
            }
        };
    };

    
    
    // Add DOMPurify for sanitization
    const purifyScript = document.createElement('script');
    purifyScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/dompurify/2.4.0/purify.min.js';
    document.head.appendChild(purifyScript);

  
     const welcomeContainer = document.getElementById('welcome-container');
    const newChatBtn = document.getElementById('new-chat');
    
    // Add a variable to track the current PDF state
    let isPdfUploaded = false;
    
    // Create and append cancel button (initially hidden)
    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'cancel-pdf-btn';
    cancelBtn.className = 'cancel-btn';
    cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancel PDF';
    cancelBtn.style.display = 'none';
    
    // Insert cancel button after upload button
    uploadBtn.parentNode.insertBefore(cancelBtn, uploadBtn.nextSibling);
    
    // Function to toggle between upload and cancel buttons
    function togglePdfButtons(pdfActive) {
    isPdfUploaded = pdfActive;

    const wrapper = document.querySelector('.file-input-wrapper');
    if (!wrapper) {
        console.warn("⚠️ file-input-wrapper not found.");
        return;
    }

    if (pdfActive) {
        uploadBtn.style.display = 'none';
        cancelBtn.style.display = 'inline-block';
        fileInput.disabled = true;
        wrapper.classList.add('disabled');
    } else {
        uploadBtn.style.display = 'inline-block';
        cancelBtn.style.display = 'none';
        fileInput.disabled = false;
        wrapper.classList.remove('disabled');
    }
}

    
    // New chat functionality
    if (newChatBtn) {
        newChatBtn.addEventListener('click', startNewChat);
    }

    async function startNewChat() {
    try {
        const res = await fetch("/start-chat", { method: "POST" });
        const data = await res.json();
        currentSessionId = data.session_id;

        chatMessages.innerHTML = '';
        chatInput.value = '';
        fileInput.value = '';
        // document.getElementById('file-name').textContent = 'Choose file...';
        sessionStorage.removeItem('pdf_filenames');
        togglePdfButtons(false);

        if (welcomeContainer) {
            welcomeContainer.style.display = 'flex';
        }

        await loadChatSessions(); // Refresh sidebar

    } catch (err) {
        console.error("Failed to start new chat:", err);
        addMessage("bot", "Failed to start a new chat.");
    }
}

    
    function saveCurrentChatToHistory() {
        // Only save if there were messages
        if (chatMessages.children.length > 0) {
            const currentPdf = sessionStorage.getItem('pdf_filename');
            if (!currentPdf) return; // Don't save if no PDF was uploaded
            
            const chatTitle = currentPdf.split('/').pop() || 'Unnamed Chat';
            const timestamp = new Date().toLocaleString();
            
            // Create a history item
            const historyItem = document.createElement('div');
            historyItem.className = 'chat-item';
            historyItem.innerHTML = `
                <div class="chat-item-title">${chatTitle}</div>
                <div class="chat-item-time">${timestamp}</div>
            `;
            
            // Add to history
            if (chatHistory) {
                chatHistory.prepend(historyItem);
            }
        }
    }



    

    // Set up event listeners
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });
    uploadBtn.addEventListener('click', uploadPDF);
    loadChatSessions();
    startNewChat();  // ✅ Automatically start a chat session on load
    
    
});



// If you're receiving the AI responses via fetch, modify your sendMessage function
async function sendMessage() {
    if (!currentSessionId) {
    addMessage("bot", "Please click 'New Chat' before asking a question.");
    return;
}
    // 1. Safely get chat input element
    const chatInput = document.getElementById('chat-input');
    if (!chatInput) {
        console.error('Chat input element not found!');
        return;
    }

    // 2. Get and validate message
    const message = chatInput.value.trim();
    if (!message) return;

    // 3. Get and validate PDF filenames
    let pdfFilenames = [];
    try {
        const storedFiles = sessionStorage.getItem('pdf_filenames');
        pdfFilenames = storedFiles ? JSON.parse(storedFiles) : [];
    } catch (e) {
        console.error('Error parsing PDF filenames:', e);
    }

    if (pdfFilenames.length === 0) {
    // Prevent duplicate warning messages
    const existingWarnings = Array.from(chatMessages.querySelectorAll('.message.bot p'))
        .map(p => p.textContent.trim());
        
    if (!existingWarnings.includes("Please upload at least one PDF before asking questions.")) {
        addMessage('bot', 'Please upload at least one PDF before asking questions.');
    }
    return;
}

    // 4. Add user message and clear input
    addMessage('user', message);
    chatInput.value = '';

    // 5. Send to backend
    try {

        console.log("Sending chat:", {
            query: message,
            pdf_filenames: pdfFilenames,
            session_id: currentSessionId
});
    
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: message,
                pdf_filenames: pdfFilenames,
                session_id: currentSessionId
            })
        }); 

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.error) {
            addMessage('bot', `Error: ${data.error}`);
        } else {
            addMessage('bot', data.response || 'No response from server.');
        }
        await loadChatSessions();  // ✅ Refresh sidebar so title updates
    } catch (error) {
        console.error('Chat Error:', error);
        addMessage('bot', 'An error occurred while communicating with the server.');
    }
}

function enableTitleEdit(titleDiv) {
    titleDiv.contentEditable = true;
    titleDiv.focus();

    const originalText = titleDiv.innerText;

    const handleKeyDown = async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            titleDiv.contentEditable = false;
            titleDiv.removeEventListener('keydown', handleKeyDown);
            await renameSession(titleDiv.dataset.id, titleDiv.innerText.trim());
        } else if (e.key === 'Escape') {
            titleDiv.innerText = originalText;
            titleDiv.contentEditable = false;
            titleDiv.removeEventListener('keydown', handleKeyDown);
        }
    };

    titleDiv.addEventListener('keydown', handleKeyDown);
}

async function loadChatSessions() {
    try {
        const res = await fetch("/chat-sessions");
        const sessions = await res.json();
        chatHistory.innerHTML = '';

        sessions.forEach(session => {
            const historyItem = document.createElement('div');
            historyItem.className = 'chat-item';
            historyItem.dataset.sessionId = session.id;
            historyItem.innerHTML = `
            <div class="chat-item-title-wrapper">
                <div class="chat-item-title" data-id="${session.id}">${session.title}</div>
                <span class="edit-icon" title="Rename">&#9998;</span>
           </div>
                <div class="chat-item-time">${new Date(session.updated_at).toLocaleString()}</div>
            `;
            historyItem.addEventListener('click', () => {
                loadChatMessages(session.id);
                currentSessionId = session.id;
            });

            const editIcon = historyItem.querySelector('.edit-icon');
            editIcon.addEventListener('click', (e) => {
                e.stopPropagation(); // prevent parent click
                const titleDiv = historyItem.querySelector('.chat-item-title');
                enableTitleEdit(titleDiv);
            });

            chatHistory.appendChild(historyItem);
        });
    } catch (err) {
        console.error("Error loading chat sessions:", err);
    }
}

async function renameSession(sessionId, newTitle) {
    try {
        const res = await fetch('/rename-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId, new_title: newTitle.trim() })
        });

        const data = await res.json();
        if (!data.success) {
            alert("Failed to rename chat.");
        }
    } catch (err) {
        console.error("Rename error:", err);
        alert("Error renaming session.");
    }
}



async function loadChatMessages(sessionId) {
    try {
        const res = await fetch(`/chat-messages/${sessionId}`);
        const messages = await res.json();
        chatMessages.innerHTML = '';

        messages.forEach(msg => {
            addMessage(msg.sender, msg.message);
        });

        if (welcomeContainer) {
            welcomeContainer.style.display = 'none';
        }
    } catch (err) {
        console.error("Error loading chat messages:", err);
        addMessage("bot", "Failed to load chat messages.");
    }
}


function convertMarkdownToHTML(text) {
    // Convert **bold** to <strong>bold</strong>// No code was selected, so we'll add a new function to improve the existing code
function improveCode() {
    // Add a function to handle errors in a more user-friendly way
    function handleError(error) {
        console.error('Error:', error);
        addMessage('bot', 'An error occurred. Please try again.');
    }

    }
   
}


// Logout functionality - Add this at the end of your existing script.js
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logout-btn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Clear client-side storage
            localStorage.clear();
            sessionStorage.clear();
            
            // Initiate server-side logout
            fetch('/logout', {
                method: 'GET',
                credentials: 'same-origin'  // Include cookies
            })
            .then(response => {
                if (response.redirected) {
                    // Force full page reload to clear all states
                    window.location.href = response.url;
                }
            })
            .catch(error => {
                console.error('Logout error:', error);
                window.location.reload(true);  // Fallback reload
            });
        });
    }
    const toggleText = document.getElementById('toggle-control-text');
  const controlPanel = document.querySelector('.control-panel');

  toggleText.addEventListener('click', () => {
    controlPanel.classList.toggle('collapsed');
    toggleText.textContent = controlPanel.classList.contains('collapsed') 
      ? 'Show More ▼' 
      : 'Show Less ▲';
  });


  const fileInput = document.getElementById('pdf-file');
    const dragDropOverlay = document.getElementById('drag-drop-overlay');

    if (fileInput && dragDropOverlay) {
        let dragCounter = 0;

        window.addEventListener('dragenter', (e) => {
            e.preventDefault();
            dragCounter++;
            dragDropOverlay.classList.add('active');
        });

        window.addEventListener('dragleave', (e) => {
            dragCounter--;
            if (dragCounter === 0) {
                dragDropOverlay.classList.remove('active');
            }
        });

        window.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        window.addEventListener('drop', (e) => {
            e.preventDefault();
            dragCounter = 0;
            dragDropOverlay.classList.remove('active');

            const files = e.dataTransfer.files;
            if (files.length) {
                // Create new DataTransfer for limiting and setting file input
                const dataTransfer = new DataTransfer();
                let pdfCount = 0;
                for (let i = 0; i < files.length; i++) {
                    if (files[i].type === "application/pdf") {
                        if (pdfCount < 4) {
                            dataTransfer.items.add(files[i]);
                            pdfCount++;
                        } else {
                            alert("You can upload a maximum of 4 PDF files.");
                            break;
                        }
                    }
                }
                fileInput.files = dataTransfer.files;
                fileInput.dispatchEvent(new Event('change'));
            }
        });
    }
});


const userBtn = document.getElementById("user-button");
const userDropdown = document.getElementById("user-dropdown");

// Toggle dropdown when button is clicked
userBtn.addEventListener("click", function(event) {
    event.stopPropagation(); // Prevent the click from bubbling to the document
    userDropdown.style.display = userDropdown.style.display === "block" ? "none" : "block";
});

// Hide dropdown when clicking outside of it
document.addEventListener("click", function(event) {
    if (!userDropdown.contains(event.target) && event.target !== userBtn) {
        userDropdown.style.display = "none";
    }
});

