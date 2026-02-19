import { calculateAverage, calculateECTS } from './utils.js';

export function renderGrades(data) {
    const passedModules = data.modules.filter(m => m.status === 'passed');
    const avgGrade = calculateAverage(passedModules);
    const currentECTS = calculateECTS(passedModules);
    const passedCount = passedModules.length;

    const gradesStatsRow = document.querySelector('.grades-stats-row');
    if (gradesStatsRow) {
        const stats = [
            { label: "Durchschnittsnote", value: avgGrade, icon: "functions", colorClass: "primary" },
            { label: "Erreichte ECTS", value: `${currentECTS} / 180`, icon: "donut_large", colorClass: "success" },
            { label: "Bestandene Module", value: passedCount.toString(), icon: "check_circle", colorClass: "purple" }
        ];

        gradesStatsRow.innerHTML = stats.map(stat => `
            <div class="grade-stat">
                <div class="grade-stat-icon ${stat.colorClass}">
                    <span class="material-icons-round">${stat.icon}</span>
                </div>
                <div class="grade-stat-info">
                    <span class="grade-stat-label">${stat.label}</span>
                    <span class="grade-stat-value">${stat.value}</span>
                </div>
            </div>
         `).join('');
    }

    const semestersMap = {};
    data.modules.forEach(m => {
        if (!semestersMap[m.semester]) {
            semestersMap[m.semester] = [];
        }
        semestersMap[m.semester].push(m);
    });

    const semesterKeys = Object.keys(semestersMap).sort().reverse();

    const semesterTables = semesterKeys.map(semKey => {
        const mods = semestersMap[semKey];
        const semAvg = calculateAverage(mods);
        const semECTS = calculateECTS(mods);

        return `
        <div class="semester-section">
            <div class="semester-header" onclick="this.parentElement.classList.toggle('collapsed')">
                <h3>${semKey}</h3>
                <span class="semester-stats">Ø ${semAvg} • ${semECTS} ECTS</span>
            </div>
            <div class="grades-card">
                <table class="grades-table">
                    <thead>
                        <tr>
                            <th width="40%">Modul</th>
                            <th width="15%">Prüfungsdatum</th>
                            <th width="15%">ECTS</th>
                            <th width="15%">Status</th>
                            <th width="15%" style="text-align: center;">Note</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${mods.map(mod => {
            let statusClass = mod.status === 'passed' ? 'passed' : (mod.status === 'registered' ? 'pending' : 'pending');
            let statusText = mod.status === 'passed' ? 'Bestanden' : (mod.status === 'registered' ? 'Angemeldet' : 'Laufend');
            let gradeClass = mod.grade ? (mod.grade <= 1.5 ? 'excellent' : (mod.grade <= 2.5 ? 'good' : 'average')) : 'pending';
            let gradeDisplay = mod.grade ? mod.grade.toFixed(1) : '-';
            let dateDisplay = mod.exam ? mod.exam.date : '-';

            return `
                            <tr>
                                <td>
                                    <div class="module-cell">
                                        <span class="module-code">${mod.code}</span>
                                        <span class="module-name">${mod.name}</span>
                                    </div>
                                </td>
                                <td>${dateDisplay}</td>
                                <td><span class="credits-pill">${mod.ects} CP</span></td>
                                <td>
                                    <div class="status-indicator ${statusClass}">
                                        <span class="status-dot"></span> ${statusText}
                                    </div>
                                </td>
                                <td align="center"><span class="grade-badge ${gradeClass}">${gradeDisplay}</span></td>
                            </tr>
                            `;
        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
    }).join('');

    const gradesSection = document.getElementById('grades');
    if (gradesSection) {
        let header = gradesSection.querySelector('.section-header') ? gradesSection.querySelector('.section-header').outerHTML : '';
        if (data.user) {
            header = `
            <header class="section-header">
                <div class="header-content">
                    <h1>Notenübersicht</h1>
                    <p>Bachelor ${data.user.courseOfStudy} (B.Sc.) ${data.user.semester ? '- ' + data.user.semester + '. Semester' : ''}</p>
                </div>
                <button class="btn btn-primary"><span class="material-icons-round">print</span>
                    Leistungsspiegel</button>
            </header>`;
        }
        const statsRowHTML = gradesSection.querySelector('.grades-stats-row') ? gradesSection.querySelector('.grades-stats-row').outerHTML : '';
        gradesSection.innerHTML = header + statsRowHTML + semesterTables;
    }
}
