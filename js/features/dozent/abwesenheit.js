import { escapeHTML } from '../../core/utils.js';
import { showConfirmDialog } from '../../core/modal.js';

const ABWESENHEIT_TYPES = ['Urlaub', 'Krankmeldung', 'Dienstreise', 'Sonstiges'];

export function renderDozentAbwesenheit(data, user) {
    const container = document.querySelector('.dozent-absence-content');
    if (!container) return;

    const myAbsences = (data.abwesenheiten || [])
        .filter(a => a.dozentId === user.id)
        .sort((a, b) => a.start.localeCompare(b.start));

    // Admin-readable: show all dozenten absences as well, grouped
    const allAbsences = (data.abwesenheiten || [])
        .slice()
        .sort((a, b) => a.start.localeCompare(b.start));

    const today = new Date().toISOString().slice(0, 10);

    const statusLabel = (a) => {
        if (a.end < today) return { label: 'Vergangen', cls: 'graded' };
        if (a.start <= today && a.end >= today) return { label: 'Aktuell', cls: 'klausur' };
        return { label: 'Geplant', cls: 'lehrveranstaltung' };
    };

    const buildRow = (a) => {
        const s = statusLabel(a);
        return `
            <tr>
                <td><span class="type-badge ${escapeHTML(s.cls)}" style="font-size:0.75rem;">${escapeHTML(s.label)}</span></td>
                <td>${escapeHTML(a.type)}</td>
                <td>${escapeHTML(a.start)}</td>
                <td>${escapeHTML(a.end)}</td>
                <td>${escapeHTML(a.note || '—')}</td>
                <td>
                    <button class="btn-icon-only danger btn-delete-absence" data-absence-id="${a.id}" title="Löschen" type="button">
                        <span class="material-symbols-rounded">delete</span>
                    </button>
                </td>
            </tr>`;
    };

    const myRows = myAbsences.length > 0
        ? myAbsences.map(buildRow).join('')
        : '<tr><td colspan="6" style="text-align:center;color:var(--text-secondary);">Keine Einträge vorhanden.</td></tr>';

    container.innerHTML = `
        <div class="card mgmt-form-section">
            <div class="card-header mgmt-card-header">
                <h3>Neue Abwesenheit eintragen</h3>
            </div>
            <div id="absence-create-alert"></div>
            <div class="inline-create-form" style="flex-wrap:wrap;gap:0.75rem;">
                <div class="form-group" style="min-width:160px;">
                    <label for="absence-type">Art der Abwesenheit</label>
                    <select id="absence-type">
                        ${ABWESENHEIT_TYPES.map(t => `<option value="${escapeHTML(t)}">${escapeHTML(t)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="absence-start">Von</label>
                    <input type="date" id="absence-start" value="${today}">
                </div>
                <div class="form-group">
                    <label for="absence-end">Bis</label>
                    <input type="date" id="absence-end" value="${today}">
                </div>
                <div class="form-group" style="flex:2;min-width:200px;">
                    <label for="absence-note">Anmerkung (optional)</label>
                    <input type="text" id="absence-note" placeholder="z.B. Konferenz Berlin">
                </div>
                <button class="btn btn-sm btn-primary" id="btn-create-absence" type="button" style="align-self:flex-end;">
                    <span class="material-symbols-rounded">add</span> Eintragen
                </button>
            </div>
        </div>

        <div class="card">
            <div class="card-header mgmt-card-header">
                <h3>Meine Abwesenheiten</h3>
            </div>
            <div class="exam-results-table-wrapper">
                <table class="management-table">
                    <thead>
                        <tr>
                            <th>Status</th>
                            <th>Art</th>
                            <th>Von</th>
                            <th>Bis</th>
                            <th>Anmerkung</th>
                            <th>Aktion</th>
                        </tr>
                    </thead>
                    <tbody id="absence-tbody">
                        ${myRows}
                    </tbody>
                </table>
            </div>
        </div>

        ${buildAllDozentAbsences(data, user, allAbsences)}
    `;

    attachAbsenceListeners(container, data, user);
}

function buildAllDozentAbsences(data, user, allAbsences) {
    // Show overview of ALL dozenten absences for planners / self-awareness
    const future = allAbsences.filter(a => a.end >= new Date().toISOString().slice(0, 10));
    if (future.length === 0) return '';

    const rows = future.map(a => {
        const dozent = data.users.find(u => u.id === a.dozentId);
        return `
            <tr>
                <td>${escapeHTML(dozent ? dozent.name : '—')}</td>
                <td>${escapeHTML(a.type)}</td>
                <td>${escapeHTML(a.start)}</td>
                <td>${escapeHTML(a.end)}</td>
                <td>${escapeHTML(a.note || '—')}</td>
            </tr>`;
    }).join('');

    return `
        <div class="card" style="margin-top:1.5rem;">
            <div class="card-header mgmt-card-header">
                <h3>Dozenten-Verfügbarkeit (kommende Abwesenheiten)</h3>
            </div>
            <p class="mgmt-desc-text" style="margin:0.5rem 1rem 0;">
                Für die Planung: alle bekannten zukünftigen Abwesenheiten aller Dozenten.
            </p>
            <div class="exam-results-table-wrapper">
                <table class="management-table">
                    <thead>
                        <tr><th>Dozent</th><th>Art</th><th>Von</th><th>Bis</th><th>Anmerkung</th></tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>`;
}

function attachAbsenceListeners(container, data, user) {
    const btnCreate = container.querySelector('#btn-create-absence');
    if (btnCreate) {
        btnCreate.addEventListener('click', () => {
            const type  = container.querySelector('#absence-type').value;
            const start = container.querySelector('#absence-start').value;
            const end   = container.querySelector('#absence-end').value;
            const note  = container.querySelector('#absence-note').value.trim();
            const alertEl = container.querySelector('#absence-create-alert');

            if (!start || !end) {
                if (alertEl) alertEl.innerHTML = '<div class="management-alert error">Bitte Datumsfelder ausfüllen.</div>';
                return;
            }
            if (start > end) {
                if (alertEl) alertEl.innerHTML = '<div class="management-alert error">Das Startdatum muss vor dem Enddatum liegen.</div>';
                return;
            }
            if (alertEl) alertEl.innerHTML = '';

            const maxId = (data.abwesenheiten || []).reduce((m, a) => Math.max(m, a.id), 0);
            if (!data.abwesenheiten) data.abwesenheiten = [];
            data.abwesenheiten.push({ id: maxId + 1, dozentId: user.id, start, end, type, note });
            renderDozentAbwesenheit(data, user);
        });
    }

    container.querySelectorAll('.btn-delete-absence').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.absenceId, 10);
            const a = (data.abwesenheiten || []).find(x => x.id === id);
            if (!a) return;
            showConfirmDialog('Abwesenheit löschen',
                `Möchten Sie den Eintrag <strong>${escapeHTML(a.type)} (${escapeHTML(a.start)} – ${escapeHTML(a.end)})</strong> wirklich löschen?`,
                () => {
                    data.abwesenheiten = data.abwesenheiten.filter(x => x.id !== id);
                    renderDozentAbwesenheit(data, user);
                });
        });
    });
}
