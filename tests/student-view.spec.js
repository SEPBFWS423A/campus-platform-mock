const { test, expect } = require('@playwright/test');
const { loginAsStudent, navigateToTab } = require('./helpers/login');
const { STUDENT, INVALID_CREDENTIALS, NAVIGATION_TABS, EXPECTED_MODULES } = require('./helpers/constants');


test.describe('Login', () => {

  test('leitet nach erfolgreicher Anmeldung zum Dashboard weiter', async ({ page }) => {
    await loginAsStudent(page);

    await expect(page.locator('#dashboard')).toBeVisible();
  });

  test('zeigt eine Fehlermeldung bei ungültigen Zugangsdaten', async ({ page }) => {
    await page.goto('/login.html');
    await page.locator('#username').fill(INVALID_CREDENTIALS.username);
    await page.locator('#password').fill(INVALID_CREDENTIALS.password);
    await page.locator('#login-form button[type="submit"]').click();

    await expect(page.locator('#login-error')).toBeVisible();
  });
});

test.describe('Dashboard', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test('begrüßt den Studenten mit Namen und zeigt Statistiken', async ({ page }) => {
    const header = page.locator('#dashboard .section-header');
    await expect(header).toContainText(STUDENT.fullName);

    const statCards = page.locator('#dashboard .stat-card');
    await expect(statCards).toHaveCount(3);
  });
});

test.describe('Navigation', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test('zeigt ausschließlich die für Studenten relevanten Menüpunkte', async ({ page }) => {
    const desktopNav = page.locator('.nav-links[role="tablist"]');
    const visibleTabs = desktopNav.locator('.nav-item:not(.hidden)');
    await expect(visibleTabs).toHaveCount(6);

    await expect(desktopNav.locator('.nav-item[data-target="dozent-courses"]')).toHaveClass(/hidden/);
    await expect(desktopNav.locator('.nav-item[data-target="admin-users"]')).toHaveClass(/hidden/);
  });

  test('wechselt beim Tab-Klick den sichtbaren Inhaltsbereich', async ({ page }) => {
    await navigateToTab(page, NAVIGATION_TABS.grades);

    await expect(page.locator('#grades')).toBeVisible();
    await expect(page.locator('#dashboard')).not.toBeVisible();
    await expect(page.locator(`.nav-item[data-target="${NAVIGATION_TABS.grades}"]`).first()).toHaveClass(/active/);
  });
});

test.describe('Vorlesungen', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
    await navigateToTab(page, NAVIGATION_TABS.schedule);
  });

  test('listet die eingeschriebenen Module in der Modulübersicht', async ({ page }) => {
    const overview = page.locator('#schedule-overview');

    for (const moduleName of EXPECTED_MODULES) {
      await expect(overview).toContainText(moduleName);
    }
  });

  test('zeigt im Kalender-Tab eine Wochenansicht mit Veranstaltungen', async ({ page }) => {
    await page.locator('.section-tab[data-tab="schedule-calendar"]').click();

    const calendarEvents = page.locator('#schedule-calendar .calendar-event');
    const eventCount = await calendarEvents.count();
    expect(eventCount).toBeGreaterThan(0);
  });
});

test.describe('Noten', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
    await navigateToTab(page, NAVIGATION_TABS.grades);
  });

  test('klappt Semester-Sektionen per Klick ein und wieder aus', async ({ page }) => {
    const firstSection = page.locator('#grades .semester-section').first();
    const sectionHeader = firstSection.locator('.semester-header').first();

    await sectionHeader.click();
    await expect(firstSection).toHaveClass(/collapsed/);

    await sectionHeader.click();
    await expect(firstSection).not.toHaveClass(/collapsed/);
  });
});

test.describe('Abgaben', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
    await navigateToTab(page, NAVIGATION_TABS.submissions);
  });

  test('filtert Abgaben beim Klick auf einen Status-Chip', async ({ page }) => {
    const allCountBefore = await page.locator('#submissions .submission-card').count();

    await page.locator('#submissions .filter-chip[data-filter="graded"]').click();

    const filteredCount = await page.locator('#submissions .submission-card:visible').count();
    expect(filteredCount).toBeLessThanOrEqual(allCountBefore);
    expect(filteredCount).toBeGreaterThan(0);
  });
});

test.describe('Logout', () => {

  test('leitet nach dem Abmelden zurück zur Login-Seite', async ({ page }) => {
    await loginAsStudent(page);

    await page.locator('#profile-btn').click();
    await page.locator('#logout-btn').dispatchEvent('click');

    await page.waitForURL(/login/, { timeout: 10000 });
    await expect(page.locator('#login-form')).toBeVisible();
  });
});
