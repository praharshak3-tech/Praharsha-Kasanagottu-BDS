const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');

// Task 1: REST API Endpoints with noun-based routing (/books)

// GET /books - Retrieve all books (with search_q, order_by, order, limit, offset, min_price, max_price)
router.get('/', bookController.getAllBooks);

// GET /books/:id - Retrieve a single book by ID
router.get('/:id', bookController.getBookById);

// POST /books - Create a new book
router.post('/', bookController.createBook);

// PUT /books/:id - Update an existing book by ID
router.put('/:id', bookController.updateBook);

// DELETE /books/:id - Delete a book by ID
router.delete('/:id', bookController.deleteBook);

module.exports = router;
