import { escapeHTML } from '../../core/utils.js';
import { initSectionTabs, renderCalendarForModules } from '../student/schedule.js';
import { showModal, closeModal } from '../../core/modal.js';

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
    if (!course.exam) return 'Keine Pr\u00fcfung geplant';
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
                <p>Keine Teilnehmer f\u00fcr diesen Kurs gefunden.</p>
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
        <button class="btn btn-outline modal-cancel-btn" type="button">Schlie\u00dfen</button>
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
