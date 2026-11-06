# Lab 3: Debugging Guide – 4 Common Backend Errors

This document provides a comprehensive explanation of the four common errors addressed in **Lab 3 (Backend Development Fundamentals)**, detailing the symptoms, root causes, broken code examples, and exact fixes.

---

## 1. Error 1: `EADDRINUSE` (Port Already in Use)

### Symptom & Error Output
```text
Error: listen EADDRINUSE: address already in use :::3000
    at Server.setupListenHandle [as _listen2] (node:net:1904:16)
    at listenInCluster (node:net:1961:12)
    at Server.listen (node:net:2063:7)
    at Function.listen (.../node_modules/express/lib/application.js:635:24)
    at startServer (.../server.js:58:21)
```

### Root Cause
An HTTP server requires exclusive binding to a specific TCP port (e.g., port `3000`). If another process is already listening on that port—such as:
- A previously started Node.js server still running in another terminal window or in the background.
- Another application (e.g., React dev server, Grafana, another lab project).
The operating system rejects the new bind request and throws `EADDRINUSE`.

### Broken Code
```javascript
// Hardcoded port without conflict detection
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

### How It Was Fixed
1. **Dynamic Environment Variable Fallback:** Configured `PORT = process.env.PORT || 3000` so the port can be changed in `.env` without modifying code.
2. **Graceful Error Handling:** Added an `'error'` event listener to the server instance to detect `EADDRINUSE` and display a friendly, actionable remedy:
   ```javascript
   const server = app.listen(PORT, () => {
       console.log(`Server running at http://localhost:${PORT}`);
   });

   server.on('error', (err) => {
       if (err.code === 'EADDRINUSE') {
           console.error(`\n[CRITICAL ERROR] Port ${PORT} is already in use (EADDRINUSE).`);
           console.error(`Fix: Change PORT in .env or kill the conflicting process.`);
           process.exit(1);
       }
   });
   ```
3. **Terminal Command to Free Port:**
   - On Windows PowerShell:
     ```powershell
     Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
     ```
   - Or using npx:
     ```bash
     npx kill-port 3000
     ```

---

## 2. Error 2: Wrong Import Path (Cannot find module)

### Symptom & Error Output
```text
node:internal/modules/cjs/loader:1228
  throw err;
  ^

Error: Cannot find module './db'
Require stack:
 - C:\Users\...\controllers\bookController.js
 - C:\Users\...\routes\bookRoutes.js
 - C:\Users\...\server.js
```

### Root Cause
In Node.js CommonJS (`require`), relative paths (`./` and `../`) are evaluated relative to the **directory of the current file**, NOT the project root.
When `bookController.js` is inside the `controllers/` directory and attempts `require('./db')`, Node looks for `controllers/db.js` which does not exist, causing module resolution failure.

### Broken Code
```javascript
// Inside controllers/bookController.js
// WRONG: Looking for db in the same folder (controllers/)
const { getDatabase } = require('./db'); 
```

### How It Was Fixed
Updated the path to traverse up one level to the root, then into `config/`:
```javascript
// Inside controllers/bookController.js
// FIXED: Go up one directory (../) then into config/db.js
const { getDatabase } = require('../config/db');
```
Similarly, in `routes/bookRoutes.js`:
```javascript
// Go up one directory to access controllers/
const bookController = require('../controllers/bookController');
```

---

## 3. Error 3: Table-Name Typo (`no such table`)

### Symptom & Error Output
```text
[Unhandled Server Error] SQLITE_ERROR: no such table: book
```
Or returning a `500 Internal Server Error` with `{"message": "Internal server error"}`.

### Root Cause
The database schema created the table with the plural noun `books` (`CREATE TABLE IF NOT EXISTS books (...)`).
However, in one or more SQL queries, a developer typed the singular noun `book` (`SELECT * FROM book` or `INSERT INTO book`). SQLite throws `SQLITE_ERROR: no such table: book`.

### Broken Code
```javascript
// WRONG: 'book' instead of 'books'
const book = await db.get('SELECT * FROM book WHERE id = ?', [id]);
const result = await db.run('INSERT INTO book (title, author, price) VALUES (?, ?, ?)', [title, author, price]);
```

### How It Was Fixed
Standardized all SQL statements across `config/db.js` and `controllers/bookController.js` to strictly reference `books`:
```javascript
// FIXED: Accurate table name matching schema
const book = await db.get('SELECT * FROM books WHERE id = ?', [id]);
const result = await db.run('INSERT INTO books (title, author, price) VALUES (?, ?, ?)', [title, author, price]);
```

---

## 4. Error 4: Missing `await` (Asynchronous Database Operations)

### Symptom & Error Output
- The API returns an empty array `[]` or `[Promise { <pending> }]` or `undefined`.
- In `POST /books` or `PUT /books`, `result.lastID` is `undefined` because the Promise has not resolved before accessing properties.
- Or responses are sent before the SQL transaction completes.

### Root Cause
All database queries using `sqlite` (`db.all()`, `db.get()`, `db.run()`, `db.exec()`) are **asynchronous** and return a JavaScript `Promise`.
If the `await` keyword is omitted before the database call:
1. JavaScript does not wait for SQLite to read or write the data on the disk.
2. The variable holds a pending `Promise` object rather than the resolved rows or results.
3. Express sends the response immediately with unpopulated data.

### Broken Code
```javascript
// WRONG: Missing 'await' keywords
exports.getAllBooks = async (req, res, next) => {
    const db = getDatabase(); // Returns Promise<Database>, NOT the database object!
    const books = db.all('SELECT * FROM books'); // Returns Promise<pending>, NOT array!
    
    // Sends [Promise] or crashes
    res.status(200).json({ data: books }); 
};
```

### How It Was Fixed
Ensured every asynchronous database operation is prefixed with `await`:
```javascript
// FIXED: Properly awaited asynchronous operations
exports.getAllBooks = async (req, res, next) => {
    try {
        const db = await getDatabase(); // Await database connection
        const books = await db.all(sql, params); // Await SQL execution
        
        return res.status(200).json({
            message: 'Books retrieved successfully',
            count: books.length,
            data: books
        });
    } catch (error) {
        next(error);
    }
};
```
