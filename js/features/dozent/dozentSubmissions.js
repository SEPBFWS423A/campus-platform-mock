import { escapeHTML, formatDateDE } from '../../core/utils.js';
import { getActiveDozentCourses } from '../shared/dataHelpers.js';
import { findMatchingEventSeries, findParticipantsForCourse, buildEmptyState } from './dozentHelpers.js';

export function renderDozentSubmissions(data, user) {
    const container = document.querySelector('.dozent-submissions-content');
    if (!container) return;

    const activeCourses = getActiveDozentCourses(data, user.id);

    if (activeCourses.length === 0) {
        container.innerHTML = buildEmptyState('assignment', 'Keine aktiven Kurse vorhanden.');
        return;
    }

    const submissions = collectSubmissions(data, activeCourses);

    container.innerHTML = buildSubmissionsUI(submissions, activeCourses);
    initFilterListeners(container, submissions);
}

function collectSubmissions(data, activeCourses) {
    const allSubs = data.submissions || [];
    const result = [];

    activeCourses.forEach(course => {
        const matching = allSubs.filter(s =>
            s.module && s.module.toLowerCase().includes(course.name.toLowerCase())
        );

        const participants = findParticipantsForCourse(course, data);

        matching.forEach(sub => {
            result.push({
                ...sub,
                courseName: course.name,
                courseCode: course.code,
                studentName: participants.length > 0 ? participants[0].name : 'Unbekannt'
            });
        });

        if (matching.length === 0 && participants.length > 0) {
            participants.forEach(student => {
                result.push({
                    id: `gen-${course.code}-${student.id}`,
                    title: `Abgabe ${course.name}`,
                    type: 'Studienleistung',
                    module: `${course.code} ${course.name}`,
                    status: 'pending',
                    dueDate: course.exam?.date || null,
                    courseName: course.name,
                    courseCode: course.code,
                    studentName: student.name
                });
            });
        }
    });

    return result;
}

function buildSubmissionsUI(submissions, activeCourses) {
    const statusCounts = { all: submissions.length, submitted: 0, graded: 0, pending: 0 };
    submissions.forEach(s => {
        if (s.status === 'submitted') statusCounts.submitted++;
        else if (s.status === 'graded') statusCounts.graded++;
        else statusCounts.pending++;
    });

    return `
        <div class="submissions-controls">
            <div class="filter-bar" role="group" aria-label="Abgabenfilter">
                <button class="filter-chip active" data-filter="all" aria-pressed="true">Alle (${statusCounts.all})</button>
                <button class="filter-chip" data-filter="submitted" aria-pressed="false">Eingereicht (${statusCounts.submitted})</button>
                <button class="filter-chip" data-filter="graded" aria-pressed="false">Bewertet (${statusCounts.graded})</button>
                <button class="filter-chip" data-filter="pending" aria-pressed="false">Ausstehend (${statusCounts.pending})</button>
            </div>
        </div>
        <div class="dozent-submissions-list">
            ${renderSubmissionCards(submissions, 'all')}
        </div>`;
}

function renderSubmissionCards(submissions, filter) {
    const filtered = filter === 'all' ? submissions : submissions.filter(s => {
        if (filter === 'pending') return s.status === 'pending' || s.status === 'upcoming';
        return s.status === filter;
    });

    if (filtered.length === 0) {
        return `
            <div class="card full-width">
                <div class="management-empty">
                    <span class="material-symbols-rounded">search_off</span>
                    <p>Keine Abgaben in dieser Kategorie.</p>
                </div>
            </div>`;
    }

    return filtered.map(sub => {
        const statusClass = getStatusClass(sub.status);
        const statusLabel = getStatusLabel(sub.status);
        const icon = getTypeIcon(sub.type);

        return `
            <div class="submission-card" role="article">
                <div class="submission-header">
                    <div class="submission-type-icon ${getTypeClass(sub.type)}">
                        <span class="material-symbols-rounded" aria-hidden="true">${icon}</span>
                    </div>
                    <div class="submission-info">
                        <h3>${escapeHTML(sub.title)}</h3>
                        <span class="submission-module">
                            <span class="submission-type">${escapeHTML(sub.type)}</span> · ${escapeHTML(sub.courseCode)}
                        </span>
                    </div>
                </div>
                <div class="submission-right">
                    <div class="submission-meta" style="flex-direction: column; gap: 0.25rem;">
                        <span style="font-size: 0.8rem; color: var(--text-secondary);">
                            <span class="material-symbols-rounded" style="font-size: 0.9rem; vertical-align: -2px;">person</span>
                            ${escapeHTML(sub.studentName)}
                        </span>
                        ${sub.dateSubmitted ? `<span style="font-size: 0.75rem; color: var(--text-tertiary);">Eingereicht: ${formatDateDE(sub.dateSubmitted)}</span>` : ''}
                        ${sub.dueDate ? `<span style="font-size: 0.75rem; color: var(--text-tertiary);">Fällig: ${formatDateDE(sub.dueDate)}</span>` : ''}
                    </div>
                    <div class="status-badge ${statusClass}">
                        <span class="status-dot"></span>
                        ${statusLabel}
                    </div>
                    ${sub.status === 'graded' && sub.grade ? `<span class="grade-circle" style="width:32px;height:32px;font-size:0.8rem;">${sub.grade.toFixed(1).replace('.', ',')}</span>` : ''}
                </div>
            </div>`;
    }).join('');
}

function initFilterListeners(container, submissions) {
    const filterBtns = container.querySelectorAll('.filter-chip');
    const listContainer = container.querySelector('.dozent-submissions-list');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');

            if (listContainer) {
                listContainer.innerHTML = renderSubmissionCards(submissions, btn.dataset.filter);
            }
        });
    });
}

function getStatusClass(status) {
    switch (status) {
        case 'graded': return 'success';
        case 'submitted': return 'info';
        case 'upcoming': return 'warning';
        case 'pending': return 'neutral';
        default: return 'neutral';
    }
}

function getStatusLabel(status) {
    switch (status) {
        case 'graded': return 'Bewertet';
        case 'submitted': return 'Eingereicht';
        case 'upcoming': return 'Ausstehend';
        case 'pending': return 'Ausstehend';
        default: return status;
    }
}

function getTypeIcon(type) {
    if (type.includes('Praxis')) return 'work';
    if (type.includes('Bachelor')) return 'school';
    if (type.includes('Präsentation')) return 'slideshow';
    return 'description';
}

function getTypeClass(type) {
    if (type.includes('Praxis')) return 'type-project';
    if (type.includes('Bachelor')) return 'type-thesis';
    if (type.includes('Präsentation')) return 'type-presentation';
    return 'type-default';
}
