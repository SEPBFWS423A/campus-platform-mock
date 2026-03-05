import { escapeHTML } from './utils.js';
import { initSectionTabs, renderCalendarForModules } from './schedule.js';
import { showModal, closeModal } from './modal.js';

// Valid German grade scale
const VALID_GRADES = ['1.0', '1.3', '1.7', '2.0', '2.3', '2.7', '3.0', '3.3', '3.7', '4.0', '5.0'];

// Day name abbreviations
const DAY_NAMES = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];

// =============================================================================
// Public API
// =============================================================================

/**
 * Renders the Dozent's course overview with two sub-tabs:
 * 1. Module overview (course cards)
 * 2. Calendar (weekly timetable for dozent's courses)
 */
export function renderDozentCourses(data, user) {
    renderDozentOverview(data, user);
    renderDozentCalendar(data, user);
    initDozentTabs();
}

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
        container.innerHTML = buildEmptyState('grading', 'Keine aktiven Kurse für die Notenvergabe.');
        return;
    }

    container.innerHTML = buildGradingInterface(data, activeCourses);
    initGradingInteraction(container, data, activeCourses);
}

// =============================================================================
// Course Overview
// =============================================================================

/**
 * Renders the Dozent's course cards in the overview tab.
 * Uses CSS classes instead of inline styles.
 */
function renderDozentOverview(data, user) {
    const container = document.querySelector('.dozent-courses-grid');
    if (!container) return;

    const myCourses = data.modules.filter(m => m.dozentId === user.id);
    const activeCourses = myCourses.filter(m => m.status === 'active' || m.status === 'registered');
    const pastCourses = myCourses.filter(m => m.status === 'passed' || m.status === 'failed');

    if (myCourses.length === 0) {
        container.innerHTML = buildEmptyState('menu_book', 'Keine Kurse zugewiesen.');
        return;
    }

    const courseCards = activeCourses.map(course => buildCourseCard(course, data)).join('');
    const pastSection = pastCourses.length > 0 ? buildPastCoursesSection(pastCourses) : '';

    container.innerHTML = courseCards + pastSection;

    // Attach event listeners for participant buttons
    activeCourses.forEach(course => {
        const btn = container.querySelector(`[data-course-code="${course.code}"]`);
        if (btn) {
            btn.addEventListener('click', () => {
                openParticipantModal(course, data);
            });
        }
    });
}

/**
 * Builds a single active course card.
 */
function buildCourseCard(course, data) {
    const scheduleInfo = buildScheduleText(course);
    const examInfo = buildExamText(course);
    const participants = findParticipantsForCourse(course, data);

    return `
        <div class="card dozent-course-card">
            <div class="dozent-card-header">
                <div class="dozent-card-icon">
                    <span class="material-icons-round" aria-hidden="true">menu_book</span>
                </div>
                <div class="dozent-card-title">
                    <h3>${escapeHTML(course.name)}</h3>
                    <span class="dozent-card-subtitle">${escapeHTML(course.code)} &bull; ${escapeHTML(String(course.ects))} ECTS</span>
                </div>
            </div>
            <div class="dozent-card-meta">
                <div class="dozent-meta-row">
                    <span class="material-icons-round" aria-hidden="true">schedule</span>
                    <span>${scheduleInfo}</span>
                </div>
                <div class="dozent-meta-row">
                    <span class="material-icons-round" aria-hidden="true">event_note</span>
                    <span>${examInfo}</span>
                </div>
                <div class="dozent-meta-row">
                    <span class="material-icons-round" aria-hidden="true">people</span>
                    <span>${participants.length} Teilnehmer &bull; ${escapeHTML(course.semester)}</span>
                </div>
            </div>
            <div class="dozent-card-footer">
                <button class="btn btn-outline btn-sm dozent-participants-btn"
                        data-course-code="${escapeHTML(course.code)}"
                        type="button">
                    <span class="material-icons-round" aria-hidden="true">group</span>
                    Teilnehmer anzeigen
                </button>
            </div>
        </div>`;
}

/**
 * Builds the schedule display text for a course.
 */
function buildScheduleText(course) {
    if (!course.schedule || course.schedule.length === 0) {
        return 'Kein Stundenplan';
    }
    return course.schedule.map(s =>
        `${DAY_NAMES[s.day]} ${escapeHTML(s.start)}-${escapeHTML(s.end)}, ${escapeHTML(s.room)}`
    ).join('<br>');
}

/**
 * Builds the exam display text for a course.
 */
function buildExamText(course) {
    if (!course.exam) return 'Keine Prüfung geplant';
    const type = escapeHTML(course.exam.type || 'Klausur');
    const date = escapeHTML(course.exam.date);
    const room = course.exam.room ? ' &bull; ' + escapeHTML(course.exam.room) : '';
    return `${type} am ${date}${room}`;
}

/**
 * Builds the past courses section displayed below active cards.
 */
function buildPastCoursesSection(pastCourses) {
    const cards = pastCourses.map(course => `
        <div class="card dozent-past-card">
            <h4 class="dozent-past-card-title">${escapeHTML(course.name)}</h4>
            <span class="dozent-past-card-meta">
                ${escapeHTML(course.code)} &bull; ${escapeHTML(course.semester)} &bull; ${escapeHTML(String(course.ects))} ECTS
            </span>
        </div>
    `).join('');

    return `
        <div class="full-width dozent-past-section">
            <h3 class="dozent-past-heading">Vergangene Kurse</h3>
            <div class="grid-container">
                ${cards}
            </div>
        </div>`;
}

// =============================================================================
// Participant Modal
// =============================================================================

/**
 * Opens a modal showing the participant list for a given course.
 * Uses showModal from modal.js.
 */
function openParticipantModal(course, data) {
    const participants = findParticipantsForCourse(course, data);

    let bodyHTML;
    if (participants.length === 0) {
        bodyHTML = `
            <div class="management-empty">
                <span class="material-icons-round">people_outline</span>
                <p>Keine Teilnehmer für diesen Kurs gefunden.</p>
            </div>`;
    } else {
        const rows = participants.map((student, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHTML(student.name)}</td>
                <td>${escapeHTML(student.matriculationNumber || '-')}</td>
                <td>${escapeHTML(student.email || '-')}</td>
            </tr>
        `).join('');

        bodyHTML = `
            <p class="dozent-participant-summary">
                ${participants.length} Teilnehmer in ${escapeHTML(course.name)} (${escapeHTML(course.code)})
            </p>
            <table class="management-table dozent-participant-table">
                <thead>
                    <tr>
                        <th scope="col" width="8%">#</th>
                        <th scope="col" width="35%">Name</th>
                        <th scope="col" width="27%">Matrikelnr.</th>
                        <th scope="col" width="30%">E-Mail</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>`;
    }

    const footerHTML = `
        <button class="btn btn-outline modal-cancel-btn" type="button">Schließen</button>
    `;

    showModal(`Teilnehmerliste: ${course.name}`, bodyHTML, footerHTML, { sizeClass: 'modal-lg' });

    // Wire up close button in footer
    const overlay = document.getElementById('modal-overlay');
    const cancelBtn = overlay ? overlay.querySelector('.modal-cancel-btn') : null;
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => closeModal(), { once: true });
    }
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
                    <label for="dozent-course-select">Kurs auswählen</label>
                    <select id="dozent-course-select" class="form-input">
                        <option value="">— Bitte Kurs wählen —</option>
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
                <p>Keine Studierenden für diesen Kurs gefunden.</p>
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
            <span class="material-icons-round" aria-hidden="true">info</span>
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
    if (matchedSeries) {
        const klausurEvent = (matchedSeries.events || []).find(ev => ev.type === 'Klausur');
        if (klausurEvent) {
            const key = matchedSeries.id + '-' + klausurEvent.id;
            data.examResults[key] = results;
        } else {
            // Create a synthetic key: series-0
            const key = matchedSeries.id + '-0';
            data.examResults[key] = results;
        }
    }

    alertArea.innerHTML = `
        <div class="management-alert success">
            <span class="material-icons-round">check_circle</span>
            ${filledCount} Note(n) für ${escapeHTML(course.name)} erfolgreich gespeichert.
        </div>`;

    // Re-render the grading table to reflect updated grades
    setTimeout(() => {
        renderGradingTable(tableArea, alertArea, course, data);
    }, 100);
}

// =============================================================================
// Calendar & Tabs
// =============================================================================

/**
 * Renders the calendar for dozent's active courses.
 */
function renderDozentCalendar(data, user) {
    const myCourses = data.modules.filter(
        m => m.dozentId === user.id && (m.status === 'active' || m.status === 'registered')
    );
    renderCalendarForModules(myCourses, '.dozent-calendar-grid', 'dozent-calendar-week-label');
}

/**
 * Initializes sub-tab switching within the dozent-courses section.
 */
function initDozentTabs() {
    const section = document.getElementById('dozent-courses');
    if (!section) return;
    initSectionTabs(section);
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
