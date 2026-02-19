export function renderExams(data) {
    const examsGrid = document.querySelector('.exams-grid');
    if (!examsGrid) return;

    const examModules = data.modules.filter(m => m.exam && (m.exam.status === 'registered' || m.exam.status === 'upcoming' || m.exam.status === 'open' || m.exam.status === 'completed'));

    const exams = examModules.map(m => {
        const e = m.exam;
        const parts = e.date.split('-');
        const year = parts[0];
        const monthMap = { '01': 'Jan', '02': 'Feb', '03': 'März', '04': 'Apr', '07': 'Juli' };
        const month = monthMap[parts[1]] || parts[1];
        const day = parts[2];

        let statusClass = "upcoming";
        let footerIcon = "event";
        let footerStatus = "Geplant";
        let footerColorClass = "";
        let footerStyle = "";
        let actionText = "Details";
        let actionIcon = "arrow_forward";

        if (e.status === 'completed' || m.status === 'passed') {
            statusClass = "completed";
            footerIcon = "verified";
            footerStatus = "Bestanden";
            footerColorClass = "success";
            footerStyle = "color: var(--success-color);";
            actionText = "Einsicht";
        } else if (e.status === 'registered') {
            statusClass = "registered";
            footerIcon = "check_circle";
            footerStatus = "Angemeldet";
            footerColorClass = "registered";
        } else if (e.status === 'open') {
            statusClass = "";
            footerIcon = "event_available";
            footerStatus = "Anmeldung offen";
            footerStyle = "color: var(--text-secondary);";
            actionText = "Anmelden";
        } else if (e.status === 'upcoming') {
            statusClass = "upcoming";
            footerIcon = "warning";
            footerStatus = "In Kürze";
            footerColorClass = "imminent";
        }

        return {
            statusClass,
            day, month, year,
            type: e.type || "Klausur",
            code: m.code,
            title: m.name,
            details: [
                { icon: "schedule", text: e.time || "TBA" },
                { icon: "place", text: e.room || "TBA" },
                e.examiner ? { icon: "person", text: e.examiner } : null
            ].filter(Boolean),
            footerStatus, footerIcon, footerColorClass, footerStyle,
            actionText, actionIcon
        };
    });

    examsGrid.innerHTML = exams.map(exam => `
        <div class="exam-card-enhanced ${exam.statusClass}">
            <div class="exam-body">
                <div class="exam-date-box">
                    <span class="exam-day">${exam.day}</span>
                    <span class="exam-month">${exam.month}</span>
                    <span class="exam-year">${exam.year}</span>
                </div>
                <div class="exam-info">
                    <div class="exam-meta">
                        <span class="exam-tag">${exam.type}</span>
                        <span class="exam-tag">${exam.code}</span>
                    </div>
                    <h3 class="exam-title">${exam.title}</h3>
                    <div class="exam-details-list">
                        ${exam.details.map(d => `
                            <div class="exam-detail-item">
                                <span class="material-icons-round">${d.icon}</span>
                                <span>${d.text}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="exam-footer">
                <div class="exam-status ${exam.footerColorClass}" style="${exam.footerStyle}">
                    <span class="material-icons-round">${exam.footerIcon}</span>
                    ${exam.footerStatus}
                </div>
                <a href="#" class="action-link">${exam.actionText} <span class="material-icons-round">${exam.actionIcon}</span></a>
            </div>
        </div>
    `).join('');
}
