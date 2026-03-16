import { showModal, closeModal } from './modal.js';

export function initAuth() {
    const profileBtn = document.getElementById('profile-btn');
    const userDropdown = document.getElementById('user-dropdown');
    const logoutBtn = document.getElementById('logout-btn');

    if (profileBtn && userDropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = userDropdown.classList.toggle('active');
            profileBtn.setAttribute('aria-expanded', String(isOpen));
        });

        document.addEventListener('click', (e) => {
            if (!userDropdown.contains(e.target) && !profileBtn.contains(e.target)) {
                userDropdown.classList.remove('active');
                profileBtn.setAttribute('aria-expanded', 'false');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && userDropdown.classList.contains('active')) {
                userDropdown.classList.remove('active');
                profileBtn.setAttribute('aria-expanded', 'false');
                profileBtn.focus();
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.clear();
            window.location.href = 'login.html';
        });
    }

    renderUserSwitcher();
    initDropdownActions();
}

function closeDropdown() {
    const userDropdown = document.getElementById('user-dropdown');
    const profileBtn = document.getElementById('profile-btn');
    if (userDropdown) userDropdown.classList.remove('active');
    if (profileBtn) profileBtn.setAttribute('aria-expanded', 'false');
}

function initDropdownActions() {
    const profileMenuBtn = document.getElementById('profile-menu-btn');
    const settingsMenuBtn = document.getElementById('settings-menu-btn');

    if (profileMenuBtn) {
        profileMenuBtn.addEventListener('click', () => {
            closeDropdown();
            openProfileModal();
        });
    }

    if (settingsMenuBtn) {
        settingsMenuBtn.addEventListener('click', () => {
            closeDropdown();
            openSettingsModal();
        });
    }
}

function openProfileModal() {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (!user) return;

    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const mockEmails = {
        student: `m.mustermann@campus-university.de`,
        dozent: `prof.mustermann@campus-university.de`,
        verwaltung: `verwaltung@campus-university.de`
    };
    const email = mockEmails[user.role] || `${user.id}@campus-university.de`;
    const matNum = user.role === 'student' ? `Mat.-Nr.: ${3000000 + user.id * 7}` : '';

    const bodyHTML = `
        <div class="profile-modal-content">
            <div class="profile-avatar-large">${initials}</div>
            <div class="profile-info">
                <h3 class="profile-name">${user.name}</h3>
                <span class="profile-role-badge">${user.roleLabel}</span>
                <div class="profile-details">
                    <div class="profile-detail-row">
                        <span class="material-symbols-rounded" aria-hidden="true">email</span>
                        <span>${email}</span>
                    </div>
                    ${matNum ? `<div class="profile-detail-row">
                        <span class="material-symbols-rounded" aria-hidden="true">badge</span>
                        <span>${matNum}</span>
                    </div>` : ''}
                </div>
            </div>
        </div>
    `;

    const footerHTML = `
        <button class="btn btn-outline" type="button" id="profile-modal-close">Schließen</button>
    `;

    showModal('Mein Profil', bodyHTML, footerHTML);
    document.getElementById('profile-modal-close')?.addEventListener('click', closeModal);
}

function openSettingsModal() {
    const isDark = document.body.classList.contains('dark-mode');

    const bodyHTML = `
        <div class="settings-modal-content">
            <div class="settings-section">
                <h4 class="settings-section-title">Darstellung</h4>
                <div class="settings-row">
                    <div class="settings-row-info">
                        <span class="material-symbols-rounded settings-row-icon" aria-hidden="true">dark_mode</span>
                        <div>
                            <div class="settings-row-label">Dunkles Design</div>
                            <div class="settings-row-desc">Dark Mode ein- oder ausschalten</div>
                        </div>
                    </div>
                    <button class="settings-toggle ${isDark ? 'active' : ''}" id="settings-dark-toggle"
                            aria-pressed="${isDark}" aria-label="Dark Mode umschalten">
                        <span class="settings-toggle-knob"></span>
                    </button>
                </div>
            </div>
            <div class="settings-divider"></div>
            <div class="settings-section">
                <h4 class="settings-section-title">Sicherheit</h4>
                <button class="settings-row settings-row-action" id="settings-change-pw" type="button">
                    <div class="settings-row-info">
                        <span class="material-symbols-rounded settings-row-icon" aria-hidden="true">lock_reset</span>
                        <div>
                            <div class="settings-row-label">Passwort ändern</div>
                            <div class="settings-row-desc">Zugangsdaten aktualisieren</div>
                        </div>
                    </div>
                    <span class="material-symbols-rounded settings-row-arrow" aria-hidden="true">chevron_right</span>
                </button>
            </div>
        </div>
    `;

    const footerHTML = `
        <button class="btn btn-outline" type="button" id="settings-modal-close">Schließen</button>
    `;

    showModal('Einstellungen', bodyHTML, footerHTML);
    document.getElementById('settings-modal-close')?.addEventListener('click', closeModal);

    const darkToggle = document.getElementById('settings-dark-toggle');
    if (darkToggle) {
        darkToggle.addEventListener('click', () => {
            document.getElementById('theme-toggle')?.click();
            const nowDark = document.body.classList.contains('dark-mode');
            darkToggle.classList.toggle('active', nowDark);
            darkToggle.setAttribute('aria-pressed', String(nowDark));
        });
    }

    document.getElementById('settings-change-pw')?.addEventListener('click', () => {
        closeModal();
        document.dispatchEvent(new CustomEvent('open-change-password'));
    });
}

function renderUserSwitcher() {
    const container = document.getElementById('user-switch-list');
    if (!container || typeof mockData === 'undefined') return;

    const currentUser = getCurrentUser();
    const roleIcons = {
        student: 'person',
        dozent: 'school',
        verwaltung: 'admin_panel_settings'
    };
    const roleGroupLabels = {
        verwaltung: 'Verwaltung',
        dozent: 'Dozenten',
        student: 'Studierende'
    };
    const groupOrder = ['verwaltung', 'dozent', 'student'];

    const grouped = {};
    for (const user of mockData.users) {
        if (!grouped[user.role]) grouped[user.role] = [];
        grouped[user.role].push(user);
    }

    let html = '';
    for (const role of groupOrder) {
        const users = grouped[role];
        if (!users || users.length === 0) continue;
        html += `<div class="user-switch-group-label">${roleGroupLabels[role]}</div>`;
        html += users.map(user => {
            const isActive = user.id === currentUser.id;
            return `
                <button class="dropdown-item user-switch-item ${isActive ? 'active' : ''}"
                        data-user-id="${user.id}" role="menuitem"
                        ${isActive ? 'aria-current="true"' : ''}>
                    <span class="material-symbols-rounded" aria-hidden="true">${roleIcons[user.role] || 'person'}</span>
                    <span class="user-switch-info">
                        <span class="user-switch-name">${user.name}</span>
                        <span class="user-switch-role">${user.roleLabel}</span>
                    </span>
                    ${isActive ? '<span class="material-symbols-rounded user-switch-check" aria-hidden="true">check</span>' : ''}
                </button>
            `;
        }).join('');
    }

    container.innerHTML = html;

    container.querySelectorAll('.user-switch-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = parseInt(btn.dataset.userId);
            if (userId === currentUser.id) return;
            sessionStorage.setItem('currentUserId', String(userId));
            window.location.reload();
        });
    });
}

export function checkAuth() {
    if (sessionStorage.getItem('isLoggedIn') !== 'true') {
        window.location.replace('login.html');
        return false;
    }
    return true;
}
