// ============================================================
// firebase.js — Firebase Configuration & Firestore Helpers
// ============================================================
// Replace the firebaseConfig values with YOUR Firebase project
// credentials before deploying.
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Firebase project config ──────────────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyAo3cBRQ1UwwdNVfLwDXfBK_T-SRVeQnmY",
    authDomain: "medguard-ai-3dc6c.firebaseapp.com",
    projectId: "medguard-ai-3dc6c",
    storageBucket: "medguard-ai-3dc6c.firebasestorage.app",
    messagingSenderId: "902025612648",
    appId: "1:902025612648:web:8974d01df0e176e77f1add",
    measurementId: "G-NJ1T2FL3F2",
};

// ── Initialize Firebase ──────────────────────────────────────
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ── Firestore collection reference ───────────────────────────
const patientsCol = collection(db, "patients");

/**
 * Save a patient record to Firestore.
 * @param {Object} record – structured patient data + status + rawInput
 * @returns {Promise<string>} – Firestore document ID
 */
export async function savePatient(record) {
    try {
        const docRef = await addDoc(patientsCol, {
            ...record,
            timestamp: serverTimestamp(),
        });
        return docRef.id;
    } catch (err) {
        console.error("Firestore save error:", err);
        throw new Error("Failed to save patient record. Please try again.");
    }
}

/**
 * Subscribe to real-time patient updates, ordered by newest first.
 * @param {Function} callback – receives an array of patient objects
 * @returns {Function} unsubscribe function
 */
export function onPatientsSnapshot(callback) {
    const q = query(patientsCol, orderBy("timestamp", "desc"));
    return onSnapshot(
        q,
        (snapshot) => {
            const patients = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            callback(patients);
        },
        (err) => {
            console.error("Firestore snapshot error:", err);
        }
    );
}
