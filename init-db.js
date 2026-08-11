const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

async function initializeDatabase() {
  try {
    console.log("Initializing local SQLite database...");
    
    // Open (or create) a local database file named 'studio.db'
    const db = await open({
      filename: './studio.db',
      driver: sqlite3.Database
    });

    // 1. Create Users Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL DEFAULT 'member', -- 'class', 'member', 'assistant'
        status TEXT NOT NULL DEFAULT 'Active' -- 'Active', 'Lapsed'
      )
    `);

    // 2. Create Pieces Table (To log daily firing entries)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS pieces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_name TEXT NOT NULL,
        clay_body TEXT NOT NULL,
        volume_ci REAL NOT NULL,
        calculated_fee REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'Shelf Queue', -- 'Shelf Queue', 'Complete'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Insert some mock students to start with
    const mockStudents = [
      { name: "Alice Smith", role: "member", status: "Active" },
      { name: "Bob Jones", role: "assistant", status: "Active" },
      { name: "Charlie Brown", role: "class", status: "Active" }
    ];

    for (const student of mockStudents) {
      await db.run(
        `INSERT OR IGNORE INTO users (name, role, status) VALUES (?, ?, ?)`,
        [student.name, student.role, student.status]
      );
    }

    console.log("✅ SUCCESS! Local database initialized.");
    console.log("Created tables: 'users', 'pieces'.");
    console.log("Inserted mock student rosters.");

  } catch (error) {
    console.error("❌ ERROR: Failed to initialize database.");
    console.error(error);
  }
}

initializeDatabase();