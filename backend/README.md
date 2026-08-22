# Excessive Data Exposure via API - Demo Backend

## Overview
This backend demonstrates the **Excessive Data Exposure via API** vulnerability (OWASP API3:2019).

## Vulnerability
The `/api/v1/users/:id` endpoint returns the **entire user object** from the database, including highly sensitive fields:
- `internal_notes` - HR/management notes
- `security_clearance` - Internal classification
- `last_password_change` - Security metadata
- `api_keys` - **LIVE API KEYS** (critical!)
- `admin_flags` - Privilege escalation info
- `salary_band` - Compensation data
- `performance_review_score` - HR data
- `ssh_public_key` - Infrastructure access
- `two_factor_secret` - **2FA SECRET** (critical!)

The frontend only needs: `id`, `name`, `email`, `role`, `department`, `avatar`, `created_at`

## Fixed Implementation
The `/api/v2/users/:id` endpoint uses **explicit field whitelisting** - only the 7 public fields are returned.

## Running the Backend

```bash
cd backend
npm install
npm start
```

Server starts on `http://localhost:3000`

## Endpoints

| Version | Endpoint | Description |
|---------|----------|-------------|
| **Vulnerable (v1)** | `GET /api/v1/users` | List all users with ALL fields |
| **Vulnerable (v1)** | `GET /api/v1/users/:id` | Get user with ALL fields |
| **Fixed (v2)** | `GET /api/v2/users` | List users with public fields only |
| **Fixed (v2)** | `GET /api/v2/users/:id` | Get user with public fields only |
| **Compare** | `GET /api/compare/:id` | Side-by-side diff |
| **Health** | `GET /api/health` | Service info |

## Testing the Vulnerability

```bash
# Vulnerable - returns everything including secrets
curl http://localhost:3000/api/v1/users/1

# Fixed - returns only public fields
curl http://localhost:3000/api/v2/users/1

# Compare - shows the difference
curl http://localhost:3000/api/compare/1
```

## Key Files

- `server.js` - Main Express server with both implementations
- `routes/vulnerable.js` - Vulnerable implementation (returns all fields)
- `routes/fixed.js` - Fixed implementation (whitelists public fields)
- `data/users.json` - Seed data with realistic sensitive fields