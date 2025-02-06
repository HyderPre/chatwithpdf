document.addEventListener("DOMContentLoaded", () => {
    const pdfForm = document.getElementById("pdf-form");
    const chatForm = document.getElementById("chat-form");
    const chatMessages = document.getElementById("chat-messages");
    const chatInput = document.getElementById("chat-input");

    // 📤 Handle PDF Upload
    pdfForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const pdfFile = document.getElementById("pdf-file").files[0];

        if (!pdfFile) {
            alert("Please upload a PDF file.");
            return;
        }

        const formData = new FormData();
        formData.append("pdf", pdfFile);

        try {
            const response = await fetch("/upload-pdf", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Upload failed");
            }

            alert(`PDF "${pdfFile.name}" uploaded successfully!`);
            sessionStorage.setItem("pdf_filename", data.filename);
        } catch (error) {
            console.error("Upload Error:", error);
        }
    });

    // 💬 Handle Chat Queries
    chatForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const userQuery = chatInput.value.trim();
        const pdfFilename = sessionStorage.getItem("pdf_filename");

        if (!pdfFilename) {
            alert("Please upload a PDF before starting the chat.");
            return;
        }

        if (userQuery) {
            addMessage("user", userQuery);
            chatInput.value = "";

            try {
                const response = await fetch("/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ query: userQuery, pdf_filename: pdfFilename }),
                });

                const data = await response.json();
                if (data.error) {
                    addMessage("bot", `Error: ${data.error}`);
                } else {
                    addMessage("bot", data.response);
                }
            } catch (error) {
                console.error("Chat Error:", error);
                addMessage("bot", "An error occurred.");
            }
        }
    });

    function addMessage(sender, text) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", `${sender}-message`);
        messageDiv.innerHTML = text.replace(/\n/g, "<br>"); // Preserve new lines
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});
console.log("PDF Form:", pdfForm);
console.log("Chat Form:", chatForm);
console.log("Chat Messages:", chatMessages);
console.log("Chat Input:", chatInput);