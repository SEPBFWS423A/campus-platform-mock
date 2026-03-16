export function initNotifications(data) {
    const notifications = data.notifications || [];
    const btn = document.getElementById('notification-btn');
    const dropdown = document.getElementById('notification-dropdown');
    const badge = document.getElementById('notification-badge');
    const list = document.getElementById('notification-list');

    if (!btn || !dropdown || !badge || !list) return;

    if (notifications.length > 0) {
        badge.textContent = notifications.length;
        badge.hidden = false;
    }

    list.innerHTML = notifications.length > 0
        ? notifications.map(n => `
            <li class="notification-item">
                <div class="activity-icon ${n.colorClass || 'primary'}">
                    <span class="material-symbols-rounded">${n.icon || 'info'}</span>
                </div>
                <div class="activity-content">
                    <p class="activity-text">${n.text}</p>
                    <span class="activity-time">${n.time}</span>
                </div>
            </li>`).join('')
        : '<li class="notification-item"><div class="activity-content"><p class="activity-text">Keine neuen Benachrichtigungen</p></div></li>';

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = !dropdown.hidden;
        dropdown.hidden = isOpen;
        btn.setAttribute('aria-expanded', String(!isOpen));

        if (!isOpen) {
            badge.hidden = true;
        }
    });

    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && e.target !== btn) {
            dropdown.hidden = true;
            btn.setAttribute('aria-expanded', 'false');
        }
    });
}
