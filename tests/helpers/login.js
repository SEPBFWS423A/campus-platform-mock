const { STUDENT } = require('./constants');

async function loginAsStudent(page) {
  await page.goto('/login.html');
  await page.locator('#login-form').waitFor({ state: 'visible', timeout: 5000 });
  await page.locator('#username').waitFor({ state: 'visible', timeout: 5000 });
  await page.locator('#password').waitFor({ state: 'visible', timeout: 5000 });
  await page.locator('#username').click();
  await page.locator('#username').fill('');
  await page.locator('#username').fill(STUDENT.username);
  await page.locator('#password').click();
  await page.locator('#password').fill('');
  await page.locator('#password').fill(STUDENT.password);
  await page.locator('#login-form button[type="submit"]').waitFor({ state: 'visible', timeout: 5000 });
  await page.locator('#login-form button[type="submit"]').click();
  await page.waitForTimeout(300);
  const errorVisible = await page.locator('alert').isVisible();
  if (errorVisible) {
    const errorText = await page.locator('alert').innerText();
    console.log('Login-Fehler:', errorText);
    throw new Error('Login fehlgeschlagen: ' + errorText);
  }
  await page.waitForURL((url) => !url.pathname.endsWith('/login.html'), { timeout: 10000 });
  await page.locator('#main-content').waitFor({ state: 'visible' });
}

async function navigateToTab(page, tabName) {
  await page.locator(`.nav-item[data-target="${tabName}"]`).first().click();
  await page.locator(`#${tabName}`).waitFor({ state: 'visible' });
}

module.exports = { loginAsStudent, navigateToTab };
