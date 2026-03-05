import { escapeHTML } from './utils.js';

// Valid German grade scale
const VALID_GRADES = ['1.0', '1.3', '1.7', '2.0', '2.3', '2.7', '3.0', '3.3', '3.7', '4.0', '5.0'];

/**
 * Renders the exam results management view for the "verwaltung" role.
 * Contains four sub-tabs: Pruefungsuebersicht, Noten eintragen,
 * Notenverteilung, and CSV-Import.
 */
export function renderExamResultsManagement(data) {
    const container = document.querySelector('.admin-exams-content');
    if (!container) return;

    container.innerHTML = buildTabs() + buildTabContents(data);
    initTabSwitching(container);
    initGradeEntryTab(container, data);
    initGradeDistributionTab(container, data);
    initCsvImportTab(container, data);
}

// =============================================================================
// Tabs Chrome
// =============================================================================

function buildTabs() {
    return `
        <div class="management-tabs">
            <button class="management-tab active" data-tab="exam-overview">
                <span class="material-icons-round">event_note</span>
                Prüfungsübersicht
            </button>
            <button class="management-tab" data-tab="grade-entry">
                <span class="material-icons-round">edit_note</span>
                Noten eintragen
            </button>
            <button class="management-tab" data-tab="grade-distribution">
                <span class="material-icons-round">bar_chart</span>
                Notenverteilung
            </button>
            <button class="management-tab" data-tab="csv-import">
                <span class="material-icons-round">upload_file</span>
                CSV-Import
            </button>
        </div>`;
}

function initTabSwitching(container) {
    const tabs = container.querySelectorAll('.management-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            container.querySelectorAll('.management-tab-content').forEach(panel => {
                panel.classList.remove('active');
            });
            const target = container.querySelector(`.management-tab-content[data-tab="${tab.dataset.tab}"]`);
            if (target) target.classList.add('active');
        });
    });
}

// =============================================================================
// Tab Contents Builder
// =============================================================================

function buildTabContents(data) {
    return `
        ${buildOverviewTab(data)}
        ${buildGradeEntryTab(data)}
        ${buildGradeDistributionTab(data)}
        ${buildCsvImportTab(data)}
    `;
}

// =============================================================================
// Tab 1 – Prüfungsübersicht
// =============================================================================

function buildOverviewTab(data) {
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

// =============================================================================
// Tab 2 – Noten eintragen (US26)
// =============================================================================

function buildGradeEntryTab(data) {
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

function initGradeEntryTab(container, data) {
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

// =============================================================================
// Tab 3 – Notenverteilung (US28)
// =============================================================================

function buildGradeDistributionTab(data) {
    const seriesOptions = data.eventSeries.map(s =>
        `<option value="${s.id}">${escapeHTML(s.name)}</option>`
    ).join('');

    return `
        <div class="management-tab-content" data-tab="grade-distribution">
            <div class="card">
                <div class="card-header mgmt-card-header">
                    <h3>Notenverteilung</h3>
                </div>

                <div class="management-form mgmt-form-section">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="gd-series-select">Veranstaltungsreihe</label>
                            <select id="gd-series-select" class="form-control">
                                <option value="">— Bitte wählen —</option>
                                ${seriesOptions}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="gd-exam-select">Klausur</label>
                            <select id="gd-exam-select" class="form-control" disabled>
                                <option value="">— Bitte wählen —</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div id="gd-chart-area"></div>
            </div>
        </div>`;
}

function initGradeDistributionTab(container, data) {
    const seriesSelect = container.querySelector('#gd-series-select');
    const examSelect = container.querySelector('#gd-exam-select');
    const chartArea = container.querySelector('#gd-chart-area');
    if (!seriesSelect || !examSelect) return;

    seriesSelect.addEventListener('change', () => {
        chartArea.innerHTML = '';
        const seriesId = parseInt(seriesSelect.value);
        populateKlausurDropdown(examSelect, data, seriesId);
    });

    examSelect.addEventListener('change', () => {
        const seriesId = parseInt(seriesSelect.value);
        const eventId = parseInt(examSelect.value);
        if (!seriesId || !eventId) { chartArea.innerHTML = ''; return; }
        renderGradeDistributionChart(chartArea, data, seriesId, eventId);
    });
}

function renderGradeDistributionChart(chartArea, data, seriesId, eventId) {
    const key = seriesId + '-' + eventId;
    const results = data.examResults[key] || [];

    if (results.length === 0) {
        chartArea.innerHTML = `
            <div class="management-empty">
                <span class="material-icons-round">bar_chart</span>
                <p>Keine Ergebnisse für diese Klausur vorhanden.</p>
            </div>`;
        return;
    }

    // Count grades per bucket
    const counts = {};
    VALID_GRADES.forEach(g => { counts[g] = 0; });
    results.forEach(r => {
        if (counts[r.grade] !== undefined) {
            counts[r.grade]++;
        }
    });

    const maxCount = Math.max(...Object.values(counts), 1);

    const rows = VALID_GRADES.map(grade => {
        const count = counts[grade];
        const widthPercent = (count / maxCount) * 100;
        const gradeNum = parseFloat(grade);
        let colorClass = 'grade-good';
        if (gradeNum >= 2.3 && gradeNum <= 3.3) colorClass = 'grade-ok';
        else if (gradeNum >= 3.7) colorClass = 'grade-bad';

        return `
            <div class="bar-chart-row">
                <span class="bar-chart-label">${grade}</span>
                <div class="bar-chart-track">
                    <div class="bar-chart-fill ${colorClass}" style="width: ${widthPercent}%;">
                        ${count > 0 ? `<span class="bar-chart-count">${count}</span>` : ''}
                    </div>
                </div>
                ${count === 0 ? `<span class="bar-chart-count-outside">0</span>` : ''}
            </div>`;
    }).join('');

    chartArea.innerHTML = `<div class="bar-chart-container">${rows}</div>`;
}

// =============================================================================
// Tab 4 – CSV-Import (US29)
// =============================================================================

function buildCsvImportTab(data) {
    const seriesOptions = data.eventSeries.map(s =>
        `<option value="${s.id}">${escapeHTML(s.name)}</option>`
    ).join('');

    return `
        <div class="management-tab-content" data-tab="csv-import">
            <div class="card">
                <div class="card-header mgmt-card-header">
                    <h3>CSV-Import</h3>
                </div>

                <div class="management-form mgmt-form-section">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="ci-series-select">Veranstaltungsreihe</label>
                            <select id="ci-series-select" class="form-control">
                                <option value="">— Bitte wählen —</option>
                                ${seriesOptions}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="ci-exam-select">Klausur</label>
                            <select id="ci-exam-select" class="form-control" disabled>
                                <option value="">— Bitte wählen —</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="csv-upload-zone" id="ci-upload-zone">
                    <span class="material-icons-round">upload_file</span>
                    <p>CSV-Datei hier ablegen oder klicken</p>
                    <p class="hint">Format: Matrikelnummer;Note (eine Zeile pro Student)</p>
                    <input type="file" accept=".csv" id="ci-file-input" class="mgmt-hidden">
                </div>

                <div id="ci-alert-area"></div>
                <div id="ci-preview-area"></div>
            </div>
        </div>`;
}

function initCsvImportTab(container, data) {
    const seriesSelect = container.querySelector('#ci-series-select');
    const examSelect = container.querySelector('#ci-exam-select');
    const uploadZone = container.querySelector('#ci-upload-zone');
    const fileInput = container.querySelector('#ci-file-input');
    const previewArea = container.querySelector('#ci-preview-area');
    const alertArea = container.querySelector('#ci-alert-area');
    if (!seriesSelect || !examSelect || !uploadZone || !fileInput) return;

    seriesSelect.addEventListener('change', () => {
        alertArea.innerHTML = '';
        previewArea.innerHTML = '';
        const seriesId = parseInt(seriesSelect.value);
        populateKlausurDropdown(examSelect, data, seriesId);
    });

    examSelect.addEventListener('change', () => {
        alertArea.innerHTML = '';
        previewArea.innerHTML = '';
    });

    // Click to upload
    uploadZone.addEventListener('click', () => {
        fileInput.click();
    });

    // Drag & Drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) handleCsvFile(file, container, data);
    });

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) handleCsvFile(file, container, data);
        fileInput.value = '';
    });
}

function handleCsvFile(file, container, data) {
    const seriesSelect = container.querySelector('#ci-series-select');
    const examSelect = container.querySelector('#ci-exam-select');
    const previewArea = container.querySelector('#ci-preview-area');
    const alertArea = container.querySelector('#ci-alert-area');

    const seriesId = parseInt(seriesSelect.value);
    const eventId = parseInt(examSelect.value);

    if (!seriesId || !eventId) {
        alertArea.innerHTML = `
            <div class="management-alert error">
                <span class="material-icons-round">error</span>
                Bitte zuerst Veranstaltungsreihe und Klausur auswählen.
            </div>`;
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
        const parsed = [];

        lines.forEach(line => {
            const parts = line.split(';');
            if (parts.length < 2) {
                parsed.push({ matNr: line.trim(), grade: '', valid: false, error: 'Ungültiges Format' });
                return;
            }

            const matNr = parts[0].trim();
            const grade = parts[1].trim();
            const user = data.users.find(u => u.matriculationNumber === matNr);
            const gradeValid = VALID_GRADES.includes(grade);

            if (!user) {
                parsed.push({ matNr, grade, valid: false, userName: '—', error: 'Matrikelnummer nicht gefunden' });
            } else if (!gradeValid) {
                parsed.push({ matNr, grade, valid: false, userName: user.name, userId: user.id, error: 'Ungültige Note' });
            } else {
                parsed.push({ matNr, grade, valid: true, userName: user.name, userId: user.id, error: '' });
            }
        });

        const validCount = parsed.filter(p => p.valid).length;
        const errorCount = parsed.filter(p => !p.valid).length;

        previewArea.innerHTML = `
            <table class="management-table mgmt-table-spaced">
                <thead>
                    <tr>
                        <th scope="col" width="25%">Matrikelnummer</th>
                        <th scope="col" width="30%">Name</th>
                        <th scope="col" width="15%">Note</th>
                        <th scope="col" width="30%">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${parsed.map(p => `
                        <tr>
                            <td>${escapeHTML(p.matNr)}</td>
                            <td>${escapeHTML(p.userName || '—')}</td>
                            <td>${escapeHTML(p.grade || '—')}</td>
                            <td>
                                ${p.valid
                                    ? '<div class="status-indicator passed"><span class="status-dot"></span> OK</div>'
                                    : `<div class="status-indicator failed"><span class="status-dot"></span> Fehler: ${escapeHTML(p.error)}</div>`
                                }
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ${validCount > 0 ? `
                <div class="mgmt-actions-right">
                    <button class="btn btn-primary" id="ci-apply-btn">
                        <span class="material-icons-round">save</span>
                        Übernehmen (${validCount} gültig)
                    </button>
                </div>` : ''}
        `;

        const applyBtn = previewArea.querySelector('#ci-apply-btn');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                const key = seriesId + '-' + eventId;
                const existing = data.examResults[key] || [];

                parsed.filter(p => p.valid).forEach(p => {
                    const idx = existing.findIndex(r => r.studentId === p.userId);
                    if (idx >= 0) {
                        existing[idx].grade = p.grade;
                    } else {
                        existing.push({ studentId: p.userId, grade: p.grade });
                    }
                });

                data.examResults[key] = existing;

                alertArea.innerHTML = `
                    <div class="management-alert success">
                        <span class="material-icons-round">check_circle</span>
                        Import abgeschlossen: ${validCount} Note(n) übernommen${errorCount > 0 ? `, ${errorCount} Fehler übersprungen` : ''}.
                    </div>`;

                previewArea.innerHTML = '';
            });
        }
    };

    reader.readAsText(file);
}

// =============================================================================
// Shared Helpers
// =============================================================================

/**
 * Populates a Klausur dropdown with only "Klausur"-type events
 * from the selected event series.
 */
function populateKlausurDropdown(selectEl, data, seriesId) {
    selectEl.innerHTML = '<option value="">— Bitte wählen —</option>';
    selectEl.disabled = true;

    if (!seriesId) return;

    const series = data.eventSeries.find(s => s.id === seriesId);
    if (!series) return;

    const klausuren = (series.events || []).filter(ev => ev.type === 'Klausur');

    if (klausuren.length === 0) return;

    klausuren.forEach(ev => {
        const opt = document.createElement('option');
        opt.value = ev.id;
        opt.textContent = ev.name;
        selectEl.appendChild(opt);
    });

    selectEl.disabled = false;
}
