# Lab 3: REST API, Query Parameters, Validation & Debugging

**Backend Development Fundamentals (BDF)** · Year II Term II · Aurora  
**Faculty:**  C. Sai Shiva Teja
**Student Name:**  Kasanagottu Praharsha  
**Registration Number:** 252U1R5067  
**Section:** 106  

---

## 🌐 Live Deployment

> **API is live on Render:**  
> 🔗 **https://praharsha-kasanagottu-bds-1.onrender.com/**

| Endpoint | URL |
|:---|:---|
| Welcome / Info | https://praharsha-kasanagottu-bds-1.onrender.com/ |
| All Books | https://praharsha-kasanagottu-bds-1.onrender.com/books |
| Search | https://praharsha-kasanagottu-bds-1.onrender.com/books?search_q=Gatsby |
| Sort by Price | https://praharsha-kasanagottu-bds-1.onrender.com/books?order_by=price&order=DESC |
| Price Range | https://praharsha-kasanagottu-bds-1.onrender.com/books?min_price=300&max_price=500 |

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [Technologies Used](#-technologies-used)
3. [Project Directory Structure](#-project-directory-structure)
4. [Database Setup & Schema](#-database-setup--schema)
5. [Installation & Setup](#-installation--setup)
6. [Running the Application](#-running-the-application)
7. [REST API Endpoints](#-rest-api-endpoints)
8. [Query Parameters & Filters (GET /books)](#-query-parameters--filters-get-books)
9. [Request Validation Rules](#-request-validation-rules)
10. [HTTP Status Codes & Response Formats](#-http-status-codes--response-formats)
11. [Debugging Guide (4 Common Errors)](#-debugging-guide-4-common-errors)
12. [Postman Testing Guide (16 Test Cases)](#-postman-testing-guide-16-test-cases)
13. [Automated Testing](#-automated-testing)
14. [Viva Examination Questions & Answers](#-viva-examination-questions--answers)
15. [Security & Version Control Best Practices](#-security--version-control-best-practices)

---

## 📖 Project Overview

This project converts the earlier **Lab 2** backend into a production-grade, clean **RESTful API** for managing a collection of books. It features:
- **Noun-based RESTful routing** (`/books`).
- **Dynamic query parameters** for search (`search_q` with SQL `LIKE`), multi-column sorting (`order_by`, `order`), and pagination (`limit`, `offset`).
- **Price range filtering** (`min_price`, `max_price`) utilizing SQL `BETWEEN` and comparison operators.
- **Strict request validation** with descriptive error messages and HTTP `400 Bad Request`.
- **Proper HTTP status codes** (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `500 Internal Server Error`).
- **SQL Injection Prevention** by whitelisting sort columns/directions and using parameterized queries (`?`).
- **Asynchronous database operations** with `sqlite` and `sqlite3` using `async/await`.
- **Debugging solutions** for common developer pitfalls (`EADDRINUSE`, wrong imports, table name typos, missing `await`).

---

## 🛠 Technologies Used

- **Node.js** (v24 / v18+) - JavaScript runtime environment.
- **Express.js** (v5 / v4) - Fast, minimalist web framework.
- **SQLite3 & sqlite** - File-based SQL relational database engine with promise-based async/await support.
- **dotenv** - Environment variable management.
- **Postman** - API testing and validation.

---

## 📁 Project Directory Structure

```text
lab-3-rest-api/
├── config/
│   └── db.js                 # SQLite database initialization & auto-seeding
├── controllers/
│   └── bookController.js     # Business logic, query construction, and validation
├── routes/
│   └── bookRoutes.js         # RESTful router endpoints for /books
├── .env.example              # Template environment variables
├── .gitignore                # Excludes node_modules, .env, and .db files
├── DEBUGGING_GUIDE.md        # Detailed breakdown of the 4 debugging problems
├── Lab3_Books_API.postman_collection.json # Direct Postman import collection
├── package.json              # Project scripts and dependencies
├── server.js                 # Server entry point, middleware, and error handlers
├── test-api.js               # 16-point automated test suite
└── README.md                 # Complete documentation
```

---

## 🗄 Database Setup & Schema

The application uses an embedded **SQLite** database (`books.db`). The database schema and initial seed data are managed automatically on server start via `config/db.js`.

### Table Schema: `books`
```sql
CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    price REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Auto-Seeded Data
When the database starts for the first time, 8 sample books are automatically seeded if the table is empty:
1. *The Great Gatsby* by F. Scott Fitzgerald (Price: 350.00)
2. *To Kill a Mockingbird* by Harper Lee (Price: 420.00)
3. *1984* by George Orwell (Price: 299.00)
4. *Pride and Prejudice* by Jane Austen (Price: 250.00)
5. *The Catcher in the Rye* by J.D. Salinger (Price: 380.00)
6. *The Hobbit* by J.R.R. Tolkien (Price: 499.00)
7. *Clean Code* by Robert C. Martin (Price: 850.00)
8. *JavaScript: The Good Parts* by Douglas Crockford (Price: 620.00)

---

## ⚙️ Installation & Setup

1. **Clone or navigate to the project directory:**
   ```bash
   cd "lab 2"
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to create `.env`:
   ```bash
   cp .env.example .env
   ```
   *Default `.env` settings:*
   ```env
   PORT=3000
   DB_FILE=./books.db
   ```

---

## 🚀 Running the Application

### Start Server
```bash
npm start
```
The server will start listening at: `http://localhost:3000`

### Run in Development Mode (with auto-reload)
```bash
npm run dev
```

---

## 📡 REST API Endpoints

| HTTP Method | Endpoint | Description | Status Code |
|:---:|:---|:---|:---:|
| **GET** | `/books` | Retrieve books with optional search, sort, pagination, and price range | `200 OK` |
| **GET** | `/books/:id` | Retrieve a single book by ID | `200 OK` / `404 Not Found` |
| **POST** | `/books` | Create a new book | `201 Created` / `400 Bad Request` |
| **PUT** | `/books/:id` | Update an existing book by ID | `200 OK` / `400 Bad Request` / `404 Not Found` |
| **DELETE** | `/books/:id` | Delete a book by ID | `200 OK` / `404 Not Found` |

---

## 🔍 Query Parameters & Filters (`GET /books`)

All parameters are optional and have sensible defaults:

| Parameter | Type | Default | Description & Validation |
|:---|:---:|:---:|:---|
| `search_q` | string | `""` | Partial title search using SQL `LIKE %search_q%`. |
| `order_by` | string | `"id"` | Column to sort by. Whitelisted: `id`, `title`, `author`, `price`, `created_at`. Prevents SQL injection. |
| `order` | string | `"ASC"` | Sort direction. Allowed: `ASC` or `DESC` (case-insensitive). |
| `limit` | integer | `10` | Maximum number of records to return (must be integer > 0). |
| `offset` | integer | `0` | Number of records to skip for pagination (must be integer >= 0). |
| `min_price`| float | `undefined` | Minimum book price (must be number >= 0). |
| `max_price`| float | `undefined` | Maximum book price (must be number >= 0). |

### Query Examples:
- **Search by title:** `GET /books?search_q=Gatsby`
- **Sort descending by price:** `GET /books?order_by=price&order=DESC`
- **Pagination (Page 2, 3 books per page):** `GET /books?limit=3&offset=3`
- **Filter by minimum price:** `GET /books?min_price=400`
- **Filter by maximum price:** `GET /books?max_price=400`
- **Price range filter (BETWEEN):** `GET /books?min_price=300&max_price=500`
- **Combined Search, Filter & Sort:** `GET /books?search_q=Code&min_price=500&order_by=price&order=ASC`

---

## 🛡 Request Validation Rules

For `POST /books` and `PUT /books/:id`:
- **`title`**: Required, non-empty string.
- **`author`**: Required, non-empty string.
- **`price`**: Required, valid positive number (`price >= 0`).

If validation fails, the API returns **HTTP 400 Bad Request** with a descriptive JSON message:
```json
{
  "message": "Title is required and must be a non-empty string"
}
```

---

## 📊 HTTP Status Codes & Response Formats

| Status Code | Meaning | When Used |
|:---:|:---|:---|
| `200 OK` | Request succeeded | `GET /books`, `GET /books/:id`, `PUT /books/:id`, `DELETE /books/:id` |
| `201 Created` | Resource created | `POST /books` |
| `400 Bad Request` | Invalid input / validation failure | Missing fields, non-numeric price, invalid query params |
| `404 Not Found` | Resource does not exist | Book ID not in database, unknown route |
| `500 Internal Server Error` | Server execution error | Centralized error handler catches uncaught exceptions |

### Consistent JSON Format:
- **Success with Data:**
  ```json
  {
    "message": "Book created successfully",
    "data": {
      "id": 9,
      "title": "Clean Architecture",
      "author": "Robert C. Martin",
      "price": 750,
      "created_at": "2026-11-06 05:30:00"
    }
  }
  ```
- **Error:**
  ```json
  {
    "message": "Book not found"
  }
  ```

---

## 🐛 Debugging Guide (4 Common Errors)

See [DEBUGGING_GUIDE.md](./DEBUGGING_GUIDE.md) for full details.

1. **`EADDRINUSE` (Port already in use):**
   - *Cause:* Previous server instance still holding port `3000`.
   - *Fix:* Added `server.on('error', ...)` handler with helpful instructions, configured `process.env.PORT` fallback, and use `npx kill-port 3000` to terminate hanging processes.
2. **Wrong Import Path (`Cannot find module`):**
   - *Cause:* In CommonJS, relative paths are relative to the current file, not project root (`require('./db')` inside `controllers/` failed).
   - *Fix:* Corrected relative path to `require('../config/db')`.
3. **Table-Name Typo (`no such table: book`):**
   - *Cause:* Schema defined the table as `books` (plural), but code executed `SELECT * FROM book` (singular).
   - *Fix:* Unified all SQL queries to strictly reference `books`.
4. **Missing `await` (Asynchronous database operations):**
   - *Cause:* SQLite methods return Promises. Without `await`, variables hold pending Promises, returning empty data or crashing before database writes finish.
   - *Fix:* Ensured `await` is placed before all `db.get()`, `db.all()`, `db.run()`, and `db.exec()`.

---

## 🧪 Postman Testing Guide (16 Test Cases)

You can import `Lab3_Books_API.postman_collection.json` directly into Postman, or execute the following 16 tests:

### Test 1: Get All Books
- **Method:** `GET`
- **URL:** `http://localhost:3000/books`
- **Expected Status:** `200 OK`
- **Expected Response:** JSON with `message: "Books retrieved successfully"`, `count: 8`, and array of 8 books.

### Test 2: Search Books by Title
- **Method:** `GET`
- **URL:** `http://localhost:3000/books?search_q=Gatsby`
- **Expected Status:** `200 OK`
- **Expected Response:** Array containing only *The Great Gatsby*.

### Test 3: Sort Books in Ascending Order
- **Method:** `GET`
- **URL:** `http://localhost:3000/books?order_by=price&order=ASC`
- **Expected Status:** `200 OK`
- **Expected Response:** Books ordered from lowest price (250) to highest (850).

### Test 4: Sort Books in Descending Order
- **Method:** `GET`
- **URL:** `http://localhost:3000/books?order_by=price&order=DESC`
- **Expected Status:** `200 OK`
- **Expected Response:** Books ordered from highest price (850) to lowest (250).

### Test 5: Pagination using Limit and Offset
- **Method:** `GET`
- **URL:** `http://localhost:3000/books?limit=3&offset=2`
- **Expected Status:** `200 OK`
- **Expected Response:** Exactly 3 books, skipping the first 2 books.

### Test 6: Filter by Minimum Price
- **Method:** `GET`
- **URL:** `http://localhost:3000/books?min_price=400`
- **Expected Status:** `200 OK`
- **Expected Response:** Books with price >= 400.

### Test 7: Filter by Maximum Price
- **Method:** `GET`
- **URL:** `http://localhost:3000/books?max_price=400`
- **Expected Status:** `200 OK`
- **Expected Response:** Books with price <= 400.

### Test 8: Filter by Minimum and Maximum Price
- **Method:** `GET`
- **URL:** `http://localhost:3000/books?min_price=300&max_price=500`
- **Expected Status:** `200 OK`
- **Expected Response:** Books with price between 300 and 500.

### Test 9: Create a Book with Valid Data
- **Method:** `POST`
- **URL:** `http://localhost:3000/books`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "title": "The Pragmatic Programmer",
    "author": "David Thomas & Andrew Hunt",
    "price": 599.00
  }
  ```
- **Expected Status:** `201 Created`
- **Expected Response:** JSON with `message: "Book created successfully"` and newly created book object.

### Test 10: Create a Book with Missing Title
- **Method:** `POST`
- **URL:** `http://localhost:3000/books`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "author": "Andrew Hunt",
    "price": 499.00
  }
  ```
- **Expected Status:** `400 Bad Request`
- **Expected Response:** `{"message": "Title is required and must be a non-empty string"}`

### Test 11: Create a Book with Missing Author
- **Method:** `POST`
- **URL:** `http://localhost:3000/books`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "title": "Mysterious Book",
    "price": 299.00
  }
  ```
- **Expected Status:** `400 Bad Request`
- **Expected Response:** `{"message": "Author is required and must be a non-empty string"}`

### Test 12: Create a Book with Invalid Price
- **Method:** `POST`
- **URL:** `http://localhost:3000/books`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "title": "Free Knowledge",
    "author": "Open Source",
    "price": "not_a_number"
  }
  ```
- **Expected Status:** `400 Bad Request`
- **Expected Response:** `{"message": "Price is required and must be a valid non-negative number"}`

### Test 13: Update an Existing Book
- **Method:** `PUT`
- **URL:** `http://localhost:3000/books/1`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "title": "The Great Gatsby - Special Edition",
    "author": "F. Scott Fitzgerald",
    "price": 450.00
  }
  ```
- **Expected Status:** `200 OK`
- **Expected Response:** JSON with `message: "Book updated successfully"` and updated book details.

### Test 14: Update a Nonexistent Book
- **Method:** `PUT`
- **URL:** `http://localhost:3000/books/999999`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "title": "Ghost Book",
    "author": "Nobody",
    "price": 500.00
  }
  ```
- **Expected Status:** `404 Not Found`
- **Expected Response:** `{"message": "Book not found"}`

### Test 15: Delete an Existing Book
- **Method:** `DELETE`
- **URL:** `http://localhost:3000/books/1`
- **Expected Status:** `200 OK`
- **Expected Response:** `{"message": "Book deleted successfully"}`

### Test 16: Delete a Nonexistent Book
- **Method:** `DELETE`
- **URL:** `http://localhost:3000/books/999999`
- **Expected Status:** `404 Not Found`
- **Expected Response:** `{"message": "Book not found"}`

---

## ⚡ Automated Testing

An automated test script `test-api.js` is included to execute all 16 test cases against the live server:

```bash
npm run test:api
```

**Output:**
```text
===============================================================
 Starting Lab 3 REST API Automated Test Suite (16 Test Cases)
===============================================================

Test server running on port 3099

[PASS] Test 1: Get all books (GET /books)
[PASS] Test 2: Search books by title (GET /books?search_q=Gatsby)
[PASS] Test 3: Sort books in ascending order (GET /books?order_by=price&order=ASC)
[PASS] Test 4: Sort books in descending order (GET /books?order_by=price&order=DESC)
[PASS] Test 5: Pagination using limit and offset (GET /books?limit=3&offset=2)
[PASS] Test 6: Filter by minimum price (GET /books?min_price=400)
[PASS] Test 7: Filter by maximum price (GET /books?max_price=400)
[PASS] Test 8: Filter by price range (GET /books?min_price=300&max_price=500)
[PASS] Test 9: Create a book with valid data (POST /books)
[PASS] Test 10: Create a book with missing title (POST /books)
[PASS] Test 11: Create a book with missing author (POST /books)
[PASS] Test 12: Create a book with invalid price (POST /books)
[PASS] Test 13: Update an existing book (PUT /books/9)
[PASS] Test 14: Update a nonexistent book (PUT /books/999999)
[PASS] Test 15: Delete an existing book (DELETE /books/9)
[PASS] Test 16: Delete a nonexistent book (DELETE /books/999999)

===============================================================
 Test Summary: 16 PASSED, 0 FAILED out of 16 tests
===============================================================
```

---

## 🎓 Viva Examination Questions & Answers

### Q1: What is the difference between a query parameter and a path parameter?
- **Path Parameter (`/books/:id`):** Part of the URL path itself used to identify a **specific resource** (e.g., `/books/5` uniquely points to the book with ID 5).
- **Query Parameter (`/books?search_q=Gatsby&limit=10`):** Added after the `?` delimiter in the URL as key-value pairs used to **filter, sort, search, or paginate** a collection without altering the resource endpoint identity.

### Q2: What does "Stateless" mean in RESTful API architecture?
- **Statelessness** means that every HTTP request from a client must contain **all the context and information** needed for the server to understand and process it.
- The server does not store client session state between requests in memory. Each request is independent and self-contained.

### Q3: Which HTTP status code should be returned for bad input vs a missing record?
- **Bad Input:** `400 Bad Request` – Used when client data fails validation (e.g., missing title, negative price, invalid parameters).
- **Missing Record:** `404 Not Found` – Used when client requests a valid operation on a resource that does not exist in the database (e.g., requesting or deleting ID `999999`).

### Q4: Why must we use parameterized queries instead of string concatenation in SQL?
- String concatenation (`"SELECT * FROM books WHERE title = '" + input + "'"` ) is vulnerable to **SQL Injection Attacks**, allowing an attacker to inject malicious SQL commands (e.g., `' OR '1'='1`).
- Parameterized queries (`SELECT * FROM books WHERE title = ?`, `[input]`) treat user input strictly as data values, never as executable SQL code.

### Q5: Why is `await` necessary when interacting with SQLite in Node.js?
- Database queries involve disk I/O and are asynchronous. They return a JavaScript `Promise`.
- Without `await`, JavaScript executes the next line immediately before the query has finished, leading to unhandled promises, undefined values, or empty responses.

---

## 🔒 Security & Version Control Best Practices

1. **`.gitignore` configured:**
   - `node_modules/` is excluded to keep repository size small.
   - `.env` is excluded to protect private configuration and secrets.
   - `*.db` is excluded to avoid committing local binary database files.
2. **SQL Injection Prevention:**
   - Whitelist validation for dynamic table columns and sorting directions.
   - Parameterized SQL placeholders (`?`) for all user-supplied search and filter queries.
3. **Graceful Error Handling:**
   - Production error messages never expose database credentials or internal stack traces to the client.
