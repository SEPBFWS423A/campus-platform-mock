let previousFocusElement = null;

export function showModal(title, bodyHTML, footerHTML = '', options = {}) {
    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    const footerEl = document.getElementById('modal-footer');
    const dialog = overlay ? overlay.querySelector('.modal-dialog') : null;

    if (!overlay || !titleEl || !bodyEl || !footerEl || !dialog) return;

    previousFocusElement = document.activeElement;

    dialog.classList.remove('modal-lg');
    if (options.sizeClass) {
        dialog.classList.add(options.sizeClass);
    }

    titleEl.textContent = title;
    bodyEl.innerHTML = bodyHTML;
    footerEl.innerHTML = footerHTML;

    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
        const focusable = overlay.querySelector('input, select, textarea, button:not(.modal-close-btn)');
        if (focusable) {
            focusable.focus();
        } else {
            const closeBtn = overlay.querySelector('.modal-close-btn');
            if (closeBtn) closeBtn.focus();
        }
    });
}

export function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;

    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    const dialog = overlay.querySelector('.modal-dialog');
    if (dialog) dialog.classList.remove('modal-lg');

    if (previousFocusElement && typeof previousFocusElement.focus === 'function') {
        previousFocusElement.focus();
    }
    previousFocusElement = null;
}

export function showConfirmDialog(title, message, onConfirm) {
    const bodyHTML = `<p style="margin: 0.5rem 0 1rem; color: var(--text-secondary);">${message}</p>`;
    const footerHTML = `
        <button class="btn btn-outline modal-cancel-btn" type="button">Abbrechen</button>
        <button class="btn btn-danger modal-confirm-btn" type="button">Bestätigen</button>
    `;

    showModal(title, bodyHTML, footerHTML);

    const overlay = document.getElementById('modal-overlay');
    const confirmBtn = overlay.querySelector('.modal-confirm-btn');
    const cancelBtn = overlay.querySelector('.modal-cancel-btn');

    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            closeModal();
            onConfirm();
        }, { once: true });
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => closeModal(), { once: true });
    }
}

export function initModal() {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;

    const closeBtn = overlay.querySelector('.modal-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            closeModal();
        }
    });

    overlay.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        const focusableElements = overlay.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    });
}
