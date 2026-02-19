
let submissionsData = [];
let currentDate = null;
let currentFilter = 'all';
let searchQuery = '';
let isInitialized = false;

export function renderSubmissions(data) {
    // Update data if provided
    if (data) {
        submissionsData = data.submissions || [];
        currentDate = data.config ? data.config.currentDate : null;
    }

    // Initialize listeners once
    if (!isInitialized) {
        setupEventListeners();
        isInitialized = true;
    }

    renderList();
}

function setupEventListeners() {
    const filterBtns = document.querySelectorAll('.submissions-controls .filter-chip');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update UI
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update State
            currentFilter = btn.dataset.filter;
            renderList();
        });
    });

    const searchInput = document.getElementById('submission-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            renderList();
        });
    }
}

function renderList() {
    const container = document.querySelector('.submissions-grid');
    if (!container) return;

    // Filter Data
    let filtered = submissionsData.filter(item => {
        // Status Filter
        if (currentFilter !== 'all') {
            if (currentFilter === 'open') {
                if (!['upcoming', 'pending'].includes(item.status)) return false;
            } else {
                if (item.status !== currentFilter) return false;
            }
        }

        // Search Filter
        if (searchQuery) {
            const term = searchQuery.toLowerCase();
            const matchesTitle = item.title.toLowerCase().includes(term);
            const matchesModule = item.module.toLowerCase().includes(term);
            if (!matchesTitle && !matchesModule) return false;
        }

        return true;
    });

    // Render Empty State
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="material-icons-round" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 0.5rem; display: block;">search_off</span>
                <p>Keine Abgaben gefunden.</p>
                ${(currentFilter !== 'all' || searchQuery) ?
                '<button class="btn btn-outline btn-sm" style="margin-top: 1rem;" id="reset-filters">Filter zurücksetzen</button>' : ''
            }
            </div>
        `;

        const resetBtn = container.querySelector('#reset-filters');
        if (resetBtn) {
            resetBtn.addEventListener('click', resetFilters);
        }
        return;
    }

    // Render Cards
    const cards = filtered.map((sub, index) => {
        const icon = getSubmissionIcon(sub.type);
        const statusClass = getStatusClass(sub.status);
        const statusLabel = getStatusLabel(sub.status);
        const typeClass = getTypeClass(sub.type);
        const animationDelay = index * 0.05; // Fast stagger

        let footerContent = '';

        if (sub.status === 'graded') {
            footerContent = `
                <div class="submission-footer graded">
                    <div class="grade-box">
                        <div class="grade-circle">
                            <span class="grade-value">${sub.grade.toFixed(1).replace('.', ',')}</span>
                        </div>
                        <div class="grade-meta">
                            <span class="grade-label">Bewertet</span>
                            <span class="feedback-preview">"${sub.feedback}"</span>
                        </div>
                    </div>
                </div>
            `;
        } else if (sub.status === 'upcoming' || sub.status === 'pending') {
            const daysLeft = calculateDaysLeft(sub.dueDate, currentDate);
            const urgentClass = daysLeft < 7 ? 'urgent' : '';
            const daysLabel = daysLeft < 0 ? 'Überfällig' : (daysLeft === 0 ? 'Heute fällig' : `Noch ${daysLeft} Tage`);

            let progressBar = '';
            if (sub.progress) {
                progressBar = `
                    <div class="progress-wrapper">
                        <div class="progress-info">
                            <span>Fortschritt</span>
                            <span>${sub.progress}%</span>
                        </div>
                        <div class="progress-container">
                            <div class="progress-bar" style="width: ${sub.progress}%"></div>
                        </div>
                    </div>
                 `;
            }

            footerContent = `
                <div class="submission-footer upcoming">
                    <div class="due-date-badge ${urgentClass}">
                        <span class="material-icons-round">event</span>
                        <span>${daysLabel} (${formatDate(sub.dueDate)})</span>
                    </div>
                    ${progressBar}
                    <button class="btn btn-primary btn-sm btn-action-glow">
                        <span class="material-icons-round">upload</span>
                        Abgeben
                    </button>
                </div>
             `;
        } else if (sub.status === 'submitted') {
            footerContent = `
                <div class="submission-footer submitted">
                     <div class="submitted-state">
                        <div class="submitted-icon-circle">
                            <span class="material-icons-round">check</span>
                        </div>
                        <div class="submitted-text">
                            <strong>Eingereicht</strong>
                            <span>am ${formatDate(sub.dateSubmitted)}</span>
                        </div>
                    </div>
                    <button class="btn btn-outline btn-sm">Ansehen</button>
                </div>
            `;
        }

        return `
            <div class="card submission-card" style="animation-delay: ${animationDelay}s">
                <div class="card-header submission-header">
                    <div class="submission-type-icon ${typeClass}">
                        <span class="material-icons-round">${icon}</span>
                    </div>
                    <div class="submission-info">
                        <span class="submission-type">${sub.type}</span>
                        <h3>${sub.title}</h3>
                        <span class="submission-module">${sub.module}</span>
                    </div>
                    <div class="status-badge ${statusClass}">
                        <span class="status-dot"></span>
                        ${statusLabel}
                    </div>
                </div>
                ${footerContent}
            </div>
        `;
    }).join('');

    container.innerHTML = cards;
}

function resetFilters() {
    currentFilter = 'all';
    searchQuery = '';

    // Update UI Controls
    const filterBtns = document.querySelectorAll('.submissions-controls .filter-chip');
    filterBtns.forEach(btn => {
        if (btn.dataset.filter === 'all') btn.classList.add('active');
        else btn.classList.remove('active');
    });

    const searchInput = document.getElementById('submission-search');
    if (searchInput) searchInput.value = '';

    renderList();
}

function getTypeClass(type) {
    if (type.includes('Praxis')) return 'type-project';
    if (type.includes('Bachelor')) return 'type-thesis';
    if (type.includes('Präsentation')) return 'type-presentation';
    return 'type-default';
}

function getSubmissionIcon(type) {
    if (type.includes('Praxis')) return 'work';
    if (type.includes('Bachelor')) return 'school';
    if (type.includes('Präsentation')) return 'slideshow';
    return 'description';
}

function getStatusClass(status) {
    switch (status) {
        case 'graded': return 'success';
        case 'submitted': return 'info';
        case 'upcoming': return 'warning';
        case 'pending': return 'neutral';
        default: return 'neutral';
    }
}

function getStatusLabel(status) {
    switch (status) {
        case 'graded': return 'Bewertet';
        case 'submitted': return 'Eingereicht';
        case 'upcoming': return 'Ausstehend';
        case 'pending': return 'In Bearbeitung';
        default: return status;
    }
}

function calculateDaysLeft(dateStr, baseDateStr = null) {
    const today = baseDateStr ? new Date(baseDateStr) : new Date();
    const due = new Date(dateStr);
    const diffTime = due - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return dateStr;
}
