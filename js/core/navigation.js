export function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('mobile-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');
            setActiveTab(targetId);
        });

        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const targetId = item.getAttribute('data-target');
                setActiveTab(targetId);
            }
        });
    });

    function toggleSidebar() {
        if (!sidebar || !overlay) return;
        const isActive = sidebar.classList.contains('active');
        if (isActive) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            sidebar.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            if (mobileMenuBtn) mobileMenuBtn.focus();
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
        } else {
            overlay.style.display = 'block';
            document.body.style.overflow = 'hidden';
            setTimeout(() => {
                sidebar.classList.add('active');
                overlay.classList.add('active');
                sidebar.setAttribute('aria-hidden', 'false');
                const firstLink = sidebar.querySelector('.nav-item');
                if (firstLink) firstLink.focus();
            }, 10);
        }
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar && sidebar.classList.contains('active')) {
            toggleSidebar();
        }
    });

    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', toggleSidebar);
    if (overlay) overlay.addEventListener('click', toggleSidebar);

    const sidebarLinks = sidebar ? sidebar.querySelectorAll('.nav-item') : [];
    sidebarLinks.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');
            toggleSidebar();
            setActiveTab(targetId);
        });
    });

    function setActiveTab(targetId) {
        navItems.forEach(nav => {
            const isTarget = nav.getAttribute('data-target') === targetId;
            nav.classList.toggle('active', isTarget);
            nav.setAttribute('aria-selected', String(isTarget));
        });

        sections.forEach(section => {
            const isTarget = section.id === targetId;
            section.classList.toggle('active', isTarget);
            section.setAttribute('aria-hidden', String(!isTarget));
        });

        const sectionTitle = document.querySelector(`#${targetId} .section-header h1`);
        if (sectionTitle) {
            document.title = `CampusPlatform - ${sectionTitle.textContent}`;
        }
    }

    return { setActiveTab };
}
