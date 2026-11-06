// ==========================================
// Automated Test Suite for Lab 3 REST API
// Tests all 16 required test cases from Task 7
// ==========================================

const http = require('http');
const app = require('./server');
const { getDatabase } = require('./config/db');

let server;
const TEST_PORT = 3099;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// Helper function to send HTTP requests using Node built-in http module
function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch {
                    parsed = data;
                }
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: parsed
                });
            });
        });

        req.on('error', (err) => reject(err));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    console.log('===============================================================');
    console.log(' Starting Lab 3 REST API Automated Test Suite (16 Test Cases)');
    console.log('===============================================================\n');

    // Initialize DB and launch test server
    await getDatabase();
    await new Promise((resolve) => {
        server = app.listen(TEST_PORT, () => {
            console.log(`Test server running on port ${TEST_PORT}\n`);
            resolve();
        });
    });

    let passedCount = 0;
    let failedCount = 0;
    let createdBookId = null;

    function assertTest(testNum, testName, condition, details) {
        if (condition) {
            console.log(`[PASS] Test ${testNum}: ${testName}`);
            passedCount++;
        } else {
            console.error(`[FAIL] Test ${testNum}: ${testName}`);
            console.error('       Details:', details);
            failedCount++;
        }
    }

    try {
        // -------------------------------------------------------------
        // Test 1: Get all books
        // -------------------------------------------------------------
        const res1 = await request('GET', '/books');
        assertTest(
            1,
            'Get all books (GET /books)',
            res1.status === 200 && Array.isArray(res1.body.data) && res1.body.data.length > 0,
            `Expected 200 and array of books, got ${res1.status}`
        );

        // -------------------------------------------------------------
        // Test 2: Search books by title
        // -------------------------------------------------------------
        const res2 = await request('GET', '/books?search_q=Gatsby');
        const matchesGatsby = res2.body.data && res2.body.data.every(b => b.title.includes('Gatsby'));
        assertTest(
            2,
            'Search books by title (GET /books?search_q=Gatsby)',
            res2.status === 200 && matchesGatsby && res2.body.data.length > 0,
            `Expected 200 and title match, got ${res2.status}`
        );

        // -------------------------------------------------------------
        // Test 3: Sort books in ascending order
        // -------------------------------------------------------------
        const res3 = await request('GET', '/books?order_by=price&order=ASC');
        const isAscending = res3.body.data && res3.body.data.every((val, idx, arr) => !idx || arr[idx - 1].price <= val.price);
        assertTest(
            3,
            'Sort books in ascending order (GET /books?order_by=price&order=ASC)',
            res3.status === 200 && isAscending,
            `Expected 200 and ascending order by price, got ${res3.status}`
        );

        // -------------------------------------------------------------
        // Test 4: Sort books in descending order
        // -------------------------------------------------------------
        const res4 = await request('GET', '/books?order_by=price&order=DESC');
        const isDescending = res4.body.data && res4.body.data.every((val, idx, arr) => !idx || arr[idx - 1].price >= val.price);
        assertTest(
            4,
            'Sort books in descending order (GET /books?order_by=price&order=DESC)',
            res4.status === 200 && isDescending,
            `Expected 200 and descending order by price, got ${res4.status}`
        );

        // -------------------------------------------------------------
        // Test 5: Pagination using limit and offset
        // -------------------------------------------------------------
        const res5 = await request('GET', '/books?limit=3&offset=2');
        assertTest(
            5,
            'Pagination using limit and offset (GET /books?limit=3&offset=2)',
            res5.status === 200 && res5.body.data.length === 3,
            `Expected 200 and exactly 3 records, got ${res5.status} with count ${res5.body.data?.length}`
        );

        // -------------------------------------------------------------
        // Test 6: Filter by minimum price
        // -------------------------------------------------------------
        const res6 = await request('GET', '/books?min_price=400');
        const allMin400 = res6.body.data && res6.body.data.every(b => b.price >= 400);
        assertTest(
            6,
            'Filter by minimum price (GET /books?min_price=400)',
            res6.status === 200 && allMin400 && res6.body.data.length > 0,
            `Expected 200 and prices >= 400, got ${res6.status}`
        );

        // -------------------------------------------------------------
        // Test 7: Filter by maximum price
        // -------------------------------------------------------------
        const res7 = await request('GET', '/books?max_price=400');
        const allMax400 = res7.body.data && res7.body.data.every(b => b.price <= 400);
        assertTest(
            7,
            'Filter by maximum price (GET /books?max_price=400)',
            res7.status === 200 && allMax400 && res7.body.data.length > 0,
            `Expected 200 and prices <= 400, got ${res7.status}`
        );

        // -------------------------------------------------------------
        // Test 8: Filter by minimum and maximum price (BETWEEN)
        // -------------------------------------------------------------
        const res8 = await request('GET', '/books?min_price=300&max_price=500');
        const allBetween300And500 = res8.body.data && res8.body.data.every(b => b.price >= 300 && b.price <= 500);
        assertTest(
            8,
            'Filter by price range (GET /books?min_price=300&max_price=500)',
            res8.status === 200 && allBetween300And500 && res8.body.data.length > 0,
            `Expected 200 and prices between 300 and 500, got ${res8.status}`
        );

        // -------------------------------------------------------------
        // Test 9: Create a book with valid data
        // -------------------------------------------------------------
        const newBookData = {
            title: 'Node.js Design Patterns',
            author: 'Mario Casciaro',
            price: 650.00
        };
        const res9 = await request('POST', '/books', newBookData);
        if (res9.body.data && res9.body.data.id) {
            createdBookId = res9.body.data.id;
        }
        assertTest(
            9,
            'Create a book with valid data (POST /books)',
            res9.status === 201 && res9.body.message === 'Book created successfully' && res9.body.data.title === newBookData.title,
            `Expected 201 and created book data, got ${res9.status}`
        );

        // -------------------------------------------------------------
        // Test 10: Create a book with missing title
        // -------------------------------------------------------------
        const res10 = await request('POST', '/books', {
            author: 'Anonymous',
            price: 299.00
        });
        assertTest(
            10,
            'Create a book with missing title (POST /books)',
            res10.status === 400 && res10.body.message.includes('Title is required'),
            `Expected 400 and Title error, got ${res10.status}: ${JSON.stringify(res10.body)}`
        );

        // -------------------------------------------------------------
        // Test 11: Create a book with missing author
        // -------------------------------------------------------------
        const res11 = await request('POST', '/books', {
            title: 'Nameless Chronicles',
            price: 199.00
        });
        assertTest(
            11,
            'Create a book with missing author (POST /books)',
            res11.status === 400 && res11.body.message.includes('Author is required'),
            `Expected 400 and Author error, got ${res11.status}: ${JSON.stringify(res11.body)}`
        );

        // -------------------------------------------------------------
        // Test 12: Create a book with invalid price
        // -------------------------------------------------------------
        const res12 = await request('POST', '/books', {
            title: 'Free Knowledge',
            author: 'Open Source',
            price: 'invalid_price_string'
        });
        assertTest(
            12,
            'Create a book with invalid price (POST /books)',
            res12.status === 400 && res12.body.message.includes('Price is required'),
            `Expected 400 and Price error, got ${res12.status}: ${JSON.stringify(res12.body)}`
        );

        // -------------------------------------------------------------
        // Test 13: Update an existing book
        // -------------------------------------------------------------
        const targetId = createdBookId || 1;
        const res13 = await request('PUT', `/books/${targetId}`, {
            title: 'Node.js Design Patterns - 3rd Edition',
            author: 'Mario Casciaro & Luciano Mammino',
            price: 720.00
        });
        assertTest(
            13,
            `Update an existing book (PUT /books/${targetId})`,
            res13.status === 200 && res13.body.message === 'Book updated successfully' && res13.body.data.price === 720.00,
            `Expected 200 and updated book data, got ${res13.status}`
        );

        // -------------------------------------------------------------
        // Test 14: Update a nonexistent book
        // -------------------------------------------------------------
        const res14 = await request('PUT', '/books/999999', {
            title: 'Ghost Book',
            author: 'Nobody',
            price: 500.00
        });
        assertTest(
            14,
            'Update a nonexistent book (PUT /books/999999)',
            res14.status === 404 && res14.body.message === 'Book not found',
            `Expected 404 and "Book not found", got ${res14.status}`
        );

        // -------------------------------------------------------------
        // Test 15: Delete an existing book
        // -------------------------------------------------------------
        const deleteId = createdBookId || 1;
        const res15 = await request('DELETE', `/books/${deleteId}`);
        assertTest(
            15,
            `Delete an existing book (DELETE /books/${deleteId})`,
            res15.status === 200 && res15.body.message === 'Book deleted successfully',
            `Expected 200 and deletion confirmation, got ${res15.status}`
        );

        // -------------------------------------------------------------
        // Test 16: Delete a nonexistent book
        // -------------------------------------------------------------
        const res16 = await request('DELETE', '/books/999999');
        assertTest(
            16,
            'Delete a nonexistent book (DELETE /books/999999)',
            res16.status === 404 && res16.body.message === 'Book not found',
            `Expected 404 and "Book not found", got ${res16.status}`
        );

    } catch (err) {
        console.error('Unexpected test execution error:', err);
        failedCount++;
    } finally {
        server.close(() => {
            console.log('\n===============================================================');
            console.log(` Test Summary: ${passedCount} PASSED, ${failedCount} FAILED out of 16 tests`);
            console.log('===============================================================');
            if (failedCount > 0) {
                process.exit(1);
            } else {
                process.exit(0);
            }
        });
    }
}

runTests();
