const { STUDENT } = require('./constants');

async function loginAsStudent(page) {
  await page.goto('/login.html');
  await page.locator('#username').fill(STUDENT.username);
  await page.locator('#password').fill(STUDENT.password);
  await page.locator('#login-form button[type="submit"]').click();
  await page.waitForURL(/\/(index\.html)?(\?.*)?$/, { timeout: 10000 });
  await page.locator('#main-content').waitFor({ state: 'visible' });
}

async function navigateToTab(page, tabName) {
  await page.locator(`.nav-item[data-target="${tabName}"]`).first().click();
  await page.locator(`#${tabName}`).waitFor({ state: 'visible' });
}

module.exports = { loginAsStudent, navigateToTab };
