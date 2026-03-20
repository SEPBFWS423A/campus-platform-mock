/**
 * Shared grading utilities used by multiple dozent features.
 * Centralised here to avoid duplication between pruefungen.js and grading.js.
 */

export const GRADE_THRESHOLDS = [
    { min: 95, grade: '1.0' }, { min: 90, grade: '1.3' }, { min: 85, grade: '1.7' },
    { min: 80, grade: '2.0' }, { min: 75, grade: '2.3' }, { min: 70, grade: '2.7' },
    { min: 65, grade: '3.0' }, { min: 60, grade: '3.3' }, { min: 55, grade: '3.7' },
    { min: 50, grade: '4.0' }, { min: 0,  grade: '5.0' }
];

/**
 * Writes grade results into data.examResults and the matching module entry.
 * @param {Array<{studentId:number, grade:string}>} results
 */
export function persistGrades(results, data, matchedSeries, mod) {
    if (matchedSeries) {
        const klausurEvent = (matchedSeries.events || []).find(ev => ev.type === 'Klausur');
        const key = klausurEvent
            ? `${matchedSeries.id}-${klausurEvent.id}`
            : `${matchedSeries.id}-0`;
        const existing = data.examResults[key] || [];
        results.forEach(r => {
            const idx = existing.findIndex(e => e.studentId === r.studentId);
            if (idx >= 0) existing[idx].grade = r.grade;
            else existing.push({ studentId: r.studentId, grade: r.grade });
        });
        data.examResults[key] = existing;
    }
    results.forEach(r => {
        const entry = data.modules.find(m => m.code === mod.code);
        if (entry) entry.grade = parseFloat(r.grade);
    });
}

/**
 * Collects already-saved grades for a course's event series.
 * @returns {{ [studentId: number]: string }}
 */
export function collectExistingGrades(data, matchedSeries) {
    const grades = {};
    if (!matchedSeries || !data.examResults) return grades;
    const prefix = `${matchedSeries.id}-`;
    Object.keys(data.examResults).forEach(key => {
        if (key.startsWith(prefix)) {
            data.examResults[key].forEach(r => { grades[r.studentId] = r.grade; });
        }
    });
    return grades;
}

/**
 * Returns a CSS colour class for a numeric grade.
 */
export function gradeColorClass(n) {
    if (isNaN(n)) return '';
    if (n <= 2.0) return 'dozent-grade-good';
    if (n <= 3.3) return 'dozent-grade-ok';
    return 'dozent-grade-bad';
}

/**
 * Converts a points value (0–100) to a grade string using sorted thresholds.
 * Thresholds must have a `min` field (GRADE_THRESHOLDS format).
 */
export function pointsToGrade(points, thresholds) {
    for (const t of thresholds) {
        if (points >= t.min) return t.grade;
    }
    return '5.0';
}
