import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import pkg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';
import { error } from 'console';

dotenv.config();

// Init Express first
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Create server AFTER app is defined
const server = http.createServer(app);

// Init Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Pool } = pkg;
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('DB connection error:', err.stack);
  } else {
    console.log('✅ Connected to PostgreSQL database');
    release();
  }
});

const API_BASE = process.env.API_BASE || '';

// API Routes
app.get(`${API_BASE}/api/timeTracker`, async (req, res) => {
  try {
    const result = await pool.query('SELECT clock_in, clock_out, date, hours FROM timetracker');
    res.json(result.rows);
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).send(err);
  }
});

app.get(`${API_BASE}/api/kanban`, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, title, status FROM kanban')
    res.json(result.rows)
  } catch (err){
    console.error('Query error: ', err)
    res.status(500).send(err)
  }
})

app.post(`${API_BASE}/api/timeTracker`, async (req, res) => {
  const { clock_in, clock_out, date, hours } = req.body;
  const sql = `
    INSERT INTO timetracker (clock_in, clock_out, date, hours)
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `;
  try {
    const result = await pool.query(sql, [clock_in, clock_out, date, hours]);
    const newEntry = { id: result.rows[0].id, clock_in, clock_out, date, hours };
    io.emit('new-entry', newEntry);
    res.status(201).json(newEntry);
  } catch (err) {
    console.error('Insert error:', err);
    res.status(500).json({ error: 'Database insert failed' });
  }
});

app.post(`/api/kanban`, async (req, res) => {
  const { title, status } = req.body;
  const sql = `
    INSERT INTO kanban (title, status)
    VALUES ($1, $2)
    RETURNING id
  `;
  try {
    const result = await pool.query(sql, [title, status]);
    const newEntry = { id: result.rows[0].id, title, status };
    io.emit('new-entry', newEntry);
    res.status(201).json(newEntry);
  } catch (err) {
    console.error('Insert error:', err);
    res.status(500).json({ error: 'Database insert failed' });
  }
});

app.patch(`${API_BASE}/api/kanban/:id`, async (req, res) => {
  const { id } = req.params;
  const { title, status } = req.body;

  const sql = `
    UPDATE kanban 
    SET title = $1, status = $2
    WHERE id = $3
    RETURNING *
  `;

  try {
    const result = await pool.query(sql, [title, status, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const updatedCard = result.rows[0];
    io.emit('update-entry', updatedCard);
    res.json(updatedCard);
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Database update failed' });
  }
});

app.delete(`${API_BASE}/api/kanban/:id`, async (req, res) => {
  const { id } = req.params

  try{
    const result = await pool.query('DELETE FROM kanban WHERE id = $1 RETURNING *', [id])

    if (result.rowCount === 0 ) {
      return res.status(404).json({ error: 'Card not found'})
    }

    io.emit('delete-entry', {id})
    res.json({message: 'Deleted succesfully', id})
  } catch (err) {
    console.error('Delete error: ', err)
    res.status(500).json({ error: 'Database delete failed'})
  }
})

const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    next();
  }
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
