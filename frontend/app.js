const API_URL = "http://localhost:3000/notes";

// Fetch and display notes
async function fetchNotes() {
    const response = await fetch(API_URL);
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
    await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input.value })
    });
    input.value = "";
    fetchNotes();
}

// Delete a note
async function deleteNote(id) {
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    fetchNotes();
}

// Initial fetch
fetchNotes();
