import { timeToMinutes, calculateAverage, calculateECTS } from './utils.js';

export function renderDashboard(data) {
    // 1. Stats
    const passedModules = data.modules.filter(m => m.status === 'passed');
    const avgGrade = calculateAverage(passedModules);
    const currentECTS = calculateECTS(passedModules);

    const upcomingExams = data.modules.filter(m => m.exam && (m.exam.status === 'registered' || m.exam.status === 'upcoming' || m.exam.status === 'open'));

    const stats = [
        { id: "avg-grade", label: "Notenschnitt", value: avgGrade, icon: "bar_chart", colorClass: "primary-bg", trend: "+0.1", trendIcon: "trending_up", trendClass: "positive" },
        { id: "ects", label: "ECTS Fortschritt", value: `${currentECTS} / 180`, icon: "school", colorClass: "success-bg", progress: (currentECTS / 180) * 100 },
        { id: "exams", label: "Anstehende Prüfungen", value: upcomingExams.length.toString(), icon: "event", colorClass: "warning-bg", desc: upcomingExams.length > 0 ? "Viel Erfolg!" : "Keine Termine" }
    ];

    const statsContainer = document.querySelector('.stats-row');
    if (statsContainer) {
        statsContainer.innerHTML = stats.map(stat => `
            <div class="card stat-card">
                <div class="stat-icon ${stat.colorClass}">
                    <span class="material-icons-round">${stat.icon}</span>
                </div>
                <div class="stat-info">
                    <span class="stat-label">${stat.label}</span>
                    <span class="stat-value">${stat.value}</span>
                    ${stat.trend ? `<span class="stat-trend ${stat.trendClass}"><span class="material-icons-round">${stat.trendIcon}</span> ${stat.trend}</span>` : ''}
                    ${stat.progress ? `<div class="progress-bar"><div class="progress-fill" style="width: ${stat.progress}%;"></div></div>` : ''}
                    ${stat.desc ? `<span class="stat-desc">${stat.desc}</span>` : ''}
                </div>
            </div>
        `).join('');
    }

    // 2. Timeline
    let todaysEvents = [];
    data.modules.forEach(m => {
        if (m.schedule) {
            m.schedule.forEach(s => {
                if (s.day === 1) { // 1 = Tuesday
                    todaysEvents.push({
                        time: s.start,
                        title: m.name,
                        desc: `${s.room} • ${s.type}`,
                        status: "future"
                    });
                }
            });
        }
    });

    todaysEvents.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
    const currentSimTime = timeToMinutes(data.config.currentTime);

    todaysEvents = todaysEvents.map(e => {
        const eTime = timeToMinutes(e.time);
        let status = "future";
        if (eTime < currentSimTime - 90) status = "past";
        else if (eTime <= currentSimTime && eTime + 90 >= currentSimTime) status = "current";
        return { ...e, status };
    });

    const timelineContainer = document.querySelector('.timeline');
    if (timelineContainer) {
        timelineContainer.innerHTML = todaysEvents.length > 0 ? todaysEvents.map(item => `
            <div class="timeline-item ${item.status}">
                <div class="time">${item.time}</div>
                <div class="marker"></div>
                <div class="content">
                    ${item.status === 'current' ? `<span class="badge badge-sm">Jetzt</span>` : ''}
                    <h4>${item.title}</h4>
                    <p>${item.desc}</p>
                </div>
            </div>
        `).join('') : '<div class="timeline-item"><div class="content"><p>Keine Veranstaltungen heute.</p></div></div>';
    }

    // 3. Activity
    const activityList = document.querySelector('.activity-list');
    if (activityList && data.notifications) {
        activityList.innerHTML = data.notifications.map(item => `
            <li>
                <div class="activity-icon ${item.colorClass}"><span class="material-icons-round">${item.icon}</span></div>
                <div class="activity-content">
                    <p class="activity-text">${item.text}</p>
                    <span class="activity-time">${item.time}</span>
                </div>
            </li>
        `).join('');
    }
}
