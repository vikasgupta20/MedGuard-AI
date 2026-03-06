// ============================================================
// gemini.js — Google Gemini API Integration
// ============================================================
// Sends unstructured patient text to Gemini and extracts
// structured medical data as JSON.
// ============================================================

// ── Gemini API key ───────────────────────────────────────────
const GEMINI_API_KEY = "AIzaSyAo3cBRQ1UwwdNVfLwDXfBK_T-SRVeQnmY";

// Models to try in order (fallback chain for rate limits / deprecation)
const GEMINI_MODELS = [
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
];

function getEndpoint(model) {
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
}

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

/** Sleep helper for retry backoff */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Extract structured patient data from raw intake text using Gemini.
 * Includes automatic retry with exponential backoff and model fallback.
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

    // Try each model with retries
    let lastError = null;

    for (const model of GEMINI_MODELS) {
        const endpoint = getEndpoint(model);
        const MAX_RETRIES = 3;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            let response;
            try {
                response = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(requestBody),
                });
            } catch (networkErr) {
                lastError = new Error("Network error — could not reach Gemini API.");
                break; // no point retrying network failures on same model
            }

            // Success — continue to parse
            if (response.ok) {
                return await parseGeminiResponse(response);
            }

            // Rate limited — wait and retry
            if (response.status === 429) {
                const waitMs = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
                console.warn(`Gemini 429 on ${model} (attempt ${attempt + 1}/${MAX_RETRIES}). Retrying in ${waitMs}ms...`);
                await sleep(waitMs);
                lastError = new Error("Gemini API is rate-limited. Please wait a moment and try again.");
                continue;
            }

            // Model not found — try next model
            if (response.status === 404) {
                console.warn(`Model ${model} not found (404). Trying next model...`);
                lastError = new Error(`Model ${model} not available.`);
                break;
            }

            // Other error — fail with details
            const errBody = await response.text();
            console.error("Gemini API error:", errBody);
            throw new Error(`Gemini API returned status ${response.status}.`);
        }
    }

    // All models and retries exhausted
    throw lastError || new Error("All Gemini models failed. Please try again later.");
}

/**
 * Parse and extract JSON data from a successful Gemini response.
 */
async function parseGeminiResponse(response) {
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
