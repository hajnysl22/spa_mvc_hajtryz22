// server.js
const express = require("express");
const fs = require("fs");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();
const PORT = 3000;
const SECRET_KEY = "your_secret_key";
const USERS_FILE = "./backend/users.json";
const NOTES_FILE = "./backend/notes.json";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

// Helper function to read and write files
const readFile = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const writeFile = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

// User Registration
app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    const users = readFile(USERS_FILE);
    if (users.find(user => user.username === username)) {
        return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now(), username, password: hashedPassword };
    users.push(newUser);
    writeFile(USERS_FILE, users);
    res.status(201).json({ message: "User registered" });
});

// User Login
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const users = readFile(USERS_FILE);
    const user = users.find(user => user.username === username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ token });
});

// Middleware to authenticate requests
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(403).json({ message: "Invalid token" });
        req.userId = decoded.userId;
        next();
    });
};

// Get user's notes
app.get("/notes", authenticate, (req, res) => {
    const notes = readFile(NOTES_FILE).filter(note => note.userId === req.userId);
    res.json(notes);
});

// Create a new note
app.post("/notes", authenticate, (req, res) => {
    const notes = readFile(NOTES_FILE);
    const newNote = { id: Date.now(), text: req.body.text, userId: req.userId };
    notes.push(newNote);
    writeFile(NOTES_FILE, notes);
    res.status(201).json(newNote);
});

// Delete a note
app.delete("/notes/:id", authenticate, (req, res) => {
    let notes = readFile(NOTES_FILE);
    notes = notes.filter(note => note.id !== parseInt(req.params.id) || note.userId !== req.userId);
    writeFile(NOTES_FILE, notes);
    res.status(200).json({ message: "Note deleted" });
});

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
