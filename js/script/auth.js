export function initAuth() {
    const profileBtn = document.getElementById('profile-btn');
    const userDropdown = document.getElementById('user-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    const mainContent = document.getElementById('main-content');
    const loginOverlay = document.getElementById('login');

    if (profileBtn && userDropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!userDropdown.contains(e.target) && !profileBtn.contains(e.target)) {
                userDropdown.classList.remove('active');
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            userDropdown.classList.remove('active');
            if (mainContent) mainContent.style.display = 'none';
            if (loginOverlay) {
                loginOverlay.classList.remove('fade-out');
                loginOverlay.classList.add('active');
                loginOverlay.style.display = 'flex';
                loginOverlay.style.opacity = '1';
            }

            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            if (usernameInput) usernameInput.value = '';
            if (passwordInput) passwordInput.value = '';
        });
    }
}

export function initLogin(onLoginSuccess) {
    const loginForm = document.getElementById('login-form');
    const loginOverlay = document.getElementById('login');
    const mainContent = document.getElementById('main-content');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            if (submitBtn) {
                submitBtn.textContent = 'Wird angemeldet...';
                submitBtn.disabled = true;
            }

            setTimeout(() => {
                loginOverlay.style.opacity = '0';
                loginOverlay.style.transition = 'opacity 0.5s ease-out';

                setTimeout(() => {
                    loginOverlay.style.display = 'none';
                    mainContent.style.display = 'block';
                    mainContent.style.animation = 'fadeIn 0.5s ease-out';

                    if (submitBtn) {
                        submitBtn.textContent = 'Anmelden';
                        submitBtn.disabled = false;
                    }

                    if (onLoginSuccess) onLoginSuccess();

                }, 500);
            }, 1000);
        });
    }
}
