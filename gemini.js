// ============================================================
// gemini.js — Google Gemini API Integration
// ============================================================
// Sends unstructured patient text to Gemini and extracts
// structured medical data as JSON.
// ============================================================

// ── Gemini API key ───────────────────────────────────────────
const GEMINI_API_KEY = "AIzaSyDtjo5aVywDeiNc3QRtPhtpr5-DM94i3uE";

// Gemini 2.0 Flash endpoint (free tier friendly)
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * System prompt that instructs Gemini to return ONLY valid JSON
 * with the exact fields we need for triage.
 */
const SYSTEM_PROMPT = `You are a medical data extraction AI.
You will receive unstructured patient intake text.
Extract the following fields and return ONLY a valid JSON object (no markdown, no explanation):

{
  "patientId": "string or null",
  "name": "string or null",
  "age": number or null,
  "symptoms": ["array of symptom strings"],
  "allergies": ["array of allergy strings"],
  "medications": ["array of medication strings"],
  "bp": "string like '120/80' or null",
  "pulse": number or null,
  "spo2": number or null,
  "doctorNotes": "string or null"
}

Rules:
- If a field is missing from the text, set it to null (or empty array for lists).
- symptoms, allergies, medications must always be arrays.
- age must be a number or null.
- pulse and spo2 must be numbers or null.
- Do NOT wrap the JSON in markdown code blocks.
- Return ONLY the JSON object, nothing else.`;

/**
 * Extract structured patient data from raw intake text using Gemini.
 * @param {string} intakeText – raw patient intake record
 * @returns {Promise<Object>} – parsed patient data object
 */
export async function extractWithGemini(intakeText) {
    if (!intakeText || !intakeText.trim()) {
        throw new Error("Please enter patient intake text before screening.");
    }

    const requestBody = {
        contents: [
            {
                parts: [
                    { text: SYSTEM_PROMPT },
                    { text: `\n\nPatient intake record:\n${intakeText}` },
                ],
            },
        ],
        generationConfig: {
            temperature: 0.1, // low temp for consistent extraction
            maxOutputTokens: 1024,
        },
    };

    let response;
    try {
        response = await fetch(GEMINI_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });
    } catch (networkErr) {
        throw new Error("Network error — could not reach Gemini API.");
    }

    if (!response.ok) {
        const errBody = await response.text();
        console.error("Gemini API error:", errBody);
        throw new Error(`Gemini API returned status ${response.status}.`);
    }

    const result = await response.json();

    // Navigate the Gemini response structure
    const rawText =
        result?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Safely extract JSON even if Gemini wraps it in ```json ... ```
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) {
        console.error("Gemini raw response:", rawText);
        throw new Error("Gemini did not return valid JSON. Please try again.");
    }

    try {
        const data = JSON.parse(match[0]);
        return normalizeExtracted(data);
    } catch (parseErr) {
        console.error("JSON parse error:", parseErr, "Raw:", match[0]);
        throw new Error("Failed to parse Gemini response as JSON.");
    }
}

/**
 * Normalize extracted data so downstream code always gets
 * consistent types (arrays, numbers, strings).
 */
function normalizeExtracted(data) {
    return {
        patientId: data.patientId ?? null,
        name: data.name ?? null,
        age: typeof data.age === "number" ? data.age : null,
        symptoms: Array.isArray(data.symptoms) ? data.symptoms : [],
        allergies: Array.isArray(data.allergies) ? data.allergies : [],
        medications: Array.isArray(data.medications) ? data.medications : [],
        bp: data.bp ?? null,
        pulse: typeof data.pulse === "number" ? data.pulse : null,
        spo2: typeof data.spo2 === "number" ? data.spo2 : null,
        doctorNotes: data.doctorNotes ?? null,
    };
}
