import { escapeHTML } from '../../../core/utils.js';
import { VALID_GRADES, populateKlausurDropdown } from './index.js';

export function buildCsvImportTab(data) {
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
                    <span class="material-symbols-rounded">upload_file</span>
                    <p>CSV-Datei hier ablegen oder klicken</p>
                    <p class="hint">Format: Matrikelnummer;Note (eine Zeile pro Student)</p>
                    <input type="file" accept=".csv" id="ci-file-input" class="mgmt-hidden">
                </div>

                <div id="ci-alert-area"></div>
                <div id="ci-preview-area"></div>
            </div>
        </div>`;
}

export function initCsvImportTab(container, data) {
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

    uploadZone.addEventListener('click', () => {
        fileInput.click();
    });

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
                <span class="material-symbols-rounded">error</span>
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
                        <span class="material-symbols-rounded">save</span>
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
                        <span class="material-symbols-rounded">check_circle</span>
                        Import abgeschlossen: ${validCount} Note(n) übernommen${errorCount > 0 ? `, ${errorCount} Fehler übersprungen` : ''}.
                    </div>`;

                previewArea.innerHTML = '';
            });
        }
    };

    reader.readAsText(file);
}
