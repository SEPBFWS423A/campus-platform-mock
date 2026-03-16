export function initTabs(container, {
    tabSelector = '.section-tab, .management-tab',
    panelSelector = '.tab-content, .management-tab-content',
    activeClass = 'active',
    useAria = false
} = {}) {
    const tabs = container.querySelectorAll(tabSelector);
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.dataset.tab;

            tabs.forEach(t => {
                t.classList.remove(activeClass);
                if (useAria) t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add(activeClass);
            if (useAria) tab.setAttribute('aria-selected', 'true');

            container.querySelectorAll(panelSelector).forEach(panel => {
                panel.classList.remove(activeClass);
            });

            const targetPanel = document.getElementById(targetId) ||
                container.querySelector(`${panelSelector}[data-tab="${targetId}"]`);
            if (targetPanel) targetPanel.classList.add(activeClass);
        });
    });
}
