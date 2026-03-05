import { buildOverviewTab } from './overview.js';
import { buildGradeEntryTab, initGradeEntryTab } from './gradeEntry.js';
import { buildGradeDistributionTab, initGradeDistributionTab } from './gradeDistribution.js';
import { buildCsvImportTab, initCsvImportTab } from './csvImport.js';

// Valid German grade scale
export const VALID_GRADES = ['1.0', '1.3', '1.7', '2.0', '2.3', '2.7', '3.0', '3.3', '3.7', '4.0', '5.0'];

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

function buildTabContents(data) {
    return `
        ${buildOverviewTab(data)}
        ${buildGradeEntryTab(data)}
        ${buildGradeDistributionTab(data)}
        ${buildCsvImportTab(data)}
    `;
}

/**
 * Populates a Klausur dropdown with only "Klausur"-type events
 * from the selected event series.
 */
export function populateKlausurDropdown(selectEl, data, seriesId) {
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
