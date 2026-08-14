const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

async function importRoster() {
  try {
    console.log("Opening local database...");
    const db = await open({
      filename: './studio.db',
      driver: sqlite3.Database
    });

    // 1. CLEAN UP: Delete the previous mock/placeholder names so they don't clutter your kiosk
    console.log("Cleaning up old mock/placeholder names...");
    const mockNames = [
      'Alice Smith', 'Bob Jones', 'Charlie Brown',
      'Jane Assistant', 'John Assistant', 
      'Regular Member One', 'Regular Member Two', 'Regular Member Three'
    ];
    for (const name of mockNames) {
      await db.run(`DELETE FROM users WHERE name = ?`, [name]);
    }

    // 2. ADD YOUR ACTUAL REAL NAMES HERE ───────────────────────────
    // Replace these examples with the actual first and last names of your assistants:
    const assistants = [
      "Heather Assistant",
      "Sarah Assistant"
    ];

    // Replace these examples with the actual first and last names of your members:
    const members = [
      "Dave Member",
      "Emily Member",
      "John Member"
    ];
    // ───────────────────────────────────────────────────────────────

    console.log("Importing your actual studio rosters...");

    for (const name of assistants) {
      await db.run(
        `INSERT OR IGNORE INTO users (name, role, status) VALUES (?, 'assistant', 'Active')`,
        [name]
      );
    }

    for (const name of members) {
      await db.run(
        `INSERT OR IGNORE INTO users (name, role, status) VALUES (?, 'member', 'Active')`,
        [name]
      );
    }

    console.log("✅ SUCCESS! Real studio rosters successfully imported into your local database.");

  } catch (error) {
    console.error("❌ ERROR: Failed to import rosters.");
    console.error(error);
  }
}

importRoster();