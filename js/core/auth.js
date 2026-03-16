export function initAuth() {
    const profileBtn = document.getElementById('profile-btn');
    const userDropdown = document.getElementById('user-dropdown');
    const logoutBtn = document.getElementById('logout-btn');

    if (profileBtn && userDropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = userDropdown.classList.toggle('active');
            profileBtn.setAttribute('aria-expanded', String(isOpen));
        });

        document.addEventListener('click', (e) => {
            if (!userDropdown.contains(e.target) && !profileBtn.contains(e.target)) {
                userDropdown.classList.remove('active');
                profileBtn.setAttribute('aria-expanded', 'false');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && userDropdown.classList.contains('active')) {
                userDropdown.classList.remove('active');
                profileBtn.setAttribute('aria-expanded', 'false');
                profileBtn.focus();
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.clear();
            window.location.href = 'login.html';
        });
    }

    renderUserSwitcher();
}

function renderUserSwitcher() {
    const container = document.getElementById('user-switch-list');
    if (!container || typeof mockData === 'undefined') return;

    const currentUser = getCurrentUser();
    const roleIcons = {
        student: 'person',
        dozent: 'school',
        verwaltung: 'admin_panel_settings'
    };
    const roleGroupLabels = {
        verwaltung: 'Verwaltung',
        dozent: 'Dozenten',
        student: 'Studierende'
    };
    const groupOrder = ['verwaltung', 'dozent', 'student'];

    const grouped = {};
    for (const user of mockData.users) {
        if (!grouped[user.role]) grouped[user.role] = [];
        grouped[user.role].push(user);
    }

    let html = '';
    for (const role of groupOrder) {
        const users = grouped[role];
        if (!users || users.length === 0) continue;
        html += `<div class="user-switch-group-label">${roleGroupLabels[role]}</div>`;
        html += users.map(user => {
            const isActive = user.id === currentUser.id;
            return `
                <button class="dropdown-item user-switch-item ${isActive ? 'active' : ''}"
                        data-user-id="${user.id}" role="menuitem"
                        ${isActive ? 'aria-current="true"' : ''}>
                    <span class="material-symbols-rounded" aria-hidden="true">${roleIcons[user.role] || 'person'}</span>
                    <span class="user-switch-info">
                        <span class="user-switch-name">${user.name}</span>
                        <span class="user-switch-role">${user.roleLabel}</span>
                    </span>
                    ${isActive ? '<span class="material-symbols-rounded user-switch-check" aria-hidden="true">check</span>' : ''}
                </button>
            `;
        }).join('');
    }

    container.innerHTML = html;

    container.querySelectorAll('.user-switch-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = parseInt(btn.dataset.userId);
            if (userId === currentUser.id) return;
            sessionStorage.setItem('currentUserId', String(userId));
            window.location.reload();
        });
    });
}

export function checkAuth() {
    if (sessionStorage.getItem('isLoggedIn') !== 'true') {
        window.location.replace('login.html');
        return false;
    }
    return true;
}
