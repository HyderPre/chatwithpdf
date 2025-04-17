document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const fileInput = document.getElementById('pdf-file');
    const uploadBtn = document.getElementById('upload-btn');
     // Store selected files (max 4)
let selectedPDFFiles = [];

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



    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    uploadBtn.addEventListener('click', uploadPDF);



    function addMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        messageDiv.innerHTML = `<p>${text}</p>`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function uploadPDF() {
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
            addMessage('bot', `Uploaded ${names.length} PDF(s) successfully:\n- ${names.join('\n- ')}`);
            
            // Save filenames for chat
            sessionStorage.setItem('pdf_filenames', JSON.stringify(names));
    
        } catch (error) {
            console.error('Upload Error:', error);
            addMessage('bot', 'Failed to upload PDF(s).');
        }
    }
    
    
});


document.addEventListener('DOMContentLoaded', function() {
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
            
            const chatMessages = document.getElementById('chat-messages');
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
});

// If you're receiving the AI responses via fetch, modify your sendMessage function
async function sendMessage() {
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
        addMessage('bot', 'Please upload at least one PDF before asking questions.');
        return;
    }

    // 4. Add user message and clear input
    addMessage('user', message);
    chatInput.value = '';

    // 5. Send to backend
    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: message,
                pdf_filenames: pdfFilenames
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
    } catch (error) {
        console.error('Chat Error:', error);
        addMessage('bot', 'An error occurred while communicating with the server.');
    }
}


document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const fileInput = document.getElementById('pdf-file');
    const uploadBtn = document.getElementById('upload-btn');
    const welcomeContainer = document.getElementById('welcome-container');
    const newChatBtn = document.getElementById('new-chat');
    const chatHistory = document.getElementById('chat-history');
    
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
        if (pdfActive) {
            uploadBtn.style.display = 'none';
            cancelBtn.style.display = 'inline-block';
            fileInput.disabled = true;
            document.querySelector('.file-input-wrapper').classList.add('disabled');
        } else {
            uploadBtn.style.display = 'inline-block';
            cancelBtn.style.display = 'none';
            fileInput.disabled = false;
            document.querySelector('.file-input-wrapper').classList.remove('disabled');
        }
    }
    
    // Cancel PDF function
    // function cancelPdf() {
    //     // Clear the file input
    //     fileInput.value = '';
    //     document.getElementById('file-name').textContent = 'Choose file...';
        
    //     // Reset the PDF state
    //     sessionStorage.removeItem('pdf_filename');
    //     togglePdfButtons(false);
        
    //     // Add a message to inform the user
    //     addMessage('bot', 'PDF cancelled. You can now upload a different file.');
    // }
    
    // Add event listener for cancel button
    cancelBtn.addEventListener('click', cancelPdf);
    
    // New chat functionality
    if (newChatBtn) {
        newChatBtn.addEventListener('click', startNewChat);
    }

    function startNewChat() {
        // 1. Clear current conversation
        chatMessages.innerHTML = '';
        
        // 2. Reset file input
        fileInput.value = '';
        document.getElementById('file-name').textContent = 'Choose file...';
        
        // 3. Clear input field
        chatInput.value = '';
        
        // 4. Show welcome message
        if (welcomeContainer) {
            welcomeContainer.style.display = 'flex';
        }
        
        // 5. Remove the current PDF from session storage
        sessionStorage.removeItem('pdf_filename');///////////////// we have to change pdf_filename  to pdf_filenames
        
        // 6. Reset PDF buttons state
        togglePdfButtons(false);
        
        // 7. Save the previous chat to history (if it had content)
        saveCurrentChatToHistory();
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



    function addMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        messageDiv.innerHTML = `<p>${text}</p>`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Hide welcome message when chat starts
        if (welcomeContainer && chatMessages.children.length > 0) {
            welcomeContainer.style.display = 'none';
        }
    }

    

    // Set up event listeners
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    uploadBtn.addEventListener('click', uploadPDF);
    
    
    

});
const userBtn = document.getElementById("user-button");
const userDropdown = document.getElementById("user-dropdown");

userBtn.addEventListener("click", function () {
    userDropdown.style.display = userDropdown.style.display === "block" ? "none" : "block";
});


function convertMarkdownToHTML(text) {
    // Convert **bold** to <strong>bold</strong>// No code was selected, so we'll add a new function to improve the existing code
function improveCode() {
    // Add a function to handle errors in a more user-friendly way
    function handleError(error) {
        console.error('Error:', error);
        addMessage('bot', 'An error occurred. Please try again.');
    }

    // Improve the addMessage function to handle different types of messages
    function addMessage(sender, text, type = 'text') {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);

        if (type === 'markdown') {
            messageDiv.innerHTML = convertMarkdownToHTML(text);
        } else {
            messageDiv.innerHTML = `<p>${text}</p>`;
        }

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Hide welcome message when chat starts
        if (welcomeContainer && chatMessages.children.length > 0) {
            welcomeContainer.style.display = 'none';
        }
    }

    // Improve the uploadPDF function to handle errors and display a success message
    
    

    // Improve the sendMessage function to handle errors and display a success message
    
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
});