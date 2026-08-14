const express = require('express');
const cors = require('cors');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let db;

async function startServer() {
  try {
    db = await open({
      filename: './studio.db',
      driver: sqlite3.Database
    });
    console.log("Connected to local SQLite database.");

    // ENDPOINT 1: Send active students/members to the kiosk dropdown
    app.get('/api/students', async (req, res) => {
      try {
        const students = await db.all('SELECT name, role FROM users WHERE status = "Active"');
        res.json(students);
      } catch (error) {
        console.error("Failed to fetch student roster:", error);
        res.status(500).json({ error: "Failed to fetch student roster" });
      }
    });

    // ENDPOINT 2: Receive and log a firing piece or clay purchase
    app.post('/api/log-piece', async (req, res) => {
      const { studentName, amountDue, cubicInches, clayType } = req.body;
      
      if (!studentName || amountDue === undefined || cubicInches === undefined || !clayType) {
        return res.status(400).json({ error: "Missing required details" });
      }

      try {
        await db.run(
          `INSERT INTO pieces (user_name, clay_body, volume_ci, calculated_fee) VALUES (?, ?, ?, ?)`,
          [studentName, clayType, cubicInches, amountDue]
        );
        console.log(`[RECORDED] ${studentName} logged: ${clayType} | Fee: $${amountDue.toFixed(2)}`);
        res.json({ success: true, message: "Transaction successfully logged." });
      } catch (error) {
        console.error("Failed to save entry:", error);
        res.status(500).json({ error: "Failed to save entry" });
      }
    });

    // ENDPOINT 3: Listen for Squarespace class/membership purchases
    app.post('/api/squarespace-webhook', async (req, res) => {
      // Handle Squarespace's initial handshake/test pings
      if (req.body.topic === 'test' || !req.body.data) {
        console.log("[SQUARESPACE WEBHOOK] Connection test handshake successful!");
        return res.json({ success: true });
      }

      const orderData = req.body.data;
      const firstName = orderData.billingAddress?.firstName || "";
      const lastName = orderData.billingAddress?.lastName || "";
      const fullName = `${firstName} ${lastName}`.trim();
      
      // Determine their role based on what product they purchased
      const lineItems = orderData.lineItems || [];
      let calculatedRole = 'member'; // Default to standard member

      for (const item of lineItems) {
        const productName = item.productName || "";
        if (productName.toLowerCase().includes('class')) {
          calculatedRole = 'class';
          break;
        } else if (productName.toLowerCase().includes('assistant')) {
          calculatedRole = 'assistant';
          break;
        }
      }

      try {
        // Automatically insert the student or update their role if they already exist
        await db.run(
          `INSERT INTO users (name, role, status) 
           VALUES (?, ?, 'Active') 
           ON CONFLICT(name) DO UPDATE SET role = ?, status = 'Active'`,
          [fullName, calculatedRole, calculatedRole]
        );
        
        console.log(`[SQUARESPACE WEBHOOK] Registered ${fullName} as a ${calculatedRole}!`);
        res.json({ success: true });
      } catch (error) {
        console.error("[SQUARESPACE WEBHOOK] Failed to process order:", error);
        res.status(500).json({ error: "Failed to process order" });
      }
    });

    app.listen(PORT, () => {
      console.log(`✅ SUCCESS! Firing Server is running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("❌ ERROR: Failed to start web server.");
    console.error(error);
  }
}

startServer();