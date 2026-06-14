const API = "http://127.0.0.1:8000";

const fileInput =
document.getElementById("pdfUpload");

const statusBox =
document.getElementById("status-box");

const fileList =
document.getElementById("file-list");

const chatBox =
document.getElementById("chat-box");

function setStatus(message){
    statusBox.innerHTML = message;
}

async function loadDocuments(){
    try{
        const response =
        await fetch(`${API}/documents`);

        const data =
        await response.json();

        if(
            !data.documents ||
            data.documents.length === 0
        ){
            fileList.innerHTML =
            "<div class='empty'>No files uploaded</div>";
            return;
        }

        fileList.innerHTML = "";

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

            onclick="previewFile(
            '${doc.name}'
            )">

                👁

            </button>

            <button
            class="delete-btn"

            onclick="deleteFile(
            '${doc.name}'
            )">

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
        fileList.innerHTML =
        "Unable to load documents";
    }
}

fileInput.addEventListener(
"change",
async function(){
    const file = this.files[0];

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
        await fetch(
            `${API}/upload`,
            {
                method:"POST",
                body:formData
            }
        );

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
        setStatus(
        "❌ Upload Failed"
        );

        console.error(error);
    }

    this.value = "";
});

function addUserMessage(text){
    chatBox.innerHTML += `

<div class="message user">

    ${text}

</div>

`;
}

function addBotMessage(text){
    chatBox.innerHTML += `

<div class="message bot">

    ${text}

</div>

`;
}

async function sendQuestion(){
    const input =
document.getElementById(
"question"
);

    const question =
    input.value.trim();

    if(!question)
    return;

    const welcome =
document.querySelector(
".welcome"
);

    if(welcome){
        welcome.remove();
    }

    addUserMessage(
        question
    );

    input.value = "";

    chatBox.scrollTop =
    chatBox.scrollHeight;

    chatBox.innerHTML += `

<div
class="message bot"
id="typing">

    Thinking...

</div>

`;

    chatBox.scrollTop =
    chatBox.scrollHeight;

    try{
        const response =
        await fetch(
            `${API}/ask`,
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

        const typing =
        document.getElementById(
        "typing"
        );

        if(typing){
            typing.remove();
        }

        let answer = "";

        if(
            typeof data.answer ===
            "string"
        ){
            answer =
            data.answer;
        }

        else if(
            data.answer &&
            data.answer.answer
        ){
            answer =
            data.answer.answer;
        }

        else{
            answer =
            JSON.stringify(
                data,
                null,
                2
            );
        }

        addBotMessage(
            answer
        );
    }
    catch(error){
        const typing =
        document.getElementById(
        "typing"
        );

        if(typing){
            typing.remove();
        }

        addBotMessage(
        "Something went wrong."
        );

        console.error(error);
    }

    chatBox.scrollTop =
    chatBox.scrollHeight;
}

document
.getElementById("question")
.addEventListener(
"keydown",
function(e){
    if(
        e.key === "Enter"
    ){
        e.preventDefault();
        sendQuestion();
    }
});

loadDocuments();

function previewFile(filename){

    window.open(

        `${API}/preview/${filename}`,

        "_blank"

    );
}
async function deleteFile(filename){

    const ok = confirm(

        `Delete ${filename}?`

    );

    if(!ok) return;

    await fetch(

        `${API}/delete/${filename}`,

        {

            method:"DELETE"

        }

    );

    loadDocuments();

    setStatus(

        `🗑 Deleted ${filename}`

    );
}