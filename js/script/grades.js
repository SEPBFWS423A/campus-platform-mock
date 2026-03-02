import { calculateAverage, calculateECTS, escapeHTML } from './utils.js';

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
            <div class="semester-header" role="button" tabindex="0" aria-expanded="true" aria-label="Semester ${semKey} ein-/ausklappen">
                <h3>${escapeHTML(semKey)}</h3>
                <span class="semester-stats">&Oslash; ${escapeHTML(String(semAvg))} &bull; ${escapeHTML(String(semECTS))} ECTS</span>
            </div>
            <div class="grades-card">
                <table class="grades-table">
                    <thead>
                        <tr>
                            <th scope="col" width="40%">Modul</th>
                            <th scope="col" width="15%">Pr&uuml;fungsdatum</th>
                            <th scope="col" width="15%">ECTS</th>
                            <th scope="col" width="15%">Status</th>
                            <th scope="col" width="15%" style="text-align: center;">Note</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${mods.map(mod => {
            let statusClass = mod.status === 'passed' ? 'passed' : 'pending';
            let statusText = mod.status === 'passed' ? 'Bestanden' : (mod.status === 'registered' ? 'Angemeldet' : 'Laufend');
            let gradeClass = mod.grade ? (mod.grade <= 1.5 ? 'excellent' : (mod.grade <= 2.5 ? 'good' : 'average')) : 'pending';
            let gradeDisplay = mod.grade ? mod.grade.toFixed(1) : '-';
            let dateDisplay = mod.exam ? escapeHTML(mod.exam.date) : '-';

            return `
                            <tr>
                                <td>
                                    <div class="module-cell">
                                        <span class="module-code">${escapeHTML(mod.code)}</span>
                                        <span class="module-name">${escapeHTML(mod.name)}</span>
                                    </div>
                                </td>
                                <td>${dateDisplay}</td>
                                <td><span class="credits-pill">${escapeHTML(String(mod.ects))} CP</span></td>
                                <td>
                                    <div class="status-indicator ${statusClass}">
                                        <span class="status-dot"></span> ${statusText}
                                    </div>
                                </td>
                                <td align="center"><span class="grade-badge ${gradeClass}">${escapeHTML(gradeDisplay)}</span></td>
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
                    <p>Bachelor ${escapeHTML(data.user.courseOfStudy)} (B.Sc.) ${data.user.semester ? '- ' + data.user.semester + '. Semester' : ''}</p>
                </div>
                <button class="btn btn-primary"><span class="material-icons-round">print</span>
                    Leistungsspiegel</button>
            </header>`;
        }
        const statsRowHTML = gradesSection.querySelector('.grades-stats-row') ? gradesSection.querySelector('.grades-stats-row').outerHTML : '';
        gradesSection.innerHTML = header + statsRowHTML + semesterTables;

        // Event delegation for semester collapse toggle (replaces inline onclick)
        gradesSection.addEventListener('click', (e) => {
            const semesterHeader = e.target.closest('.semester-header');
            if (semesterHeader) {
                const section = semesterHeader.parentElement;
                const isCollapsed = section.classList.toggle('collapsed');
                semesterHeader.setAttribute('aria-expanded', String(!isCollapsed));
            }
        });

        // Keyboard support for semester headers
        gradesSection.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const semesterHeader = e.target.closest('.semester-header');
                if (semesterHeader) {
                    e.preventDefault();
                    const section = semesterHeader.parentElement;
                    const isCollapsed = section.classList.toggle('collapsed');
                    semesterHeader.setAttribute('aria-expanded', String(!isCollapsed));
                }
            }
        });
    }
}
