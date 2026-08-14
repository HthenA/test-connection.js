const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

async function importRoster() {
  try {
    console.log("Opening local database...");
    const db = await open({
      filename: './studio.db',
      driver: sqlite3.Database
    });

    // ─── ADD YOUR REAL NAMES HERE ──────────────────────────────────
    // Just replace these placeholder names with your real studio rosters:
    
    const assistants = [
      "Jane Assistant",
      "John Assistant"
    ];

    const members = [
      "Regular Member One",
      "Regular Member Two",
      "Regular Member Three"
    ];
    // ───────────────────────────────────────────────────────────────

    console.log("Importing rosters...");

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

    console.log("✅ SUCCESS! Real rosters successfully imported into your local database file.");

  } catch (error) {
    console.error("❌ ERROR: Failed to import rosters.");
    console.error(error);
  }
}

importRoster();