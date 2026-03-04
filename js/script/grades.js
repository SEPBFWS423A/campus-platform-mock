import { calculateAverage, calculateECTS, escapeHTML } from './utils.js';

/**
 * Renders the grades overview with semester tables.
 * Shows passed AND failed modules with attempt (Versuch) tracking.
 */
export function renderGrades(data) {
    const passedModules = data.modules.filter(m => m.status === 'passed');
    const failedModules = data.modules.filter(m => m.status === 'failed');
    const avgGrade = calculateAverage(passedModules);
    const currentECTS = calculateECTS(passedModules);
    const passedCount = passedModules.length;

    const gradesStatsRow = document.querySelector('.grades-stats-row');
    if (gradesStatsRow) {
        const stats = [
            { label: "Durchschnittsnote", value: avgGrade, icon: "functions", colorClass: "primary" },
            { label: "Erreichte ECTS", value: `${currentECTS} / 180`, icon: "donut_large", colorClass: "success" },
            { label: "Bestandene Module", value: passedCount.toString(), icon: "check_circle", colorClass: "purple" },
            { label: "Nicht bestanden", value: failedModules.length.toString(), icon: "cancel", colorClass: "danger" }
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

    // Group modules by semester – include all modules for full semester display
    const gradableModules = data.modules.filter(m =>
        m.status === 'passed' || m.status === 'failed' || m.status === 'active' || m.status === 'registered'
    );

    const semestersMap = {};
    gradableModules.forEach(m => {
        if (!semestersMap[m.semester]) {
            semestersMap[m.semester] = [];
        }
        semestersMap[m.semester].push(m);
    });

    // Chronological sort (newest first): WiSe YY/YY → year*2+2, SoSe YYYY → year*2+1
    function semesterSortKey(sem) {
        if (sem.startsWith('WiSe')) {
            const year = parseInt(sem.match(/\d+/)[0], 10);
            return (year < 100 ? 2000 + year : year) * 2 + 2;
        }
        const year = parseInt(sem.match(/\d+/)[0], 10);
        return year * 2 + 1;
    }

    const semesterKeys = Object.keys(semestersMap).sort((a, b) => semesterSortKey(b) - semesterSortKey(a));

    const semesterTables = semesterKeys.map(semKey => {
        const mods = semestersMap[semKey];
        const semPassed = mods.filter(m => m.status === 'passed');
        const semAvg = calculateAverage(semPassed);
        const semECTS = calculateECTS(semPassed);

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
                            <th scope="col" width="35%">Modul</th>
                            <th scope="col" width="13%">Pr&uuml;fungsdatum</th>
                            <th scope="col" width="10%">ECTS</th>
                            <th scope="col" width="13%">Status</th>
                            <th scope="col" width="14%" style="text-align: center;">Versuch</th>
                            <th scope="col" width="15%" style="text-align: center;">Note</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${mods.map(mod => {
            let statusClass, statusText;
            if (mod.status === 'passed') {
                statusClass = 'passed';
                statusText = 'Bestanden';
            } else if (mod.status === 'failed') {
                statusClass = 'failed';
                statusText = 'Nicht bestanden';
            } else {
                statusClass = 'pending';
                statusText = 'Ausstehend';
            }

            let gradeClass;
            if (mod.status === 'failed') {
                gradeClass = 'failed';
            } else if (mod.grade) {
                gradeClass = mod.grade <= 1.5 ? 'excellent' : (mod.grade <= 2.5 ? 'good' : 'average');
            } else {
                gradeClass = 'pending';
            }

            const gradeDisplay = mod.grade ? mod.grade.toFixed(1) : '-';
            const dateDisplay = mod.exam ? escapeHTML(mod.exam.date) : '-';
            const attemptDisplay = mod.attempt ? `${mod.attempt}. Versuch` : '-';

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
                                <td align="center"><span class="attempt-badge">${escapeHTML(attemptDisplay)}</span></td>
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
        const user = getCurrentUser();
        let header = `
            <header class="section-header">
                <div class="header-content">
                    <h1>Notenübersicht</h1>
                    <p>Bachelor ${escapeHTML(user.courseOfStudy || '')} (B.Sc.) ${user.semester ? '- ' + user.semester + '. Semester' : ''}</p>
                </div>
                <button class="btn btn-primary"><span class="material-icons-round">print</span>
                    Leistungsspiegel</button>
            </header>`;

        const statsRowHTML = gradesSection.querySelector('.grades-stats-row') ? gradesSection.querySelector('.grades-stats-row').outerHTML : '';
        gradesSection.innerHTML = header + statsRowHTML + semesterTables;

        // Event delegation for semester collapse toggle
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
