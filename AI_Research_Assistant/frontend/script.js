const API_URL =
"https://researchassistant-production-7471.up.railway.app";

const fileInput =
document.getElementById("pdfUpload");

const statusBox =
document.getElementById("status-box");

const fileList =
document.getElementById("file-list");

const chatBox =
document.getElementById("chat-box");

const questionInput =
document.getElementById("question");

// ======================
// STATUS
// ======================

function setStatus(message){

    if(statusBox){
        statusBox.innerHTML = message;
    }
}

// ======================
// CHAT
// ======================

function addUserMessage(text){

    const div =
    document.createElement("div");

    div.className =
    "message user";

    div.innerHTML = text;

    chatBox.appendChild(div);

    chatBox.scrollTop =
    chatBox.scrollHeight;
}

function addBotMessage(text){

    const div =
    document.createElement("div");

    div.className =
    "message bot";

    div.innerHTML = text;

    chatBox.appendChild(div);

    chatBox.scrollTop =
    chatBox.scrollHeight;
}

// ======================
// DOCUMENTS
// ======================

async function loadDocuments(){

    try{

        const response =
        await fetch(
            `${API_URL}/documents`
        );

        const data =
        await response.json();

        fileList.innerHTML = "";

        if(
            !data.documents ||
            data.documents.length === 0
        ){

            fileList.innerHTML = `
            <div class="empty">
                No documents uploaded
            </div>
            `;

            return;
        }

        data.documents.forEach(doc => {

            fileList.innerHTML += `

            <div class="pdf-card">

                <div class="pdf-icon">
                    📄
                </div>

                <div class="pdf-info">

                    <div
                    class="pdf-name"
                    title="${doc.name}">

                        ${doc.name}

                    </div>

                    <div class="pdf-size">
                        ${doc.size} MB
                    </div>

                    <div class="actions">

                        <button
                        class="preview-btn"
                        onclick="previewFile('${doc.name}')">

                            👁
                        </button>

                        <button
                        class="delete-btn"
                        onclick="deleteFile('${doc.name}')">

                            🗑
                        </button>

                    </div>

                </div>

            </div>

            `;
        });

    }
    catch(error){

        console.error(error);

        fileList.innerHTML = `
        <div class="empty">
            Unable to load documents
        </div>
        `;
    }
}

// ======================
// UPLOAD
// ======================

fileInput.addEventListener(
"change",
async function(){

    const file =
    this.files[0];

    if(!file) return;

    setStatus(
        "⏳ Uploading..."
    );

    const formData =
    new FormData();

    formData.append(
        "file",
        file
    );

    try{

        const response =
        await fetch(
            `${API_URL}/upload`,
            {
                method:"POST",
                body:formData
            }
        );

        if(!response.ok){

            throw new Error(
                "Upload failed"
            );
        }

        setStatus(`
            🟢 Ready
            <br>
            📄 ${file.name}
            <br>
            ✓ Indexed Successfully
        `);

        await loadDocuments();

    }
    catch(error){

        console.error(error);

        setStatus(
            "❌ Upload Failed"
        );
    }

    this.value = "";
});

// ======================
// ASK QUESTION
// ======================

async function sendQuestion(){

    const question =
    questionInput.value.trim();

    if(!question) return;

    const welcome =
    document.querySelector(
        ".welcome"
    );

    if(welcome){
        welcome.remove();
    }

    addUserMessage(question);

    questionInput.value = "";

    const typing =
    document.createElement("div");

    typing.className =
    "message bot";

    typing.id =
    "typing";

    typing.innerHTML =
    "Thinking...";

    chatBox.appendChild(
        typing
    );

    chatBox.scrollTop =
    chatBox.scrollHeight;

    try{

        const response =
        await fetch(
            `${API_URL}/ask`,
            {
                method:"POST",

                headers:{
                    "Content-Type":
                    "application/json"
                },

                body:JSON.stringify({
                    question
                })
            }
        );

        const data =
        await response.json();

        document
        .getElementById(
            "typing"
        )
        ?.remove();

        addBotMessage(
            data.answer ||
            "No response received."
        );

    }
    catch(error){

        document
        .getElementById(
            "typing"
        )
        ?.remove();

        addBotMessage(
            "⚠ Server Error"
        );

        console.error(error);
    }

    chatBox.scrollTop =
    chatBox.scrollHeight;
}

// ======================
// ENTER KEY
// ======================

questionInput.addEventListener(
"keydown",
function(e){

    if(e.key === "Enter"){

        e.preventDefault();

        sendQuestion();
    }
});

// ======================
// FILE PREVIEW
// ======================

function previewFile(filename){

    window.open(
        `${API_URL}/preview/${filename}`,
        "_blank"
    );
}

// ======================
// DELETE FILE
// ======================

async function deleteFile(filename){

    const ok =
    confirm(
        `Delete ${filename}?`
    );

    if(!ok) return;

    try{

        await fetch(
            `${API_URL}/delete/${filename}`,
            {
                method:"DELETE"
            }
        );

        setStatus(
            `🗑 Deleted ${filename}`
        );

        await loadDocuments();

    }
    catch(error){

        console.error(error);

        setStatus(
            "Delete failed"
        );
    }
}

// ======================
// INITIAL LOAD
// ======================

loadDocuments();
