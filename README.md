# CampusPlatform Mock

A mock web application for a student campus management platform.

### Features
- **Dashboard**: Overview of upcoming tasks and events.
- **Schedule**: Weekly class timetable.
- **Grades**: Academic performance tracking.
- **Exams**: Upcoming examination dates.
- **Downloads**: Course materials and resources.
- **Submissions**: Assignment tracking and details.

### Tech Stack
- HTML5, CSS3, Vanilla JavaScript structure.
- Mock data integration for dynamic content rendering.

### Usage
Simply open `index.html` in your browser to start. No build step required.

---

## UI Tests with Playwright

The student view is covered by automated UI tests using [Playwright](https://playwright.dev/).

### Prerequisites

- **Node.js** (>= 18): [https://nodejs.org/](https://nodejs.org/)

### Setup on a New Machine

```bash
# 1. Clone the repository and switch to the test branch
git clone https://github.com/SEPBFWS423A/campus-platform-mock.git
cd campus-platform-mock
git checkout playwright-testing

# 2. Install dependencies
npm install

# 3. Download the Playwright browser
npx playwright install chromium
```

### Running the Tests

```bash
# Run all tests (headless)
npm test

# Run tests with a visible browser
npm run test:headed

# Run tests sequentially in a visible browser (ideal for presentations)
npm run test:demo

# Same as above but with slow motion
SLOWMO=1000 npm run test:demo
$env:SLOWMO=1000; npm run test:demo #Windows

# Launch the Playwright Test Runner UI (does NOT show the website)
npm run test:ui

# Open the HTML report after a test run
npm run test:report
```

> **Tip for presentations:** Use `npm run test:demo` to watch the tests run one by one in a visible browser. Add `SLOWMO=1000` (in ms) to slow down each interaction so the audience can follow along.

### Test Structure

```
tests/
├── helpers/
│   ├── constants.js      # Test data (credentials, module names, etc.)
│   └── login.js          # Helper functions (loginAsStudent, navigateToTab)
└── student-view.spec.js  # 10 UI tests for the student view
```
