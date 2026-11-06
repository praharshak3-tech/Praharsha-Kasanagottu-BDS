const { getDatabase } = require('../config/db');

// Allowed columns for sorting to prevent SQL injection
const ALLOWED_SORT_COLUMNS = ['id', 'title', 'author', 'price', 'created_at'];
const ALLOWED_SORT_ORDERS = ['ASC', 'DESC'];

/**
 * Task 1, 2, 3: GET /books
 * Supports search_q, order_by, order, limit, offset, min_price, max_price
 */
exports.getAllBooks = async (req, res, next) => {
    try {
        const db = await getDatabase();

        // 1. Extract query parameters with defaults
        const {
            search_q = '',
            order_by = 'id',
            order = 'ASC',
            limit = 10,
            offset = 0,
            min_price,
            max_price
        } = req.query;

        // 2. Validate order_by column
        const normalizedOrderBy = order_by.toString().toLowerCase();
        if (!ALLOWED_SORT_COLUMNS.includes(normalizedOrderBy)) {
            return res.status(400).json({
                message: `Invalid order_by column. Allowed columns: ${ALLOWED_SORT_COLUMNS.join(', ')}`
            });
        }

        // 3. Validate sort order
        const normalizedOrder = order.toString().toUpperCase();
        if (!ALLOWED_SORT_ORDERS.includes(normalizedOrder)) {
            return res.status(400).json({
                message: `Invalid order direction. Allowed values: ${ALLOWED_SORT_ORDERS.join(', ')}`
            });
        }

        // 4. Validate limit
        const parsedLimit = parseInt(limit, 10);
        if (isNaN(parsedLimit) || parsedLimit <= 0) {
            return res.status(400).json({
                message: 'Invalid limit parameter. Must be a positive integer'
            });
        }

        // 5. Validate offset
        const parsedOffset = parseInt(offset, 10);
        if (isNaN(parsedOffset) || parsedOffset < 0) {
            return res.status(400).json({
                message: 'Invalid offset parameter. Must be a non-negative integer'
            });
        }

        // 6. Validate price filters if supplied
        let parsedMinPrice = undefined;
        let parsedMaxPrice = undefined;

        if (min_price !== undefined) {
            parsedMinPrice = parseFloat(min_price);
            if (isNaN(parsedMinPrice) || parsedMinPrice < 0) {
                return res.status(400).json({
                    message: 'Invalid min_price parameter. Must be a non-negative number'
                });
            }
        }

        if (max_price !== undefined) {
            parsedMaxPrice = parseFloat(max_price);
            if (isNaN(parsedMaxPrice) || parsedMaxPrice < 0) {
                return res.status(400).json({
                    message: 'Invalid max_price parameter. Must be a non-negative number'
                });
            }
        }

        if (parsedMinPrice !== undefined && parsedMaxPrice !== undefined && parsedMinPrice > parsedMaxPrice) {
            return res.status(400).json({
                message: 'min_price cannot be greater than max_price'
            });
        }

        // 7. Construct dynamic SQL query with parameterized values
        let sql = 'SELECT * FROM books WHERE 1=1';
        const params = [];

        // Partial title search using SQL LIKE
        if (search_q && search_q.toString().trim() !== '') {
            sql += ' AND title LIKE ?';
            params.push(`%${search_q.toString().trim()}%`);
        }

        // Price range filter using BETWEEN or individual conditions
        if (parsedMinPrice !== undefined && parsedMaxPrice !== undefined) {
            sql += ' AND price BETWEEN ? AND ?';
            params.push(parsedMinPrice, parsedMaxPrice);
        } else if (parsedMinPrice !== undefined) {
            sql += ' AND price >= ?';
            params.push(parsedMinPrice);
        } else if (parsedMaxPrice !== undefined) {
            sql += ' AND price <= ?';
            params.push(parsedMaxPrice);
        }

        // Sorting (whitelisted, safe from SQL injection)
        sql += ` ORDER BY ${normalizedOrderBy} ${normalizedOrder}`;

        // Pagination
        sql += ' LIMIT ? OFFSET ?';
        params.push(parsedLimit, parsedOffset);

        // Execute query
        const books = await db.all(sql, params);

        return res.status(200).json({
            message: 'Books retrieved successfully',
            count: books.length,
            data: books
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Task 1: GET /books/:id
 * Retrieve a single book by ID
 */
exports.getBookById = async (req, res, next) => {
    try {
        const db = await getDatabase();
        const id = parseInt(req.params.id, 10);

        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ message: 'Invalid book ID' });
        }

        const book = await db.get('SELECT * FROM books WHERE id = ?', [id]);

        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        return res.status(200).json({
            message: 'Book retrieved successfully',
            data: book
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Task 1, 4: POST /books
 * Create a new book with validation
 */
exports.createBook = async (req, res, next) => {
    try {
        const db = await getDatabase();
        const { title, author, price } = req.body;

        // Validation for title
        if (!title || typeof title !== 'string' || title.trim() === '') {
            return res.status(400).json({
                message: 'Title is required and must be a non-empty string'
            });
        }

        // Validation for author
        if (!author || typeof author !== 'string' || author.trim() === '') {
            return res.status(400).json({
                message: 'Author is required and must be a non-empty string'
            });
        }

        // Validation for price
        if (price === undefined || price === null || price === '' || isNaN(Number(price)) || Number(price) < 0) {
            return res.status(400).json({
                message: 'Price is required and must be a valid non-negative number'
            });
        }

        const parsedPrice = parseFloat(Number(price).toFixed(2));

        // Insert new record into SQLite
        const result = await db.run(
            'INSERT INTO books (title, author, price) VALUES (?, ?, ?)',
            [title.trim(), author.trim(), parsedPrice]
        );

        // Fetch newly created record
        const newBook = await db.get('SELECT * FROM books WHERE id = ?', [result.lastID]);

        return res.status(201).json({
            message: 'Book created successfully',
            data: newBook
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Task 1: PUT /books/:id
 * Update an existing book by ID
 */
exports.updateBook = async (req, res, next) => {
    try {
        const db = await getDatabase();
        const id = parseInt(req.params.id, 10);

        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ message: 'Invalid book ID' });
        }

        // Check if book exists first
        const existingBook = await db.get('SELECT * FROM books WHERE id = ?', [id]);
        if (!existingBook) {
            return res.status(404).json({ message: 'Book not found' });
        }

        const { title, author, price } = req.body;

        // Validate title
        if (!title || typeof title !== 'string' || title.trim() === '') {
            return res.status(400).json({
                message: 'Title is required and must be a non-empty string'
            });
        }

        // Validate author
        if (!author || typeof author !== 'string' || author.trim() === '') {
            return res.status(400).json({
                message: 'Author is required and must be a non-empty string'
            });
        }

        // Validate price
        if (price === undefined || price === null || price === '' || isNaN(Number(price)) || Number(price) < 0) {
            return res.status(400).json({
                message: 'Price is required and must be a valid non-negative number'
            });
        }

        const parsedPrice = parseFloat(Number(price).toFixed(2));

        // Update record
        await db.run(
            'UPDATE books SET title = ?, author = ?, price = ? WHERE id = ?',
            [title.trim(), author.trim(), parsedPrice, id]
        );

        // Fetch updated record
        const updatedBook = await db.get('SELECT * FROM books WHERE id = ?', [id]);

        return res.status(200).json({
            message: 'Book updated successfully',
            data: updatedBook
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Task 1: DELETE /books/:id
 * Delete a book by ID
 */
exports.deleteBook = async (req, res, next) => {
    try {
        const db = await getDatabase();
        const id = parseInt(req.params.id, 10);

        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ message: 'Invalid book ID' });
        }

        // Check if book exists
        const existingBook = await db.get('SELECT * FROM books WHERE id = ?', [id]);
        if (!existingBook) {
            return res.status(404).json({ message: 'Book not found' });
        }

        // Delete record
        await db.run('DELETE FROM books WHERE id = ?', [id]);

        return res.status(200).json({
            message: 'Book deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
