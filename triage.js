// ============================================================
// triage.js — Rule-Based Triage Risk Classification
// ============================================================
// Classifies patients as CRITICAL, MODERATE, or SAFE based on
// symptoms, vitals, allergies, and data completeness.
// ============================================================

/**
 * Keywords / conditions that trigger CRITICAL status.
 * Checked against symptoms and doctorNotes (case-insensitive).
 */
const CRITICAL_KEYWORDS = [
    "chest pain",
    "shortness of breath",
    "acute mi",
    "stemi",
    "cardiac arrest",
    "stroke",
    "hemorrhage",
    "anaphylaxis",
    "sepsis",
    "unresponsive",
];

/**
 * Classify a patient's triage risk level.
 *
 * CRITICAL — if any high-risk condition is detected
 * MODERATE — if data is incomplete or ambiguous
 * SAFE     — otherwise
 *
 * @param {Object} patient – normalized patient data from Gemini
 * @returns {string} "CRITICAL" | "MODERATE" | "SAFE"
 */
export function classifyRisk(patient) {
    // ── CRITICAL checks ──────────────────────────────────────

    // 1. Check symptoms + doctor notes for critical keywords
    const textToScan = [
        ...(patient.symptoms || []),
        patient.doctorNotes || "",
    ]
        .join(" ")
        .toLowerCase();

    for (const keyword of CRITICAL_KEYWORDS) {
        if (textToScan.includes(keyword)) return "CRITICAL";
    }

    // 2. SpO2 below 96
    if (typeof patient.spo2 === "number" && patient.spo2 < 96) {
        return "CRITICAL";
    }

    // 3. BP systolic above 160
    if (patient.bp) {
        const systolic = parseInt(patient.bp.split("/")[0], 10);
        if (!isNaN(systolic) && systolic > 160) return "CRITICAL";
    }

    // 4. Drug-allergy conflict (allergy matches a current medication)
    if (hasAllergyConflict(patient)) return "CRITICAL";

    // ── MODERATE checks ──────────────────────────────────────

    if (!patient.name) return "MODERATE";
    if (patient.age === null || patient.age === undefined) return "MODERATE";
    if (!patient.bp && patient.pulse === null && patient.spo2 === null) {
        return "MODERATE"; // vitals missing
    }
    if (
        (!patient.symptoms || patient.symptoms.length === 0) &&
        !patient.doctorNotes
    ) {
        return "MODERATE"; // insufficient data
    }

    // ── SAFE ─────────────────────────────────────────────────
    return "SAFE";
}

/**
 * Detect allergy ↔ medication conflicts.
 * Returns true if any allergy string appears inside any medication string
 * (or vice-versa), case-insensitive.
 */
function hasAllergyConflict(patient) {
    const allergies = (patient.allergies || []).map((a) => a.toLowerCase());
    const meds = (patient.medications || []).map((m) => m.toLowerCase());

    for (const allergy of allergies) {
        for (const med of meds) {
            if (med.includes(allergy) || allergy.includes(med)) return true;
        }
    }

    // Also check doctor notes for allergy warnings
    const notes = (patient.doctorNotes || "").toLowerCase();
    for (const allergy of allergies) {
        if (
            notes.includes(`do not administer ${allergy}`) ||
            notes.includes(`avoid ${allergy}`) ||
            notes.includes(`allergic to ${allergy}`)
        ) {
            return true;
        }
    }

    return false;
}

/**
 * Get a human-readable reason for the triage status.
 * Useful for displaying explanations on the UI.
 */
export function getTriageReason(patient, status) {
    if (status === "SAFE") return "No high-risk indicators detected.";

    const reasons = [];

    // Check critical keywords
    const textToScan = [
        ...(patient.symptoms || []),
        patient.doctorNotes || "",
    ]
        .join(" ")
        .toLowerCase();

    for (const keyword of CRITICAL_KEYWORDS) {
        if (textToScan.includes(keyword)) {
            reasons.push(`Detected: ${keyword}`);
        }
    }

    if (typeof patient.spo2 === "number" && patient.spo2 < 96) {
        reasons.push(`SpO2 is ${patient.spo2}% (below 96%)`);
    }

    if (patient.bp) {
        const systolic = parseInt(patient.bp.split("/")[0], 10);
        if (!isNaN(systolic) && systolic > 160) {
            reasons.push(`BP systolic ${systolic} (above 160)`);
        }
    }

    if (hasAllergyConflict(patient)) {
        reasons.push("Drug-allergy conflict detected");
    }

    if (!patient.name) reasons.push("Patient name missing");
    if (patient.age === null) reasons.push("Patient age missing");
    if (!patient.bp && patient.pulse === null && patient.spo2 === null) {
        reasons.push("Vitals data missing");
    }

    return reasons.length > 0
        ? reasons.join(" • ")
        : "Insufficient information for full assessment.";
}
