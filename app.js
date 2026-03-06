// ============================================================
// app.js — Patient Intake Page Logic
// ============================================================
// Handles: textarea input → Gemini extraction → preview →
//          triage classification → Firestore save
// ============================================================

import { extractWithGemini } from "./gemini.js";
import { classifyRisk, getTriageReason } from "./triage.js";
import { savePatient } from "./firebase.js";
import { showToast, initThemeToggle, escapeHtml, STATUS_COLORS } from "./utils.js";

// ── DOM Elements ─────────────────────────────────────────────
const intakeForm = document.getElementById("intake-form");
const intakeText = document.getElementById("intake-text");
const screenBtn = document.getElementById("screen-btn");
const previewSection = document.getElementById("preview-section");
const previewContent = document.getElementById("preview-content");
const confirmBtn = document.getElementById("confirm-btn");
const cancelBtn = document.getElementById("cancel-btn");
const loadingOverlay = document.getElementById("loading-overlay");
const criticalAlert = document.getElementById("critical-alert");

// Holds the current extraction result
let currentExtraction = null;
let currentStatus = null;

// ── Initialize ───────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    initThemeToggle();

    // Screen Patient button
    screenBtn.addEventListener("click", handleScreen);

    // Confirm Save
    confirmBtn.addEventListener("click", handleConfirmSave);

    // Cancel
    cancelBtn.addEventListener("click", handleCancel);
});

// ── Screen Patient Handler ───────────────────────────────────
async function handleScreen() {
    const raw = intakeText.value.trim();

    if (!raw) {
        showToast("Please enter patient intake text.", "error");
        intakeText.focus();
        return;
    }

    // Show loading
    showLoading(true);
    hideCriticalAlert();
    hidePreview();

    try {
        // 1. Send to Gemini for extraction
        const extracted = await extractWithGemini(raw);

        // 2. Classify risk
        const status = classifyRisk(extracted);
        const reason = getTriageReason(extracted, status);

        currentExtraction = extracted;
        currentStatus = status;

        // 3. Show preview
        renderPreview(extracted, status, reason);
        showPreview();

        // 4. Critical alert
        if (status === "CRITICAL") {
            showCriticalAlert();
        }

        showToast("AI extraction complete. Review below.", "success");
    } catch (err) {
        console.error("Screen error:", err);
        showToast(err.message || "An error occurred during screening.", "error");
    } finally {
        showLoading(false);
    }
}

// ── Confirm Save Handler ─────────────────────────────────────
async function handleConfirmSave() {
    if (!currentExtraction) return;

    confirmBtn.disabled = true;
    confirmBtn.textContent = "Saving...";

    try {
        const record = {
            ...currentExtraction,
            status: currentStatus,
            rawInput: intakeText.value.trim(),
        };

        await savePatient(record);
        showToast("Patient record saved successfully!", "success");

        // Reset form
        intakeText.value = "";
        hidePreview();
        hideCriticalAlert();
        currentExtraction = null;
        currentStatus = null;
    } catch (err) {
        console.error("Save error:", err);
        showToast(err.message || "Failed to save record.", "error");
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = "✓ Confirm & Save";
    }
}

// ── Cancel Handler ───────────────────────────────────────────
function handleCancel() {
    hidePreview();
    hideCriticalAlert();
    currentExtraction = null;
    currentStatus = null;
}

// ── Render AI Extraction Preview ─────────────────────────────
function renderPreview(data, status, reason) {
    const colors = STATUS_COLORS[status];

    previewContent.innerHTML = `
    <!-- Status Badge -->
    <div class="status-banner" style="background:${colors.bg}; border-color:${colors.border}; box-shadow:${colors.glow}">
      <span class="status-dot" style="background:${colors.border}"></span>
      <span class="status-text" style="color:${colors.text}">
        ${status} ${status === "CRITICAL" ? "🚨" : status === "MODERATE" ? "⚠️" : "✅"}
      </span>
      <p class="status-reason">${escapeHtml(reason)}</p>
    </div>

    <!-- Preview Cards Grid -->
    <div class="preview-grid">
      <!-- Patient Info -->
      <div class="preview-card">
        <h4>👤 Patient Info</h4>
        <div class="preview-field"><span>ID:</span> ${escapeHtml(data.patientId) || "N/A"}</div>
        <div class="preview-field"><span>Name:</span> ${escapeHtml(data.name) || "N/A"}</div>
        <div class="preview-field"><span>Age:</span> ${data.age ?? "N/A"}</div>
      </div>

      <!-- Vitals -->
      <div class="preview-card">
        <h4>💓 Vitals</h4>
        <div class="preview-field"><span>BP:</span> ${escapeHtml(data.bp) || "N/A"}</div>
        <div class="preview-field"><span>Pulse:</span> ${data.pulse ?? "N/A"} bpm</div>
        <div class="preview-field"><span>SpO2:</span> ${data.spo2 ?? "N/A"}%</div>
      </div>

      <!-- Symptoms -->
      <div class="preview-card">
        <h4>🩺 Symptoms</h4>
        ${data.symptoms.length > 0
            ? `<div class="tag-list">${data.symptoms.map((s) => `<span class="tag tag-symptom">${escapeHtml(s)}</span>`).join("")}</div>`
            : "<p class='text-muted'>None reported</p>"
        }
      </div>

      <!-- Allergies -->
      <div class="preview-card">
        <h4>⚠️ Allergies</h4>
        ${data.allergies.length > 0
            ? `<div class="tag-list">${data.allergies.map((a) => `<span class="tag tag-allergy">${escapeHtml(a)}</span>`).join("")}</div>`
            : "<p class='text-muted'>None reported</p>"
        }
      </div>

      <!-- Medications -->
      <div class="preview-card">
        <h4>💊 Medications</h4>
        ${data.medications.length > 0
            ? `<div class="tag-list">${data.medications.map((m) => `<span class="tag tag-med">${escapeHtml(m)}</span>`).join("")}</div>`
            : "<p class='text-muted'>None reported</p>"
        }
      </div>

      <!-- Doctor Notes -->
      <div class="preview-card">
        <h4>📝 Doctor Notes</h4>
        <p>${escapeHtml(data.doctorNotes) || "No notes"}</p>
      </div>
    </div>
  `;
}

// ── UI Helpers ───────────────────────────────────────────────
function showLoading(show) {
    loadingOverlay.classList.toggle("hidden", !show);
    screenBtn.disabled = show;
    screenBtn.innerHTML = show
        ? '<span class="spinner"></span> AI Screening...'
        : '🔬 Screen Patient';
}

function showPreview() {
    previewSection.classList.remove("hidden");
    previewSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function hidePreview() {
    previewSection.classList.add("hidden");
}

function showCriticalAlert() {
    criticalAlert.classList.remove("hidden");
    criticalAlert.classList.add("alert-flash");
}

function hideCriticalAlert() {
    criticalAlert.classList.add("hidden");
    criticalAlert.classList.remove("alert-flash");
}
