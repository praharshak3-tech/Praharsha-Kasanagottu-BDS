// ==========================================
// Lab 3: REST API, Query Parameters, Validation & Debugging
// Course: Backend Development Fundamentals (BDF) - Year II
// Student: Kasanagottu Praharsha (252U1R5067)
// Section: 106
// ==========================================

require('dotenv').config();
const express = require('express');
const { getDatabase } = require('./config/db');
const bookRoutes = require('./routes/bookRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON request bodies
app.use(express.json());

// Request logger for debugging incoming requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// Root route - Welcome and API information
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to the Lab 3 Books REST API',
        version: '1.0.0',
        author: 'Kasanagottu Praharsha (252U1R5067)',
        endpoints: {
            getAllBooks: 'GET /books',
            getBookById: 'GET /books/:id',
            createBook: 'POST /books',
            updateBook: 'PUT /books/:id',
            deleteBook: 'DELETE /books/:id'
        },
        documentation: 'Refer to README.md and DEBUGGING_GUIDE.md'
    });
});

// Mount the Books Router on /books
app.use('/books', bookRoutes);

// Catch-all route for any undefined endpoints (404 Handler)
app.use((req, res) => {
    res.status(404).json({
        message: 'Endpoint not found'
    });
});

// Centralized Error Handling Middleware (500 Handler)
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err.message || err);
    res.status(500).json({
        message: 'Internal server error'
    });
});

// Initialize database and start HTTP server
async function startServer() {
    try {
        // Initialize SQLite database and tables
        await getDatabase();

        const server = app.listen(PORT, () => {
            console.log(`====================================================`);
            console.log(` Books REST API is running!`);
            console.log(` Base URL: http://localhost:${PORT}`);
            console.log(` Try: http://localhost:${PORT}/books`);
            console.log(`====================================================`);
        });

        // Debugging Task 6 (1): Catch and explain EADDRINUSE error gracefully
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`\n[CRITICAL ERROR] Port ${PORT} is already in use (EADDRINUSE).`);
                console.error(`Another process or previous instance is running on port ${PORT}.`);
                console.error(`Fix:`);
                console.error(`  1. Change PORT in .env (e.g., PORT=3001)`);
                console.error(`  2. Or stop the process running on port ${PORT} via terminal:\n     npx kill-port ${PORT}\n`);
                process.exit(1);
            } else {
                console.error('Server error:', err);
            }
        });
    } catch (err) {
        console.error('Failed to initialize database or start server:', err);
        process.exit(1);
    }
}

// Export app for automated testing and start server if executed directly
if (require.main === module) {
    startServer();
}

module.exports = app;
