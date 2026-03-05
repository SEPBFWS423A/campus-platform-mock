import { escapeHTML } from '../../../core/utils.js';
import { VALID_GRADES, populateKlausurDropdown } from './index.js';

export function buildGradeDistributionTab(data) {
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

export function initGradeDistributionTab(container, data) {
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
