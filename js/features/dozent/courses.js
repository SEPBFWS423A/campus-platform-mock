import { escapeHTML } from '../../core/utils.js';
import { initSectionTabs, renderCalendarForModules } from '../student/schedule.js';
import { showModal, closeModal } from '../../core/modal.js';
import { findParticipantsForCourse, buildEmptyState } from './dozentHelpers.js';
import { getDozentCourses, getActiveDozentCourses } from '../shared/dataHelpers.js';
import { buildCourseCard, buildPastCoursesSection } from '../shared/courseCardHelpers.js';

export function renderDozentCourses(data, user) {
    renderDozentOverview(data, user);
    renderDozentCalendar(data, user);
    initDozentTabs();
}

function renderDozentOverview(data, user) {
    const container = document.querySelector('#dozent-overview .dozent-courses-grid');
    const pastContainer = document.querySelector('#dozent-overview .past-courses-container');
    if (!container) return;

    const myCourses = getDozentCourses(data, user.id);
    const activeCourses = getActiveDozentCourses(data, user.id);
    const pastCourses = myCourses.filter(m => m.status === 'passed' || m.status === 'failed');

    if (myCourses.length === 0) {
        container.innerHTML = buildEmptyState('menu_book', 'Keine Kurse zugewiesen.');
        return;
    }

    container.innerHTML = activeCourses.map(course => buildDozentCourseCard(course, data)).join('');

    if (pastContainer) {
        pastContainer.innerHTML = pastCourses.length > 0 ? buildPastCoursesSection(pastCourses) : '';
    }

    activeCourses.forEach(course => {
        const btn = container.querySelector(`[data-course-code="${course.code}"]`);
        if (btn) {
            btn.addEventListener('click', () => {
                openParticipantModal(course, data);
            });
        }
    });
}

function buildDozentCourseCard(course, data) {
    const participants = findParticipantsForCourse(course, data);
    const extraMetaRows = `
        <div class="dozent-meta-row">
            <span class="material-symbols-rounded" aria-hidden="true">people</span>
            <span>${participants.length} Teilnehmer &bull; ${escapeHTML(course.semester)}</span>
        </div>`;
    const footer = `
        <button class="btn btn-outline btn-sm dozent-participants-btn"
                data-course-code="${escapeHTML(course.code)}"
                type="button">
            <span class="material-symbols-rounded" aria-hidden="true">group</span>
            Teilnehmer anzeigen
        </button>`;
    return buildCourseCard(course, { extraMetaRows, footer });
}

function openParticipantModal(course, data) {
    const participants = findParticipantsForCourse(course, data);

    let bodyHTML;
    if (participants.length === 0) {
        bodyHTML = `
            <div class="management-empty">
                <span class="material-symbols-rounded">people_outline</span>
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

    const overlay = document.getElementById('modal-overlay');
    const cancelBtn = overlay ? overlay.querySelector('.modal-cancel-btn') : null;
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => closeModal(), { once: true });
    }
}

function renderDozentCalendar(data, user) {
    const myCourses = getActiveDozentCourses(data, user.id);
    renderCalendarForModules(myCourses, '.dozent-calendar-grid', 'dozent-calendar-week-label');
}

function initDozentTabs() {
    const section = document.getElementById('dozent-courses');
    if (!section) return;
    initSectionTabs(section);
}

