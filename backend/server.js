/**
 * Excessive Data Exposure via API - Demonstration Backend
 * 
 * This server runs BOTH vulnerable and fixed implementations side-by-side
 * so you can compare the API responses directly.
 * 
 * Run: npm start
 * Server runs on http://localhost:3000
 * Frontend served from /frontend folder
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const { getUserVulnerable, listUsersVulnerable } = require('./routes/vulnerable');
const { getUserFixed, listUsersFixed } = require('./routes/fixed');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// ============================================
// VULNERABLE ENDPOINTS (v1)
// ============================================
// These demonstrate the Excessive Data Exposure vulnerability

app.get('/api/v1/users', listUsersVulnerable);
app.get('/api/v1/users/:id', getUserVulnerable);

// ============================================
// FIXED ENDPOINTS (v2)
// ============================================
// These demonstrate the proper implementation

app.get('/api/v2/users', listUsersFixed);
app.get('/api/v2/users/:id', getUserFixed);

// ============================================
// COMPARISON ENDPOINT
// ============================================
// Shows side-by-side comparison for a specific user

app.get('/api/compare/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const users = require('./data/users.json');
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const { sanitizeUser } = require('./routes/fixed');
  const publicUser = sanitizeUser(user);
  
  // Show what fields are exposed in each version
  const vulnerableFields = Object.keys(user);
  const fixedFields = Object.keys(publicUser);
  const exposedFields = vulnerableFields.filter(f => !fixedFields.includes(f));
  
  return res.json({
    userId,
    vulnerableResponse: user,
    fixedResponse: publicUser,
    analysis: {
      totalFieldsInDatabase: vulnerableFields.length,
      fieldsReturnedByFixed: fixedFields.length,
      fieldsUnnecessarilyExposed: exposedFields.length,
      unnecessarilyExposedFields: exposedFields,
      severity: exposedFields.some(f => ['api_keys', 'two_factor_secret', 'ssh_public_key'].includes(f)) ? 'CRITICAL' : 'HIGH'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Excessive Data Exposure Demo',
    version: '1.0.0',
    endpoints: {
      vulnerable: {
        list: 'GET /api/v1/users',
        single: 'GET /api/v1/users/:id'
      },
      fixed: {
        list: 'GET /api/v2/users',
        single: 'GET /api/v2/users/:id'
      },
      compare: 'GET /api/compare/:id'
    }
  });
});

// Catch-all: serve index.html for frontend routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  Excessive Data Exposure via API - Demo Backend             ║
║  Running on http://localhost:${PORT}                            ║
╠══════════════════════════════════════════════════════════════╣
║  VULNERABLE endpoints (v1):                                  ║
║    GET /api/v1/users        - List all users (ALL fields)   ║
║    GET /api/v1/users/:id    - Get user (ALL fields)         ║
╠══════════════════════════════════════════════════════════════╣
║  FIXED endpoints (v2):                                       ║
║    GET /api/v2/users        - List users (public fields)    ║
║    GET /api/v2/users/:id    - Get user (public fields)      ║
╠══════════════════════════════════════════════════════════════╣
║  COMPARISON endpoint:                                        ║
║    GET /api/compare/:id     - Side-by-side diff             ║
╠══════════════════════════════════════════════════════════════╣
║  Frontend: http://localhost:${PORT}                            ║
╚══════════════════════════════════════════════════════════════╝
  `);
});