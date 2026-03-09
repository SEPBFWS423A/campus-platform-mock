export function timeToMinutes(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const parts = timeStr.split(':');
    if (parts.length !== 2) return 0;
    const [hours, minutes] = parts.map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
    return hours * 60 + minutes;
}

export function calculateAverage(modules) {
    if (!Array.isArray(modules) || modules.length === 0) return "-";
    let sum = 0;
    let count = 0;
    modules.forEach(m => {
        if (m.grade && typeof m.grade === 'number' && !Number.isNaN(m.grade)) {
            sum += m.grade;
            count++;
        }
    });
    return count > 0 ? (sum / count).toFixed(1) : "-";
}

export function calculateECTS(modules) {
    if (!Array.isArray(modules)) return 0;
    return modules.reduce((sum, m) => m.status === 'passed' ? sum + (m.ects || 0) : sum, 0);
}

export function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    const escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    };
    return str.replace(/[&<>"']/g, (char) => escapeMap[char]);
}

export function formatDateDE(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatCurrentDateDE() {
    const d = new Date();
    const day = d.toLocaleDateString('de-DE', { weekday: 'long' });
    const monthNum = String(d.getMonth() + 1).padStart(2, '0');
    const monthName = d.toLocaleDateString('de-DE', { month: 'long' });
    const year = d.getFullYear();
    return `${day}, ${monthNum}. ${monthName} ${year}`;
}
