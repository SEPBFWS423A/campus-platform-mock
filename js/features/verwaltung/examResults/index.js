import { buildOverviewTab } from './overview.js';
import { buildGradeEntryTab, initGradeEntryTab } from './gradeEntry.js';
import { buildGradeDistributionTab, initGradeDistributionTab } from './gradeDistribution.js';
import { buildCsvImportTab, initCsvImportTab } from './csvImport.js';
import { initTabs } from '../../shared/tabSwitching.js';
import { VALID_GRADES } from '../../shared/constants.js';

export { VALID_GRADES };

export function renderExamResultsManagement(data) {
    const container = document.querySelector('.admin-exams-content');
    if (!container) return;

    container.innerHTML = buildTabs() + buildTabContents(data);
    initTabs(container, { tabSelector: '.management-tab', panelSelector: '.management-tab-content' });
    initGradeEntryTab(container, data);
    initGradeDistributionTab(container, data);
    initCsvImportTab(container, data);
}

function buildTabs() {
    return `
        <div class="management-tabs">
            <button class="management-tab active" data-tab="exam-overview">
                <span class="material-symbols-rounded">event_note</span>
                Pr\u00fcfungs\u00fcbersicht
            </button>
            <button class="management-tab" data-tab="grade-entry">
                <span class="material-symbols-rounded">edit_note</span>
                Noten eintragen
            </button>
            <button class="management-tab" data-tab="grade-distribution">
                <span class="material-symbols-rounded">bar_chart</span>
                Notenverteilung
            </button>
            <button class="management-tab" data-tab="csv-import">
                <span class="material-symbols-rounded">upload_file</span>
                CSV-Import
            </button>
        </div>`;
}

function buildTabContents(data) {
    return `
        ${buildOverviewTab(data)}
        ${buildGradeEntryTab(data)}
        ${buildGradeDistributionTab(data)}
        ${buildCsvImportTab(data)}
    `;
}

export function populateKlausurDropdown(selectEl, data, seriesId) {
    selectEl.innerHTML = '<option value="">\u2014 Bitte w\u00e4hlen \u2014</option>';
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
