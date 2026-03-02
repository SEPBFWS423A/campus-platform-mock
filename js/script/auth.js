export function initAuth() {
    const profileBtn = document.getElementById('profile-btn');
    const userDropdown = document.getElementById('user-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    const mainContent = document.getElementById('main-content');
    const loginOverlay = document.getElementById('login');

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

        // Close dropdown on Escape
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
            userDropdown.classList.remove('active');
            profileBtn.setAttribute('aria-expanded', 'false');
            if (mainContent) mainContent.classList.add('hidden');
            if (loginOverlay) {
                loginOverlay.classList.remove('fade-out');
                loginOverlay.classList.add('active');
                loginOverlay.style.display = 'flex';
                loginOverlay.style.opacity = '1';
                // Focus the username input for re-login
                const usernameInput = document.getElementById('username');
                if (usernameInput) {
                    usernameInput.value = '';
                    setTimeout(() => usernameInput.focus(), 100);
                }
            }

            const passwordInput = document.getElementById('password');
            if (passwordInput) passwordInput.value = '';
        });
    }
}

export function initLogin(onLoginSuccess) {
    const loginForm = document.getElementById('login-form');
    const loginOverlay = document.getElementById('login');
    const mainContent = document.getElementById('main-content');

    // Focus username input on page load
    const usernameInput = document.getElementById('username');
    if (usernameInput && loginOverlay && loginOverlay.classList.contains('active')) {
        setTimeout(() => usernameInput.focus(), 300);
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            if (submitBtn) {
                submitBtn.textContent = 'Wird angemeldet...';
                submitBtn.disabled = true;
                submitBtn.setAttribute('aria-busy', 'true');
            }

            setTimeout(() => {
                loginOverlay.style.opacity = '0';
                loginOverlay.style.transition = 'opacity 0.5s ease-out';

                setTimeout(() => {
                    loginOverlay.style.display = 'none';
                    mainContent.classList.remove('hidden');
                    mainContent.style.display = 'block';
                    mainContent.style.animation = 'fadeIn 0.5s ease-out';

                    if (submitBtn) {
                        submitBtn.textContent = 'Anmelden';
                        submitBtn.disabled = false;
                        submitBtn.removeAttribute('aria-busy');
                    }

                    if (onLoginSuccess) onLoginSuccess();

                    // Focus main content for screen readers
                    mainContent.focus();

                }, 500);
            }, 1000);
        });
    }
}
