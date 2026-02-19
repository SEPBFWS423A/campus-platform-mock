export function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    const savedTheme = localStorage.getItem('theme') || 'light-mode';
    body.classList.add(savedTheme);
    updateThemeIcon();

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            if (body.classList.contains('light-mode')) {
                body.classList.replace('light-mode', 'dark-mode');
                localStorage.setItem('theme', 'dark-mode');
            } else {
                body.classList.replace('dark-mode', 'light-mode');
                localStorage.setItem('theme', 'light-mode');
            }
            updateThemeIcon();
        });
    }

    function updateThemeIcon() {
        if (!themeToggleBtn) return;
        const iconSpan = themeToggleBtn.querySelector('span');
        if (body.classList.contains('dark-mode')) {
            iconSpan.textContent = 'light_mode';
        } else {
            iconSpan.textContent = 'dark_mode';
        }
    }
}
