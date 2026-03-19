import { escapeHTML } from '../../core/utils.js';
import { buildAlert } from '../shared/uiComponents.js';
import { findMatchingEventSeries, findParticipantsForCourse } from './dozentHelpers.js';
import { VALID_GRADES } from '../shared/constants.js';

const STATUSES = [
    { value: 'offen',         label: 'Offen' },
    { value: 'eingereicht',   label: 'Eingereicht' },
    { value: 'geschrieben',   label: 'Geschrieben' },
    { value: 'abgeschlossen', label: 'Abgeschlossen' }
];

const STATUS_INDEX = Object.fromEntries(STATUSES.map((s, i) => [s.value, i]));

const GRADE_THRESHOLDS = [
    { min: 95, grade: '1.0' }, { min: 90, grade: '1.3' }, { min: 85, grade: '1.7' },
    { min: 80, grade: '2.0' }, { min: 75, grade: '2.3' }, { min: 70, grade: '2.7' },
    { min: 65, grade: '3.0' }, { min: 60, grade: '3.3' }, { min: 55, grade: '3.7' },
    { min: 50, grade: '4.0' }, { min: 0,  grade: '5.0' }
];

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

    content.innerHTML = buildFilterBar() + `<div class="pruefung-cards-list">${
        modules.map(m => buildCard(m, data)).join('')
    }</div>`;

    initInteractions(content, modules, data);
}

// ── Build HTML ────────────────────────────────────────────────────────────────

function buildFilterBar() {
    return `
        <div class="filter-bar" role="group" aria-label="Prüfungsfilter" style="margin-bottom:1.25rem;">
            <button class="filter-chip active" data-filter="all" aria-pressed="true">Alle</button>
            ${STATUSES.map(s =>
                `<button class="filter-chip" data-filter="${s.value}" aria-pressed="false">${s.label}</button>`
            ).join('')}
        </div>`;
}

function buildCard(mod, data) {
    const doc = (data.pruefungsDocs || {})[mod.code] || { status: 'offen', examFileName: null, uploadedAt: null, notes: '' };
    const submissions = (data.studienarbeiten || []).filter(a => a.moduleCode === mod.code);
    const statusIdx = STATUS_INDEX[doc.status] ?? 0;

    const examType = mod.exam?.type || 'Prüfung';
    const isProjectType = /projekt|arbeit|referat|seminar/i.test(examType);
    const typeBadgeClass = isProjectType ? 'lehrveranstaltung' : 'klausur';

    const statusOptions = STATUSES.map(s =>
        `<option value="${s.value}"${doc.status === s.value ? ' selected' : ''}>${s.label}</option>`
    ).join('');

    const pipelineHTML = STATUSES.map((s, i) => {
        const stepClass = i < statusIdx ? 'done' : i === statusIdx ? 'current' : '';
        const lineClass = i < statusIdx ? 'done' : '';
        const connector = i < STATUSES.length - 1
            ? `<div class="pipeline-line ${lineClass}" aria-hidden="true"></div>` : '';
        return `
            <div class="pipeline-step ${stepClass}" role="listitem">
                <div class="pipeline-dot"></div>
                <span class="pipeline-label">${s.label}</span>
            </div>${connector}`;
    }).join('');

    const submBadge = submissions.length > 0
        ? `<span class="badge" style="margin-left:0.3rem;vertical-align:middle;">${submissions.length}</span>`
        : '';

    const id = escapeHTML(mod.code);

    return `
        <div class="card pruefung-card" data-module="${id}" data-status="${escapeHTML(doc.status)}">

            <div class="pruefung-card-header">
                <div class="pruefung-card-info">
                    <div class="pruefung-card-title">
                        <span class="type-badge ${typeBadgeClass}">${escapeHTML(examType)}</span>
                        ${escapeHTML(mod.name)}
                    </div>
                    <div class="pruefung-card-meta">
                        ${escapeHTML(mod.code)}${
                            mod.exam?.date ? ` &bull; ${escapeHTML(mod.exam.date)}` : ''
                        }${
                            mod.exam?.time ? ` &bull; ${escapeHTML(mod.exam.time)}` : ''
                        }${
                            mod.exam?.room ? ` &bull; ${escapeHTML(mod.exam.room)}` : ''
                        }
                    </div>
                </div>
                <select class="form-input pruefung-status-select" data-module="${id}" aria-label="Status">
                    ${statusOptions}
                </select>
            </div>

            <div class="pruefung-pipeline" role="list" aria-label="Prüfungsprozess">
                ${pipelineHTML}
            </div>

            <div class="section-tabs pruefung-card-tabs" role="tablist" aria-label="Bereiche">
                <button class="section-tab active" data-tab="dok-${id}" role="tab" aria-selected="true">
                    <span class="material-symbols-rounded" aria-hidden="true">upload_file</span>
                    Dokument
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
                ${buildDokumentPanel(doc, id)}
            </div>
            <div id="sub-${id}" class="tab-content">
                ${buildEinreichungenPanel(submissions)}
            </div>
            <div id="note-${id}" class="tab-content">
                ${buildNotenPanel(mod, data)}
            </div>

            <div class="pruefung-card-alert" aria-live="polite"></div>
        </div>`;
}

function buildDokumentPanel(doc, id) {
    const fileRow = doc.examFileName ? `
        <div class="pruefung-file-row">
            <span class="material-symbols-rounded">description</span>
            <span>${escapeHTML(doc.examFileName)}</span>
            ${doc.uploadedAt
                ? `<span class="pruefung-file-date">Hochgeladen: ${escapeHTML(doc.uploadedAt)}</span>`
                : ''}
        </div>` : '';

    return `
        ${fileRow}
        <div class="csv-upload-zone dok-upload-zone" data-module="${id}">
            <span class="material-symbols-rounded">upload_file</span>
            <p>${doc.examFileName ? 'Datei ersetzen' : 'Klausur / Aufgabenstellung hochladen (.pdf, .docx, .zip)'}</p>
            <input type="file" accept=".pdf,.docx,.zip" class="mgmt-hidden dok-file-input">
        </div>
        <div class="form-group" style="margin-top:0.75rem;">
            <label>Hinweise / Notizen</label>
            <input type="text" class="form-input dok-notes-input"
                   placeholder="z.\u00a0B. Keine Hilfsmittel, Sitzplan beachten\u2026"
                   value="${escapeHTML(doc.notes || '')}">
        </div>
        <div style="margin-top:0.75rem;text-align:right;">
            <button class="btn btn-sm btn-primary dok-save-btn" data-module="${id}">
                <span class="material-symbols-rounded">save</span> Speichern
            </button>
        </div>`;
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
                    <button class="btn btn-sm btn-outline sub-download-btn" data-file="${escapeHTML(s.fileName)}">
                        <span class="material-symbols-rounded">download</span>
                        ${escapeHTML(s.size)}
                    </button>
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
                    <th scope="col">Download</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
}

function buildNotenPanel(mod, data) {
    const participants = findParticipantsForCourse(mod, data);
    const matchedSeries = findMatchingEventSeries(mod, data);
    const existing = collectExistingGrades(data, matchedSeries);

    if (participants.length === 0) {
        return `
            <div class="management-empty" style="padding:1.25rem 0;">
                <span class="material-symbols-rounded">people_outline</span>
                <p>Keine Studierenden f\u00fcr diesen Kurs gefunden.</p>
            </div>`;
    }

    const manualRows = participants.map(s => {
        const grade = existing[s.id] || '';
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
                <button class="btn btn-outline note-calc-btn">
                    <span class="material-symbols-rounded">calculate</span> Berechnen
                </button>
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
        </div>`;
}

// ── Interactions ──────────────────────────────────────────────────────────────

function initInteractions(content, modules, data) {
    initFilterChips(content);

    modules.forEach(mod => {
        const card = content.querySelector(`.pruefung-card[data-module="${mod.code}"]`);
        if (!card) return;

        initCardTabs(card);
        initStatusSelect(card, mod, data);
        initDokumentPanel(card, mod, data);
        card.querySelectorAll('.sub-download-btn').forEach(btn =>
            btn.addEventListener('click', () => showDownloadToast(btn.dataset.file))
        );
        initNotenPanel(card, mod, data);
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
            list.querySelectorAll('.pruefung-card').forEach(card => {
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
        card.dataset.status = status;
        updatePipeline(card, status);
        if (!data.pruefungsDocs) data.pruefungsDocs = {};
        data.pruefungsDocs[mod.code] = { ...(data.pruefungsDocs[mod.code] || {}), status };
    });
}

function updatePipeline(card, status) {
    const idx = STATUS_INDEX[status] ?? 0;
    card.querySelectorAll('.pipeline-step').forEach((step, i) => {
        step.classList.toggle('done', i < idx);
        step.classList.toggle('current', i === idx);
    });
    card.querySelectorAll('.pipeline-line').forEach((line, i) => {
        line.classList.toggle('done', i < idx);
    });
}

function initDokumentPanel(card, mod, data) {
    const zone = card.querySelector('.dok-upload-zone');
    const fileInput = card.querySelector('.dok-file-input');
    const saveBtn = card.querySelector('.dok-save-btn');
    const notesInput = card.querySelector('.dok-notes-input');
    const alertEl = card.querySelector('.pruefung-card-alert');

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
}

function applyDocUpload(zone, file, moduleCode, card, data) {
    const today = new Date().toISOString().slice(0, 10);
    if (!data.pruefungsDocs) data.pruefungsDocs = {};
    data.pruefungsDocs[moduleCode] = {
        ...(data.pruefungsDocs[moduleCode] || {}),
        examFileName: file.name,
        uploadedAt: today
    };

    // Update or create the file info row
    let fileRow = card.querySelector('.pruefung-file-row');
    const zone2 = card.querySelector('.dok-upload-zone');
    if (!fileRow && zone2) {
        fileRow = document.createElement('div');
        fileRow.className = 'pruefung-file-row';
        zone2.parentElement.insertBefore(fileRow, zone2);
    }
    if (fileRow) {
        fileRow.innerHTML = `
            <span class="material-symbols-rounded">description</span>
            <span>${escapeHTML(file.name)}</span>
            <span class="pruefung-file-date">Hochgeladen: ${today}</span>`;
    }

    const p = zone.querySelector('p');
    if (p) p.textContent = 'Datei ersetzen';

    // Auto-advance status from "offen" → "eingereicht"
    const statusSelect = card.querySelector('.pruefung-status-select');
    if (statusSelect && statusSelect.value === 'offen') {
        statusSelect.value = 'eingereicht';
        card.dataset.status = 'eingereicht';
        updatePipeline(card, 'eingereicht');
        if (data.pruefungsDocs[moduleCode]) {
            data.pruefungsDocs[moduleCode].status = 'eingereicht';
        }
    }
}

function initNotenPanel(card, mod, data) {
    const matchedSeries = findMatchingEventSeries(mod, data);
    const alertEl = card.querySelector('.pruefung-card-alert');

    // Mode switcher
    const modeBtns = card.querySelectorAll('.grading-mode-btn');
    const modePanels = card.querySelectorAll('.note-mode-panel');
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            modePanels.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            card.querySelector(`.note-mode-panel[data-panel="${btn.dataset.mode}"]`)
                ?.classList.add('active');
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

    // Points calculate
    const calcBtn = card.querySelector('.note-calc-btn');
    if (calcBtn) {
        calcBtn.addEventListener('click', () => {
            const thresholds = getCustomThresholds(card);
            card.querySelectorAll('.note-pts-input').forEach(inp => {
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
    }

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

// ── Grade utilities ───────────────────────────────────────────────────────────

function persistGrades(results, data, matchedSeries, mod) {
    if (matchedSeries) {
        const klausurEvent = (matchedSeries.events || []).find(ev => ev.type === 'Klausur');
        const key = klausurEvent
            ? `${matchedSeries.id}-${klausurEvent.id}`
            : `${matchedSeries.id}-0`;
        const existing = data.examResults[key] || [];
        results.forEach(r => {
            const idx = existing.findIndex(e => e.studentId === r.studentId);
            if (idx >= 0) existing[idx].grade = r.grade;
            else existing.push({ studentId: r.studentId, grade: r.grade });
        });
        data.examResults[key] = existing;
    }
    results.forEach(r => {
        const entry = data.modules.find(m => m.code === mod.code);
        if (entry) entry.grade = parseFloat(r.grade);
    });
}

function collectExistingGrades(data, matchedSeries) {
    const grades = {};
    if (!matchedSeries || !data.examResults) return grades;
    const prefix = `${matchedSeries.id}-`;
    Object.keys(data.examResults).forEach(key => {
        if (key.startsWith(prefix)) {
            data.examResults[key].forEach(r => { grades[r.studentId] = r.grade; });
        }
    });
    return grades;
}

function gradeColorClass(n) {
    if (isNaN(n)) return '';
    if (n <= 2.0) return 'dozent-grade-good';
    if (n <= 3.3) return 'dozent-grade-ok';
    return 'dozent-grade-bad';
}

function getCustomThresholds(card) {
    const thresholds = GRADE_THRESHOLDS.map(t => ({ ...t }));
    card.querySelectorAll('.pts-min-input').forEach(inp => {
        const idx = parseInt(inp.dataset.idx);
        if (!isNaN(idx) && thresholds[idx]) thresholds[idx].min = parseInt(inp.value) || 0;
    });
    return thresholds.sort((a, b) => b.min - a.min);
}

function pointsToGrade(points, thresholds) {
    for (const t of thresholds) {
        if (points >= t.min) return t.grade;
    }
    return '5.0';
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
            const user = data.users.find(u => u.matriculationNumber === matNr);
            if (!user) return { matNr, grade, valid: false, error: 'Matrikelnr. unbekannt', userName: '—' };
            if (!VALID_GRADES.includes(grade)) return { matNr, grade, valid: false, error: 'Ung\u00fcltige Note', userName: user.name, userId: user.id };
            return { matNr, grade, valid: true, userName: user.name, userId: user.id, error: '' };
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

// ── UI helpers ────────────────────────────────────────────────────────────────

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
