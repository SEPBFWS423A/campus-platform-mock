import { escapeHTML } from '../../../core/utils.js';
import { showConfirmDialog } from '../../../core/modal.js';
import { renderEventManagement as renderSeriesCards } from './seriesCards.js';
import { initTabs } from '../../shared/tabSwitching.js';

function formatDateDE(isoStr) {
    if (!isoStr) return '';
    const [y, m, d] = isoStr.split('-');
    return `${d}.${m}.${y}`;
}

export function renderEventManagement(data) {
    const container = document.querySelector('.admin-events-content');
    if (!container) return;

    container.innerHTML = `
        <div class="management-tabs">
            <button class="management-tab active" data-tab="evt-series-panel">
                <span class="material-symbols-rounded">event</span> Veranstaltungsreihen
            </button>
            <button class="management-tab" data-tab="evt-vfz-panel">
                <span class="material-symbols-rounded">event_busy</span> Vorlesungsfreie Zeiten
            </button>
        </div>

        <div id="evt-series-panel" class="management-tab-content active">
            <div id="admin-events-series-slot"></div>
        </div>

        <div id="evt-vfz-panel" class="management-tab-content">
            ${buildVfzPanel(data)}
        </div>
    `;

    initTabs(container, { tabSelector: '.management-tab', panelSelector: '.management-tab-content' });

    renderSeriesCards(data);
    attachVfzListeners(container, data);
}

// ─── Vorlesungsfreie Zeiten ───────────────────────────────────────────────────

function buildVfzPanel(data) {
    const vfz = data.vorlesungsfreieZeiten || [];

    const rows = vfz.map(v => `
        <tr>
            <td><strong>${escapeHTML(v.name)}</strong></td>
            <td>${escapeHTML(formatDateDE(v.start))}</td>
            <td>${escapeHTML(formatDateDE(v.end))}</td>
            <td>
                <button class="btn-icon-only danger btn-delete-vfz" data-vfz-id="${v.id}" title="Löschen" type="button">
                    <span class="material-symbols-rounded">delete</span>
                </button>
            </td>
        </tr>`).join('');

    return `
        <div class="card mgmt-form-section">
            <div class="card-header mgmt-card-header"><h3>Vorlesungsfreie Zeit eintragen</h3></div>
            <div id="vfz-create-alert"></div>
            <div class="inline-create-form">
                <div class="form-group form-group--lg">
                    <label for="create-vfz-name">Bezeichnung</label>
                    <input type="text" id="create-vfz-name" placeholder="z.B. Osterferien">
                </div>
                <div class="form-group">
                    <label for="create-vfz-start">Von</label>
                    <input type="date" id="create-vfz-start">
                </div>
                <div class="form-group">
                    <label for="create-vfz-end">Bis</label>
                    <input type="date" id="create-vfz-end">
                </div>
                <button class="btn btn-sm btn-primary" id="btn-create-vfz" type="button">
                    <span class="material-symbols-rounded">add</span> Hinzufügen
                </button>
            </div>
            <div id="vfz-alert"></div>
        </div>

        <div class="card">
            <div class="card-header mgmt-card-header"><h3>Eingetragene vorlesungsfreie Zeiten</h3></div>
            <div class="exam-results-table-wrapper">
                <table class="management-table">
                    <thead>
                        <tr><th>Bezeichnung</th><th>Von</th><th>Bis</th><th>Aktion</th></tr>
                    </thead>
                    <tbody id="vfz-tbody">
                        ${rows || '<tr><td colspan="4" class="table-empty-cell">Keine Einträge vorhanden.</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function attachVfzListeners(container, data) {
    const btnCreate = container.querySelector('#btn-create-vfz');
    if (btnCreate) {
        btnCreate.addEventListener('click', () => {
            const name = container.querySelector('#create-vfz-name').value.trim();
            const start = container.querySelector('#create-vfz-start').value;
            const end = container.querySelector('#create-vfz-end').value;
            const alertEl = container.querySelector('#vfz-alert');

            if (!name || !start || !end) {
                if (alertEl) alertEl.innerHTML = '<div class="management-alert error">Bitte alle Felder ausfüllen.</div>';
                return;
            }
            if (start > end) {
                if (alertEl) alertEl.innerHTML = '<div class="management-alert error">Das Startdatum muss vor dem Enddatum liegen.</div>';
                return;
            }
            if (alertEl) alertEl.innerHTML = '';
            const maxId = (data.vorlesungsfreieZeiten || []).reduce((m, v) => Math.max(m, v.id), 0);
            if (!data.vorlesungsfreieZeiten) data.vorlesungsfreieZeiten = [];
            data.vorlesungsfreieZeiten.push({ id: maxId + 1, name, start, end });
            renderEventManagement(data);
        });
    }

    container.querySelectorAll('.btn-delete-vfz').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.vfzId, 10);
            const v = (data.vorlesungsfreieZeiten || []).find(x => x.id === id);
            if (!v) return;
            showConfirmDialog('Eintrag löschen',
                `Möchten Sie <strong>${escapeHTML(v.name)}</strong> wirklich löschen?`,
                () => {
                    data.vorlesungsfreieZeiten = data.vorlesungsfreieZeiten.filter(x => x.id !== id);
                    renderEventManagement(data);
                });
        });
    });
}
