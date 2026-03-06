# MedGuard AI — Patient Safety Intelligence System

> AI-powered medical triage system built for the AI Innovation Hackathon 2026

## ✨ Features

- **AI-Powered Extraction** — Paste unstructured patient intake text and Gemini AI extracts structured medical data
- **Automated Triage** — Rule-based classification: CRITICAL / MODERATE / SAFE
- **Real-Time Dashboard** — Live patient cards via Firebase Firestore `onSnapshot`
- **Analytics Panel** — Animated donut chart + counters
- **Search & Filter** — Filter by status, search by name/ID
- **Dark/Light Mode** — Futuristic glassmorphism UI with theme toggle
- **Critical Alerts** — Flashing red banner for critical patients

## 🛠️ Tech Stack

| Layer     | Technology              |
|-----------|------------------------|
| Frontend  | HTML, CSS, Vanilla JS  |
| AI        | Google Gemini API      |
| Database  | Firebase Firestore     |
| Hosting   | Firebase Hosting       |

## 🚀 Quick Setup (2-3 hours)

### 1. Get API Keys

1. **Firebase**: Go to [Firebase Console](https://console.firebase.google.com), create a project, enable Firestore, and copy your web app config.
2. **Gemini**: Go to [Google AI Studio](https://aistudio.google.com/app/apikey), create a free API key.

### 2. Configure

Open `firebase.js` and replace the `firebaseConfig` object with your Firebase credentials.

Open `gemini.js` and replace `YOUR_GEMINI_API_KEY` with your Gemini API key.

### 3. Deploy

```bash
npm install -g firebase-tools
firebase login
cd medguard-ai
firebase init        # Select Hosting, use "." as public dir
firebase deploy
```

### 4. Firestore Rules (for hackathon demo)

In Firebase Console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

> ⚠️ These rules allow public access — only for hackathon demos, not production.

## 📁 Project Structure

```
medguard-ai/
├── index.html        # Patient intake page
├── dashboard.html    # Live patient dashboard
├── styles.css        # Complete styling (light + dark mode)
├── app.js            # Intake page logic
├── dashboard.js      # Dashboard logic + real-time listener
├── firebase.js       # Firebase config & Firestore helpers
├── gemini.js         # Gemini API integration
├── triage.js         # Rule-based triage classification
├── utils.js          # Shared utilities (theme, toast, chart)
├── firebase.json     # Firebase Hosting config
└── README.md         # This file
```

## 🧪 Test Cases

### Case 1 — CRITICAL

```
PATIENT ID: PT-001
Name: Ravi Shankar
Age: 58 | Gender: Male
Ward: Emergency
Symptoms: Severe chest pain, shortness of breath
Vitals: BP 180/110, Pulse 102, SpO2 94%
Known Allergies: Penicillin, Aspirin
Current Medications: Warfarin 5mg daily
Doctor Notes: Possible acute MI. Do NOT administer aspirin.
```

Expected: **CRITICAL** (chest pain, shortness of breath, SpO2 < 96, BP > 160, acute MI)

### Case 2 — SAFE

```
PATIENT ID: PT-002
Name: Ananya Mehta
Age: 29 | Gender: Female
Ward: General
Symptoms: Mild headache, fatigue
Vitals: BP 118/76, Pulse 72, SpO2 99%
Known Allergies: None
Current Medications: Multivitamin daily
Doctor Notes: Likely stress-related. Monitor and follow up.
```

Expected: **SAFE**

### Case 3 — MODERATE

```
PATIENT ID: PT-003
Name: Unknown
Age: Unknown
Ward: Walk-in
Symptoms: Dizziness
Vitals: Not recorded
Known Allergies: Unknown
Current Medications: Unknown
Doctor Notes: Incomplete intake. Needs follow-up.
```

Expected: **MODERATE** (missing vitals, unknown age)

## 📄 License

MIT — Built for AI Innovation Hackathon 2026
