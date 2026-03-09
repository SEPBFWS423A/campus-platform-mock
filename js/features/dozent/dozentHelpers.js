import { escapeHTML } from '../../core/utils.js';

export function findMatchingEventSeries(course, data) {
    if (!data.eventSeries) return null;

    const courseName = course.name.toLowerCase();

    let match = data.eventSeries.find(s =>
        s.name.toLowerCase() === courseName
    );
    if (match) return match;

    match = data.eventSeries.find(s => {
        const seriesName = s.name.toLowerCase();
        return courseName.includes(seriesName) || seriesName.includes(courseName);
    });
    if (match) return match;

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

export function findParticipantsForCourse(course, data) {
    const series = findMatchingEventSeries(course, data);
    if (!series || !series.studentIds || series.studentIds.length === 0) return [];

    return series.studentIds
        .map(sid => data.users.find(u => u.id === sid))
        .filter(Boolean);
}

export function buildEmptyState(icon, message) {
    return `
        <div class="card full-width">
            <div class="management-empty">
                <span class="material-icons-round">${escapeHTML(icon)}</span>
                <p>${escapeHTML(message)}</p>
            </div>
        </div>`;
}
