# Excessive Data Exposure Demo - Frontend

## Overview
Simple vanilla HTML/CSS/JS frontend for the Employee Directory demo application.

## Features
- Displays user list with avatar, name, email, role, department
- Click a user to view detail page
- Toggle between **Vulnerable (v1)** and **Fixed (v2)** API versions
- **API Response Inspector** button to view raw JSON response (reveals the vulnerability)

## Running
The frontend is served by the backend Express server. Just run the backend:

```bash
cd ../backend
npm install
npm start
```

Then open `http://localhost:3000` in your browser.

## Files
- `index.html` - Main HTML structure
- `styles.css` - All styling
- `app.js` - Application logic (fetching, rendering, inspector)

## Demonstrating the Vulnerability

1. Select **Vulnerable (v1)** mode
2. Click any user to view their profile
3. Click **"Show Raw JSON Response"** button
4. Observe the sensitive fields in the raw response:
   - `internal_notes`, `security_clearance`, `api_keys`, `two_factor_secret`, etc.
5. Switch to **Fixed (v2)** mode
6. Click the same user
7. Click **"Show Raw JSON Response"** again
8. Observe only the 7 public fields are returned

## No Build Step Required
Pure vanilla JS - works by opening index.html directly (with CORS) or served by the backend.