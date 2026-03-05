import { escapeHTML } from '../../core/utils.js';

/**
 * Renders the Verwaltung's student management view (basic placeholder).
 */
export function renderAdminStudents(data) {
    const container = document.querySelector('.admin-students-content');
    if (!container) return;

    const students = data.users.filter(u => u.role === 'student');
    const totalModules = data.modules.length;
    const passedModules = data.modules.filter(m => m.status === 'passed').length;

    container.innerHTML = `
        <div class="grid-container stats-row" style="margin-bottom: 1.5rem;">
            <div class="card stat-card">
                <div class="stat-icon primary-bg">
                    <span class="material-icons-round">people</span>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Eingeschriebene Studierende</span>
                    <span class="stat-value">${students.length}</span>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon success-bg">
                    <span class="material-icons-round">school</span>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Module gesamt</span>
                    <span class="stat-value">${totalModules}</span>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon warning-bg">
                    <span class="material-icons-round">check_circle</span>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Bestandene Pr\u00fcfungen</span>
                    <span class="stat-value">${passedModules}</span>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header" style="margin-bottom: 1rem;">
                <h3>Studierendenliste</h3>
            </div>
            <table class="data-table grades-table">
                <thead>
                    <tr>
                        <th scope="col" width="25%">Name</th>
                        <th scope="col" width="20%">Matrikelnr.</th>
                        <th scope="col" width="25%">Studiengang</th>
                        <th scope="col" width="15%">Semester</th>
                        <th scope="col" width="15%">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${students.map(s => `
                        <tr>
                            <td>
                                <div class="module-cell">
                                    <span class="module-name">${escapeHTML(s.name)}</span>
                                    <span class="module-code">${escapeHTML(s.email)}</span>
                                </div>
                            </td>
                            <td>${escapeHTML(s.matriculationNumber || '-')}</td>
                            <td>${escapeHTML(s.courseOfStudy || '-')}</td>
                            <td>${s.semester ? s.semester + '. Semester' : '-'}</td>
                            <td>
                                <div class="status-indicator passed">
                                    <span class="status-dot"></span> Aktiv
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Renders the Verwaltung's exam management view (basic placeholder).
 */
export function renderAdminExams(data) {
    const container = document.querySelector('.admin-exams-content');
    if (!container) return;

    const allExams = data.modules
        .filter(m => m.exam && m.exam.date && (m.status === 'active' || m.status === 'registered'))
        .sort((a, b) => a.exam.date.localeCompare(b.exam.date));

    container.innerHTML = `
        <div class="grid-container stats-row" style="margin-bottom: 1.5rem;">
            <div class="card stat-card">
                <div class="stat-icon primary-bg">
                    <span class="material-icons-round">event_note</span>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Geplante Pr\u00fcfungen</span>
                    <span class="stat-value">${allExams.length}</span>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon warning-bg">
                    <span class="material-icons-round">meeting_room</span>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Gebuchte R\u00e4ume</span>
                    <span class="stat-value">${new Set(allExams.map(m => m.exam.room).filter(Boolean)).size}</span>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header" style="margin-bottom: 1rem;">
                <h3>Pr\u00fcfungs\u00fcbersicht</h3>
            </div>
            <table class="data-table grades-table">
                <thead>
                    <tr>
                        <th scope="col" width="25%">Modul</th>
                        <th scope="col" width="15%">Datum</th>
                        <th scope="col" width="15%">Uhrzeit</th>
                        <th scope="col" width="15%">Raum</th>
                        <th scope="col" width="15%">Typ</th>
                        <th scope="col" width="15%">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${allExams.map(m => {
                        const e = m.exam;
                        let statusText = 'Geplant';
                        let statusClass = 'pending';
                        if (e.status === 'registered') { statusText = 'Anmeldungen offen'; statusClass = 'passed'; }
                        else if (e.status === 'open') { statusText = 'Anmeldung offen'; statusClass = 'pending'; }
                        else if (e.status === 'upcoming') { statusText = 'In K\u00fcrze'; statusClass = 'pending'; }

                        return `
                            <tr>
                                <td>
                                    <div class="module-cell">
                                        <span class="module-code">${escapeHTML(m.code)}</span>
                                        <span class="module-name">${escapeHTML(m.name)}</span>
                                    </div>
                                </td>
                                <td>${escapeHTML(e.date)}</td>
                                <td>${escapeHTML(e.time || 'TBA')}</td>
                                <td>${escapeHTML(e.room || 'TBA')}</td>
                                <td>${escapeHTML(e.type || 'Klausur')}</td>
                                <td>
                                    <div class="status-indicator ${statusClass}">
                                        <span class="status-dot"></span> ${statusText}
                                    </div>
                                </td>
                            </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}
