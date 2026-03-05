import { escapeHTML } from '../../../core/utils.js';

export function buildOverviewTab(data) {
    const allExams = data.modules
        .filter(m => m.exam && m.exam.date && (m.status === 'active' || m.status === 'registered'))
        .sort((a, b) => a.exam.date.localeCompare(b.exam.date));

    const bookedRooms = new Set(allExams.map(m => m.exam.room).filter(Boolean)).size;

    return `
        <div class="management-tab-content active" data-tab="exam-overview">
            <div class="grid-container stats-row mgmt-stats-row">
                <div class="card stat-card">
                    <div class="stat-icon primary-bg">
                        <span class="material-icons-round">event_note</span>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">Geplante Prüfungen</span>
                        <span class="stat-value">${allExams.length}</span>
                    </div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon warning-bg">
                        <span class="material-icons-round">meeting_room</span>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">Gebuchte Räume</span>
                        <span class="stat-value">${bookedRooms}</span>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header mgmt-card-header">
                    <h3>Prüfungsübersicht</h3>
                </div>
                <div class="exam-results-table-wrapper">
                <table class="management-table">
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
                            else if (e.status === 'upcoming') { statusText = 'In Kürze'; statusClass = 'pending'; }

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
            </div>
        </div>`;
}
