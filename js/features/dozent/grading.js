import { escapeHTML } from '../../core/utils.js';

// Valid German grade scale
const VALID_GRADES = ['1.0', '1.3', '1.7', '2.0', '2.3', '2.7', '3.0', '3.3', '3.7', '4.0', '5.0'];

// =============================================================================
// Public API
// =============================================================================

/**
 * Renders the Dozent's grading interface with course selector,
 * student table, grade inputs, and save functionality.
 */
export function renderDozentGrading(data, user) {
    const container = document.querySelector('.dozent-grading-content');
    if (!container) return;

    const activeCourses = data.modules.filter(
        m => m.dozentId === user.id && (m.status === 'active' || m.status === 'registered')
    );

    if (activeCourses.length === 0) {
        container.innerHTML = buildEmptyState('grading', 'Keine aktiven Kurse f\u00fcr die Notenvergabe.');
        return;
    }

    container.innerHTML = buildGradingInterface(data, activeCourses);
    initGradingInteraction(container, data, activeCourses);
}

// =============================================================================
// Grading Interface
// =============================================================================

/**
 * Builds the complete grading interface HTML.
 */
function buildGradingInterface(data, activeCourses) {
    const courseOptions = activeCourses.map(c =>
        `<option value="${escapeHTML(c.code)}">${escapeHTML(c.name)} (${escapeHTML(c.code)})</option>`
    ).join('');

    return `
        <div class="card">
            <div class="management-form dozent-grading-selector">
                <div class="form-group">
                    <label for="dozent-course-select">Kurs ausw\u00e4hlen</label>
                    <select id="dozent-course-select" class="form-input">
                        <option value="">\u2014 Bitte Kurs w\u00e4hlen \u2014</option>
                        ${courseOptions}
                    </select>
                </div>
            </div>

            <div id="dozent-grading-alert" aria-live="polite"></div>
            <div id="dozent-grading-table-area"></div>
        </div>`;
}

/**
 * Initializes event listeners for the grading interface.
 */
function initGradingInteraction(container, data, activeCourses) {
    const courseSelect = container.querySelector('#dozent-course-select');
    const tableArea = container.querySelector('#dozent-grading-table-area');
    const alertArea = container.querySelector('#dozent-grading-alert');

    if (!courseSelect || !tableArea || !alertArea) return;

    courseSelect.addEventListener('change', () => {
        alertArea.innerHTML = '';
        const selectedCode = courseSelect.value;

        if (!selectedCode) {
            tableArea.innerHTML = '';
            return;
        }

        const course = activeCourses.find(c => c.code === selectedCode);
        if (!course) {
            tableArea.innerHTML = '';
            return;
        }

        renderGradingTable(tableArea, alertArea, course, data);
    });
}

/**
 * Renders the grading table for a selected course.
 * Shows enrolled students with their current grades and grade input dropdowns.
 */
function renderGradingTable(tableArea, alertArea, course, data) {
    const participants = findParticipantsForCourse(course, data);
    const matchedSeries = findMatchingEventSeries(course, data);

    if (participants.length === 0) {
        tableArea.innerHTML = `
            <div class="management-empty">
                <span class="material-icons-round">people_outline</span>
                <p>Keine Studierenden f\u00fcr diesen Kurs gefunden.</p>
            </div>`;
        return;
    }

    // Collect existing grades for these students from examResults
    const existingGrades = collectExistingGrades(data, matchedSeries);

    const rows = participants.map(student => {
        const currentGrade = existingGrades[student.id] || '';
        const gradeDisplay = currentGrade ? currentGrade : '-';
        const gradeClass = currentGrade ? getGradeColorClass(parseFloat(currentGrade)) : '';

        return `
            <tr>
                <td>${escapeHTML(student.name)}</td>
                <td>${escapeHTML(student.matriculationNumber || '-')}</td>
                <td>
                    <span class="${gradeClass}">${escapeHTML(gradeDisplay)}</span>
                </td>
                <td>
                    <select class="form-input dozent-grade-input" data-student-id="${student.id}">
                        <option value="">\u2014</option>
                        ${VALID_GRADES.map(g =>
                            `<option value="${g}"${currentGrade === g ? ' selected' : ''}>${g}</option>`
                        ).join('')}
                    </select>
                </td>
            </tr>`;
    }).join('');

    tableArea.innerHTML = `
        <div class="dozent-grading-course-info">
            <span class="material-icons-round" aria-hidden="true">info</span>
            ${escapeHTML(course.name)} &bull; ${escapeHTML(course.exam?.type || 'Klausur')} &bull;
            Pr\u00fcfungstermin: ${course.exam ? escapeHTML(course.exam.date) : 'TBA'}
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
            <tbody>
                ${rows}
            </tbody>
        </table>
        <div class="dozent-grading-actions">
            <span class="dozent-grading-count">${participants.length} Studierende</span>
            <button class="btn btn-primary" id="dozent-save-grades-btn" type="button">
                <span class="material-icons-round" aria-hidden="true">save</span>
                Noten speichern
            </button>
        </div>`;

    // Attach save handler
    const saveBtn = tableArea.querySelector('#dozent-save-grades-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            saveGrades(tableArea, alertArea, course, data, matchedSeries);
        });
    }
}

/**
 * Saves entered grades to mockData.examResults.
 */
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
        alertArea.innerHTML = `
            <div class="management-alert error">
                <span class="material-icons-round">warning</span>
                Bitte mindestens eine Note eingeben.
            </div>`;
        return;
    }

    // Store grades in examResults using the matched series
    let saved = false;
    if (matchedSeries) {
        const klausurEvent = (matchedSeries.events || []).find(ev => ev.type === 'Klausur');
        const key = klausurEvent
            ? matchedSeries.id + '-' + klausurEvent.id
            : matchedSeries.id + '-0';
        data.examResults[key] = results;
        saved = true;
    }

    // Sync grades into the module objects so the student view reflects them
    results.forEach(r => {
        const moduleEntry = data.modules.find(m => m.code === course.code);
        if (moduleEntry) {
            moduleEntry.grade = parseFloat(r.grade);
        }
    });

    if (!saved) {
        alertArea.innerHTML = `
            <div class="management-alert error">
                <span class="material-icons-round">warning</span>
                Noten konnten nicht gespeichert werden (keine Veranstaltungsreihe zugeordnet).
            </div>`;
        return;
    }

    alertArea.innerHTML = `
        <div class="management-alert success">
            <span class="material-icons-round">check_circle</span>
            ${filledCount} Note(n) f\u00fcr ${escapeHTML(course.name)} erfolgreich gespeichert.
        </div>`;

    // Re-render the grading table to reflect updated grades
    setTimeout(() => {
        renderGradingTable(tableArea, alertArea, course, data);
    }, 100);
}

// =============================================================================
// Data Helpers
// =============================================================================

/**
 * Finds the eventSeries that matches a given module.
 * Uses name similarity: checks if the series name is contained
 * in the module name, or vice versa (case-insensitive).
 */
function findMatchingEventSeries(course, data) {
    if (!data.eventSeries) return null;

    const courseName = course.name.toLowerCase();

    // Try exact-ish match first
    let match = data.eventSeries.find(s =>
        s.name.toLowerCase() === courseName
    );
    if (match) return match;

    // Try substring match: series name in module name or reverse
    match = data.eventSeries.find(s => {
        const seriesName = s.name.toLowerCase();
        return courseName.includes(seriesName) || seriesName.includes(courseName);
    });
    if (match) return match;

    // Try word overlap: find series with most words in common
    const courseWords = courseName.split(/[\s\-]+/).filter(w => w.length > 2);
    let bestMatch = null;
    let bestScore = 0;

    data.eventSeries.forEach(s => {
        const seriesWords = s.name.toLowerCase().split(/[\s\-]+/).filter(w => w.length > 2);
        const overlap = courseWords.filter(w => seriesWords.some(sw => sw.includes(w) || w.includes(sw))).length;
        if (overlap > bestScore) {
            bestScore = overlap;
            bestMatch = s;
        }
    });

    return bestScore > 0 ? bestMatch : null;
}

/**
 * Finds participant User objects for a course via eventSeries matching.
 */
function findParticipantsForCourse(course, data) {
    const series = findMatchingEventSeries(course, data);
    if (!series || !series.studentIds || series.studentIds.length === 0) return [];

    return series.studentIds
        .map(sid => data.users.find(u => u.id === sid))
        .filter(Boolean);
}

/**
 * Collects existing grades for students from a matched event series.
 * Returns a map of studentId -> grade string.
 */
function collectExistingGrades(data, matchedSeries) {
    const grades = {};
    if (!matchedSeries || !data.examResults) return grades;

    // Look through all examResults keys that start with this series ID
    const prefix = matchedSeries.id + '-';
    Object.keys(data.examResults).forEach(key => {
        if (key.startsWith(prefix)) {
            const results = data.examResults[key];
            results.forEach(r => {
                // Only store the most recent grade (last key wins)
                grades[r.studentId] = r.grade;
            });
        }
    });

    return grades;
}

/**
 * Returns a CSS class name for grade coloring.
 */
function getGradeColorClass(gradeNum) {
    if (Number.isNaN(gradeNum)) return '';
    if (gradeNum <= 2.0) return 'dozent-grade-good';
    if (gradeNum <= 3.3) return 'dozent-grade-ok';
    return 'dozent-grade-bad';
}

// =============================================================================
// Shared UI Helpers
// =============================================================================

/**
 * Builds a centered empty-state card.
 */
function buildEmptyState(icon, message) {
    return `
        <div class="card full-width">
            <div class="management-empty">
                <span class="material-icons-round">${escapeHTML(icon)}</span>
                <p>${escapeHTML(message)}</p>
            </div>
        </div>`;
}
