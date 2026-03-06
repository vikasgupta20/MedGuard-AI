// ============================================================
// dashboard.js — Live Dashboard with Real-Time Firestore
// ============================================================
// Features: real-time cards, analytics panel, search & filter,
//           animated donut chart
// ============================================================

import { onPatientsSnapshot } from "./firebase.js";
import {
    STATUS_COLORS,
    formatTimestamp,
    escapeHtml,
    debounce,
    renderDonutChart,
    initThemeToggle,
} from "./utils.js";

// ── DOM Elements ─────────────────────────────────────────────
const cardsContainer = document.getElementById("patient-cards");
const searchInput = document.getElementById("search-input");
const filterBtns = document.querySelectorAll(".filter-btn");
const statTotal = document.getElementById("stat-total");
const statCritical = document.getElementById("stat-critical");
const statModerate = document.getElementById("stat-moderate");
const statSafe = document.getElementById("stat-safe");

// ── State ────────────────────────────────────────────────────
let allPatients = [];
let currentFilter = "ALL";
let currentSearch = "";

// ── Initialize ───────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    initThemeToggle();

    // Start real-time listener
    onPatientsSnapshot((patients) => {
        allPatients = patients;
        updateAnalytics();
        renderCards();
    });

    // Search handler
    searchInput.addEventListener(
        "input",
        debounce((e) => {
            currentSearch = e.target.value.trim().toLowerCase();
            renderCards();
        }, 250)
    );

    // Filter buttons
    filterBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            filterBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            currentFilter = btn.dataset.filter;
            renderCards();
        });
    });
});

// ── Update Analytics Counters ────────────────────────────────
function updateAnalytics() {
    const counts = { CRITICAL: 0, MODERATE: 0, SAFE: 0 };
    allPatients.forEach((p) => {
        if (counts[p.status] !== undefined) counts[p.status]++;
    });

    animateCounter(statTotal, allPatients.length);
    animateCounter(statCritical, counts.CRITICAL);
    animateCounter(statModerate, counts.MODERATE);
    animateCounter(statSafe, counts.SAFE);

    // Render donut chart
    renderDonutChart("donut-chart", {
        critical: counts.CRITICAL,
        moderate: counts.MODERATE,
        safe: counts.SAFE,
    });
}

/**
 * Animate a counter from current value to target.
 */
function animateCounter(element, target) {
    if (!element) return;
    const current = parseInt(element.textContent, 10) || 0;
    if (current === target) return;

    const duration = 500;
    const steps = 20;
    const increment = (target - current) / steps;
    let step = 0;

    const interval = setInterval(() => {
        step++;
        element.textContent = Math.round(current + increment * step);
        if (step >= steps) {
            element.textContent = target;
            clearInterval(interval);
        }
    }, duration / steps);
}

// ── Render Patient Cards ─────────────────────────────────────
function renderCards() {
    let filtered = allPatients;

    // Apply status filter
    if (currentFilter !== "ALL") {
        filtered = filtered.filter((p) => p.status === currentFilter);
    }

    // Apply search
    if (currentSearch) {
        filtered = filtered.filter((p) => {
            const name = (p.name || "").toLowerCase();
            const id = (p.patientId || "").toLowerCase();
            return name.includes(currentSearch) || id.includes(currentSearch);
        });
    }

    if (filtered.length === 0) {
        cardsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>No patients found</h3>
        <p>Patient records will appear here in real time.</p>
      </div>
    `;
        return;
    }

    cardsContainer.innerHTML = filtered.map((p, i) => buildCard(p, i)).join("");
}

/**
 * Build HTML for a single patient card.
 */
function buildCard(patient, index) {
    const colors = STATUS_COLORS[patient.status] || STATUS_COLORS.SAFE;
    const delay = index * 80; // stagger animation

    return `
    <div class="patient-card animate-in" style="
      border-left: 4px solid ${colors.border};
      animation-delay: ${delay}ms;
    ">
      <!-- Card Header -->
      <div class="card-header">
        <div class="card-id-group">
          <span class="card-patient-id">${escapeHtml(patient.patientId) || "N/A"}</span>
          <span class="card-name">${escapeHtml(patient.name) || "Unknown"}</span>
        </div>
        <span class="status-badge" style="background:${colors.border}">
          ${patient.status}
        </span>
      </div>

      <!-- Card Body -->
      <div class="card-body">
        <div class="card-row">
          <span class="card-label">Age:</span>
          <span>${patient.age ?? "N/A"}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Vitals:</span>
          <span>BP ${escapeHtml(patient.bp) || "—"} | Pulse ${patient.pulse ?? "—"} | SpO2 ${patient.spo2 ?? "—"}%</span>
        </div>

        ${patient.symptoms && patient.symptoms.length > 0
            ? `<div class="card-row">
                <span class="card-label">Symptoms:</span>
                <div class="tag-list">${patient.symptoms.map((s) => `<span class="tag tag-symptom">${escapeHtml(s)}</span>`).join("")}</div>
              </div>`
            : ""
        }

        ${patient.allergies && patient.allergies.length > 0
            ? `<div class="card-row">
                <span class="card-label">Allergies:</span>
                <div class="tag-list">${patient.allergies.map((a) => `<span class="tag tag-allergy">${escapeHtml(a)}</span>`).join("")}</div>
              </div>`
            : ""
        }
      </div>

      <!-- Card Footer -->
      <div class="card-footer">
        <span class="card-timestamp">${formatTimestamp(patient.timestamp)}</span>
      </div>
    </div>
  `;
}
