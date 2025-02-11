// app.js
const API_URL = "http://localhost:3000";


// Register User
async function register() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });
    alert(await response.json().message);
}

// Login User
async function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (data.token) {
        localStorage.setItem("token", data.token);
        document.getElementById("auth").style.display = "none";
        document.getElementById("notesSection").style.display = "block";
        fetchNotes();
    } else {
        alert("Login failed");
    }
}

// Logout User
function logout() {
    localStorage.removeItem("token");
    document.getElementById("auth").style.display = "block";
    document.getElementById("notesSection").style.display = "none";
}

// Fetch and display notes
async function fetchNotes() {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/notes`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const notes = await response.json();
    const notesList = document.getElementById("notesList");
    notesList.innerHTML = "";
    notes.forEach(note => {
        const li = document.createElement("li");
        li.textContent = note.text;
        const delBtn = document.createElement("button");
        delBtn.textContent = "X";
        delBtn.onclick = () => deleteNote(note.id);
        li.appendChild(delBtn);
        notesList.appendChild(li);
    });
}

// Add a new note
async function addNote() {
    const input = document.getElementById("noteInput");
    if (!input.value.trim()) return;
    const token = localStorage.getItem("token");
    await fetch(`${API_URL}/notes`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ text: input.value })
    });
    input.value = "";
    fetchNotes();
}

// Delete a note
async function deleteNote(id) {
    const token = localStorage.getItem("token");
    await fetch(`${API_URL}/notes/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
    });
    fetchNotes();
}

// Check if user is logged in
if (localStorage.getItem("token")) {
    document.getElementById("auth").style.display = "none";
    document.getElementById("notesSection").style.display = "block";
    fetchNotes();
}
