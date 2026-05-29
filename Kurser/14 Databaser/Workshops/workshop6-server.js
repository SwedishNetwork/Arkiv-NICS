const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');

const app = express();

app.use(express.json()); // Middleware to parse JSON requests
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL connection pool
const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'my-pw-1234',
    database: 'persondb'
});

// Serve static files (like data.html)
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/data.html');
});

// --- GET: Fetch all persons ---
app.get('/api/persons', async (req, res) => {
    console.log("---> SERVER: Fetching all persons...");
    try {
        const [rows] = await pool.query('SELECT * FROM Person');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// --- GET: Fetch a single person by ID ---
app.get('/api/persons/:id', async (req, res) => {
    console.log("---> SERVER: Fetching person with ID:", req.params.id);
    try {
        const [rows] = await pool.query(
            'SELECT * FROM Person WHERE pid = ?',
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Person not found' });
        }

        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- POST: Create a new person ---
app.post('/api/persons', async (req, res) => {
    console.log("---> SERVER: Received POST request with body:", req.body);
    try {
        const { fn, ln, bdate, em } = req.body;

        if (!fn || !ln) {
            return res.status(400).json({ error: 'First name and last name are required' });
        }

        const [result] = await pool.query(
            'INSERT INTO Person (pfirstname, plastname, pbirthdate, pemail) VALUES (?, ?, ?, ?)',
            [fn, ln, bdate, em]
        );

        const [newPerson] = await pool.query(
            'SELECT * FROM Person WHERE pid = ?',
            [result.insertId]
        );

        res.status(201).json(newPerson[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PUT: Update a person by ID ---
app.put('/api/persons/:id', async (req, res) => {
    console.log("---> SERVER: Received PUT request with body:", req.body);
    try {
        const { fname, lname, birthdate, email } = req.body;

        if (!fname || !lname) {
            return res.status(400).json({ error: 'First name and last name are required' });
        }

        const [result] = await pool.query(
            'UPDATE Person SET pfirstname = ?, plastname = ?, pbirthdate = ?, pemail = ? WHERE pid = ?',
            [fname, lname, birthdate, email, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Person not found' });
        }

        const [updatedPerson] = await pool.query(
            'SELECT * FROM Person WHERE pid = ?',
            [req.params.id]
        );

        res.json(updatedPerson[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- DELETE: Remove a person by ID ---
app.delete('/api/persons/:id', async (req, res) => {
    console.log("---> SERVER: Received DELETE request for person with ID:", req.params.id);
    try {
        const [result] = await pool.query(
            'DELETE FROM Person WHERE pid = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Person not found' });
        }

        res.status(204).end();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});

