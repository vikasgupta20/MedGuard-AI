// ============================================================
// utils.js — Utility / Helper Functions
// ============================================================

/**
 * Status color map for UI rendering.
 */
export const STATUS_COLORS = {
    CRITICAL: {
        bg: "rgba(239, 68, 68, 0.15)",
        border: "#ef4444",
        text: "#dc2626",
        glow: "0 0 20px rgba(239, 68, 68, 0.4)",
        badge: "bg-red-500",
    },
    MODERATE: {
        bg: "rgba(245, 158, 11, 0.15)",
        border: "#f59e0b",
        text: "#d97706",
        glow: "0 0 20px rgba(245, 158, 11, 0.4)",
        badge: "bg-amber-500",
    },
    SAFE: {
        bg: "rgba(34, 197, 94, 0.15)",
        border: "#22c55e",
        text: "#16a34a",
        glow: "0 0 20px rgba(34, 197, 94, 0.4)",
        badge: "bg-green-500",
    },
};

/**
 * Format a Firestore timestamp to a readable date string.
 */
export function formatTimestamp(ts) {
    if (!ts) return "Just now";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/**
 * Escape HTML to prevent XSS when injecting user text into the DOM.
 */
export function escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Create a debounced version of a function.
 */
export function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Show a toast notification.
 */
export function showToast(message, type = "info") {
    const container =
        document.getElementById("toast-container") || createToastContainer();

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <button onclick="this.parentElement.remove()" class="toast-close">&times;</button>
  `;

    container.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        toast.classList.add("toast-exit");
        setTimeout(() => toast.remove(), 400);
    }, 5000);
}

function createToastContainer() {
    const container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
    return container;
}

/**
 * Toggle dark/light mode and persist preference.
 */
export function initThemeToggle() {
    const saved = localStorage.getItem("medguard-theme");
    if (saved === "dark") {
        document.documentElement.classList.add("dark");
    }

    const btn = document.getElementById("theme-toggle");
    if (btn) {
        btn.addEventListener("click", () => {
            document.documentElement.classList.toggle("dark");
            const isDark = document.documentElement.classList.contains("dark");
            localStorage.setItem("medguard-theme", isDark ? "dark" : "light");
            btn.textContent = isDark ? "☀️" : "🌙";
        });

        // Set initial icon
        const isDark = document.documentElement.classList.contains("dark");
        btn.textContent = isDark ? "☀️" : "🌙";
    }
}

/**
 * Simple donut chart renderer using SVG.
 * @param {string} containerId – DOM element ID
 * @param {Object} data – { critical, moderate, safe }
 */
export function renderDonutChart(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const total = data.critical + data.moderate + data.safe;
    if (total === 0) {
        container.innerHTML = `<p class="text-center text-secondary">No data yet</p>`;
        return;
    }

    const radius = 60;
    const circumference = 2 * Math.PI * radius;

    const segments = [
        { value: data.critical, color: "#ef4444", label: "Critical" },
        { value: data.moderate, color: "#f59e0b", label: "Moderate" },
        { value: data.safe, color: "#22c55e", label: "Safe" },
    ];

    let offset = 0;
    const circles = segments
        .map((seg) => {
            const pct = seg.value / total;
            const dashArray = `${pct * circumference} ${circumference}`;
            const circle = `<circle cx="80" cy="80" r="${radius}" fill="none" stroke="${seg.color}"
        stroke-width="20" stroke-dasharray="${dashArray}" stroke-dashoffset="-${offset}"
        class="donut-segment" style="transition: stroke-dasharray 0.8s ease, stroke-dashoffset 0.8s ease;" />`;
            offset += pct * circumference;
            return circle;
        })
        .join("");

    container.innerHTML = `
    <svg viewBox="0 0 160 160" class="donut-chart">
      ${circles}
      <text x="80" y="76" text-anchor="middle" class="donut-total">${total}</text>
      <text x="80" y="94" text-anchor="middle" class="donut-label">Patients</text>
    </svg>
    <div class="donut-legend">
      ${segments
            .map(
                (s) =>
                    `<span class="legend-item"><span class="legend-dot" style="background:${s.color}"></span>${s.label}: ${s.value}</span>`
            )
            .join("")}
    </div>
  `;
}
