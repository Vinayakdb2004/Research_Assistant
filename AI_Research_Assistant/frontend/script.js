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

// =====================
// STATUS
// =====================

function setStatus(message) {

```
if (statusBox) {
    statusBox.innerHTML = message;
}
```

}

// =====================
// CHAT UI
// =====================

function addUserMessage(text) {

```
const div =
document.createElement("div");

div.className =
"message user";

div.textContent =
text;

chatBox.appendChild(div);

chatBox.scrollTop =
chatBox.scrollHeight;
```

}

function addBotMessage(text) {

```
const div =
document.createElement("div");

div.className =
"message bot";

div.textContent =
text;

chatBox.appendChild(div);

chatBox.scrollTop =
chatBox.scrollHeight;
```

}

// =====================
// LOAD DOCUMENTS
// =====================

async function loadDocuments() {

```
try {

    const response =
    await fetch(
        `${API_URL}/documents`
    );

    const data =
    await response.json();

    fileList.innerHTML = "";

    if (
        !data.documents ||
        data.documents.length === 0
    ) {

        fileList.innerHTML =
        `<div class="empty">
            No documents uploaded
        </div>`;

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

} catch (error) {

    console.error(error);

    fileList.innerHTML =
    `<div class="empty">
        Unable to load documents
    </div>`;
}
```

}

// =====================
// UPLOAD PDF
// =====================

fileInput.addEventListener(
"change",
async function () {

```
const file =
this.files[0];

if (!file) return;

const formData =
new FormData();

formData.append(
    "file",
    file
);

setStatus(
    "⏳ Uploading..."
);

try {

    const response =
    await fetch(
        `${API_URL}/upload`,
        {
            method: "POST",
            body: formData
        }
    );

    if (!response.ok) {
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

} catch (error) {

    console.error(error);

    setStatus(
        "❌ Upload Failed"
    );
}

this.value = "";
```

});

// =====================
// ASK QUESTION
// =====================

async function sendQuestion() {

```
const question =
questionInput.value.trim();

if (!question) return;

addUserMessage(question);

questionInput.value = "";

const typing =
document.createElement("div");

typing.className =
"message bot";

typing.id =
"typing";

typing.textContent =
"Thinking...";

chatBox.appendChild(
    typing
);

try {

    const response =
    await fetch(
        `${API_URL}/ask`,
        {
            method: "POST",

            headers: {
                "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
                question
            })
        }
    );

    const data =
    await response.json();

    document
    .getElementById("typing")
    ?.remove();

    console.log(
        "API RESPONSE:",
        data
    );

    let answer = "";

    if (
        typeof data.answer ===
        "string"
    ) {

        answer =
        data.answer;

    } else if (
        data.answer &&
        data.answer.answer
    ) {

        answer =
        data.answer.answer;

    } else if (
        data.answer &&
        data.answer.content
    ) {

        answer =
        data.answer.content;

    } else {

        answer =
        JSON.stringify(
            data,
            null,
            2
        );
    }

    addBotMessage(answer);

} catch (error) {

    document
    .getElementById("typing")
    ?.remove();

    console.error(error);

    addBotMessage(
        "⚠ Server Error"
    );
}
```

}

// =====================
// ENTER KEY
// =====================

questionInput.addEventListener(
"keydown",
function (e) {

```
if (e.key === "Enter") {

    e.preventDefault();

    sendQuestion();
}
```

});

// =====================
// PREVIEW FILE
// =====================

function previewFile(filename) {

```
const encodedName =
encodeURIComponent(
    filename
);

window.open(
    `${API_URL}/preview/${encodedName}`,
    "_blank"
);
```

}

// =====================
// DELETE FILE
// =====================

async function deleteFile(filename) {

```
const confirmed =
confirm(
    `Delete ${filename}?`
);

if (!confirmed) return;

try {

    const encodedName =
    encodeURIComponent(
        filename
    );

    const response =
    await fetch(
        `${API_URL}/delete/${encodedName}`,
        {
            method: "DELETE"
        }
    );

    console.log(
        await response.json()
    );

    setStatus(
        `🗑 Deleted ${filename}`
    );

    await loadDocuments();

} catch (error) {

    console.error(error);

    setStatus(
        "Delete failed"
    );
}
```

}

// =====================
// INITIAL LOAD
// =====================

loadDocuments();
