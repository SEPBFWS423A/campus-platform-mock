import { escapeHTML } from '../../core/utils.js';
import { showModal, closeModal, showConfirmDialog } from '../../core/modal.js';

/**
 * Role label mapping for display in the UI.
 */
const ROLE_LABELS = {
    student: 'Student',
    dozent: 'Dozent',
    verwaltung: 'Mitarbeiter'
};

/**
 * Renders the full user management view for the Verwaltung (admin) role.
 * Includes stats, inline create form, and user table with edit/delete actions.
 * @param {object} data - The central mockData object.
 */
export function renderUserManagement(data) {
    const container = document.querySelector('.admin-users-content');
    if (!container) return;

    const users = data.users;
    const totalCount = users.length;
    const staffCount = users.filter(u => u.role === 'verwaltung' || u.role === 'dozent').length;
    const studentCount = users.filter(u => u.role === 'student').length;

    const sortedUsers = [...users].sort((a, b) =>
        (a.username || '').localeCompare(b.username || '', 'de')
    );

    container.innerHTML = `
        <div class="grid-container stats-row mgmt-stats-row">
            <div class="card stat-card">
                <div class="stat-icon primary-bg">
                    <span class="material-icons-round">group</span>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Benutzer gesamt</span>
                    <span class="stat-value">${totalCount}</span>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon warning-bg">
                    <span class="material-icons-round">badge</span>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Mitarbeiter</span>
                    <span class="stat-value">${staffCount}</span>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon success-bg">
                    <span class="material-icons-round">school</span>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Studierende</span>
                    <span class="stat-value">${studentCount}</span>
                </div>
            </div>
        </div>

        <div class="card mgmt-form-section">
            <div class="card-header mgmt-card-header">
                <h3>Neuen Benutzer anlegen</h3>
            </div>
            <div id="user-create-alert"></div>
            <form id="user-create-form" class="inline-create-form" autocomplete="off">
                <div class="form-group">
                    <label for="create-username">Benutzername</label>
                    <input type="text" id="create-username" placeholder="z.B. maria.muster" required>
                </div>
                <div class="form-group">
                    <label for="create-name">Name</label>
                    <input type="text" id="create-name" placeholder="z.B. Maria Muster">
                </div>
                <div class="form-group">
                    <label for="create-password">Passwort</label>
                    <input type="password" id="create-password" placeholder="Passwort" required>
                </div>
                <div class="form-group">
                    <label for="create-email">E-Mail</label>
                    <input type="email" id="create-email" placeholder="name@university.edu">
                </div>
                <div class="form-group">
                    <label for="create-role">Benutzerart</label>
                    <select id="create-role">
                        <option value="verwaltung">Mitarbeiter</option>
                        <option value="student">Student</option>
                        <option value="dozent">Dozent</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-sm btn-primary">
                    <span class="material-icons-round">add</span>
                    Anlegen
                </button>
            </form>
        </div>

        <div class="card">
            <div class="card-header mgmt-card-header">
                <h3>Benutzerliste</h3>
            </div>
            <div class="user-list-toolbar">
                <div class="user-search-wrapper">
                    <span class="material-icons-round user-search-icon">search</span>
                    <input type="text" id="user-search" class="user-search-input" placeholder="Benutzer suchen\u2026">
                </div>
                <select id="user-role-filter" class="user-role-filter">
                    <option value="">Alle Benutzerarten</option>
                    <option value="verwaltung">Mitarbeiter</option>
                    <option value="dozent">Dozent</option>
                    <option value="student">Student</option>
                </select>
            </div>
            <div class="exam-results-table-wrapper">
                <table class="management-table" id="user-table">
                    <thead>
                        <tr>
                            <th scope="col">Benutzername</th>
                            <th scope="col">Name</th>
                            <th scope="col">E-Mail</th>
                            <th scope="col">Benutzerart</th>
                            <th scope="col">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedUsers.map(u => `
                            <tr data-role="${escapeHTML(u.role)}" data-search="${escapeHTML((u.username + ' ' + (u.name || '') + ' ' + (u.email || '')).toLowerCase())}">
                                <td><strong>${escapeHTML(u.username)}</strong></td>
                                <td>${escapeHTML(u.name || '-')}</td>
                                <td>${escapeHTML(u.email || '-')}</td>
                                <td>
                                    <span class="type-badge ${escapeHTML(u.role)}">
                                        ${escapeHTML(ROLE_LABELS[u.role] || u.role)}
                                    </span>
                                </td>
                                <td>
                                    <div class="actions-cell">
                                        <button class="btn-icon-only" data-edit-user="${u.id}" title="Bearbeiten" type="button">
                                            <span class="material-icons-round">edit</span>
                                        </button>
                                        <button class="btn-icon-only danger" data-delete-user="${u.id}" title="Loeschen" type="button">
                                            <span class="material-icons-round">delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div id="user-no-results" class="management-empty mgmt-hidden">
                <span class="material-icons-round">search_off</span>
                <p>Keine Benutzer gefunden.</p>
            </div>
        </div>
    `;

    // --- Bind: Create User Form ---
    const createForm = container.querySelector('#user-create-form');
    if (createForm) {
        createForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleCreateUser(data);
        });
    }

    // --- Bind: Delete Buttons ---
    container.querySelectorAll('[data-delete-user]').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = parseInt(btn.getAttribute('data-delete-user'));
            handleDeleteUser(data, userId);
        });
    });

    // --- Bind: Edit Buttons ---
    container.querySelectorAll('[data-edit-user]').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = parseInt(btn.getAttribute('data-edit-user'));
            handleEditUser(data, userId);
        });
    });

    // --- Bind: Search + Role Filter ---
    const searchInput = container.querySelector('#user-search');
    const roleFilter = container.querySelector('#user-role-filter');
    const tableBody = container.querySelector('#user-table tbody');
    const noResults = container.querySelector('#user-no-results');

    function applyFilters() {
        const query = searchInput.value.toLowerCase().trim();
        const role = roleFilter.value;
        const rows = tableBody.querySelectorAll('tr');
        let visible = 0;

        rows.forEach(row => {
            const matchesRole = !role || row.dataset.role === role;
            const matchesSearch = !query || row.dataset.search.includes(query);
            const show = matchesRole && matchesSearch;
            row.style.display = show ? '' : 'none';
            if (show) visible++;
        });

        noResults.classList.toggle('mgmt-hidden', visible !== 0);
    }

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (roleFilter) roleFilter.addEventListener('change', applyFilters);
}

/**
 * Shows an alert message inside the create form area.
 * @param {string} message - The message text.
 * @param {'error'|'success'} type - Alert type.
 */
function showCreateAlert(message, type) {
    const alertEl = document.getElementById('user-create-alert');
    if (!alertEl) return;
    const icon = type === 'error' ? 'error_outline' : 'check_circle';
    alertEl.innerHTML = `
        <div class="management-alert ${type}">
            <span class="material-icons-round" style="font-size: 1.1rem;">${icon}</span>
            ${escapeHTML(message)}
        </div>
    `;
    // Auto-clear success messages after a few seconds
    if (type === 'success') {
        setTimeout(() => { alertEl.innerHTML = ''; }, 3000);
    }
}

/**
 * Validates and creates a new user from the inline form (US3/US7).
 * @param {object} data - The central mockData object.
 */
function handleCreateUser(data) {
    const username = document.getElementById('create-username').value.trim();
    const name = document.getElementById('create-name').value.trim();
    const password = document.getElementById('create-password').value;
    const email = document.getElementById('create-email').value.trim();
    const role = document.getElementById('create-role').value;

    // Validate: username not empty
    if (!username) {
        showCreateAlert('Benutzername darf nicht leer sein.', 'error');
        return;
    }

    // Validate: username not duplicate
    const duplicate = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (duplicate) {
        showCreateAlert('Dieser Benutzername ist bereits vergeben.', 'error');
        return;
    }

    // Validate: password not empty
    if (!password) {
        showCreateAlert('Passwort darf nicht leer sein.', 'error');
        return;
    }

    // Validate: email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showCreateAlert('Bitte geben Sie eine gueltige E-Mail-Adresse ein.', 'error');
        return;
    }

    // For students: name must not be empty
    if (role === 'student' && !name) {
        showCreateAlert('Fuer Studierende muss ein Name angegeben werden.', 'error');
        return;
    }

    // Compute next available ID
    const maxId = data.users.reduce((max, u) => Math.max(max, u.id), 0);
    const newUser = {
        id: maxId + 1,
        username: username,
        password: password,
        name: name,
        role: role,
        roleLabel: ROLE_LABELS[role] || role,
        email: email
    };

    data.users.push(newUser);

    showCreateAlert(`Benutzer "${username}" wurde erfolgreich angelegt.`, 'success');

    // Re-render
    renderUserManagement(data);
}

/**
 * Handles deletion of a user with confirmation dialog (US6).
 * @param {object} data - The central mockData object.
 * @param {number} userId - The ID of the user to delete.
 */
function handleDeleteUser(data, userId) {
    const user = data.users.find(u => u.id === userId);
    if (!user) return;

    showConfirmDialog(
        'Benutzer loeschen',
        `Moechten Sie den Benutzer <strong>${escapeHTML(user.username)}</strong> (${escapeHTML(user.name || '-')}) wirklich loeschen? Diese Aktion kann nicht rueckgaengig gemacht werden.`,
        () => {
            // Remove user from data
            data.users = data.users.filter(u => u.id !== userId);

            // If the deleted user is the currently logged-in user, log out
            if (typeof getCurrentUser === 'function') {
                const currentUser = getCurrentUser();
                if (currentUser && currentUser.id === userId) {
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                    return;
                }
            }

            // Re-render
            renderUserManagement(data);
        }
    );
}

/**
 * Opens a modal to edit a user's details.
 * For students, includes event series assignment management (US14/US15).
 * @param {object} data - The central mockData object.
 * @param {number} userId - The ID of the user to edit.
 */
function handleEditUser(data, userId) {
    const user = data.users.find(u => u.id === userId);
    if (!user) return;

    // Build assigned event series chips for students
    let eventSeriesSection = '';
    if (user.role === 'student' && Array.isArray(data.eventSeries)) {
        const assignedSeries = data.eventSeries.filter(
            es => Array.isArray(es.studentIds) && es.studentIds.includes(userId)
        );
        const unassignedSeries = data.eventSeries.filter(
            es => !Array.isArray(es.studentIds) || !es.studentIds.includes(userId)
        );

        eventSeriesSection = `
            <div class="form-group" style="margin-top: 1rem;">
                <label>Zugewiesene Veranstaltungsreihen</label>
                <div id="edit-assigned-series" class="student-chips" style="margin-bottom: 0.5rem;">
                    ${assignedSeries.length > 0 ? assignedSeries.map(es => `
                        <span class="student-chip" data-series-id="${es.id}">
                            ${escapeHTML(es.name)}
                            <button type="button" class="remove-chip" data-remove-series="${es.id}" title="Entfernen">
                                <span class="material-icons-round" style="font-size: 0.875rem;">close</span>
                            </button>
                        </span>
                    `).join('') : '<span style="font-size: 0.8rem; color: var(--text-tertiary);">Keine Zuweisungen</span>'}
                </div>
                ${unassignedSeries.length > 0 ? `
                    <div style="display: flex; gap: 0.5rem; align-items: flex-end; margin-top: 0.5rem;">
                        <select id="edit-add-series" style="flex: 1;">
                            <option value="">Veranstaltungsreihe hinzufuegen...</option>
                            ${unassignedSeries.map(es => `
                                <option value="${es.id}">${escapeHTML(es.name)}</option>
                            `).join('')}
                        </select>
                        <button type="button" id="edit-add-series-btn" class="btn btn-sm btn-outline">
                            <span class="material-icons-round" style="font-size: 1rem;">add</span>
                            Hinzufuegen
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    const bodyHTML = `
        <form id="edit-user-form" class="management-form" autocomplete="off">
            <div id="edit-user-alert"></div>
            <div class="form-group">
                <label for="edit-username">Benutzername</label>
                <input type="text" id="edit-username" value="${escapeHTML(user.username)}" disabled
                    style="opacity: 0.6; cursor: not-allowed;">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="edit-name">Name</label>
                    <input type="text" id="edit-name" value="${escapeHTML(user.name || '')}">
                </div>
                <div class="form-group">
                    <label for="edit-email">E-Mail</label>
                    <input type="email" id="edit-email" value="${escapeHTML(user.email || '')}">
                </div>
            </div>
            <div class="form-group">
                <label>Benutzerart</label>
                <span class="type-badge ${escapeHTML(user.role)}" style="margin-top: 0.25rem;">
                    ${escapeHTML(ROLE_LABELS[user.role] || user.role)}
                </span>
            </div>
            ${eventSeriesSection}
        </form>
    `;

    const footerHTML = `
        <button class="btn btn-outline modal-cancel-btn" type="button">Abbrechen</button>
        <button class="btn btn-sm" type="button" id="edit-user-save-btn">
            <span class="material-icons-round" style="font-size: 1rem;">save</span>
            Speichern
        </button>
    `;

    showModal('Benutzer bearbeiten', bodyHTML, footerHTML);

    // --- Bind: Cancel ---
    const overlay = document.getElementById('modal-overlay');
    const cancelBtn = overlay.querySelector('.modal-cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => closeModal(), { once: true });
    }

    // --- Bind: Save ---
    const saveBtn = document.getElementById('edit-user-save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const newName = document.getElementById('edit-name').value.trim();
            const newEmail = document.getElementById('edit-email').value.trim();

            // Validate email format if provided
            if (newEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
                showEditAlert('Bitte geben Sie eine gueltige E-Mail-Adresse ein.', 'error');
                return;
            }

            user.name = newName;
            user.email = newEmail;

            closeModal();
            renderUserManagement(data);
        }, { once: true });
    }

    // --- Bind: Remove series chip (US15) ---
    if (user.role === 'student') {
        overlay.querySelectorAll('[data-remove-series]').forEach(btn => {
            btn.addEventListener('click', () => {
                const seriesId = parseInt(btn.getAttribute('data-remove-series'));
                const series = data.eventSeries.find(es => es.id === seriesId);
                if (series && Array.isArray(series.studentIds)) {
                    series.studentIds = series.studentIds.filter(id => id !== userId);
                }
                // Re-open the edit modal to reflect updated state
                closeModal();
                handleEditUser(data, userId);
            }, { once: true });
        });

        // --- Bind: Add series (US14) ---
        const addSeriesBtn = document.getElementById('edit-add-series-btn');
        if (addSeriesBtn) {
            addSeriesBtn.addEventListener('click', () => {
                const selectEl = document.getElementById('edit-add-series');
                const seriesId = parseInt(selectEl.value);
                if (!seriesId) return;

                const series = data.eventSeries.find(es => es.id === seriesId);
                if (series) {
                    if (!Array.isArray(series.studentIds)) {
                        series.studentIds = [];
                    }
                    if (!series.studentIds.includes(userId)) {
                        series.studentIds.push(userId);
                    }
                }
                // Re-open the edit modal to reflect updated state
                closeModal();
                handleEditUser(data, userId);
            });
        }
    }
}

/**
 * Shows an alert message inside the edit modal.
 * @param {string} message - The message text.
 * @param {'error'|'success'} type - Alert type.
 */
function showEditAlert(message, type) {
    const alertEl = document.getElementById('edit-user-alert');
    if (!alertEl) return;
    const icon = type === 'error' ? 'error_outline' : 'check_circle';
    alertEl.innerHTML = `
        <div class="management-alert ${type}">
            <span class="material-icons-round" style="font-size: 1.1rem;">${icon}</span>
            ${escapeHTML(message)}
        </div>
    `;
}
