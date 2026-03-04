import { showModal, closeModal } from './modal.js';
import { escapeHTML } from './utils.js';

/**
 * Initializes the "Change Password" feature.
 * Adds a button to the user dropdown that opens a password change modal.
 */
export function initChangePassword() {
    const dropdown = document.getElementById('user-dropdown');
    if (!dropdown) return;

    // Insert "Passwort ändern" button before the logout divider
    const dividers = dropdown.querySelectorAll('.dropdown-divider');
    const lastDivider = dividers[dividers.length - 1];
    if (!lastDivider) return;

    const changePwBtn = document.createElement('button');
    changePwBtn.className = 'dropdown-item';
    changePwBtn.setAttribute('role', 'menuitem');
    changePwBtn.innerHTML = `
        <span class="material-icons-round" aria-hidden="true">lock_reset</span>
        Passwort ändern
    `;

    lastDivider.parentNode.insertBefore(changePwBtn, lastDivider);

    changePwBtn.addEventListener('click', () => {
        openChangePasswordModal();
        // Close dropdown
        dropdown.classList.remove('active');
        const profileBtn = document.getElementById('profile-btn');
        if (profileBtn) profileBtn.setAttribute('aria-expanded', 'false');
    });
}

function openChangePasswordModal() {
    const bodyHTML = `
        <form id="change-password-form" class="management-form" novalidate>
            <div id="change-pw-feedback"></div>
            <div class="form-group">
                <label for="current-password">Aktuelles Passwort</label>
                <input type="password" id="current-password" required autocomplete="current-password">
            </div>
            <div class="form-group">
                <label for="new-password">Neues Passwort</label>
                <input type="password" id="new-password" required autocomplete="new-password">
            </div>
            <div class="form-group">
                <label for="confirm-password">Neues Passwort bestätigen</label>
                <input type="password" id="confirm-password" required autocomplete="new-password">
            </div>
        </form>
    `;

    const footerHTML = `
        <button class="btn btn-outline" type="button" id="change-pw-cancel">Abbrechen</button>
        <button class="btn btn-primary" type="button" id="change-pw-submit">Passwort ändern</button>
    `;

    showModal('Passwort ändern', bodyHTML, footerHTML);

    document.getElementById('change-pw-cancel')?.addEventListener('click', closeModal);
    document.getElementById('change-pw-submit')?.addEventListener('click', handleChangePassword);

    const form = document.getElementById('change-password-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleChangePassword();
        });
    }
}

function handleChangePassword() {
    const feedback = document.getElementById('change-pw-feedback');
    const currentPw = document.getElementById('current-password')?.value || '';
    const newPw = document.getElementById('new-password')?.value || '';
    const confirmPw = document.getElementById('confirm-password')?.value || '';

    if (!feedback) return;

    // Get current user
    const user = getCurrentUser();
    if (!user) {
        showFeedback(feedback, 'error', 'Benutzer nicht gefunden.');
        return;
    }

    // Validate current password
    if (currentPw !== user.password) {
        showFeedback(feedback, 'error', 'Aktuelles Passwort ist nicht korrekt.');
        return;
    }

    // Validate new password not empty
    if (!newPw.trim()) {
        showFeedback(feedback, 'error', 'Das neue Passwort darf nicht leer sein.');
        return;
    }

    // Validate new password differs from old
    if (newPw === currentPw) {
        showFeedback(feedback, 'error', 'Das neue Passwort muss sich vom aktuellen unterscheiden.');
        return;
    }

    // Validate confirmation matches
    if (newPw !== confirmPw) {
        showFeedback(feedback, 'error', 'Die Passwörter stimmen nicht überein.');
        return;
    }

    // Update password in mock data
    user.password = newPw;

    showFeedback(feedback, 'success', 'Passwort wurde erfolgreich geändert.');

    // Disable submit button after success
    const submitBtn = document.getElementById('change-pw-submit');
    if (submitBtn) submitBtn.disabled = true;

    // Close modal after delay
    setTimeout(closeModal, 1500);
}

function showFeedback(container, type, message) {
    const icon = type === 'success' ? 'check_circle' : 'error_outline';
    container.innerHTML = `
        <div class="management-alert ${type}">
            <span class="material-icons-round" aria-hidden="true">${icon}</span>
            ${escapeHTML(message)}
        </div>
    `;
}
