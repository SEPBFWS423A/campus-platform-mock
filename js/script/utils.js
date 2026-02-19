export function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

export function calculateAverage(modules) {
    let sum = 0;
    let count = 0;
    modules.forEach(m => {
        if (m.grade && typeof m.grade === 'number') {
            sum += m.grade;
            count++;
        }
    });
    return count > 0 ? (sum / count).toFixed(1) : "-";
}

export function calculateECTS(modules) {
    return modules.reduce((sum, m) => m.status === 'passed' ? sum + m.ects : sum, 0);
}
