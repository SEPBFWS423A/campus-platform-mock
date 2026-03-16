const mockData = {
    config: {
        get currentDate() {
            return new Date().toISOString().slice(0, 10);
        },
        get currentTime() {
            const now = new Date();
            return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        }
    },

    users: [
        {
            id: 1,
            username: "max.mustermann",
            password: "student123",
            name: "Max Mustermann",
            role: "student",
            roleLabel: "Student (B.Sc.)",
            matriculationNumber: "12345678",
            email: "max.mustermann@university.edu",
            courseOfStudy: "Wirtschaftsinformatik",
            semester: 5
        },
        {
            id: 2,
            username: "weber",
            password: "dozent123",
            name: "Prof. Dr. Weber",
            role: "dozent",
            roleLabel: "Dozent",
            email: "weber@university.edu",
            department: "Wirtschaftsinformatik"
        },
        {
            id: 3,
            username: "schmidt",
            password: "admin123",
            name: "Anna Schmidt",
            role: "verwaltung",
            roleLabel: "Verwaltung",
            email: "schmidt@university.edu",
            department: "Studierendensekretariat"
        },
        {
            id: 6,
            username: "rektor",
            password: "rektor123",
            name: "Dr. Thomas Rektor",
            role: "verwaltung",
            roleLabel: "Hochschulleitung",
            email: "rektor@university.edu",
            department: "Hochschulleitung"
        },
        {
            id: 7,
            username: "lisa.mueller",
            password: "pass456",
            name: "Lisa Mueller",
            role: "student",
            roleLabel: "Studentin (B.Sc.)",
            matriculationNumber: "260563",
            email: "lisa.mueller@university.edu",
            courseOfStudy: "Wirtschaftsinformatik",
            semester: 4
        },
        {
            id: 8,
            username: "mueller",
            password: "dozent456",
            name: "Prof. Dr. Mueller",
            role: "dozent",
            roleLabel: "Dozent",
            email: "mueller@university.edu",
            department: "Informatik"
        },
        {
            id: 9,
            username: "bauer",
            password: "mit123",
            name: "Klaus Bauer",
            role: "verwaltung",
            roleLabel: "Verwaltung",
            email: "bauer@university.edu",
            department: "Raumverwaltung"
        }
    ],

    modules: [
        {
            code: "WIN-101", name: "Einführung Wirtschaftsinformatik", semester: "WiSe 23/24",
            ects: 6, grade: 1.3, status: "passed", attempt: 1, dozentId: 2,
            lecturer: "Prof. Dr. Weber",
            exam: { date: "2024-02-15", grade: 1.3, type: "Klausur" }
        },
        {
            code: "INF-101", name: "Programmierung I", semester: "WiSe 23/24",
            ects: 6, grade: 1.7, status: "passed", attempt: 1, dozentId: 8,
            lecturer: "Prof. Dr. Mueller",
            exam: { date: "2024-02-20", grade: 1.7, type: "Klausur" }
        },
        {
            code: "MAT-101", name: "Mathematik I", semester: "WiSe 23/24",
            ects: 5, grade: 2.3, status: "passed", attempt: 2,
            lecturer: "Prof. Dr. Berger",
            exam: { date: "2024-02-10", grade: 2.3, type: "Klausur" }
        },
        {
            code: "BWL-101", name: "Grundlagen der BWL", semester: "WiSe 23/24",
            ects: 5, grade: 2.0, status: "passed", attempt: 1,
            lecturer: "Prof. Dr. Fischer",
            exam: { date: "2024-02-05", grade: 2.0, type: "Klausur" }
        },

        {
            code: "INF-102", name: "Programmierung II", semester: "SoSe 2024",
            ects: 6, grade: 1.0, status: "passed", attempt: 1, dozentId: 8,
            lecturer: "Prof. Dr. Mueller",
            exam: { date: "2024-07-15", grade: 1.0, type: "Klausur" }
        },
        {
            code: "MAT-102", name: "Statistik", semester: "SoSe 2024",
            ects: 5, grade: 3.0, status: "passed", attempt: 1,
            lecturer: "Prof. Dr. Berger",
            exam: { date: "2024-07-18", grade: 3.0, type: "Klausur" }
        },
        {
            code: "BWL-102", name: "Rechnungswesen", semester: "SoSe 2024",
            ects: 5, grade: 1.7, status: "passed", attempt: 1,
            lecturer: "Prof. Dr. Fischer",
            exam: { date: "2024-07-10", grade: 1.7, type: "Klausur" }
        },
        {
            code: "INF-103", name: "Datenbanken I", semester: "SoSe 2024",
            ects: 5, grade: 2.3, status: "passed", attempt: 1,
            lecturer: "Prof. Dr. Richter",
            exam: { date: "2024-07-22", grade: 2.3, type: "Klausur" }
        },

        {
            code: "WIN-201", name: "Geschäftsprozessmodellierung", semester: "WiSe 24/25",
            ects: 6, grade: 1.3, status: "passed", attempt: 1, dozentId: 2,
            lecturer: "Prof. Dr. Weber",
            exam: { date: "2025-02-14", grade: 1.3, type: "Klausur" }
        },
        {
            code: "INF-205", name: "Software Engineering", semester: "WiSe 24/25",
            ects: 6, grade: 2.0, status: "passed", attempt: 1,
            lecturer: "Prof. Dr. Keller",
            exam: { date: "2025-02-20", grade: 2.0, type: "Klausur" }
        },
        {
            code: "BWL-201", name: "Investition & Finanzierung", semester: "WiSe 24/25",
            ects: 5, grade: 2.7, status: "passed", attempt: 1,
            lecturer: "Prof. Dr. Fischer",
            exam: { date: "2025-02-10", grade: 2.7, type: "Klausur" }
        },
        {
            code: "INF-201", name: "Betriebssysteme", semester: "SoSe 2025",
            ects: 5, grade: 3.3, status: "passed", attempt: 2,
            lecturer: "Prof. Dr. Richter",
            exam: { date: "2025-07-10", grade: 3.3, type: "Klausur" }
        },

        {
            code: "INF-301", name: "Datenbanken II", semester: "SoSe 2025",
            ects: 5, grade: 1.7, status: "passed", attempt: 1,
            lecturer: "Prof. Dr. Richter",
            exam: { date: "2025-07-15", grade: 1.7, type: "Klausur" }
        },
        {
            code: "WIN-301", name: "E-Business", semester: "SoSe 2025",
            ects: 5, grade: 1.0, status: "passed", attempt: 1, dozentId: 2,
            lecturer: "Prof. Dr. Weber",
            exam: { date: "2025-07-20", grade: 1.0, type: "Klausur" }
        },
        {
            code: "WIN-302", name: "Projekt Wirtschaftsinformatik", semester: "SoSe 2025",
            ects: 10, grade: 1.3, status: "passed", attempt: 1, dozentId: 2,
            lecturer: "Prof. Dr. Weber",
            exam: { date: "2025-07-25", grade: 1.3, type: "Projektarbeit" }
        },

        {
            code: "WIN-401", name: "IT-Projektmanagement", semester: "WiSe 25/26",
            ects: 5, status: "active", attempt: 1, dozentId: 2,
            lecturer: "Prof. Dr. Weber",
            schedule: [
                { day: 0, start: "09:45", end: "13:00", room: "R 2.05", type: "Vorlesung", color: "blue" }
            ],
            exam: {
                status: "registered", date: "2026-03-15", time: "09:00 - 10:30",
                room: "Hörsaal 2", type: "Klausur (90 min)",
                examiner: "Prof. Dr. Weber"
            },
            files: [
                { name: "ITPM_Kapitel_1_Grundlagen.pdf", type: "pdf", size: "3.2 MB", date: "10.02.2026" }
            ]
        },
        {
            code: "WIN-402", name: "ERP-Systeme (SAP)", semester: "WiSe 25/26",
            ects: 6, status: "active", attempt: 1,
            lecturer: "Prof. Dr. Klein",
            schedule: [
                { day: 1, start: "13:45", end: "17:00", room: "PC-Labor 1", type: "Praktikum", color: "orange" },
                { day: 0, start: "13:45", end: "17:00", room: "R 1.02", type: "Vorlesung", color: "orange" }
            ],
            exam: {
                status: "upcoming", date: "2026-03-22", time: "10:00 - 13:00",
                room: "PC-Labor 1", type: "Praktische Prüfung",
                examiner: "Prof. Dr. Klein"
            }
        },
        {
            code: "INF-405", name: "Künstliche Intelligenz", semester: "WiSe 25/26",
            ects: 5, status: "active", attempt: 1, dozentId: 8,
            lecturer: "Prof. Dr. Mueller",
            schedule: [
                { day: 2, start: "09:45", end: "13:00", room: "Hörsaal 1", type: "Vorlesung", color: "purple" },
                { day: 4, start: "09:45", end: "13:00", room: "R 1.04", type: "Übung", color: "purple" }
            ],
            exam: {
                status: "open", date: "2026-03-18", time: "14:00 - 15:30",
                room: "Audimax", type: "Klausur (90 min)"
            },
            files: [
                { name: "KI_Skript_Complete.pdf", type: "pdf", size: "15 MB", date: "01.02.2026" },
                { name: "Übungsblatt_3_NeuronalNet.ipynb", type: "code", size: "2 MB", date: "15.02.2026" }
            ]
        },
        {
            code: "WIN-403", name: "IT-Recht & Compliance", semester: "WiSe 25/26",
            ects: 5, status: "registered", attempt: 1, dozentId: 2,
            lecturer: "Prof. Dr. Weber",
            schedule: [
                { day: 3, start: "09:45", end: "13:00", room: "R 2.10", type: "Vorlesung", color: "green" },
                { day: 2, start: "13:45", end: "17:00", room: "R 2.10", type: "Übung", color: "green" }
            ],
            exam: {
                status: "registered", date: "2026-03-25", time: "10:00 - 11:30",
                room: "Hörsaal 4", type: "Klausur (90 min)"
            }
        }
    ],

    generalFiles: [
        {
            category: "Verwaltung",
            files: [
                { name: "Immatrikulationsbescheinigung_SoSe26.pdf", type: "pdf", size: "1.2 MB", date: "15.02.2026", source: "Studierendensekretariat" },
                { name: "Campus_Plan_2026_HighRes.jpg", type: "img", size: "8.4 MB", date: "01.01.2026", source: "Allgemein" }
            ]
        }
    ],

    submissions: [
        {
            id: 1,
            title: "Projektarbeit Wirtschaftsinformatik",
            type: "Praxisarbeit",
            module: "WIN-302 Projekt Wirtschaftsinformatik",
            dueDate: "2025-07-15",
            status: "graded",
            grade: 1.3,
            feedback: "Sehr gute Analyse, technischer Teil könnte detaillierter sein."
        },
        {
            id: 2,
            title: "Entwicklung einer Web-Applikation",
            type: "Praxisarbeit",
            module: "WIN-402 ERP-Systeme",
            dueDate: "2026-03-01",
            status: "submitted",
            dateSubmitted: "2026-02-18"
        },
        {
            id: 3,
            title: "Bachelor Thesis: AI in Healthcare",
            type: "Bachelorarbeit",
            module: "Bachelor Thesis",
            dueDate: "2026-05-30",
            status: "pending",
            progress: 35
        },
        {
            id: 4,
            title: "Präsentation: IT-Sicherheit",
            type: "Präsentation",
            module: "WIN-403 IT-Recht & Compliance",
            dueDate: "2026-03-18",
            status: "upcoming"
        }
    ],

    notifications: [
        { text: "Neue Note in <strong>Mathematik II</strong>", time: "Vor 2 Stunden", icon: "grade", colorClass: "success" },
        { text: "Skript für <strong>Web Tech</strong> hochgeladen", time: "Gestern, 15:30", icon: "upload_file", colorClass: "primary" },
        { text: "Prüfungsanmeldung <strong>Betriebssysteme</strong>", time: "15. Feb", icon: "event", colorClass: "warning" }
    ],

    rooms: [
        { id: 1, name: "Hörsaal 1", seats: 200, examSeats: 100, bookings: [
            { day: 2, start: "09:45", end: "13:00", title: "Künstliche Intelligenz", eventSeriesId: 3, eventId: 1 }
        ]},
        { id: 2, name: "Hörsaal 2", seats: 150, examSeats: 75, bookings: [
            { day: 3, start: "09:00", end: "10:30", title: "Klausur IT-PM", eventSeriesId: 2, eventId: 3 }
        ]},
        { id: 3, name: "M-208", seats: 23, examSeats: 7, bookings: [] },
        { id: 4, name: "R 2.05", seats: 35, examSeats: 18, bookings: [
            { day: 0, start: "09:45", end: "11:15", title: "VL Grundlagen SE", eventSeriesId: 1, eventId: 1 },
            { day: 0, start: "13:45", end: "15:15", title: "VL Projektmanagement", eventSeriesId: 2, eventId: 1 }
        ]},
        { id: 5, name: "PC-Labor 1", seats: 25, examSeats: 25, bookings: [
            { day: 1, start: "13:45", end: "17:00", title: "ERP-Systeme Praktikum", eventSeriesId: null, eventId: null }
        ]},
        { id: 6, name: "R 1.02", seats: 40, examSeats: 20, bookings: [
            { day: 1, start: "09:45", end: "11:15", title: "Übung PM", eventSeriesId: 2, eventId: 2 }
        ]},
        { id: 7, name: "R 1.04", seats: 30, examSeats: 15, bookings: [
            { day: 4, start: "09:45", end: "13:00", title: "Übung KI", eventSeriesId: 3, eventId: 2 }
        ]},
        { id: 8, name: "R 2.10", seats: 45, examSeats: 22, bookings: [
            { day: 3, start: "09:45", end: "13:00", title: "IT-Recht Vorlesung", eventSeriesId: null, eventId: null },
            { day: 2, start: "13:45", end: "17:00", title: "IT-Recht Übung", eventSeriesId: null, eventId: null }
        ]},
        { id: 9, name: "Audimax", seats: 500, examSeats: 250, bookings: [] }
    ],

    eventSeries: [
        {
            id: 1,
            name: "Software Engineering",
            studentIds: [1, 7],
            events: [
                { id: 1, name: "VL Grundlagen", type: "Lehrveranstaltung", duration: 90, schedule: { day: 0, start: "09:45", end: "11:15" }, roomId: 4, order: 1 },
                { id: 2, name: "Klausur SE", type: "Klausur", duration: 90, schedule: null, roomId: null, order: 2 }
            ]
        },
        {
            id: 2,
            name: "IT-Projektmanagement",
            studentIds: [1, 5, 7],
            events: [
                { id: 1, name: "VL Projektmanagement", type: "Lehrveranstaltung", duration: 90, schedule: { day: 0, start: "13:45", end: "15:15" }, roomId: 4, order: 1 },
                { id: 2, name: "Übung PM", type: "Lehrveranstaltung", duration: 90, schedule: { day: 1, start: "09:45", end: "11:15" }, roomId: 6, order: 2 },
                { id: 3, name: "Klausur PM", type: "Klausur", duration: 90, schedule: { day: 3, start: "09:00", end: "10:30" }, roomId: 2, order: 3 }
            ]
        },
        {
            id: 3,
            name: "Künstliche Intelligenz",
            studentIds: [1, 4, 7],
            events: [
                { id: 1, name: "VL Neuronale Netze", type: "Lehrveranstaltung", duration: 90, schedule: { day: 2, start: "09:45", end: "13:00" }, roomId: 1, order: 1 },
                { id: 2, name: "Übung KI", type: "Lehrveranstaltung", duration: 90, schedule: { day: 4, start: "09:45", end: "13:00" }, roomId: 7, order: 2 },
                { id: 3, name: "Klausur KI", type: "Klausur", duration: 90, schedule: null, roomId: null, order: 3 }
            ]
        },
        {
            id: 4,
            name: "Software Testing & DevOps",
            studentIds: [],
            events: []
        },
        {
            id: 5,
            name: "IT-Recht & Compliance",
            studentIds: [1, 4, 7],
            events: [
                { id: 1, name: "VL IT-Recht", type: "Lehrveranstaltung", duration: 90, schedule: { day: 3, start: "09:45", end: "13:00" }, roomId: 8, order: 1 },
                { id: 2, name: "Übung IT-Recht", type: "Lehrveranstaltung", duration: 90, schedule: { day: 2, start: "13:45", end: "17:00" }, roomId: 8, order: 2 },
                { id: 3, name: "Klausur IT-Recht", type: "Klausur", duration: 90, schedule: null, roomId: null, order: 3 }
            ]
        }
    ],

    examResults: {
        "1-2": [
            { studentId: 1, grade: "1.3" },
            { studentId: 7, grade: "2.0" }
        ],
        "2-3": [
            { studentId: 1, grade: "2.7" },
            { studentId: 5, grade: "3.3" },
            { studentId: 7, grade: "1.7" }
        ]
    }
};

/**
 * Gibt den aktuell ausgewählten Nutzer aus der Mock-DB zurück.
 * Die Auswahl wird in sessionStorage gespeichert.
 */
function getCurrentUser() {
    const userId = parseInt(sessionStorage.getItem('currentUserId')) || 1;
    return mockData.users.find(u => u.id === userId) || mockData.users[0];
}
