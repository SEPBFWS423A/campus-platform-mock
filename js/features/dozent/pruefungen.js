import { escapeHTML } from '../../core/utils.js';
import { buildAlert } from '../shared/uiComponents.js';
import { findMatchingEventSeries, findParticipantsForCourse } from './dozentHelpers.js';
import { VALID_GRADES } from '../shared/constants.js';
import {
    GRADE_THRESHOLDS, persistGrades, collectExistingGrades,
    gradeColorClass, pointsToGrade
} from './gradingHelpers.js';

// ── Status pipeline ────────────────────────────────────────────────────────────
// Values are stored in pruefungsDocs.status; labels are type-aware.

const STATUS_VALUES = ['offen', 'eingereicht', 'geschrieben', 'abgeschlossen'];
const STATUS_INDEX = Object.fromEntries(STATUS_VALUES.map((v, i) => [v, i]));

// Klausur: describe preparation → delivery → correction → done
const KLAUSUR_LABELS = ['Offen', 'Bereitgestellt', 'Geschrieben', 'Abgeschlossen'];
// Projects/papers: topic open → submissions in → graded → done
const PROJEKT_LABELS = ['Offen', 'Eingereicht', 'Bewertet', 'Abgeschlossen'];
// Neutral labels used in the filter bar (not type-specific)
const FILTER_LABELS = ['Offen', 'Eingereicht', 'Geschrieben', 'Abgeschlossen'];

function isProjectExam(examType) {
    return /projekt|arbeit|referat|seminar|pr[äa]sentation/i.test(examType || '');
}

function getStatusLabels(examType) {
    return isProjectExam(examType) ? PROJEKT_LABELS : KLAUSUR_LABELS;
}

// ── Main export ────────────────────────────────────────────────────────────────

export function renderDozentPruefungen(data, user) {
    const content = document.querySelector('.dozent-exams-content');
    if (!content) return;

    const modules = data.modules.filter(m =>
        m.dozentId === user.id && (m.status === 'active' || m.status === 'registered')
    );

    if (modules.length === 0) {
        content.innerHTML = `
            <div class="management-empty">
                <span class="material-symbols-rounded">quiz</span>
                <p>Keine aktiven Prüfungen gefunden.</p>
            </div>`;
        return;
    }

    content.innerHTML = buildFilterBar() +
        `<div class="pruefung-cards-list">${modules.map(m => buildCompactCard(m, data)).join('')}</div>` +
        buildModal() +
        `<div class="pruefung-full-pool" style="display:none">${modules.map(m => buildCard(m, data)).join('')}</div>`;

    initInteractions(content, modules, data);
}

// ── Build HTML ─────────────────────────────────────────────────────────────────

function buildFilterBar() {
    return `
        <div class="filter-bar-container" style="margin-bottom:2rem;">
            <div class="filter-bar" role="group" aria-label="Prüfungsfilter">
                <button class="filter-chip active" data-filter="all" aria-pressed="true">
                    <span class="material-symbols-rounded">apps</span> Alle
                </button>
                ${STATUS_VALUES.map((v, i) =>
        `<button class="filter-chip" data-filter="${v}" aria-pressed="false">
                        <span class="material-symbols-rounded">${getIconForStatus(v)}</span>
                        ${FILTER_LABELS[i]}
                    </button>`
    ).join('')}
            </div>
        </div>`;
}

function getIconForStatus(status) {
    const icons = {
        'offen': 'radio_button_unchecked',
        'eingereicht': 'upload_file',
        'bereitgestellt': 'file_present',
        'geschrieben': 'edit_note',
        'abgeschlossen': 'check_circle'
    };
    return icons[status] || 'info';
}

function buildCompactCard(mod, data) {
    const doc = (data.pruefungsDocs || {})[mod.code] || { status: 'offen' };
    const submissions = (data.studienarbeiten || []).filter(a => a.moduleCode === mod.code);
    const participants = findParticipantsForCourse(mod, data);
    const examType = mod.exam?.type || 'Prüfung';
    const isProject = isProjectExam(examType);
    const labels = getStatusLabels(examType);
    const statusIdx = STATUS_INDEX[doc.status] ?? 0;
    const typeBadgeClass = isProject ? 'lehrveranstaltung' : 'klausur';
    const id = escapeHTML(mod.code);

    const metaParts = [escapeHTML(mod.code)];
    if (mod.exam?.date) metaParts.push(escapeHTML(mod.exam.date));
    if (mod.exam?.time) metaParts.push(escapeHTML(mod.exam.time));
    if (mod.exam?.room) metaParts.push(escapeHTML(mod.exam.room));

    return `
        <div class="pruefung-compact-card" data-module="${id}" data-status="${escapeHTML(doc.status)}" role="button" tabindex="0" aria-label="${escapeHTML(mod.name)} öffnen">
            <div class="compact-card-main">
                <div class="compact-card-title">
                    <span class="type-badge ${typeBadgeClass}">${escapeHTML(examType)}</span>
                    <span class="compact-card-name">${escapeHTML(mod.name)}</span>
                </div>
                <div class="compact-card-meta">${metaParts.join(' &bull; ')}</div>
            </div>
            <div class="compact-card-aside">
                <div class="compact-status-pill status-${escapeHTML(doc.status)}">
                    <span class="material-symbols-rounded">${getIconForStatus(doc.status)}</span>
                    ${escapeHTML(labels[statusIdx])}
                </div>
                <div class="compact-card-stats">
                    <span title="Anmeldungen"><span class="material-symbols-rounded">how_to_reg</span>${participants.length}</span>
                    <span title="Einreichungen"><span class="material-symbols-rounded">assignment_turned_in</span>${submissions.length}</span>
                </div>
                <span class="material-symbols-rounded compact-card-arrow">chevron_right</span>
            </div>
        </div>`;
}

function buildModal() {
    return `
        <div id="pruefung-modal" class="pruefung-modal-overlay" aria-modal="true" role="dialog" aria-label="Prüfungsdetails" hidden>
            <div class="pruefung-modal-dialog">
                <div class="pruefung-modal-topbar">
                    <button class="pruefung-modal-close btn btn-sm btn-outline" aria-label="Schließen">
                        <span class="material-symbols-rounded">close</span> Schließen
                    </button>
                </div>
                <div class="pruefung-modal-body"></div>
            </div>
        </div>`;
}

function buildCard(mod, data) {
    const doc = (data.pruefungsDocs || {})[mod.code] ||
        { status: 'offen', examFileName: null, uploadedAt: null, notes: '' };
    const submissions = (data.studienarbeiten || []).filter(a => a.moduleCode === mod.code);
    const participants = findParticipantsForCourse(mod, data);
    const matchedSeries = findMatchingEventSeries(mod, data);
    const existingGrades = collectExistingGrades(data, matchedSeries);

    const statusIdx = STATUS_INDEX[doc.status] ?? 0;
    const examType = mod.exam?.type || 'Prüfung';
    const isProject = isProjectExam(examType);
    const labels = getStatusLabels(examType);

    const statusOptions = STATUS_VALUES.map((v, i) =>
        `<option value="${v}"${doc.status === v ? ' selected' : ''}>${labels[i]}</option>`
    ).join('');

    const pipelineHTML = STATUS_VALUES.map((v, i) => {
        const stepClass = i < statusIdx ? 'done' : i === statusIdx ? 'current' : '';
        const lineClass = i < statusIdx ? 'done' : '';
        const connector = i < STATUS_VALUES.length - 1
            ? `<div class="pipeline-line ${lineClass}" style="left: calc(${(i * 100) / (STATUS_VALUES.length - 1)}% + 50% - 2rem); width: calc(${100 / (STATUS_VALUES.length - 1)}% - 4rem);" aria-hidden="true"></div>` : '';

        const stepIcons = isProject
            ? ['edit_document', 'move_to_inbox', 'grading', 'verified']
            : ['edit_document', 'file_present', 'edit_note', 'verified'];

        return `
            <div class="pipeline-step ${stepClass}" role="listitem">
                <div class="pipeline-dot">
                    <span class="material-symbols-rounded">${stepIcons[i]}</span>
                </div>
                <span class="pipeline-label">${labels[i]}</span>
            </div>`;
    }).join('');

    // Re-calculate the lines separately to be more precise
    const linesHTML = STATUS_VALUES.slice(0, -1).map((_, i) => {
        const lineClass = i < statusIdx ? 'done' : '';
        const left = ((i / (STATUS_VALUES.length - 1)) * 100) + (100 / (STATUS_VALUES.length - 1) / 2);
        const width = (100 / (STATUS_VALUES.length - 1));
        return `<div class="pipeline-line ${lineClass}" style="left: ${left}%; width: ${width}%;" aria-hidden="true"></div>`;
    }).join('');

    const submBadge = submissions.length > 0
        ? `<span class="badge" style="margin-left:0.3rem;vertical-align:middle;">${submissions.length}</span>`
        : '';
    const anmBadge = participants.length > 0
        ? `<span class="badge" style="margin-left:0.3rem;vertical-align:middle;">${participants.length}</span>`
        : '';

    const id = escapeHTML(mod.code);
    const typeBadgeClass = isProject ? 'lehrveranstaltung' : 'klausur';

    return `
        <div class="card pruefung-card" data-module="${id}" data-status="${escapeHTML(doc.status)}" data-exam-type="${escapeHTML(examType)}">

            <div class="pruefung-card-header">
                <div class="pruefung-card-info">
                    <div class="pruefung-card-title">
                        <span class="type-badge ${typeBadgeClass}">${escapeHTML(examType)}</span>
                        ${escapeHTML(mod.name)}
                    </div>
                    <div class="pruefung-card-meta">
                        ${escapeHTML(mod.code)}${mod.exam?.date ? ` &bull; ${escapeHTML(mod.exam.date)}` : ''
        }${mod.exam?.time ? ` &bull; ${escapeHTML(mod.exam.time)}` : ''
        }${mod.exam?.room ? ` &bull; ${escapeHTML(mod.exam.room)}` : ''
        }
                    </div>
                </div>
                <select class="form-input pruefung-status-select" data-module="${id}" aria-label="Status">
                    ${statusOptions}
                </select>
            </div>

            <div class="pruefung-pipeline" role="list" aria-label="Prüfungsprozess">
                <div class="pipeline-lines-container" style="position: absolute; inset: 0; pointer-events: none;">
                    ${linesHTML}
                </div>
                ${pipelineHTML}
            </div>

            <div class="section-tabs pruefung-card-tabs" role="tablist" aria-label="Bereiche">
                <button class="section-tab active" data-tab="dok-${id}" role="tab" aria-selected="true">
                    <span class="material-symbols-rounded" aria-hidden="true">upload_file</span>
                    Dokument
                </button>
                <button class="section-tab" data-tab="anm-${id}" role="tab" aria-selected="false">
                    <span class="material-symbols-rounded" aria-hidden="true">how_to_reg</span>
                    Anmeldungen${anmBadge}
                </button>
                <button class="section-tab" data-tab="sub-${id}" role="tab" aria-selected="false">
                    <span class="material-symbols-rounded" aria-hidden="true">assignment_turned_in</span>
                    Einreichungen${submBadge}
                </button>
                <button class="section-tab" data-tab="note-${id}" role="tab" aria-selected="false">
                    <span class="material-symbols-rounded" aria-hidden="true">grading</span>
                    Noten
                </button>
            </div>

            <div id="dok-${id}" class="tab-content active">
                ${buildDokumentPanel(doc, id, mod)}
            </div>
            <div id="anm-${id}" class="tab-content">
                ${buildAnmeldungenPanel(participants)}
            </div>
            <div id="sub-${id}" class="tab-content">
                ${buildEinreichungenPanel(submissions)}
            </div>
            <div id="note-${id}" class="tab-content">
                ${buildNotenPanel(mod, participants, existingGrades)}
            </div>

            <div class="pruefung-card-alert" aria-live="polite"></div>
        </div>`;
}

function buildDokumentPanel(doc, id, mod) {
    const examType = mod?.exam?.type || '';
    const isProject = isProjectExam(examType);

    const fileRow = doc.examFileName ? `
        <div class="pruefung-file-row">
            <span class="material-symbols-rounded">description</span>
            <span>${escapeHTML(doc.examFileName)}</span>
            ${doc.uploadedAt
            ? `<span class="pruefung-file-date">Hochgeladen: ${escapeHTML(doc.uploadedAt)}</span>`
            : ''}
        </div>` : '';

    const uploadLabel = isProject
        ? 'Aufgabenstellung / Themen hochladen (.pdf, .docx, .zip)'
        : 'Klausur / Aufgabenstellung hochladen (.pdf, .docx, .zip)';

    const mlRow = doc.musterloesungFileName ? `
        <div class="pruefung-file-row pruefung-file-row--ml">
            <span class="material-symbols-rounded">task_alt</span>
            <span>${escapeHTML(doc.musterloesungFileName)}</span>
            ${doc.musterloesungAt
            ? `<span class="pruefung-file-date">Hochgeladen: ${escapeHTML(doc.musterloesungAt)}</span>`
            : ''}
        </div>` : '';

    const publishedChecked = doc.notenVeroeffentlicht ? 'checked' : '';
    const mlLabel = isProject
        ? 'Bewertungsschema / Musterlösung hochladen (.pdf, .docx)'
        : 'Musterlösung hochladen (.pdf, .docx)';

    return `
        ${fileRow}
        <div class="csv-upload-zone dok-upload-zone" data-module="${id}">
            <span class="material-symbols-rounded">upload_file</span>
            <p>${doc.examFileName ? 'Datei ersetzen' : uploadLabel}</p>
            <input type="file" accept=".pdf,.docx,.zip" class="mgmt-hidden dok-file-input">
        </div>
        <div class="form-group" style="margin-top:0.75rem;">
            <label>Hinweise / Notizen</label>
            <input type="text" class="form-input dok-notes-input"
                   placeholder="z.\u00a0B. Keine Hilfsmittel, Sitzplan beachten\u2026"
                   value="${escapeHTML(doc.notes || '')}">
        </div>
        <div class="dozent-grading-actions">
            <button class="btn btn-primary dok-save-btn" data-module="${id}">
                <span class="material-symbols-rounded">save</span> Speichern
            </button>
        </div>

        <hr class="pruefung-divider">

        <p class="pruefung-section-label">
            <span class="material-symbols-rounded">task_alt</span>
            ${isProject ? 'Bewertungsschema / Musterlösung' : 'Musterlösung'}
        </p>
        ${mlRow}
        <div class="csv-upload-zone dok-ml-zone" style="margin-top:0.5rem;">
            <span class="material-symbols-rounded">upload_file</span>
            <p>${doc.musterloesungFileName ? 'Datei ersetzen' : mlLabel}</p>
            <input type="file" accept=".pdf,.docx" class="mgmt-hidden dok-ml-input">
        </div>

        <hr class="pruefung-divider">

        <div class="pruefung-publish-row">
            <label class="pruefung-toggle-label">
                <input type="checkbox" class="dok-publish-toggle" ${publishedChecked}>
                <span>Noten für Studierende veröffentlicht</span>
            </label>
        </div>`;
}

function buildAnmeldungenPanel(participants) {
    if (participants.length === 0) {
        return `
            <div class="management-empty" style="padding:1.25rem 0;">
                <span class="material-symbols-rounded">person_search</span>
                <p>Keine Anmeldungen vorhanden.</p>
            </div>`;
    }

    const rows = participants.map((s, i) => `
        <tr>
            <td style="color:var(--text-secondary);font-size:0.8rem;">${i + 1}</td>
            <td>
                <div style="font-weight:500;">${escapeHTML(s.name)}</div>
                <span style="font-size:0.75rem;color:var(--text-secondary);">${escapeHTML(s.email || '—')}</span>
            </td>
            <td>${escapeHTML(s.matriculationNumber || '—')}</td>
            <td><div class="status-indicator passed"><span class="status-dot"></span>Angemeldet</div></td>
        </tr>`).join('');

    return `
        <div class="mgmt-actions-right" style="margin-bottom:0.75rem;gap:0.75rem;">
            <span class="dozent-grading-count">${participants.length} Anmeldung${participants.length !== 1 ? 'en' : ''}</span>
            <button class="btn btn-outline anm-print-btn">
                <span class="material-symbols-rounded">print</span>
                Anwesenheitsliste
            </button>
        </div>
        <table class="management-table">
            <thead>
                <tr>
                    <th scope="col" style="width:2rem;">#</th>
                    <th scope="col">Name</th>
                    <th scope="col">Matrikelnr.</th>
                    <th scope="col">Status</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
}

function buildEinreichungenPanel(submissions) {
    if (submissions.length === 0) {
        return `
            <div class="management-empty" style="padding:1.25rem 0;">
                <span class="material-symbols-rounded">inbox</span>
                <p>Noch keine Einreichungen vorhanden.</p>
            </div>`;
    }

    const rows = submissions.map(s => {
        const statusClass = s.status === 'bewertet' ? 'passed' : 'info';
        const statusLabel = s.status === 'bewertet' ? 'Bewertet' : 'Eingereicht';
        const gradeCell = s.grade
            ? `<span class="${gradeColorClass(parseFloat(s.grade))}">${escapeHTML(s.grade)}</span>`
            : '—';
        const hasFeedback = s.feedback && s.feedback.trim().length > 0;

        return `
            <tr>
                <td>
                    <div style="font-weight:500;">${escapeHTML(s.title)}</div>
                    <span class="type-badge lehrveranstaltung" style="font-size:0.7rem;margin-top:0.2rem;">${escapeHTML(s.type)}</span>
                </td>
                <td>
                    ${escapeHTML(s.studentName)}<br>
                    <span style="font-size:0.75rem;color:var(--text-secondary);">${escapeHTML(s.matNr)}</span>
                </td>
                <td>${escapeHTML(s.submittedAt || '—')}</td>
                <td><div class="status-indicator ${statusClass}"><span class="status-dot"></span>${statusLabel}</div></td>
                <td>${gradeCell}</td>
                <td>
                    <div style="display:flex;gap:0.35rem;flex-wrap:wrap;align-items:center;">
                        <button class="btn btn-sm btn-outline sub-download-btn" data-file="${escapeHTML(s.fileName)}">
                            <span class="material-symbols-rounded">download</span>
                            ${escapeHTML(s.size)}
                        </button>
                        <button class="btn btn-sm btn-outline sub-feedback-toggle${hasFeedback ? ' sub-feedback-toggle--has' : ''}" data-sub-id="${s.id}">
                            <span class="material-symbols-rounded">comment</span>
                            Feedback
                        </button>
                    </div>
                </td>
            </tr>
            <tr class="sub-feedback-row" data-sub-id="${s.id}" style="display:none;">
                <td colspan="6">
                    <div class="sub-feedback-area">
                        <label style="font-size:0.8rem;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:0.4rem;">
                            Feedback / Korrekturhinweise f\u00fcr ${escapeHTML(s.studentName)}
                        </label>
                        <textarea class="form-input sub-feedback-input" rows="3"
                                  placeholder="St\u00e4rken, Schw\u00e4chen, Verbesserungsvorschl\u00e4ge\u2026">${escapeHTML(s.feedback || '')}</textarea>
                        <div style="display:flex;gap:0.5rem;margin-top:0.5rem;justify-content:flex-end;">
                            <button class="btn btn-sm btn-outline sub-feedback-cancel" data-sub-id="${s.id}">Abbrechen</button>
                            <button class="btn btn-sm btn-primary sub-feedback-save" data-sub-id="${s.id}">
                                <span class="material-symbols-rounded">save</span> Speichern
                            </button>
                        </div>
                    </div>
                </td>
            </tr>`;
    }).join('');

    return `
        <table class="management-table">
            <thead>
                <tr>
                    <th scope="col">Titel / Typ</th>
                    <th scope="col">Studierende/r</th>
                    <th scope="col">Eingereicht</th>
                    <th scope="col">Status</th>
                    <th scope="col">Note</th>
                    <th scope="col">Aktionen</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
}

function buildNotenPanel(mod, participants, existingGrades) {
    if (participants.length === 0) {
        return `
            <div class="management-empty" style="padding:1.25rem 0;">
                <span class="material-symbols-rounded">people_outline</span>
                <p>Keine Studierenden f\u00fcr diesen Kurs gefunden.</p>
            </div>`;
    }

    const manualRows = participants.map(s => {
        const grade = existingGrades[s.id] || '';
        return `
            <tr>
                <td>${escapeHTML(s.name)}</td>
                <td>${escapeHTML(s.matriculationNumber || '—')}</td>
                <td><span class="${gradeColorClass(parseFloat(grade))}">${grade || '—'}</span></td>
                <td>
                    <select class="form-input note-grade-select" data-student-id="${s.id}">
                        <option value="">—</option>
                        ${VALID_GRADES.map(g =>
            `<option value="${g}"${grade === g ? ' selected' : ''}>${g}</option>`
        ).join('')}
                    </select>
                </td>
            </tr>`;
    }).join('');

    const pointRows = participants.map(s => `
        <tr>
            <td>${escapeHTML(s.name)}</td>
            <td>${escapeHTML(s.matriculationNumber || '—')}</td>
            <td><input type="number" class="form-input note-pts-input" data-student-id="${s.id}"
                       placeholder="0–100" min="0" max="100" style="width:90px;"></td>
            <td class="note-pts-preview" data-student-id="${s.id}">—</td>
        </tr>`).join('');

    const thresholdRows = GRADE_THRESHOLDS.map((t, i) => {
        const max = i === 0 ? 100 : GRADE_THRESHOLDS[i - 1].min - 1;
        return `<tr>
            <td><input type="number" class="form-input pts-min-input" data-idx="${i}"
                       value="${t.min}" min="0" max="100" style="width:70px;"> – ${max}</td>
            <td><strong>${t.grade}</strong></td>
        </tr>`;
    }).join('');

    return `
        <div class="grading-mode-bar" role="group" aria-label="Notenvergabe Modus">
            <button class="grading-mode-btn active" data-mode="manual">Manuell</button>
            <button class="grading-mode-btn" data-mode="points">Punkte</button>
            <button class="grading-mode-btn" data-mode="csv">CSV</button>
            <button class="grading-mode-btn" data-mode="statistik">Statistik</button>
        </div>

        <div class="note-mode-panel active" data-panel="manual">
            <table class="management-table">
                <thead>
                    <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Matrikelnr.</th>
                        <th scope="col">Aktuelle Note</th>
                        <th scope="col">Note vergeben</th>
                    </tr>
                </thead>
                <tbody>${manualRows}</tbody>
            </table>
            <div class="dozent-grading-actions">
                <span class="dozent-grading-count">${participants.length} Studierende</span>
                <button class="btn btn-primary note-save-btn" data-mode="manual">
                    <span class="material-symbols-rounded">save</span> Speichern
                </button>
            </div>
        </div>

        <div class="note-mode-panel" data-panel="points">
            <details class="pts-threshold-details" style="margin-bottom:0.75rem;">
                <summary style="cursor:pointer;font-size:0.85rem;color:var(--text-secondary);padding:0.4rem 0;">
                    Punktgrenzen anpassen
                </summary>
                <table class="management-table" style="max-width:280px;margin-top:0.5rem;">
                    <thead><tr><th>Punkte ab</th><th>Note</th></tr></thead>
                    <tbody>${thresholdRows}</tbody>
                </table>
            </details>
            <table class="management-table">
                <thead>
                    <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Matrikelnr.</th>
                        <th scope="col">Punkte (0–100)</th>
                        <th scope="col">Berechnete Note</th>
                    </tr>
                </thead>
                <tbody>${pointRows}</tbody>
            </table>
            <div class="dozent-grading-actions">
                <button class="btn btn-primary note-save-btn" data-mode="points">
                    <span class="material-symbols-rounded">save</span> \u00dcbernehmen
                </button>
            </div>
        </div>

        <div class="note-mode-panel" data-panel="csv">
            <p class="mgmt-desc-text">
                Format: <code>Matrikelnummer;Note</code> &mdash; eine Zeile pro Studierenden.
            </p>
            <div class="csv-upload-zone note-csv-zone">
                <span class="material-symbols-rounded">upload_file</span>
                <p>CSV-Datei hier ablegen oder klicken</p>
                <p class="hint">G\u00fcltige Noten: 1.0 &middot; 1.3 &middot; 1.7 &middot; \u2026 &middot; 4.0 &middot; 5.0</p>
                <input type="file" accept=".csv,.txt" class="mgmt-hidden note-csv-input">
            </div>
            <div class="note-csv-preview"></div>
        </div>

        <div class="note-mode-panel" data-panel="statistik">
            ${buildStatistikPanel(existingGrades, participants)}
        </div>`;
}

function buildStatistikPanel(existingGrades, participants) {
    const gradeValues = Object.values(existingGrades);

    if (gradeValues.length === 0) {
        return `
            <div class="management-empty" style="padding:1.25rem 0;">
                <span class="material-symbols-rounded">bar_chart</span>
                <p>Noch keine Noten eingetragen.</p>
            </div>`;
    }

    const counts = Object.fromEntries(VALID_GRADES.map(g => [g, 0]));
    gradeValues.forEach(g => { if (counts[g] !== undefined) counts[g]++; });

    const total = gradeValues.length;
    const passed = gradeValues.filter(g => parseFloat(g) <= 4.0).length;
    const sum = gradeValues.reduce((acc, g) => acc + parseFloat(g), 0);
    const avg = (sum / total).toFixed(2);
    const maxCount = Math.max(...Object.values(counts), 1);

    const bars = VALID_GRADES.map(g => {
        const count = counts[g];
        const barPct = Math.round((count / maxCount) * 100);
        const sharePct = Math.round((count / total) * 100);
        const colorCls = gradeColorClass(parseFloat(g));
        return `
            <div class="stat-grade-row">
                <span class="stat-grade-label ${colorCls}">${g}</span>
                <div class="stat-grade-bar-wrap">
                    <div class="stat-grade-bar ${colorCls}" style="width:${barPct}%"></div>
                </div>
                <span class="stat-grade-count">${count > 0 ? `${count}\u00a0(${sharePct}%)` : '\u2014'}</span>
            </div>`;
    }).join('');

    return `
        <div class="pruefung-stats-summary">
            <div class="pruefung-stat-item">
                <span class="material-symbols-rounded">people</span>
                <div>
                    <span class="pruefung-stat-value">${total} / ${participants.length}</span>
                    <span class="pruefung-stat-desc">benotet / angemeldet</span>
                </div>
            </div>
            <div class="pruefung-stat-item">
                <span class="material-symbols-rounded">calculate</span>
                <div>
                    <span class="pruefung-stat-value ${gradeColorClass(parseFloat(avg))}">${avg}</span>
                    <span class="pruefung-stat-desc">Durchschnitt</span>
                </div>
            </div>
            <div class="pruefung-stat-item">
                <span class="material-symbols-rounded">check_circle</span>
                <div>
                    <span class="pruefung-stat-value dozent-grade-good">${passed} / ${total}</span>
                    <span class="pruefung-stat-desc">bestanden (\u2264\u00a04,0)</span>
                </div>
            </div>
        </div>
        <div class="stat-grade-bars">${bars}</div>`;
}

// ── Interactions ───────────────────────────────────────────────────────────────

function initInteractions(content, modules, data) {
    initFilterChips(content);
    initModal(content, modules, data);

    modules.forEach(mod => {
        const card = content.querySelector(`.pruefung-full-pool .pruefung-card[data-module="${mod.code}"]`);
        if (!card) return;

        const matchedSeries = findMatchingEventSeries(mod, data);
        const participants = findParticipantsForCourse(mod, data);

        initCardTabs(card);
        initStatusSelect(card, mod, data);
        initDokumentPanel(card, mod, data);
        initAnmeldungenPanel(card);
        initEinreichungenPanel(card, data);
        card.querySelectorAll('.sub-download-btn').forEach(btn =>
            btn.addEventListener('click', () => showDownloadToast(btn.dataset.file))
        );
        initNotenPanel(card, mod, data, participants, matchedSeries);
    });
}

function initModal(content, modules, data) {
    const modal = content.querySelector('#pruefung-modal');
    if (!modal) return;
    const modalBody = modal.querySelector('.pruefung-modal-body');
    const closeBtn = modal.querySelector('.pruefung-modal-close');
    const pool = content.querySelector('.pruefung-full-pool');

    function closeModal() {
        const card = modalBody.querySelector('.pruefung-card');
        if (card) pool.appendChild(card);
        modal.hidden = true;
        document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

    content.querySelectorAll('.pruefung-compact-card').forEach(compactCard => {
        const open = () => {
            const code = compactCard.dataset.module;
            const fullCard = pool.querySelector(`.pruefung-card[data-module="${code}"]`);
            if (!fullCard) return;
            modalBody.innerHTML = '';
            modalBody.appendChild(fullCard);
            modal.hidden = false;
            document.body.style.overflow = 'hidden';
        };
        compactCard.addEventListener('click', open);
        compactCard.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
}

function initFilterChips(content) {
    const chips = content.querySelectorAll('.filter-chip');
    const list = content.querySelector('.pruefung-cards-list');

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); });
            chip.classList.add('active');
            chip.setAttribute('aria-pressed', 'true');

            const filter = chip.dataset.filter;
            list.querySelectorAll('.pruefung-compact-card').forEach(card => {
                card.style.display = (filter === 'all' || card.dataset.status === filter) ? '' : 'none';
            });
        });
    });
}

function initCardTabs(card) {
    const tabs = card.querySelectorAll('.pruefung-card-tabs .section-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');

            card.querySelectorAll(':scope > .tab-content').forEach(p => p.classList.remove('active'));
            const target = document.getElementById(tab.dataset.tab);
            if (target) target.classList.add('active');
        });
    });
}

function initStatusSelect(card, mod, data) {
    const select = card.querySelector('.pruefung-status-select');
    if (!select) return;

    select.addEventListener('change', () => {
        const status = select.value;
        const examType = card.dataset.examType || '';
        card.dataset.status = status;
        updatePipeline(card, status, examType);
        if (!data.pruefungsDocs) data.pruefungsDocs = {};
        data.pruefungsDocs[mod.code] = { ...(data.pruefungsDocs[mod.code] || {}), status };

        // Sync compact card pill and filter data
        const compactCard = document.querySelector(`.pruefung-compact-card[data-module="${mod.code}"]`);
        if (compactCard) {
            compactCard.dataset.status = status;
            const labels = getStatusLabels(examType);
            const statusIdx = STATUS_INDEX[status] ?? 0;
            const pill = compactCard.querySelector('.compact-status-pill');
            if (pill) {
                pill.className = `compact-status-pill status-${status}`;
                pill.innerHTML = `<span class="material-symbols-rounded">${getIconForStatus(status)}</span>${labels[statusIdx]}`;
            }
        }
    });
}

function updatePipeline(card, status, examType) {
    const idx = STATUS_INDEX[status] ?? 0;
    const labels = getStatusLabels(examType);

    card.querySelectorAll('.pipeline-step').forEach((step, i) => {
        step.classList.toggle('done', i < idx);
        step.classList.toggle('current', i === idx);
        const labelEl = step.querySelector('.pipeline-label');
        if (labelEl) labelEl.textContent = labels[i];
    });
    card.querySelectorAll('.pipeline-line').forEach((line, i) => {
        line.classList.toggle('done', i < idx);
    });

    // Keep select option labels in sync with type-aware labels
    const select = card.querySelector('.pruefung-status-select');
    if (select) {
        select.querySelectorAll('option').forEach((opt, i) => {
            opt.textContent = labels[i];
        });
    }
}

function initDokumentPanel(card, mod, data) {
    const zone = card.querySelector('.dok-upload-zone');
    const fileInput = card.querySelector('.dok-file-input');
    const saveBtn = card.querySelector('.dok-save-btn');
    const notesInput = card.querySelector('.dok-notes-input');
    const mlZone = card.querySelector('.dok-ml-zone');
    const mlInput = card.querySelector('.dok-ml-input');
    const publishToggle = card.querySelector('.dok-publish-toggle');
    const alertEl = card.querySelector('.pruefung-card-alert');

    // Exam document upload
    if (zone && fileInput) {
        zone.addEventListener('click', () => fileInput.click());
        zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('dragover');
            if (e.dataTransfer.files[0]) applyDocUpload(zone, e.dataTransfer.files[0], mod.code, card, data);
        });
        fileInput.addEventListener('change', () => {
            if (fileInput.files[0]) applyDocUpload(zone, fileInput.files[0], mod.code, card, data);
            fileInput.value = '';
        });
    }

    // Notes save
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            if (!data.pruefungsDocs) data.pruefungsDocs = {};
            data.pruefungsDocs[mod.code] = {
                ...(data.pruefungsDocs[mod.code] || {}),
                notes: notesInput?.value.trim() || ''
            };
            showCardAlert(alertEl, 'Gespeichert.', 'success');
        });
    }

    // Musterlösung upload
    if (mlZone && mlInput) {
        mlZone.addEventListener('click', () => mlInput.click());
        mlZone.addEventListener('dragover', e => { e.preventDefault(); mlZone.classList.add('dragover'); });
        mlZone.addEventListener('dragleave', () => mlZone.classList.remove('dragover'));
        mlZone.addEventListener('drop', e => {
            e.preventDefault();
            mlZone.classList.remove('dragover');
            if (e.dataTransfer.files[0]) applyMlUpload(mlZone, e.dataTransfer.files[0], mod.code, card, data);
        });
        mlInput.addEventListener('change', () => {
            if (mlInput.files[0]) applyMlUpload(mlZone, mlInput.files[0], mod.code, card, data);
            mlInput.value = '';
        });
    }

    // Notenveröffentlichung toggle
    if (publishToggle) {
        publishToggle.addEventListener('change', () => {
            if (!data.pruefungsDocs) data.pruefungsDocs = {};
            data.pruefungsDocs[mod.code] = {
                ...(data.pruefungsDocs[mod.code] || {}),
                notenVeroeffentlicht: publishToggle.checked
            };
            const msg = publishToggle.checked
                ? 'Noten f\u00fcr Studierende freigegeben.'
                : 'Notenver\u00f6ffentlichung zur\u00fcckgezogen.';
            showCardAlert(alertEl, msg, publishToggle.checked ? 'success' : 'warning');
        });
    }
}

function applyDocUpload(zone, file, moduleCode, card, data) {
    const today = new Date().toISOString().slice(0, 10);
    if (!data.pruefungsDocs) data.pruefungsDocs = {};
    data.pruefungsDocs[moduleCode] = {
        ...(data.pruefungsDocs[moduleCode] || {}),
        examFileName: file.name,
        uploadedAt: today
    };

    // Update or insert the file info row (not the ML row)
    let fileRow = card.querySelector('.pruefung-file-row:not(.pruefung-file-row--ml)');
    const uploadZone = card.querySelector('.dok-upload-zone');
    if (!fileRow && uploadZone) {
        fileRow = document.createElement('div');
        fileRow.className = 'pruefung-file-row';
        uploadZone.parentElement.insertBefore(fileRow, uploadZone);
    }
    if (fileRow) {
        fileRow.innerHTML = `
            <span class="material-symbols-rounded">description</span>
            <span>${escapeHTML(file.name)}</span>
            <span class="pruefung-file-date">Hochgeladen: ${today}</span>`;
    }

    const p = zone.querySelector('p');
    if (p) p.textContent = 'Datei ersetzen';

    // Auto-advance status: offen → eingereicht
    const statusSelect = card.querySelector('.pruefung-status-select');
    if (statusSelect && statusSelect.value === 'offen') {
        statusSelect.value = 'eingereicht';
        card.dataset.status = 'eingereicht';
        updatePipeline(card, 'eingereicht', card.dataset.examType || '');
        data.pruefungsDocs[moduleCode].status = 'eingereicht';
    }
}

function applyMlUpload(zone, file, moduleCode, card, data) {
    const today = new Date().toISOString().slice(0, 10);
    if (!data.pruefungsDocs) data.pruefungsDocs = {};
    data.pruefungsDocs[moduleCode] = {
        ...(data.pruefungsDocs[moduleCode] || {}),
        musterloesungFileName: file.name,
        musterloesungAt: today
    };

    let mlRow = card.querySelector('.pruefung-file-row--ml');
    if (!mlRow) {
        mlRow = document.createElement('div');
        mlRow.className = 'pruefung-file-row pruefung-file-row--ml';
        zone.parentElement.insertBefore(mlRow, zone);
    }
    mlRow.innerHTML = `
        <span class="material-symbols-rounded">task_alt</span>
        <span>${escapeHTML(file.name)}</span>
        <span class="pruefung-file-date">Hochgeladen: ${today}</span>`;

    const p = zone.querySelector('p');
    if (p) p.textContent = 'Datei ersetzen';

    showCardAlert(card.querySelector('.pruefung-card-alert'), 'Musterlösung hochgeladen.', 'success');
}

function initAnmeldungenPanel(card) {
    card.querySelector('.anm-print-btn')?.addEventListener('click', () => {
        showCardAlert(
            card.querySelector('.pruefung-card-alert'),
            'Anwesenheitsliste wird als PDF generiert\u2026',
            'info'
        );
    });
}

function initEinreichungenPanel(card, data) {
    // Toggle feedback row
    card.querySelectorAll('.sub-feedback-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const subId = parseInt(btn.dataset.subId);
            const row = card.querySelector(`.sub-feedback-row[data-sub-id="${subId}"]`);
            if (!row) return;
            const isHidden = row.style.display !== 'table-row';
            row.style.display = isHidden ? 'table-row' : 'none';
        });
    });

    // Cancel feedback
    card.querySelectorAll('.sub-feedback-cancel').forEach(btn => {
        btn.addEventListener('click', () => {
            const subId = parseInt(btn.dataset.subId);
            const row = card.querySelector(`.sub-feedback-row[data-sub-id="${subId}"]`);
            if (row) row.style.display = 'none';
        });
    });

    // Save feedback
    card.querySelectorAll('.sub-feedback-save').forEach(btn => {
        btn.addEventListener('click', () => {
            const subId = parseInt(btn.dataset.subId);
            const row = card.querySelector(`.sub-feedback-row[data-sub-id="${subId}"]`);
            const input = row?.querySelector('.sub-feedback-input');
            const alertEl = card.querySelector('.pruefung-card-alert');
            if (!input || !data.studienarbeiten) return;

            const sub = data.studienarbeiten.find(s => s.id === subId);
            if (sub) {
                sub.feedback = input.value.trim();
                sub.status = 'bewertet';
            }

            if (row) row.style.display = 'none';

            // Mark toggle button to indicate saved feedback
            const toggle = card.querySelector(`.sub-feedback-toggle[data-sub-id="${subId}"]`);
            if (toggle) toggle.classList.add('sub-feedback-toggle--has');

            showCardAlert(alertEl, 'Feedback gespeichert.', 'success');
        });
    });
}

function initNotenPanel(card, mod, data, participants, matchedSeries) {
    const alertEl = card.querySelector('.pruefung-card-alert');

    // Mode switcher
    const modeBtns = card.querySelectorAll('.grading-mode-btn');
    const modePanels = card.querySelectorAll('.note-mode-panel');
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            modePanels.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const panel = card.querySelector(`.note-mode-panel[data-panel="${btn.dataset.mode}"]`);
            if (panel) panel.classList.add('active');

            // Refresh statistics on every switch (grades may have been saved)
            if (btn.dataset.mode === 'statistik' && panel) {
                const fresh = collectExistingGrades(data, matchedSeries);
                panel.innerHTML = buildStatistikPanel(fresh, participants);
            }
        });
    });

    // Manual save
    const manualSave = card.querySelector('.note-save-btn[data-mode="manual"]');
    if (manualSave) {
        manualSave.addEventListener('click', () => {
            const results = [];
            card.querySelectorAll('.note-grade-select').forEach(sel => {
                if (sel.value) results.push({ studentId: parseInt(sel.dataset.studentId), grade: sel.value });
            });
            if (!results.length) {
                showCardAlert(alertEl, 'Bitte mindestens eine Note eingeben.', 'error');
                return;
            }
            persistGrades(results, data, matchedSeries, mod);
            showCardAlert(alertEl, `${results.length} Note(n) gespeichert.`, 'success');
        });
    }

    // Points auto-calculate on input
    card.querySelectorAll('.note-pts-input').forEach(inp => {
        inp.addEventListener('input', () => {
            const thresholds = getCustomThresholds(card);
            const sid = parseInt(inp.dataset.studentId);
            const preview = card.querySelector(`.note-pts-preview[data-student-id="${sid}"]`);
            if (!preview) return;
            const val = parseFloat(inp.value);
            if (inp.value === '' || isNaN(val)) {
                preview.textContent = '—';
                delete preview.dataset.grade;
            } else {
                const grade = pointsToGrade(val, thresholds);
                preview.textContent = grade;
                preview.className = `note-pts-preview ${gradeColorClass(parseFloat(grade))}`;
                preview.dataset.grade = grade;
            }
        });
    });

    // Points save
    const pointsSave = card.querySelector('.note-save-btn[data-mode="points"]');
    if (pointsSave) {
        pointsSave.addEventListener('click', () => {
            const results = [];
            card.querySelectorAll('.note-pts-preview[data-grade]').forEach(cell => {
                results.push({ studentId: parseInt(cell.dataset.studentId), grade: cell.dataset.grade });
            });
            if (!results.length) {
                showCardAlert(alertEl, 'Bitte zuerst berechnen.', 'error');
                return;
            }
            persistGrades(results, data, matchedSeries, mod);
            showCardAlert(alertEl, `${results.length} Note(n) \u00fcbernommen.`, 'success');
        });
    }

    // CSV
    const csvZone = card.querySelector('.note-csv-zone');
    const csvInput = card.querySelector('.note-csv-input');
    const csvPreview = card.querySelector('.note-csv-preview');
    if (csvZone && csvInput) {
        csvZone.addEventListener('click', () => csvInput.click());
        csvZone.addEventListener('dragover', e => { e.preventDefault(); csvZone.classList.add('dragover'); });
        csvZone.addEventListener('dragleave', () => csvZone.classList.remove('dragover'));
        csvZone.addEventListener('drop', e => {
            e.preventDefault();
            csvZone.classList.remove('dragover');
            if (e.dataTransfer.files[0]) handleCsv(e.dataTransfer.files[0], alertEl, csvPreview, mod, data, matchedSeries);
        });
        csvInput.addEventListener('change', () => {
            if (csvInput.files[0]) handleCsv(csvInput.files[0], alertEl, csvPreview, mod, data, matchedSeries);
            csvInput.value = '';
        });
    }
}

// ── Grade utilities ────────────────────────────────────────────────────────────

function getCustomThresholds(card) {
    const thresholds = GRADE_THRESHOLDS.map(t => ({ ...t }));
    card.querySelectorAll('.pts-min-input').forEach(inp => {
        const idx = parseInt(inp.dataset.idx);
        if (!isNaN(idx) && thresholds[idx]) thresholds[idx].min = parseInt(inp.value) || 0;
    });
    return thresholds.sort((a, b) => b.min - a.min);
}

function handleCsv(file, alertEl, previewEl, mod, data, matchedSeries) {
    const reader = new FileReader();
    reader.onload = e => {
        const lines = e.target.result.split(/\r?\n/).filter(l => l.trim());
        const parsed = lines.map(line => {
            const parts = line.split(';').map(p => p.trim());
            const matNr = parts[0] || '';
            const grade = parts[1] || '';
            if (!grade) return { matNr, grade, valid: false, error: 'Ung\u00fcltiges Format', userName: '—' };
            const u = data.users.find(u => u.matriculationNumber === matNr);
            if (!u) return { matNr, grade, valid: false, error: 'Matrikelnr. unbekannt', userName: '—' };
            if (!VALID_GRADES.includes(grade)) return { matNr, grade, valid: false, error: 'Ung\u00fcltige Note', userName: u.name, userId: u.id };
            return { matNr, grade, valid: true, userName: u.name, userId: u.id, error: '' };
        });

        const validCount = parsed.filter(p => p.valid).length;
        const errorCount = parsed.filter(p => !p.valid).length;

        previewEl.innerHTML = `
            <table class="management-table" style="margin-top:0.75rem;">
                <thead><tr><th>Matrikelnr.</th><th>Name</th><th>Note</th><th>Status</th></tr></thead>
                <tbody>${parsed.map(p => `
                    <tr>
                        <td>${escapeHTML(p.matNr)}</td>
                        <td>${escapeHTML(p.userName)}</td>
                        <td>${escapeHTML(p.grade || '—')}</td>
                        <td>${p.valid
                ? '<div class="status-indicator passed"><span class="status-dot"></span>OK</div>'
                : `<div class="status-indicator failed"><span class="status-dot"></span>${escapeHTML(p.error)}</div>`
            }</td>
                    </tr>`).join('')}
                </tbody>
            </table>
            ${validCount > 0 ? `
                <div class="mgmt-actions-right" style="margin-top:0.5rem;">
                    <button class="btn btn-primary note-csv-apply-btn">
                        <span class="material-symbols-rounded">save</span>
                        \u00dcbernehmen (${validCount} g\u00fcltig)
                    </button>
                </div>` : ''}`;

        previewEl.querySelector('.note-csv-apply-btn')?.addEventListener('click', () => {
            const results = parsed.filter(p => p.valid).map(p => ({ studentId: p.userId, grade: p.grade }));
            persistGrades(results, data, matchedSeries, mod);
            showCardAlert(alertEl,
                `Import: ${validCount} Note(n) \u00fcbernommen${errorCount ? `, ${errorCount} Fehler` : ''}.`,
                'success'
            );
            previewEl.innerHTML = '';
        });
    };
    reader.readAsText(file);
}

// ── UI helpers ─────────────────────────────────────────────────────────────────

function showCardAlert(el, message, type) {
    if (!el) return;
    el.innerHTML = buildAlert(message, type);
    setTimeout(() => { el.innerHTML = ''; }, 3000);
}

function showDownloadToast(fileName) {
    const toast = document.createElement('div');
    toast.className = 'management-alert success';
    toast.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;max-width:380px;animation:none;';
    toast.innerHTML = `<span class="material-symbols-rounded">download</span> Download gestartet: <strong>${escapeHTML(fileName)}</strong>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
