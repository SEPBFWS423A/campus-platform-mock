const STUDENT = {
  username: 'max.mustermann',
  password: 'student123',
  fullName: 'Max Mustermann',
  role: 'Student',
  program: 'Wirtschaftsinformatik',
  semester: '5. Semester',
};

const INVALID_CREDENTIALS = {
  username: 'unbekannt',
  password: 'falsch',
};

const NAVIGATION_TABS = {
  dashboard: 'dashboard',
  schedule: 'schedule',
  grades: 'grades',
  submissions: 'submissions',
  downloads: 'downloads',
};

const EXPECTED_MODULES = [
  'IT-Projektmanagement',
  'ERP-Systeme',
  'Künstliche Intelligenz',
];

module.exports = {
  STUDENT,
  INVALID_CREDENTIALS,
  NAVIGATION_TABS,
  EXPECTED_MODULES,
};
