const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files
const frontendPath = path.join(__dirname, '../frontend');
// Serve static files with no cache (to prevent development issues)
app.use(express.static(frontendPath, {
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// API routes (Placeholder for future backend logic)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'FocusFlow Backend is running' });
});

// Fallback to index.html for client-side routing (if needed)
app.use((req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
