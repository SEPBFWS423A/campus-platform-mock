import { escapeHTML } from '../../core/utils.js';

export function bindActionButtons(container, navigation) {
    container.querySelectorAll('.btn-action[data-nav]').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-nav');
            if (target && navigation) {
                navigation.setActiveTab(target);
            }
        });
    });
}

export function buildStatCard({ label, value, icon, colorClass, desc }) {
    return `
        <div class="card stat-card">
            <div class="stat-icon ${colorClass || ''}">
                <span class="material-symbols-rounded">${icon}</span>
            </div>
            <div class="stat-info">
                <span class="stat-label">${label}</span>
                <span class="stat-value">${value}</span>
                ${desc ? `<span class="stat-desc">${desc}</span>` : ''}
            </div>
        </div>`;
}

export function buildAlert(message, type = 'info', icon = null) {
    const icons = { success: 'check_circle', error: 'error_outline', warning: 'warning', info: 'info' };
    const alertIcon = icon || icons[type] || icons.info;
    return `
        <div class="management-alert ${type}">
            <span class="material-symbols-rounded">${alertIcon}</span>
            ${message}
        </div>`;
}

export function showAlert(container, message, type = 'info', autoHideMs = 0) {
    if (!container) return;
    container.innerHTML = buildAlert(message, type);
    if (autoHideMs > 0) {
        setTimeout(() => { container.innerHTML = ''; }, autoHideMs);
    }
}

export function buildEmptyState(icon, message) {
    return `
        <div class="card full-width">
            <div class="management-empty">
                <span class="material-symbols-rounded">${escapeHTML(icon)}</span>
                <p>${escapeHTML(message)}</p>
            </div>
        </div>`;
}
