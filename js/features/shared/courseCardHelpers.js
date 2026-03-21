import { escapeHTML } from '../../core/utils.js';
import { DAY_NAMES } from './constants.js';

export function buildCourseCard(course, { extraMetaRows = '', footer = '' } = {}) {
    const scheduleInfo = buildScheduleText(course);
    const examInfo = buildExamText(course);

    return `
        <div class="card dozent-course-card">
            <div class="dozent-card-header">
                <div class="dozent-card-icon">
                    <span class="material-symbols-rounded" aria-hidden="true">menu_book</span>
                </div>
                <div class="dozent-card-title">
                    <h3>${escapeHTML(course.name)}</h3>
                    <span class="dozent-card-subtitle">${escapeHTML(course.code)} &bull; ${escapeHTML(String(course.ects))} ECTS</span>
                </div>
            </div>
            <div class="dozent-card-meta">
                <div class="dozent-meta-row">
                    <span class="material-symbols-rounded" aria-hidden="true">schedule</span>
                    <span>${scheduleInfo}</span>
                </div>
                <div class="dozent-meta-row">
                    <span class="material-symbols-rounded" aria-hidden="true">event_note</span>
                    <span>${examInfo}</span>
                </div>
                ${extraMetaRows}
            </div>
            ${footer ? `<div class="dozent-card-footer">${footer}</div>` : ''}
        </div>`;
}

export function buildPastCoursesSection(pastCourses) {
    const cards = pastCourses.map(course => `
        <div class="card dozent-past-card">
            <h4 class="dozent-past-card-title">${escapeHTML(course.name)}</h4>
            <span class="dozent-past-card-meta">
                ${escapeHTML(course.code)} &bull; ${escapeHTML(course.semester || '')} &bull; ${escapeHTML(String(course.ects))} ECTS
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

export function buildScheduleText(course) {
    if (!course.schedule || course.schedule.length === 0) {
        return 'Kein Stundenplan';
    }
    return course.schedule.map(s =>
        `${DAY_NAMES[s.day]} ${escapeHTML(s.start)}-${escapeHTML(s.end)}, ${escapeHTML(s.room)}`
    ).join('<br>');
}

export function buildExamText(course) {
    if (!course.exam) return 'Keine Pr\u00fcfung geplant';
    const type = escapeHTML(course.exam.type || 'Klausur');
    const date = escapeHTML(course.exam.date);
    const time = course.exam.time ? ', ' + escapeHTML(course.exam.time) : '';
    const room = course.exam.room ? ' &bull; ' + escapeHTML(course.exam.room) : '';
    return `${type} am ${date}${time}${room}`;
}
