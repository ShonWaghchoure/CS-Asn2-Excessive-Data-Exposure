# Excessive Data Exposure via API - Demonstration Project

### Demo Video Link: https://drive.google.com/file/d/15naQmmINl_ZZ_vKKzBGBlTESxlBk56sV/view

## 🎯 Project Title
**Excessive Data Exposure via API** - Cybersecurity Vulnerability Demonstration

## 🔍 Vulnerability Name
**Excessive Data Exposure via API** (OWASP API3:2019 / OWASP API Security Top 10)

## 📋 Overview
This project demonstrates the **Excessive Data Exposure via API** vulnerability where a backend API returns more data than the frontend actually needs, exposing sensitive internal fields that the UI never displays.

The vulnerability occurs when developers return entire database objects instead of explicitly selecting only the fields required by the frontend. Attackers can inspect raw API responses (via browser DevTools, curl, Postman, etc.) to access sensitive data.

## 🏗️ Vulnerable Architecture

```
┌─────────────────┐     HTTP Request      ┌─────────────────┐
│   Frontend      │ ─────────────────────▶ │    Backend      │
│   (Browser)     │                        │   (Express)     │
└─────────────────┘                        └────────┬────────┘
                                                    │
                                    ┌───────────────┴───────────────┐
                                    ▼                               ▼
                            ┌───────────────┐               ┌───────────────┐
                            │  Vulnerable   │               │    Fixed      │
                            │   (v1)        │               │    (v2)       │
                            │               │               │               │
                            │ Returns ALL   │               │ Returns ONLY  │
                            │ database      │               │ whitelisted   │
                            │ fields        │               │ public fields │
                            └───────────────┘               └───────────────┘
```

### Data Flow - Vulnerable Version
1. Frontend requests `GET /api/v1/users/1`
2. Backend queries database → gets **full user object** (17 fields)
3. Backend returns **entire object** to frontend
4. Frontend displays only 7 fields (name, email, role, etc.)
5. **Attacker opens DevTools → Network tab → sees all 17 fields including secrets**

### Data Flow - Fixed Version
1. Frontend requests `GET /api/v2/users/1`
2. Backend queries database → gets full user object
3. Backend **sanitizes** object → keeps only 7 whitelisted fields
4. Backend returns **sanitized object** to frontend
5. Frontend displays the same 7 fields
6. **Attacker sees only the 7 public fields**

## 🚀 How to Run

### Prerequisites
- Node.js 18+ installed
- npm (comes with Node.js)

### Quick Start
```bash
# Clone/navigate to project
cd excessive-data-exposure-demo

# Install backend dependencies
cd backend
npm install

# Start the server (serves both backend API and frontend)
npm start
```

The application will be available at **http://localhost:3000**

### Alternative: Run Frontend Separately
If you want to run frontend separately (e.g., with a different backend):
```bash
cd frontend
# Serve with any static server, e.g.:
npx serve .
# Or: python3 -m http.server 8080
```
Note: You'll need to configure CORS on the backend.

## 🔬 How to Reproduce the Demonstration Locally

### Step 1: Start the Application
```bash
cd excessive-data-exposure-demo/backend
npm install
npm start
```

### Step 2: Open the Frontend
Open **http://localhost:3000** in your browser.

### Step 3: Normal Operation (Vulnerable Mode)
1. The app defaults to **Vulnerable (v1)** mode
2. Click on any user card (e.g., "Alice Johnson")
3. Observe the profile shows: name, email, role, department, join date, user ID
4. This looks like a normal employee directory

### Step 4: The Attack - Inspect Raw API Response
1. With a user detail open, click **"Show Raw JSON Response"**
2. **OR** open Browser DevTools (F12) → Network tab → click user → inspect Response
3. **Observe the sensitive fields exposed:**
   - `internal_notes`: "Candidate for promotion to Tech Lead..."
   - `security_clearance`: "LEVEL_3_CONFIDENTIAL"
   - `api_keys`: `["sk_live_demo_abc123def456", "sk_test_demo_xyz789uvw012"]`
   - `two_factor_secret`: `"JBSWY3DPEHPK3PXP"` ← **CRITICAL!**
   - `admin_flags`: `{can_access_billing: true, can_manage_users: true, ...}`
   - `salary_band`: "L6"
   - `ssh_public_key`: `"ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDemoKeyAlice..."`

### Step 5: Direct API Testing (Command Line)
```bash
# Vulnerable endpoint - returns ALL fields
curl http://localhost:3000/api/v1/users/1 | jq .

# Fixed endpoint - returns ONLY public fields
curl http://localhost:3000/api/v2/users/1 | jq .

# Comparison endpoint - shows side-by-side diff
curl http://localhost:3000/api/compare/1 | jq .
```

### Step 6: Switch to Fixed Version
1. In the UI, select **Fixed (v2)** radio button
2. Click the same user again
3. Click **"Show Raw JSON Response"**
4. Observe **only 7 fields** returned: `id`, `name`, `email`, `role`, `department`, `avatar`, `created_at`

## 🔓 What the Vulnerable API Exposes

| Field | Type | Sensitivity | Why It's Dangerous |
|-------|------|-------------|-------------------|
| `internal_notes` | String | HIGH | HR info, promotion plans, flight risk assessments |
| `security_clearance` | String | HIGH | Internal classification levels |
| `last_password_change` | DateTime | MEDIUM | Security hygiene info for targeted attacks |
| `api_keys` | Array[String] | **CRITICAL** | **Live API keys** - full account takeover! |
| `admin_flags` | Object | HIGH | Privilege escalation roadmap |
| `salary_band` | String | HIGH | Compensation data - privacy violation |
| `performance_review_score` | Number | MEDIUM | HR data |
| `ssh_public_key` | String | HIGH | Infrastructure access correlation |
| `two_factor_secret` | String | **CRITICAL** | **2FA bypass** - complete account compromise! |

## 💥 Why It Is Vulnerable

### Root Cause
```javascript
// VULNERABLE CODE (routes/vulnerable.js)
function getUserVulnerable(req, res) {
    const user = users.find(u => u.id === userId);
    return res.json(user);  // ← Returns ENTIRE object!
}
```

### The Mistake
**Returning the database object directly** instead of mapping to a DTO (Data Transfer Object) or explicitly selecting fields.

### Why Frontend Hiding Is NOT Sufficient
- The frontend **does not display** sensitive fields in the UI
- But the **data is still transmitted** over the network
- Anyone can inspect network traffic (DevTools, curl, mitmproxy, Wireshark)
- "Security by obscurity" - hiding in UI ≠ securing the data
- Mobile apps, third-party integrations, and API consumers all receive the full data

### How an Attacker Inspects Raw Responses
1. **Browser DevTools** (F12 → Network → Click request → Response tab)
2. **curl/wget** command line
3. **Postman/Insomnia** API clients
4. **Burp Suite / OWASP ZAP** proxy tools
5. **Mobile app** network inspection (Charles Proxy, mitmproxy)
6. **Automated scanners** that enumerate API endpoints

## 🛡️ How the Backend Should Be Designed

### Principle: Explicit Field Whitelisting (Allowlist)
```javascript
// FIXED CODE (routes/fixed.js)
const PUBLIC_USER_FIELDS = [
    'id', 'name', 'email', 'role', 'department', 'avatar', 'created_at'
];

function sanitizeUser(user) {
    const publicUser = {};
    for (const field of PUBLIC_USER_FIELDS) {
        if (user.hasOwnProperty(field)) {
            publicUser[field] = user[field];
        }
    }
    return publicUser;
}

function getUserFixed(req, res) {
    const user = users.find(u => u.id === userId);
    return res.json(sanitizeUser(user));  // ← Returns ONLY whitelisted fields
}
```

### Best Practices
1. **Never return database objects directly** - always map to DTOs
2. **Define explicit allowlists** of fields per endpoint/role
3. **Use serialization libraries** (e.g., `class-transformer`, `joi`, `zod`)
4. **Implement field-level permissions** (different fields for admin vs user)
5. **Audit API responses** regularly for data minimization
6. **Use GraphQL** with explicit field selection (client asks for what it needs)
7. **Apply principle of least privilege** to data exposure

## ⚖️ Vulnerable vs Fixed Comparison

| Aspect | Vulnerable (v1) | Fixed (v2) |
|--------|-----------------|------------|
| **Fields Returned** | 17 (all database fields) | 7 (whitelisted public fields) |
| **API Keys Exposed** | ✅ Yes (live keys!) | ❌ No |
| **2FA Secret Exposed** | ✅ Yes (critical!) | ❌ No |
| **HR Data Exposed** | ✅ Yes (salary, reviews, notes) | ❌ No |
| **Infrastructure Data** | ✅ Yes (SSH keys, clearance) | ❌ No |
| **Response Size** | ~2.5 KB per user | ~0.5 KB per user |
| **Attack Surface** | Large | Minimal |
| **Compliance** | Violates GDPR, CCPA, etc. | Compliant by design |

### Side-by-Side Response Comparison

**Vulnerable (v1) - `/api/v1/users/1`:**
```json
{
  "id": 1,
  "name": "Alice Johnson",
  "email": "alice.johnson@company.demo",
  "role": "Senior Developer",
  "department": "Engineering",
  "avatar": "https://...",
  "created_at": "2023-01-15T09:30:00Z",
  "internal_notes": "Candidate for promotion...",
  "security_clearance": "LEVEL_3_CONFIDENTIAL",
  "last_password_change": "2024-01-20T14:22:00Z",
  "api_keys": ["sk_live_demo_abc123def456", "sk_test_demo_xyz789uvw012"],
  "admin_flags": {"can_access_billing": true, "can_manage_users": true, ...},
  "salary_band": "L6",
  "performance_review_score": 4.7,
  "ssh_public_key": "ssh-rsa AAAAB3NzaC1yc2E...",
  "two_factor_secret": "JBSWY3DPEHPK3PXP"
}
```

**Fixed (v2) - `/api/v2/users/1`:**
```json
{
  "id": 1,
  "name": "Alice Johnson",
  "email": "alice.johnson@company.demo",
  "role": "Senior Developer",
  "department": "Engineering",
  "avatar": "https://...",
  "created_at": "2023-01-15T09:30:00Z"
}
```
## 📦 Project Structure

```
excessive-data-exposure-demo/
├── backend/
│   ├── package.json
│   ├── server.js                 # Express server with both versions
│   ├── data/
│   │   └── users.json            # Seed data with sensitive fields
│   ├── routes/
│   │   ├── vulnerable.js         # Vulnerable implementation
│   │   └── fixed.js              # Fixed implementation
│   └── README.md
├── frontend/
│   ├── index.html                # Main page
│   ├── styles.css                # Styling
│   ├── app.js                    # Frontend logic + API inspector
│   └── README.md
├── README.md                     # This file
└── DEMO_SCRIPT.md                # Video narration script
```
## 📚 References

- [OWASP API Security Top 10 - API3:2019 Excessive Data Exposure](https://owasp.org/API-Security/editions/2019/en/0x11-t3-excessive-data-exposure.html)
- [OWASP API Security Top 10 2023](https://owasp.org/www-project-api-security/)
- [PortSwigger - Excessive Data Exposure](https://portswigger.net/web-security/api-testing/excessive-data-exposure)

---
