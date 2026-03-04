// =============================================================================
// Mock-Datenbank – Zentrale Datenquelle für CampusPlatform
// Alle Daten (Nutzer, Module, Noten, Prüfungen, etc.) werden hier verwaltet.
// Kein Hardcoding in anderen JS-Dateien.
// =============================================================================

const mockData = {
    config: {
        currentDate: "2026-03-04",
        currentTime: "14:00"
    },

    // -------------------------------------------------------------------------
    // Nutzer – Drei Nutzergruppen: Student, Dozent, Verwaltung
    // -------------------------------------------------------------------------
    users: [
        {
            id: 1,
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
            name: "Prof. Dr. Weber",
            role: "dozent",
            roleLabel: "Dozent",
            email: "weber@university.edu",
            department: "Wirtschaftsinformatik"
        },
        {
            id: 3,
            name: "Anna Schmidt",
            role: "verwaltung",
            roleLabel: "Verwaltung",
            email: "schmidt@university.edu",
            department: "Studierendensekretariat"
        }
    ],

    // -------------------------------------------------------------------------
    // Module – Zentrale Datenhaltung für Vorlesungen, Noten, Prüfungen
    // Jedes Modul enthält: Status, Note, Versuch, Stundenplan, Prüfung, Dateien
    // -------------------------------------------------------------------------
    modules: [
        // --- 1. Semester (WiSe 23/24) – Abgeschlossen ---
        {
            code: "WIN-101", name: "Einführung Wirtschaftsinformatik", semester: "WiSe 23/24",
            ects: 6, grade: 1.3, status: "passed", attempt: 1, dozentId: 2,
            lecturer: "Prof. Dr. Weber",
            exam: { date: "2024-02-15", grade: 1.3, type: "Klausur" }
        },
        {
            code: "INF-101", name: "Programmierung I", semester: "WiSe 23/24",
            ects: 6, grade: 1.7, status: "passed", attempt: 1,
            lecturer: "Prof. Dr. Müller",
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

        // --- 2. Semester (SoSe 2024) – Abgeschlossen ---
        {
            code: "INF-102", name: "Programmierung II", semester: "SoSe 2024",
            ects: 6, grade: 1.0, status: "passed", attempt: 1,
            lecturer: "Prof. Dr. Müller",
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

        // --- 3. Semester (WiSe 24/25) – Abgeschlossen ---
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

        // --- 4. Semester (SoSe 2025) – Abgeschlossen ---
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
            ects: 10, grade: 1.3, status: "passed", attempt: 1,
            lecturer: "Prof. Dr. Weber",
            exam: { date: "2025-07-25", grade: 1.3, type: "Projektarbeit" }
        },

        // --- 5. Semester (WiSe 25/26 – Aktuell) – Laufend ---
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
            ects: 5, status: "active", attempt: 1,
            lecturer: "Prof. Dr. Hoffmann",
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
            ects: 5, status: "registered", attempt: 1,
            lecturer: "Prof. Dr. Lang",
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

    // -------------------------------------------------------------------------
    // Allgemeine Dateien (nicht Modul-spezifisch)
    // -------------------------------------------------------------------------
    generalFiles: [
        {
            category: "Verwaltung",
            files: [
                { name: "Immatrikulationsbescheinigung_SoSe26.pdf", type: "pdf", size: "1.2 MB", date: "15.02.2026", source: "Studierendensekretariat" },
                { name: "Campus_Plan_2026_HighRes.jpg", type: "img", size: "8.4 MB", date: "01.01.2026", source: "Allgemein" }
            ]
        }
    ],

    // -------------------------------------------------------------------------
    // Abgaben (Student-spezifisch)
    // -------------------------------------------------------------------------
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

    // -------------------------------------------------------------------------
    // Benachrichtigungen
    // -------------------------------------------------------------------------
    notifications: [
        { text: "Neue Note in <strong>Mathematik II</strong>", time: "Vor 2 Stunden", icon: "grade", colorClass: "success" },
        { text: "Skript für <strong>Web Tech</strong> hochgeladen", time: "Gestern, 15:30", icon: "upload_file", colorClass: "primary" },
        { text: "Prüfungsanmeldung <strong>Betriebssysteme</strong>", time: "15. Feb", icon: "event", colorClass: "warning" }
    ]
};

/**
 * Gibt den aktuell ausgewählten Nutzer aus der Mock-DB zurück.
 * Die Auswahl wird in sessionStorage gespeichert.
 */
function getCurrentUser() {
    const userId = parseInt(sessionStorage.getItem('currentUserId')) || 1;
    return mockData.users.find(u => u.id === userId) || mockData.users[0];
}
