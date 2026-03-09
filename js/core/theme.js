export function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.classList.add(savedTheme);
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        body.classList.add(prefersDark ? 'dark-mode' : 'light-mode');
    }
    updateThemeIcon();

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isDark = body.classList.contains('dark-mode');
            body.classList.replace(
                isDark ? 'dark-mode' : 'light-mode',
                isDark ? 'light-mode' : 'dark-mode'
            );
            localStorage.setItem('theme', isDark ? 'light-mode' : 'dark-mode');
            updateThemeIcon();
        });
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            body.classList.replace(
                e.matches ? 'light-mode' : 'dark-mode',
                e.matches ? 'dark-mode' : 'light-mode'
            );
            updateThemeIcon();
        }
    });

    function updateThemeIcon() {
        if (!themeToggleBtn) return;
        const iconSpan = themeToggleBtn.querySelector('span');
        const isDark = body.classList.contains('dark-mode');
        iconSpan.textContent = isDark ? 'light_mode' : 'dark_mode';
        themeToggleBtn.setAttribute('aria-label', isDark ? 'Helles Design aktivieren' : 'Dunkles Design aktivieren');
    }
}
