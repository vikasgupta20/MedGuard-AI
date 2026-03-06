# 🛡️ MedGuard AI — Patient Safety Intelligence System

<p align="center">
  <img src="https://img.shields.io/badge/AI-Gemini%201.5%20Flash-blue?style=for-the-badge&logo=google" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/Database-Firestore-orange?style=for-the-badge&logo=firebase" alt="Firestore" />
  <img src="https://img.shields.io/badge/Hosting-Vercel-black?style=for-the-badge&logo=vercel" alt="Vercel" />
  <img src="https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JS-yellow?style=for-the-badge" alt="Frontend" />
</p>

> 🏆 Built for the **AI Innovation Hackathon 2026** — An AI-powered medical triage system that extracts structured data from unstructured patient intake records and classifies risk in real time.

---

## 🎯 Problem Statement

Hospitals receive **unstructured patient intake records** that are hard to process quickly. Delayed triage can be life-threatening. MedGuard AI solves this by:

1. Accepting raw patient intake text
2. Using **Google Gemini AI** to extract structured medical data
3. Applying **rule-based triage classification** (CRITICAL / MODERATE / SAFE)
4. Storing records in **Firebase Firestore**
5. Displaying results on a **real-time live dashboard**

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Extraction** | Gemini 1.5 Flash parses unstructured text into structured JSON |
| 🚦 **Triage Classification** | Rule-based engine: CRITICAL, MODERATE, SAFE |
| 📊 **Live Dashboard** | Real-time patient cards via Firestore `onSnapshot` |
| 📈 **Analytics Panel** | Animated donut chart + live counters |
| 🔍 **Search & Filter** | Filter by status, search by patient name or ID |
| 🔎 **AI Preview** | Review extracted data before saving |
| 🚨 **Critical Alerts** | Flashing red banner for critical patients |
| 🌗 **Dark / Light Mode** | Futuristic glassmorphism UI with theme toggle |
| 📱 **Responsive** | Works on desktop, tablet, and mobile |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| AI Engine | Google Gemini 1.5 Flash API |
| Database | Firebase Firestore (real-time NoSQL) |
| Hosting | Vercel |
| Design | Glassmorphism, CSS animations, SVG charts |

---

## 📁 Project Structure

```
MedGuard-AI/
├── index.html          # Patient intake page
├── dashboard.html      # Live patient dashboard
├── styles.css          # Full styling (light + dark mode, animations)
├── app.js              # Intake page logic (Gemini → preview → save)
├── dashboard.js        # Dashboard logic + real-time Firestore listener
├── firebase.js         # Firebase config & Firestore helpers
├── gemini.js           # Gemini API integration + JSON extraction
├── triage.js           # Rule-based triage classification engine
├── utils.js            # Shared utilities (theme, toasts, donut chart)
├── vercel.json         # Vercel deployment config
└── README.md           # Documentation
```

---

## 🚀 Quick Setup

### Prerequisites

- A [Firebase](https://console.firebase.google.com) project with **Firestore** enabled
- A free [Gemini API key](https://aistudio.google.com/app/apikey) from Google AI Studio

### 1. Clone the Repository

```bash
git clone https://github.com/vikasgupta20/MedGuard-AI.git
cd MedGuard-AI
```

### 2. Configure API Keys

**Firebase** — Open `firebase.js` and replace the `firebaseConfig` object with your Firebase project credentials.

**Gemini** — Open `gemini.js` and replace `YOUR_GEMINI_API_KEY` with your Gemini API key.

### 3. Enable Firestore

In Firebase Console → **Firestore Database** → **Create Database** → **Start in test mode**

Set these rules for the hackathon demo:

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

> ⚠️ These rules allow public access — for hackathon demos only, not production.

### 4. Deploy on Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import this repo
3. Framework Preset: **Other**
4. Click **Deploy**

---

## 🧪 Test Cases

### Case 1 — 🔴 CRITICAL

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

**Expected:** `CRITICAL` — chest pain, shortness of breath, SpO2 < 96, BP systolic > 160, acute MI, drug-allergy conflict

---

### Case 2 — 🟢 SAFE

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

**Expected:** `SAFE` — No high-risk indicators detected

---

### Case 3 — 🟡 MODERATE

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

**Expected:** `MODERATE` — Missing vitals, unknown age, insufficient data

---

## ⚙️ Triage Classification Rules

| Status | Trigger Conditions |
|--------|-------------------|
| 🔴 **CRITICAL** | Chest pain, shortness of breath, acute MI, STEMI, SpO2 < 96%, BP systolic > 160, drug-allergy conflict |
| 🟡 **MODERATE** | Missing name, missing/unknown age, missing vitals, insufficient data |
| 🟢 **SAFE** | No high-risk indicators detected |

---

## 🎨 UI Design

- **Glassmorphism** — Frosted glass panels with backdrop blur
- **Animated Background** — Subtle floating gradient
- **Light Mode** — Clean with soft blue, teal, white surfaces
- **Dark Mode** — Futuristic deep navy, purple glow, neon blue highlights
- **Animations** — Card hover elevation, fade-in, scanning animation, counter animations

---

## 👥 Team

Built by students for the **AI Innovation Hackathon 2026**

---

## 📄 License

MIT License — Free to use and modify
