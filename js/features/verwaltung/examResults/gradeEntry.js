import { escapeHTML } from '../../../core/utils.js';
import { VALID_GRADES, populateKlausurDropdown } from './index.js';

export function buildGradeEntryTab(data) {
    const seriesOptions = data.eventSeries.map(s =>
        `<option value="${s.id}">${escapeHTML(s.name)}</option>`
    ).join('');

    return `
        <div class="management-tab-content" data-tab="grade-entry">
            <div class="card">
                <div class="card-header mgmt-card-header">
                    <h3>Noten eintragen</h3>
                </div>

                <div class="management-form mgmt-form-section">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="ge-series-select">Veranstaltungsreihe</label>
                            <select id="ge-series-select" class="form-control">
                                <option value="">— Bitte wählen —</option>
                                ${seriesOptions}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="ge-exam-select">Klausur</label>
                            <select id="ge-exam-select" class="form-control" disabled>
                                <option value="">— Bitte wählen —</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div id="ge-alert-area"></div>
                <div id="ge-table-area"></div>
            </div>
        </div>`;
}

export function initGradeEntryTab(container, data) {
    const seriesSelect = container.querySelector('#ge-series-select');
    const examSelect = container.querySelector('#ge-exam-select');
    const tableArea = container.querySelector('#ge-table-area');
    const alertArea = container.querySelector('#ge-alert-area');
    if (!seriesSelect || !examSelect) return;

    seriesSelect.addEventListener('change', () => {
        alertArea.innerHTML = '';
        tableArea.innerHTML = '';
        const seriesId = parseInt(seriesSelect.value);
        populateKlausurDropdown(examSelect, data, seriesId);
    });

    examSelect.addEventListener('change', () => {
        alertArea.innerHTML = '';
        const seriesId = parseInt(seriesSelect.value);
        const eventId = parseInt(examSelect.value);
        if (!seriesId || !eventId) { tableArea.innerHTML = ''; return; }
        renderGradeEntryTable(tableArea, alertArea, data, seriesId, eventId);
    });
}

function renderGradeEntryTable(tableArea, alertArea, data, seriesId, eventId) {
    const series = data.eventSeries.find(s => s.id === seriesId);
    if (!series) return;

    const key = seriesId + '-' + eventId;
    const existingResults = data.examResults[key] || [];

    const students = (series.studentIds || []).map(sid => {
        const user = data.users.find(u => u.id === sid);
        const existing = existingResults.find(r => r.studentId === sid);
        return { user, existingGrade: existing ? existing.grade : '' };
    }).filter(s => s.user);

    if (students.length === 0) {
        tableArea.innerHTML = `
            <div class="management-empty">
                <span class="material-icons-round">people_outline</span>
                <p>Keine Studierenden in dieser Veranstaltungsreihe.</p>
            </div>`;
        return;
    }

    const gradeOptionsHTML = VALID_GRADES.map(g => `<option value="${g}">${g}</option>`).join('');

    tableArea.innerHTML = `
        <table class="management-table">
            <thead>
                <tr>
                    <th scope="col" width="25%">Matrikelnummer</th>
                    <th scope="col" width="35%">Name</th>
                    <th scope="col" width="25%">Note</th>
                </tr>
            </thead>
            <tbody>
                ${students.map(s => `
                    <tr>
                        <td>${escapeHTML(s.user.matriculationNumber || '-')}</td>
                        <td>${escapeHTML(s.user.name)}</td>
                        <td>
                            <select class="form-control ge-grade-input" data-student-id="${s.user.id}">
                                <option value="">—</option>
                                ${VALID_GRADES.map(g =>
                                    `<option value="${g}"${s.existingGrade === g ? ' selected' : ''}>${g}</option>`
                                ).join('')}
                            </select>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div class="mgmt-actions-right">
            <button class="btn btn-primary" id="ge-save-btn">
                <span class="material-icons-round">save</span>
                Eintragen
            </button>
        </div>`;

    const saveBtn = tableArea.querySelector('#ge-save-btn');
    saveBtn.addEventListener('click', () => {
        const key = seriesId + '-' + eventId;
        const gradeInputs = tableArea.querySelectorAll('.ge-grade-input');
        const results = [];

        gradeInputs.forEach(input => {
            const studentId = parseInt(input.dataset.studentId);
            const grade = input.value;
            if (grade) {
                results.push({ studentId, grade });
            }
        });

        data.examResults[key] = results;

        alertArea.innerHTML = `
            <div class="management-alert success">
                <span class="material-icons-round">check_circle</span>
                ${results.length} Note(n) erfolgreich eingetragen.
            </div>`;
    });
}
