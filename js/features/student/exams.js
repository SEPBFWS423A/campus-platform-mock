import { escapeHTML } from '../../core/utils.js';

let allExams = [];
let currentFilter = 'all';
let isInitialized = false;

export function renderExams(data) {
    if (data) {
        const examModules = data.modules.filter(m =>
            m.exam &&
            (m.exam.status === 'registered' || m.exam.status === 'upcoming' || m.exam.status === 'open') &&
            m.status !== 'passed' &&
            m.status !== 'failed'
        );
        allExams = examModules.map(m => buildExamData(m));
    }

    if (!isInitialized) {
        setupFilterListeners();
        isInitialized = true;
    }

    renderExamCards();
}

function setupFilterListeners() {
    const filterBtns = document.querySelectorAll('.exams-filter-bar .filter-chip');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');

            currentFilter = btn.dataset.filter;
            renderExamCards();
        });
    });
}

function renderExamCards() {
    const examsGrid = document.querySelector('.exams-grid');
    if (!examsGrid) return;

    const filtered = currentFilter === 'all'
        ? allExams
        : allExams.filter(exam => exam.filterStatus === currentFilter);

    if (filtered.length === 0) {
        examsGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem;">
                <span class="material-icons-round" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 0.5rem; display: block;" aria-hidden="true">search_off</span>
                <p style="color: var(--text-secondary);">Keine Prüfungstermine in dieser Kategorie.</p>
            </div>
        `;
        return;
    }

    examsGrid.innerHTML = filtered.map(exam => `
        <div class="exam-card-enhanced ${exam.statusClass}" role="article" aria-label="${escapeHTML(exam.title)}">
            <div class="exam-body">
                <div class="exam-date-box">
                    <span class="exam-day">${escapeHTML(exam.day)}</span>
                    <span class="exam-month">${escapeHTML(exam.month)}</span>
                    <span class="exam-year">${escapeHTML(exam.year)}</span>
                </div>
                <div class="exam-info">
                    <div class="exam-meta">
                        <span class="exam-tag">${escapeHTML(exam.type)}</span>
                        <span class="exam-tag">${escapeHTML(exam.code)}</span>
                    </div>
                    <h3 class="exam-title">${escapeHTML(exam.title)}</h3>
                    <div class="exam-details-list">
                        ${exam.details.map(d => `
                            <div class="exam-detail-item">
                                <span class="material-icons-round" aria-hidden="true">${d.icon}</span>
                                <span>${escapeHTML(d.text)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="exam-footer">
                <div class="exam-status ${exam.footerColorClass}" style="${exam.footerStyle}">
                    <span class="material-icons-round" aria-hidden="true">${exam.footerIcon}</span>
                    ${exam.footerStatus}
                </div>
                <a href="#" class="action-link">${exam.actionText} <span class="material-icons-round" aria-hidden="true">${exam.actionIcon}</span></a>
            </div>
        </div>
    `).join('');
}

function buildExamData(m) {
    const e = m.exam;
    const parts = e.date.split('-');
    const year = parts[0];
    const monthMap = { '01': 'Jan', '02': 'Feb', '03': 'März', '04': 'Apr', '07': 'Juli' };
    const month = monthMap[parts[1]] || parts[1];
    const day = parts[2];

    let statusClass = 'upcoming';
    let filterStatus = 'upcoming';
    let footerIcon = 'event';
    let footerStatus = 'Geplant';
    let footerColorClass = '';
    let footerStyle = '';
    let actionText = 'Details';
    let actionIcon = 'arrow_forward';

    if (e.status === 'registered') {
        statusClass = 'registered';
        filterStatus = 'registered';
        footerIcon = 'check_circle';
        footerStatus = 'Angemeldet';
        footerColorClass = 'registered';
    } else if (e.status === 'open') {
        statusClass = '';
        filterStatus = 'open';
        footerIcon = 'event_available';
        footerStatus = 'Anmeldung offen';
        footerStyle = 'color: var(--text-secondary);';
        actionText = 'Anmelden';
    } else if (e.status === 'upcoming') {
        statusClass = 'upcoming';
        filterStatus = 'upcoming';
        footerIcon = 'warning';
        footerStatus = 'In Kürze';
        footerColorClass = 'imminent';
    }

    return {
        statusClass,
        filterStatus,
        day, month, year,
        type: e.type || 'Klausur',
        code: m.code,
        title: m.name,
        details: [
            { icon: 'schedule', text: e.time || 'TBA' },
            { icon: 'place', text: e.room || 'TBA' },
            e.examiner ? { icon: 'person', text: e.examiner } : null
        ].filter(Boolean),
        footerStatus, footerIcon, footerColorClass, footerStyle,
        actionText, actionIcon
    };
}
