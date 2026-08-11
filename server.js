const express = require('express');
const cors = require('cors');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS so your iPad HTML file can communicate with this server
app.use(cors());

// Enable JSON reading so the server can understand the data sent by the kiosk
app.use(express.json());

let db;

async function startServer() {
  try {
    // 1. Connect to our local database
    db = await open({
      filename: './studio.db',
      driver: sqlite3.Database
    });
    console.log("Connected to local SQLite database.");

    // 2. ENDPOINT 1: Send active students/members to the kiosk dropdown
    app.get('/api/students', async (req, res) => {
      try {
        const students = await db.all('SELECT name, role FROM users WHERE status = "Active"');
        res.json(students);
      } catch (error) {
        console.error("Failed to fetch student roster:", error);
        res.status(500).json({ error: "Failed to fetch student roster" });
      }
    });

    // 3. ENDPOINT 2: Receive and log a fired piece
    app.post('/api/log-piece', async (req, res) => {
      const { studentName, amountDue, cubicInches, clayType } = req.body;
      
      // Basic check to make sure the kiosk sent all required info
      if (!studentName || amountDue === undefined || !cubicInches || !clayType) {
        return res.status(400).json({ error: "Missing required firing details" });
      }

      try {
        // Insert the log directly into our local database
        await db.run(
          `INSERT INTO pieces (user_name, clay_body, volume_ci, calculated_fee) VALUES (?, ?, ?, ?)`,
          [studentName, clayType, cubicInches, amountDue]
        );
        
        console.log(`[LOGGED] ${studentName} fired ${cubicInches.toFixed(1)} CI of ${clayType} ($${amountDue.toFixed(2)})`);
        res.json({ success: true, message: "Piece successfully logged to local database." });
      } catch (error) {
        console.error("Failed to save firing entry:", error);
        res.status(500).json({ error: "Failed to save firing entry" });
      }
    });

    // 4. Start listening for network commands
    app.listen(PORT, () => {
      console.log(`✅ SUCCESS! Firing Server is running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("❌ ERROR: Failed to start web server.");
    console.error(error);
  }
}

startServer();