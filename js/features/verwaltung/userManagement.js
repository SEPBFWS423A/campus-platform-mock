import { escapeHTML } from '../../core/utils.js';
import { showModal, closeModal, showConfirmDialog } from '../../core/modal.js';
import { initTabs } from '../shared/tabSwitching.js';

const ROLE_LABELS = {
    student: 'Student',
    dozent: 'Dozent',
    verwaltung: 'Mitarbeiter'
};

const ABWESENHEIT_TYPES = ['Urlaub', 'Krankmeldung', 'Dienstreise', 'Sonstiges'];

export function renderUserManagement(data) {
    const container = document.querySelector('.admin-users-content');
    if (!container) return;

    const users = data.users;
    const totalCount = users.length;
    const staffCount = users.filter(u => u.role === 'verwaltung' || u.role === 'dozent').length;
    const studentCount = users.filter(u => u.role === 'student').length;

    container.innerHTML = `
        <div class="grid-container stats-row mgmt-stats-row">
            <div class="card stat-card">
                <div class="stat-icon primary-bg">
                    <span class="material-symbols-rounded">group</span>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Benutzer gesamt</span>
                    <span class="stat-value">${totalCount}</span>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon warning-bg">
                    <span class="material-symbols-rounded">badge</span>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Mitarbeiter</span>
                    <span class="stat-value">${staffCount}</span>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon success-bg">
                    <span class="material-symbols-rounded">school</span>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Studierende</span>
                    <span class="stat-value">${studentCount}</span>
                </div>
            </div>
        </div>

        <div class="management-tabs">
            <button class="management-tab active" data-tab="user-list-panel">
                <span class="material-symbols-rounded">manage_accounts</span> Benutzer
            </button>
            <button class="management-tab" data-tab="studiengruppen-panel">
                <span class="material-symbols-rounded">groups</span> Studiengruppen
            </button>
        </div>

        <div id="user-list-panel" class="management-tab-content active">
            ${buildUserPanel(data)}
        </div>

        <div id="studiengruppen-panel" class="management-tab-content">
            ${buildStudiengruppenPanel(data)}
        </div>
    `;

    initTabs(container, { tabSelector: '.management-tab', panelSelector: '.management-tab-content' });

    attachUserPanelListeners(container, data);
    attachStudiengruppenListeners(container, data);
}

// ─── Benutzer-Panel ──────────────────────────────────────────────────────────

function buildUserPanel(data) {
    const sortedUsers = [...data.users].sort((a, b) =>
        (a.username || '').localeCompare(b.username || '', 'de')
    );

    return `
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
                    <span class="material-symbols-rounded">add</span>
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
                    <span class="material-symbols-rounded user-search-icon">search</span>
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
                                            <span class="material-symbols-rounded">edit</span>
                                        </button>
                                        <button class="btn-icon-only danger" data-delete-user="${u.id}" title="Löschen" type="button">
                                            <span class="material-symbols-rounded">delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div id="user-no-results" class="management-empty mgmt-hidden">
                <span class="material-symbols-rounded">search_off</span>
                <p>Keine Benutzer gefunden.</p>
            </div>
        </div>
    `;
}

function attachUserPanelListeners(container, data) {
    const createForm = container.querySelector('#user-create-form');
    if (createForm) {
        createForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleCreateUser(data);
        });
    }

    container.querySelectorAll('[data-delete-user]').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = parseInt(btn.getAttribute('data-delete-user'));
            handleDeleteUser(data, userId);
        });
    });

    container.querySelectorAll('[data-edit-user]').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = parseInt(btn.getAttribute('data-edit-user'));
            handleEditUser(data, userId);
        });
    });

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

// ─── Studiengruppen-Panel ────────────────────────────────────────────────────

function buildStudiengruppenPanel(data) {
    const gruppen = data.studiengruppen || [];
    const allStudents = data.users.filter(u => u.role === 'student');

    const cardsHTML = gruppen.map(g => {
        const members = allStudents.filter(s => g.studentIds.includes(s.id));
        return `
            <div class="series-card card" data-gruppe-id="${g.id}">
                <div class="series-card-header">
                    <div>
                        <div class="series-card-title">${escapeHTML(g.name)}</div>
                        <div class="series-card-subtitle">
                            <span class="material-symbols-rounded">school</span>
                            ${members.length} Studierende
                        </div>
                    </div>
                    <div class="series-card-actions">
                        <button class="btn btn-sm btn-outline btn-edit-gruppe" data-gruppe-id="${g.id}" type="button">
                            <span class="material-symbols-rounded">edit</span> Bearbeiten
                        </button>
                        <button class="btn btn-sm btn-danger btn-delete-gruppe" data-gruppe-id="${g.id}" type="button">
                            <span class="material-symbols-rounded">delete</span> Löschen
                        </button>
                    </div>
                </div>
                <div class="series-card-members">
                    ${members.length > 0
                        ? members.map(s => `<span class="student-chip">${escapeHTML(s.name)}</span>`).join('')
                        : '<span class="series-card-empty">Keine Mitglieder</span>'
                    }
                </div>
            </div>`;
    }).join('');

    return `
        <div class="card mgmt-form-section">
            <div class="card-header mgmt-card-header">
                <h3>Neue Studiengruppe anlegen</h3>
            </div>
            <div id="gruppe-create-alert"></div>
            <div class="inline-create-form">
                <div class="form-group" style="flex:2;min-width:180px;">
                    <label for="create-gruppe-name">Name der Studiengruppe</label>
                    <input type="text" id="create-gruppe-name" placeholder="z.B. WIN-2025A">
                </div>
                <button class="btn btn-sm btn-primary" id="btn-create-gruppe" type="button" style="align-self:flex-end;">
                    <span class="material-symbols-rounded">add</span> Anlegen
                </button>
            </div>
        </div>

        <div class="series-cards-grid">
            ${cardsHTML || '<div class="management-empty"><span class="material-symbols-rounded">groups</span><p>Keine Studiengruppen vorhanden.</p></div>'}
        </div>
    `;
}

function attachStudiengruppenListeners(container, data) {
    const btnCreate = container.querySelector('#btn-create-gruppe');
    const inputName = container.querySelector('#create-gruppe-name');

    if (btnCreate && inputName) {
        btnCreate.addEventListener('click', () => {
            const name = inputName.value.trim();
            if (!name) return;
            const maxId = (data.studiengruppen || []).reduce((m, g) => Math.max(m, g.id), 0);
            if (!data.studiengruppen) data.studiengruppen = [];
            data.studiengruppen.push({ id: maxId + 1, name, studentIds: [] });
            renderUserManagement(data);
        });
        inputName.addEventListener('keydown', e => { if (e.key === 'Enter') btnCreate.click(); });
    }

    container.querySelectorAll('.btn-delete-gruppe').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.gruppeId, 10);
            const g = (data.studiengruppen || []).find(x => x.id === id);
            if (!g) return;
            showConfirmDialog(
                'Studiengruppe löschen',
                `Möchten Sie die Studiengruppe <strong>${escapeHTML(g.name)}</strong> wirklich löschen?`,
                () => {
                    data.studiengruppen = data.studiengruppen.filter(x => x.id !== id);
                    renderUserManagement(data);
                }
            );
        });
    });

    container.querySelectorAll('.btn-edit-gruppe').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.gruppeId, 10);
            handleEditGruppe(data, id);
        });
    });
}

function handleEditGruppe(data, gruppeId) {
    const gruppe = (data.studiengruppen || []).find(g => g.id === gruppeId);
    if (!gruppe) return;

    const allStudents = data.users.filter(u => u.role === 'student');
    const members = allStudents.filter(s => gruppe.studentIds.includes(s.id));
    const available = allStudents.filter(s => !gruppe.studentIds.includes(s.id));

    const chipsHTML = members.length > 0
        ? members.map(s => `
            <span class="student-chip" data-student-id="${s.id}">
                ${escapeHTML(s.name)}
                <button class="btn-icon-only btn-remove-sg-member" data-student-id="${s.id}" type="button" title="Entfernen">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </span>`).join('')
        : '<span style="color:var(--text-secondary);font-size:0.875rem;">Keine Mitglieder</span>';

    const bodyHTML = `
        <div style="margin-bottom: 1rem;">
            <div class="form-group">
                <label>Name der Studiengruppe</label>
                <input type="text" id="edit-gruppe-name" class="form-input" value="${escapeHTML(gruppe.name)}">
            </div>
        </div>
        <h4 class="modal-section-heading">
            <span class="material-symbols-rounded">school</span> Mitglieder
        </h4>
        <div class="student-chips" id="sg-member-chips">${chipsHTML}</div>
        ${available.length > 0 ? `
            <div style="display:flex;gap:0.5rem;margin-top:0.75rem;align-items:center;flex-wrap:wrap;">
                <select id="sg-add-student-select" class="form-input" style="flex:1;min-width:180px;">
                    <option value="">-- Studierenden auswählen --</option>
                    ${available.map(s => `<option value="${s.id}">${escapeHTML(s.name)}</option>`).join('')}
                </select>
                <button class="btn btn-sm btn-primary" id="sg-btn-add-student" type="button">
                    <span class="material-symbols-rounded">person_add</span> Hinzufügen
                </button>
            </div>` : ''}
    `;

    const footerHTML = `
        <button class="btn btn-outline modal-cancel-btn" type="button">Abbrechen</button>
        <button class="btn btn-sm" id="sg-save-btn" type="button">
            <span class="material-symbols-rounded">save</span> Speichern
        </button>
    `;

    showModal(`Studiengruppe: ${escapeHTML(gruppe.name)}`, bodyHTML, footerHTML);

    const overlay = document.getElementById('modal-overlay');

    overlay.querySelector('.modal-cancel-btn')?.addEventListener('click', () => closeModal(), { once: true });

    overlay.querySelector('#sg-save-btn')?.addEventListener('click', () => {
        const newName = document.getElementById('edit-gruppe-name').value.trim();
        if (newName) gruppe.name = newName;
        closeModal();
        renderUserManagement(data);
    }, { once: true });

    overlay.querySelectorAll('.btn-remove-sg-member').forEach(btn => {
        btn.addEventListener('click', () => {
            const sId = parseInt(btn.dataset.studentId, 10);
            gruppe.studentIds = gruppe.studentIds.filter(id => id !== sId);
            closeModal();
            handleEditGruppe(data, gruppeId);
        }, { once: true });
    });

    const addBtn = overlay.querySelector('#sg-btn-add-student');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            const sId = parseInt(document.getElementById('sg-add-student-select').value, 10);
            if (!sId) return;
            if (!gruppe.studentIds.includes(sId)) gruppe.studentIds.push(sId);
            closeModal();
            handleEditGruppe(data, gruppeId);
        });
    }
}

// ─── Create User ─────────────────────────────────────────────────────────────

function showCreateAlert(message, type) {
    const alertEl = document.getElementById('user-create-alert');
    if (!alertEl) return;
    const icon = type === 'error' ? 'error_outline' : 'check_circle';
    alertEl.innerHTML = `
        <div class="management-alert ${type}">
            <span class="material-symbols-rounded" style="font-size: 1.1rem;">${icon}</span>
            ${escapeHTML(message)}
        </div>
    `;
    if (type === 'success') {
        setTimeout(() => { alertEl.innerHTML = ''; }, 3000);
    }
}

function handleCreateUser(data) {
    const username = document.getElementById('create-username').value.trim();
    const name = document.getElementById('create-name').value.trim();
    const password = document.getElementById('create-password').value;
    const email = document.getElementById('create-email').value.trim();
    const role = document.getElementById('create-role').value;

    if (!username) { showCreateAlert('Benutzername darf nicht leer sein.', 'error'); return; }
    if (data.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        showCreateAlert('Dieser Benutzername ist bereits vergeben.', 'error'); return;
    }
    if (!password) { showCreateAlert('Passwort darf nicht leer sein.', 'error'); return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showCreateAlert('Bitte geben Sie eine gültige E-Mail-Adresse ein.', 'error'); return;
    }
    if (role === 'student' && !name) {
        showCreateAlert('Für Studierende muss ein Name angegeben werden.', 'error'); return;
    }

    const maxId = data.users.reduce((max, u) => Math.max(max, u.id), 0);
    data.users.push({ id: maxId + 1, username, password, name, role, roleLabel: ROLE_LABELS[role] || role, email });
    showCreateAlert(`Benutzer "${username}" wurde erfolgreich angelegt.`, 'success');
    renderUserManagement(data);
}

function handleDeleteUser(data, userId) {
    const user = data.users.find(u => u.id === userId);
    if (!user) return;
    showConfirmDialog(
        'Benutzer löschen',
        `Möchten Sie den Benutzer <strong>${escapeHTML(user.username)}</strong> (${escapeHTML(user.name || '-')}) wirklich löschen?`,
        () => {
            data.users = data.users.filter(u => u.id !== userId);
            if (typeof getCurrentUser === 'function') {
                const currentUser = getCurrentUser();
                if (currentUser && currentUser.id === userId) {
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                    return;
                }
            }
            renderUserManagement(data);
        }
    );
}

// ─── Edit User ───────────────────────────────────────────────────────────────

function handleEditUser(data, userId) {
    const user = data.users.find(u => u.id === userId);
    if (!user) return;

    let eventSeriesSection = '';
    if (user.role === 'student' && Array.isArray(data.eventSeries)) {
        const assignedSeries = data.eventSeries.filter(es => Array.isArray(es.studentIds) && es.studentIds.includes(userId));
        const unassignedSeries = data.eventSeries.filter(es => !Array.isArray(es.studentIds) || !es.studentIds.includes(userId));

        eventSeriesSection = `
            <div class="form-group" style="margin-top: 1rem;">
                <label>Zugewiesene Veranstaltungsreihen</label>
                <div id="edit-assigned-series" class="student-chips" style="margin-bottom: 0.5rem;">
                    ${assignedSeries.length > 0 ? assignedSeries.map(es => `
                        <span class="student-chip" data-series-id="${es.id}">
                            ${escapeHTML(es.name)}
                            <button type="button" class="remove-chip" data-remove-series="${es.id}" title="Entfernen">
                                <span class="material-symbols-rounded" style="font-size: 0.875rem;">close</span>
                            </button>
                        </span>
                    `).join('') : '<span style="font-size: 0.8rem; color: var(--text-tertiary);">Keine Zuweisungen</span>'}
                </div>
                ${unassignedSeries.length > 0 ? `
                    <div style="display: flex; gap: 0.5rem; align-items: flex-end; margin-top: 0.5rem;">
                        <select id="edit-add-series" style="flex: 1;">
                            <option value="">Veranstaltungsreihe hinzufügen...</option>
                            ${unassignedSeries.map(es => `<option value="${es.id}">${escapeHTML(es.name)}</option>`).join('')}
                        </select>
                        <button type="button" id="edit-add-series-btn" class="btn btn-sm btn-outline">
                            <span class="material-symbols-rounded" style="font-size: 1rem;">add</span>
                            Hinzufügen
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
                <label for="edit-role">Benutzerart</label>
                <select id="edit-role">
                    <option value="verwaltung" ${user.role === 'verwaltung' ? 'selected' : ''}>Mitarbeiter</option>
                    <option value="student"    ${user.role === 'student'    ? 'selected' : ''}>Student</option>
                    <option value="dozent"     ${user.role === 'dozent'     ? 'selected' : ''}>Dozent</option>
                </select>
            </div>
            ${eventSeriesSection}
        </form>
    `;

    const footerHTML = `
        <button class="btn btn-outline modal-cancel-btn" type="button">Abbrechen</button>
        <button class="btn btn-sm" type="button" id="edit-user-save-btn">
            <span class="material-symbols-rounded" style="font-size: 1rem;">save</span>
            Speichern
        </button>
    `;

    showModal('Benutzer bearbeiten', bodyHTML, footerHTML);

    const overlay = document.getElementById('modal-overlay');
    overlay.querySelector('.modal-cancel-btn')?.addEventListener('click', () => closeModal(), { once: true });

    document.getElementById('edit-user-save-btn')?.addEventListener('click', () => {
        const newName = document.getElementById('edit-name').value.trim();
        const newEmail = document.getElementById('edit-email').value.trim();
        const newRole = document.getElementById('edit-role').value;

        if (newEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
            showEditAlert('Bitte geben Sie eine gültige E-Mail-Adresse ein.', 'error');
            return;
        }

        user.name = newName;
        user.email = newEmail;
        user.role = newRole;
        user.roleLabel = ROLE_LABELS[newRole] || newRole;

        closeModal();
        renderUserManagement(data);
    }, { once: true });

    if (user.role === 'student') {
        overlay.querySelectorAll('[data-remove-series]').forEach(btn => {
            btn.addEventListener('click', () => {
                const seriesId = parseInt(btn.getAttribute('data-remove-series'));
                const series = data.eventSeries.find(es => es.id === seriesId);
                if (series && Array.isArray(series.studentIds)) {
                    series.studentIds = series.studentIds.filter(id => id !== userId);
                }
                closeModal();
                handleEditUser(data, userId);
            }, { once: true });
        });

        const addSeriesBtn = document.getElementById('edit-add-series-btn');
        if (addSeriesBtn) {
            addSeriesBtn.addEventListener('click', () => {
                const selectEl = document.getElementById('edit-add-series');
                const seriesId = parseInt(selectEl.value);
                if (!seriesId) return;
                const series = data.eventSeries.find(es => es.id === seriesId);
                if (series) {
                    if (!Array.isArray(series.studentIds)) series.studentIds = [];
                    if (!series.studentIds.includes(userId)) series.studentIds.push(userId);
                }
                closeModal();
                handleEditUser(data, userId);
            });
        }
    }
}

function showEditAlert(message, type) {
    const alertEl = document.getElementById('edit-user-alert');
    if (!alertEl) return;
    const icon = type === 'error' ? 'error_outline' : 'check_circle';
    alertEl.innerHTML = `
        <div class="management-alert ${type}">
            <span class="material-symbols-rounded" style="font-size: 1.1rem;">${icon}</span>
            ${escapeHTML(message)}
        </div>
    `;
}

// keep for potential external use
export { ABWESENHEIT_TYPES };
