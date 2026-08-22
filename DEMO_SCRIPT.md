# Video Demonstration Script - Excessive Data Exposure via API

**Target Duration: Under 10 minutes**  
**Format: Screen recording with voiceover**

---

## 📹 Recording Setup Checklist

- [ ] Screen resolution: 1920x1080 or 1280x720
- [ ] Browser: Chrome/Edge with DevTools docked to bottom or right
- [ ] Terminal visible for curl commands
- [ ] Code editor open (VS Code) for code comparison
- [ ] Microphone tested, clear audio
- [ ] Hide personal bookmarks, extensions, sensitive tabs

---

## 🎬 Part A: Normal Application (≈2 minutes)

### Scene 1: Project Introduction (0:00 - 0:30)
**Visual:** Terminal → `cd excessive-data-exposure-demo/backend && npm start`  
**Visual:** Browser opens to `http://localhost:3000`

**Narration:**
> "Hi, I'm demonstrating Problem 7: Excessive Data Exposure via API. This is a deliberately vulnerable employee directory application that shows how backend APIs can accidentally leak sensitive data that the frontend never displays."

### Scene 2: Application Walkthrough (0:30 - 1:15)
**Visual:** Click through user cards, show detail view for Alice, Bob, Carol

**Narration:**
> "The application looks completely normal. It's an employee directory showing names, emails, roles, departments, and join dates. I can click any user to see their profile. There's nothing suspicious in the UI - it's exactly what you'd expect from an internal company tool."

### Scene 3: Version Toggle Explanation (1:15 - 1:45)
**Visual:** Point to radio buttons "Vulnerable (v1)" and "Fixed (v2)", currently on v1

**Narration:**
> "Notice the version toggle at the top. The app runs two API versions side by side: Vulnerable (v1) which has the flaw, and Fixed (v2) which shows the correct implementation. We're currently on the vulnerable version."

### Scene 4: Normal User Flow (1:45 - 2:00)
**Visual:** Click "Show Raw JSON Response" button (but don't emphasize it yet), then go back to list

**Narration:**
> "Let me show the normal flow one more time. I'll view a user profile, and there's this 'Show Raw JSON Response' button we'll come back to. For now, everything looks fine."

---

## 🎬 Part B: Live Attack (≈3 minutes)

### Scene 5: The Attack - DevTools Network Tab (2:00 - 3:00)
**Visual:** 
1. Open DevTools (F12) → Network tab
2. Filter: "Fetch/XHR"
3. Click Alice Johnson user card
4. Click the API request (`users/1`)
5. Click Response tab

**Narration:**
> "Now for the attack. I'll open Chrome DevTools with F12, go to the Network tab, and filter for fetch requests. When I click on Alice's profile... there's the API call to `/api/v1/users/1`. Let me look at the raw response."

**Visual:** Scroll through JSON response, pause on each sensitive field

**Narration:**
> "Here's the vulnerability. The frontend only shows 7 fields, but the API returns 17 fields. Look at what's exposed:
> - `internal_notes`: HR notes about promotion candidacy
> - `security_clearance`: Internal classification level
> - `api_keys`: **Live API keys** - this is critical!
> - `admin_flags`: Shows exactly what privileges this user has
> - `salary_band`: Compensation data
> - `two_factor_secret`: **The 2FA secret!** With this, an attacker can generate valid 2FA codes and completely bypass two-factor authentication."

### Scene 6: Direct API Testing with curl (3:00 - 3:45)
**Visual:** Terminal window, run curl commands

**Commands:**
```bash
curl -s http://localhost:3000/api/v1/users/1 | jq .
curl -s http://localhost:3000/api/v2/users/1 | jq .
```

**Narration:**
> "Let me also show this from the command line. The vulnerable endpoint returns the full object with all secrets. The fixed endpoint - which we'll look at next - returns only the 7 public fields."

### Scene 7: Comparison Endpoint (3:45 - 4:15)
**Visual:** Browser → `http://localhost:3000/api/compare/1` or curl

**Narration:**
> "There's also a comparison endpoint that shows the side-by-side difference. It tells us exactly what fields are unnecessarily exposed - 10 extra fields in this case, including critical secrets like API keys and the 2FA secret."

### Scene 8: UI "Raw Response" Button (4:15 - 5:00)
**Visual:** Back in UI, click "Show Raw JSON Response" button, show highlighted JSON

**Narration:**
> "The frontend also has a built-in inspector button that shows the exact same raw response. This simulates what any attacker would see - whether they use DevTools, curl, Postman, or any API client. The data is there for anyone who looks."

---

## 🎬 Part C: Explanation & Fix (≈4 minutes)

### Scene 9: What Is This Vulnerability? (5:00 - 5:45)
**Visual:** Code editor open to `backend/routes/vulnerable.js`

**Narration:**
> "So what just happened? This is **Excessive Data Exposure via API** - OWASP API Security Top 10, API3. The vulnerability occurs when an API returns more data than the client actually needs. In our case, the backend returns the entire database record instead of just the fields the frontend displays."

### Scene 10: The Exact Flaw in Code (5:45 - 6:30)
**Visual:** Show vulnerable code, highlight `return res.json(user)`

**Narration:**
> "Here's the vulnerable code. One line: `return res.json(user)`. The `user` variable is the complete database object. The developer didn't think about what fields should be exposed - they just returned everything. This is a classic mistake: confusing 'what the database has' with 'what the API should return.'"

### Scene 11: What Data Was Unnecessarily Exposed (6:30 - 7:15)
**Visual:** Show the data/users.json file, scroll through fields

**Narration:**
> "In our demo, the database has 17 fields per user. The frontend only needs 7. The 10 unnecessarily exposed fields include:
> - **Critical**: API keys (live secrets), 2FA secret
> - **High**: Internal HR notes, security clearance, admin flags, salary band, SSH keys
> - **Medium**: Password change history, performance scores
> 
> Any of these could enable further attacks - credential stuffing, privilege escalation, social engineering, or infrastructure compromise."

### Scene 12: Why Frontend Hiding Isn't Enough (7:15 - 7:45)
**Visual:** Show frontend code `app.js` - point out it only reads 7 fields

**Narration:**
> "You might think 'but the frontend doesn't show these fields, so it's fine.' Wrong. The data travels over the network regardless of what the UI renders. Anyone with DevTools, curl, a proxy tool, or an automated scanner sees the full response. Hiding in the UI is security by obscurity - it provides zero actual protection."

### Scene 13: How to Fix It - The Code (7:45 - 8:45)
**Visual:** Show `backend/routes/fixed.js` - highlight `PUBLIC_USER_FIELDS` and `sanitizeUser`

**Narration:**
> "The fix is **explicit field whitelisting**. Define exactly which fields are safe to expose, then map the database object to a clean public object. Here's the pattern:
> 
> 1. Define a constant array of allowed field names
> 2. Create a sanitizer function that picks only those fields
> 3. Apply it before sending the response
> 
> This is also called a Data Transfer Object (DTO) pattern. The database can have 100 fields - the API only exposes what's explicitly allowed."

### Scene 14: Demonstrate Fixed Version (8:45 - 9:30)
**Visual:** 
1. Switch UI to "Fixed (v2)" radio button
2. Click same user (Alice)
3. Click "Show Raw JSON Response"
4. Show only 7 fields returned

**Narration:**
> "Now let's see the fixed version. I'll switch to v2, view the same user, and inspect the raw response. Only 7 fields - exactly what the frontend needs. No API keys, no 2FA secret, no HR data, no infrastructure details. The attack surface is reduced from 17 fields to 7."

### Scene 15: Summary & Best Practices (9:30 - 10:00)
**Visual:** Terminal with both curl outputs side by side, or comparison endpoint

**Narration:**
> "To summarize: Excessive Data Exposure happens when APIs return full database objects instead of curated responses. The fix is simple but requires discipline: never return database objects directly, always whitelist fields, audit your API responses regularly, and remember that anything sent over the network can be inspected. Thanks for watching!"

---

## 🎤 Narration Tips

### Tone
- Professional but conversational
- Clear, steady pace (~140 words/minute)
- Pause 1-2 seconds after key points
- Slightly emphasize critical terms: "API keys", "2FA secret", "critical"

### Technical Accuracy
- Say "OWASP API Security Top 10, API3" not just "OWASP Top 10"
- Distinguish "database object" vs "API response" vs "UI display"
- Use "whitelisting" / "allowlisting" not "filtering"

### Timing Notes
- If running long: shorten code walkthrough, skip comparison endpoint
- If running short: add more detail on attack vectors (mobile apps, automated scanners)
- Total target: 9:30 ± 30 seconds

---

## 🖥️ Recording Checklist (During Recording)

- [ ] DevTools Network tab clearly visible
- [ ] JSON response readable (zoom if needed)
- [ ] Terminal text large enough to read
- [ ] Code editor font size ≥ 14px
- [ ] No notifications pop up
- [ ] Mouse movements smooth, not frantic
- [ ] Click highlights visible (cursor highlight tool recommended)

---

## ✂️ Post-Production Notes

### Cuts to Make
- Remove npm install / startup wait time
- Cut any coughs, long pauses, mistakes
- Speed up repetitive scrolling (2x speed with note)

### Add in Editing
- Text overlay: "VULNERABLE: Returns 17 fields" / "FIXED: Returns 7 fields"
- Highlight boxes on sensitive fields in JSON
- Arrow pointing to version toggle when mentioned
- Timestamp markers for each section

### Export Settings
- 1080p, 30fps, H.264, ~10-15 Mbps
- Audio: 128+ kbps AAC
- Filename: `excessive-data-exposure-demo-[date].mp4`

---

## 📎 Alternative: If No Video Recording

Create a **GIF walkthrough** or **annotated screenshots** document showing:
1. Normal UI
2. DevTools Network tab with vulnerable response
3. Sensitive fields highlighted
4. Fixed version response
5. Code diff (vulnerable vs fixed)

---

## 🔗 Final Deliverable

**Video file:** `excessive-data-exposure-demo.mp4`  
**Upload to:** YouTube (unlisted) or Google Drive  
**Link in README:** Update the Video Demonstration Placeholder section

---

*Script version 1.0 - Adjust timing based on actual recording*