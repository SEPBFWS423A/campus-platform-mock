import { escapeHTML } from '../../core/utils.js';
import { findMatchingEventSeries, findParticipantsForCourse, buildEmptyState } from './dozentHelpers.js';
import { VALID_GRADES } from '../shared/constants.js';
import { buildAlert } from '../shared/uiComponents.js';
import { getActiveDozentCourses } from '../shared/dataHelpers.js';
import { initTabs } from '../shared/tabSwitching.js';
import {
    GRADE_THRESHOLDS, persistGrades, collectExistingGrades,
    gradeColorClass, pointsToGrade
} from './gradingHelpers.js';

export function renderDozentGrading(data, user) {
    const container = document.querySelector('.dozent-grading-content');
    if (!container) return;

    const activeCourses = getActiveDozentCourses(data, user.id);

    if (activeCourses.length === 0) {
        container.innerHTML = buildEmptyState('grading', 'Keine aktiven Kurse für die Notenvergabe.');
        return;
    }

    container.innerHTML = buildGradingShell(activeCourses);
    initTabs(container);
    initGradingInteraction(container, data, activeCourses);
}

function buildGradingShell(activeCourses) {
    const courseOptions = activeCourses.map(c =>
        `<option value="${escapeHTML(c.code)}">${escapeHTML(c.name)} (${escapeHTML(c.code)})</option>`
    ).join('');

    const courseSelector = `
        <div class="card">
            <div class="management-form dozent-grading-selector">
                <div class="form-group">
                    <label for="dozent-course-select">Kurs auswählen</label>
                    <select id="dozent-course-select" class="form-input">
                        <option value="">— Bitte Kurs wählen —</option>
                        ${courseOptions}
                    </select>
                </div>
            </div>
        </div>`;

    const tabNav = `
        <div class="section-tabs" role="tablist" aria-label="Notenvergabe Modus" id="grading-tab-nav" style="display:none;">
            <button class="section-tab active" data-tab="grading-manual" role="tab" aria-selected="true">
                <span class="material-symbols-rounded" aria-hidden="true">grading</span>
                Noten
            </button>
            <button class="section-tab" data-tab="grading-points" role="tab" aria-selected="false">
                <span class="material-symbols-rounded" aria-hidden="true">calculate</span>
                Punkte-Modus
            </button>
            <button class="section-tab" data-tab="grading-csv" role="tab" aria-selected="false">
                <span class="material-symbols-rounded" aria-hidden="true">upload_file</span>
                CSV-Import
            </button>
        </div>`;

    const tabPanels = `
        <div id="grading-manual" class="tab-content active">
            <div id="dozent-grading-alert" aria-live="polite"></div>
            <div id="dozent-grading-table-area"></div>
        </div>
        <div id="grading-points" class="tab-content">
            <div id="dozent-points-content"></div>
        </div>
        <div id="grading-csv" class="tab-content">
            <div id="dozent-csv-content"></div>
        </div>`;

    return courseSelector + tabNav + tabPanels;
}

function initGradingInteraction(container, data, activeCourses) {
    const courseSelect = container.querySelector('#dozent-course-select');
    if (!courseSelect) return;

    courseSelect.addEventListener('change', () => {
        const selectedCode = courseSelect.value;
        const tabNav = container.querySelector('#grading-tab-nav');

        if (!selectedCode) {
            if (tabNav) tabNav.style.display = 'none';
            clearTabPanels(container);
            return;
        }

        const course = activeCourses.find(c => c.code === selectedCode);
        if (!course) return;

        if (tabNav) tabNav.style.display = '';

        const tableArea = container.querySelector('#dozent-grading-table-area');
        const alertArea = container.querySelector('#dozent-grading-alert');
        if (tableArea && alertArea) renderGradingTable(tableArea, alertArea, course, data);

        renderPointsTab(container, course, data);
        renderCsvTab(container, course, data);
    });
}

function clearTabPanels(container) {
    const ids = ['#dozent-grading-table-area', '#dozent-grading-alert', '#dozent-points-content', '#dozent-csv-content'];
    ids.forEach(id => {
        const el = container.querySelector(id);
        if (el) el.innerHTML = '';
    });
}

// ─── MANUAL GRADING ──────────────────────────────────────────────────────────

function renderGradingTable(tableArea, alertArea, course, data) {
    alertArea.innerHTML = '';
    const participants = findParticipantsForCourse(course, data);
    const matchedSeries = findMatchingEventSeries(course, data);

    if (participants.length === 0) {
        tableArea.innerHTML = `
            <div class="management-empty">
                <span class="material-symbols-rounded">people_outline</span>
                <p>Keine Studierenden für diesen Kurs gefunden.</p>
            </div>`;
        return;
    }

    const existingGrades = collectExistingGrades(data, matchedSeries);

    const rows = participants.map(student => {
        const currentGrade = existingGrades[student.id] || '';
        const gradeDisplay = currentGrade || '-';
        const gradeClass = currentGrade ? gradeColorClass(parseFloat(currentGrade)) : '';

        return `
            <tr>
                <td>${escapeHTML(student.name)}</td>
                <td>${escapeHTML(student.matriculationNumber || '-')}</td>
                <td><span class="${gradeClass}">${escapeHTML(gradeDisplay)}</span></td>
                <td>
                    <select class="form-input dozent-grade-input" data-student-id="${student.id}">
                        <option value="">—</option>
                        ${VALID_GRADES.map(g =>
                            `<option value="${g}"${currentGrade === g ? ' selected' : ''}>${g}</option>`
                        ).join('')}
                    </select>
                </td>
            </tr>`;
    }).join('');

    tableArea.innerHTML = `
        <div class="dozent-grading-course-info">
            <span class="material-symbols-rounded" aria-hidden="true">info</span>
            ${escapeHTML(course.name)} &bull; ${escapeHTML(course.exam?.type || 'Klausur')} &bull;
            Prüfungstermin: ${course.exam ? escapeHTML(course.exam.date) : 'TBA'}
        </div>
        <table class="management-table">
            <thead>
                <tr>
                    <th scope="col" width="30%">Name</th>
                    <th scope="col" width="20%">Matrikelnr.</th>
                    <th scope="col" width="20%">Aktuelle Note</th>
                    <th scope="col" width="30%">Note vergeben</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        <div class="dozent-grading-actions">
            <span class="dozent-grading-count">${participants.length} Studierende</span>
            <button class="btn btn-primary" id="dozent-save-grades-btn" type="button">
                <span class="material-symbols-rounded" aria-hidden="true">save</span>
                Noten speichern
            </button>
        </div>`;

    const saveBtn = tableArea.querySelector('#dozent-save-grades-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            saveGrades(tableArea, alertArea, course, data, matchedSeries);
        });
    }
}

function saveGrades(tableArea, alertArea, course, data, matchedSeries) {
    const gradeInputs = tableArea.querySelectorAll('.dozent-grade-input');
    const results = [];
    let filledCount = 0;

    gradeInputs.forEach(input => {
        const studentId = parseInt(input.dataset.studentId);
        const grade = input.value;
        if (grade) {
            results.push({ studentId, grade });
            filledCount++;
        }
    });

    if (filledCount === 0) {
        alertArea.innerHTML = buildAlert('Bitte mindestens eine Note eingeben.', 'error', 'warning');
        return;
    }

    persistGrades(results, data, matchedSeries, course);

    alertArea.innerHTML = buildAlert(`${filledCount} Note(n) für ${escapeHTML(course.name)} erfolgreich gespeichert.`, 'success');

    setTimeout(() => {
        renderGradingTable(tableArea, alertArea, course, data);
    }, 100);
}

// ─── POINTS MODE ─────────────────────────────────────────────────────────────

function renderPointsTab(container, course, data) {
    const area = container.querySelector('#dozent-points-content');
    if (!area) return;

    const participants = findParticipantsForCourse(course, data);
    const matchedSeries = findMatchingEventSeries(course, data);
    const existingGrades = collectExistingGrades(data, matchedSeries);

    const thresholdRows = GRADE_THRESHOLDS.map((t, i) => {
        const maxPts = i === 0 ? 100 : GRADE_THRESHOLDS[i - 1].min - 1;
        return `
            <tr>
                <td>
                    <input type="number" class="form-input pts-threshold-input" style="width:80px;"
                           data-idx="${i}" value="${t.min}" min="0" max="100">
                    &ndash; ${maxPts === 100 ? '100' : maxPts}
                </td>
                <td><strong>${t.grade}</strong></td>
            </tr>`;
    }).join('');

    const studentRows = participants.map(s => `
        <tr>
            <td>${escapeHTML(s.name)}</td>
            <td>${escapeHTML(s.matriculationNumber || '—')}</td>
            <td>
                <input type="number" class="form-input pts-student-input" style="width:90px;"
                       data-student-id="${s.id}" placeholder="0–100" min="0" max="100"
                       value="${existingGrades[s.id] ? '' : ''}">
            </td>
            <td class="pts-grade-preview" data-student-id="${s.id}">—</td>
        </tr>`).join('');

    area.innerHTML = `
        <div class="card" style="margin-bottom:1rem;">
            <div class="card-header mgmt-card-header">
                <h3>Punktegrenzen konfigurieren</h3>
            </div>
            <p class="mgmt-desc-text">Legen Sie fest, ab wie vielen Punkten (0–100) welche Note vergeben wird.</p>
            <table class="management-table" style="max-width:320px;">
                <thead><tr><th>Punkte ab</th><th>Note</th></tr></thead>
                <tbody>${thresholdRows}</tbody>
            </table>
        </div>

        <div class="card">
            <div class="card-header mgmt-card-header">
                <h3>Punkte eingeben &amp; Noten berechnen</h3>
            </div>
            <div id="pts-alert" aria-live="polite"></div>
            <table class="management-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Matrikelnr.</th>
                        <th>Punkte (0–100)</th>
                        <th>Berechnete Note</th>
                    </tr>
                </thead>
                <tbody>${studentRows}</tbody>
            </table>
            <div class="dozent-grading-actions">
                <button class="btn btn-outline" id="pts-calc-btn" type="button">
                    <span class="material-symbols-rounded">calculate</span>
                    Noten berechnen
                </button>
                <button class="btn btn-primary" id="pts-save-btn" type="button">
                    <span class="material-symbols-rounded">save</span>
                    Noten übernehmen
                </button>
            </div>
        </div>`;

    initPointsTabInteraction(area, course, data, matchedSeries, participants);
}

function initPointsTabInteraction(area, course, data, matchedSeries, participants) {
    function getThresholds() {
        const inputs = area.querySelectorAll('.pts-threshold-input');
        const thresholds = GRADE_THRESHOLDS.map(t => ({ ...t }));
        inputs.forEach(inp => {
            const idx = parseInt(inp.dataset.idx);
            if (!isNaN(idx) && thresholds[idx]) thresholds[idx].min = parseInt(inp.value) || 0;
        });
        return thresholds.sort((a, b) => b.min - a.min);
    }

    const calcBtn = area.querySelector('#pts-calc-btn');
    const saveBtn = area.querySelector('#pts-save-btn');
    const alertEl = area.querySelector('#pts-alert');

    calcBtn.addEventListener('click', () => {
        const thresholds = getThresholds();
        area.querySelectorAll('.pts-student-input').forEach(inp => {
            const studentId = parseInt(inp.dataset.studentId);
            const pts = parseFloat(inp.value);
            const preview = area.querySelector(`.pts-grade-preview[data-student-id="${studentId}"]`);
            if (!preview) return;
            if (inp.value === '' || isNaN(pts)) {
                preview.textContent = '—';
            } else {
                const grade = pointsToGrade(pts, thresholds);
                preview.textContent = grade;
                preview.className = `pts-grade-preview ${gradeColorClass(parseFloat(grade))}`;
                preview.dataset.grade = grade;
            }
        });
    });

    saveBtn.addEventListener('click', () => {
        const results = [];
        area.querySelectorAll('.pts-grade-preview').forEach(cell => {
            if (cell.dataset.grade) {
                const studentId = parseInt(cell.dataset.studentId);
                results.push({ studentId, grade: cell.dataset.grade });
            }
        });

        if (results.length === 0) {
            alertEl.innerHTML = buildAlert('Bitte zuerst Punkte eingeben und berechnen.', 'error', 'warning');
            return;
        }

        persistGrades(results, data, matchedSeries, course);
        alertEl.innerHTML = buildAlert(`${results.length} Note(n) erfolgreich übernommen.`, 'success');
    });
}

// ─── CSV IMPORT ───────────────────────────────────────────────────────────────

function renderCsvTab(container, course, data) {
    const area = container.querySelector('#dozent-csv-content');
    if (!area) return;

    area.innerHTML = `
        <div class="card">
            <div class="card-header mgmt-card-header">
                <h3>CSV-Import für ${escapeHTML(course.name)}</h3>
            </div>
            <p class="mgmt-desc-text">
                Format: <code>Matrikelnummer;Note</code> (eine Zeile pro Studierenden).
                Gültige Noten: ${VALID_GRADES.join(', ')}
            </p>

            <div class="csv-upload-zone" id="dozent-ci-upload-zone">
                <span class="material-symbols-rounded">upload_file</span>
                <p>CSV-Datei hier ablegen oder klicken</p>
                <p class="hint">Format: Matrikelnummer;Note</p>
                <input type="file" accept=".csv,.txt" id="dozent-ci-file-input" class="mgmt-hidden">
            </div>

            <div id="dozent-ci-alert" aria-live="polite"></div>
            <div id="dozent-ci-preview"></div>
        </div>`;

    const uploadZone = area.querySelector('#dozent-ci-upload-zone');
    const fileInput = area.querySelector('#dozent-ci-file-input');
    const alertEl = area.querySelector('#dozent-ci-alert');
    const previewEl = area.querySelector('#dozent-ci-preview');

    uploadZone.addEventListener('click', () => fileInput.click());
    uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('dragover'); });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
    uploadZone.addEventListener('drop', e => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        if (e.dataTransfer.files[0]) handleCsvFile(e.dataTransfer.files[0], alertEl, previewEl, course, data);
    });
    fileInput.addEventListener('change', () => {
        if (fileInput.files[0]) handleCsvFile(fileInput.files[0], alertEl, previewEl, course, data);
        fileInput.value = '';
    });
}

function handleCsvFile(file, alertEl, previewEl, course, data) {
    const matchedSeries = findMatchingEventSeries(course, data);
    const reader = new FileReader();
    reader.onload = e => {
        const lines = e.target.result.split(/\r?\n/).filter(l => l.trim() !== '');
        const parsed = lines.map(line => {
            const parts = line.split(';');
            if (parts.length < 2) return { matNr: line.trim(), grade: '', valid: false, error: 'Ungültiges Format', userName: '—' };
            const matNr = parts[0].trim();
            const grade = parts[1].trim();
            const user = data.users.find(u => u.matriculationNumber === matNr);
            if (!user) return { matNr, grade, valid: false, error: 'Matrikelnummer nicht gefunden', userName: '—' };
            if (!VALID_GRADES.includes(grade)) return { matNr, grade, valid: false, error: 'Ungültige Note', userName: user.name, userId: user.id };
            return { matNr, grade, valid: true, userName: user.name, userId: user.id, error: '' };
        });

        const validCount = parsed.filter(p => p.valid).length;
        const errorCount = parsed.filter(p => !p.valid).length;

        previewEl.innerHTML = `
            <table class="management-table mgmt-table-spaced">
                <thead>
                    <tr>
                        <th>Matrikelnummer</th><th>Name</th><th>Note</th><th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${parsed.map(p => `
                        <tr>
                            <td>${escapeHTML(p.matNr)}</td>
                            <td>${escapeHTML(p.userName)}</td>
                            <td>${escapeHTML(p.grade || '—')}</td>
                            <td>${p.valid
                                ? '<div class="status-indicator passed"><span class="status-dot"></span> OK</div>'
                                : `<div class="status-indicator failed"><span class="status-dot"></span> ${escapeHTML(p.error)}</div>`
                            }</td>
                        </tr>`).join('')}
                </tbody>
            </table>
            ${validCount > 0 ? `
                <div class="mgmt-actions-right">
                    <button class="btn btn-primary" id="dozent-ci-apply-btn">
                        <span class="material-symbols-rounded">save</span>
                        Übernehmen (${validCount} gültig)
                    </button>
                </div>` : ''}`;

        const applyBtn = previewEl.querySelector('#dozent-ci-apply-btn');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                const results = parsed.filter(p => p.valid).map(p => ({ studentId: p.userId, grade: p.grade }));
                persistGrades(results, data, matchedSeries, course);
                alertEl.innerHTML = buildAlert(
                    `Import abgeschlossen: ${validCount} Note(n) übernommen${errorCount > 0 ? `, ${errorCount} Fehler übersprungen` : ''}.`,
                    'success'
                );
                previewEl.innerHTML = '';
            });
        }
    };
    reader.readAsText(file);
}

// ─── SHARED HELPERS ───────────────────────────────────────────────────────────
// persistGrades, collectExistingGrades, gradeColorClass, pointsToGrade
// are imported from ./gradingHelpers.js above.
