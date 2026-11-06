const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
require('dotenv').config();

let dbInstance = null;

/**
 * Initializes and returns the SQLite database connection singleton.
 * Automatically creates the 'books' table and seeds sample records if empty.
 */
async function getDatabase() {
    if (!dbInstance) {
        const dbPath = process.env.DB_FILE || path.join(__dirname, '..', 'books.db');

        dbInstance = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        // Enable foreign keys if needed
        await dbInstance.run('PRAGMA foreign_keys = ON');

        // Create the 'books' table if not exists
        await dbInstance.exec(`
            CREATE TABLE IF NOT EXISTS books (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                author TEXT NOT NULL,
                price REAL NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Check if table has records, seed initial data for easy testing
        const row = await dbInstance.get('SELECT COUNT(*) AS count FROM books');
        if (row.count === 0) {
            await dbInstance.run(`
                INSERT INTO books (title, author, price) VALUES
                ('The Great Gatsby', 'F. Scott Fitzgerald', 350.00),
                ('To Kill a Mockingbird', 'Harper Lee', 420.00),
                ('1984', 'George Orwell', 299.00),
                ('Pride and Prejudice', 'Jane Austen', 250.00),
                ('The Catcher in the Rye', 'J.D. Salinger', 380.00),
                ('The Hobbit', 'J.R.R. Tolkien', 499.00),
                ('Clean Code', 'Robert C. Martin', 850.00),
                ('JavaScript: The Good Parts', 'Douglas Crockford', 620.00)
            `);
            console.log('Database initialized and seeded with 8 sample books.');
        }
    }

    return dbInstance;
}

module.exports = { getDatabase };
