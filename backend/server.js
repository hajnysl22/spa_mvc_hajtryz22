const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = 3000;
const DATA_FILE = "./backend/db.json";

app.use(cors());
app.use(express.json());
const path = require("path");

// Serve static frontend files
app.use(express.static(path.join(__dirname, "../frontend")));

// Serve index.html for root URL
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});


// Read notes
app.get("/notes", (req, res) => {
    const notes = JSON.parse(fs.readFileSync(DATA_FILE));
    res.json(notes);
});

// Create a note
app.post("/notes", (req, res) => {
    const notes = JSON.parse(fs.readFileSync(DATA_FILE));
    const newNote = { id: Date.now(), text: req.body.text };
    notes.push(newNote);
    fs.writeFileSync(DATA_FILE, JSON.stringify(notes, null, 2));
    res.status(201).json(newNote);
});

// Delete a note
app.delete("/notes/:id", (req, res) => {
    let notes = JSON.parse(fs.readFileSync(DATA_FILE));
    notes = notes.filter(note => note.id !== parseInt(req.params.id));
    fs.writeFileSync(DATA_FILE, JSON.stringify(notes, null, 2));
    res.status(200).json({ message: "Note deleted" });
});

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
