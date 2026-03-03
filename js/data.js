const mockData = {
    config: {
        currentDate: "2026-03-04",
        currentTime: "14:00",
        weekLabel: "KW 10 (02.03 - 06.03)",
        weekDays: ["Mo 02.03", "Di 03.03", "Mi 04.03", "Do 05.03", "Fr 06.03"]
    },
    user: {
        name: "Max Mustermann",
        role: "Student (B.Sc.)",
        matriculationNumber: "12345678",
        email: "max.mustermann@university.edu",
        courseOfStudy: "Wirtschaftsinformatik",
        semester: 5
    },
    // Centralized Data: Modules contain all info (grades, schedule, exams)
    modules: [
        // --- 1. Semester (WiSe 23/24) - Completed ---
        {
            code: "WIN-101", name: "Einführung Wirtschaftsinformatik", semester: "WiSe 23/24", ects: 6, grade: 1.3, status: "passed",
            exam: { date: "2024-02-15", grade: 1.3 }
        },
        {
            code: "INF-101", name: "Programmierung I", semester: "WiSe 23/24", ects: 6, grade: 1.7, status: "passed",
            exam: { date: "2024-02-20", grade: 1.7 }
        },
        {
            code: "MAT-101", name: "Mathematik I", semester: "WiSe 23/24", ects: 5, grade: 2.3, status: "passed",
            exam: { date: "2024-02-10", grade: 2.3 }
        },
        {
            code: "BWL-101", name: "Grundlagen der BWL", semester: "WiSe 23/24", ects: 5, grade: 2.0, status: "passed",
            exam: { date: "2024-02-05", grade: 2.0 }
        },

        // --- 2. Semester (SoSe 2024) - Completed ---
        {
            code: "INF-102", name: "Programmierung II", semester: "SoSe 2024", ects: 6, grade: 1.0, status: "passed",
            exam: { date: "2024-07-15", grade: 1.0 }
        },
        {
            code: "MAT-102", name: "Statistik", semester: "SoSe 2024", ects: 5, grade: 3.0, status: "passed",
            exam: { date: "2024-07-18", grade: 3.0 }
        },
        {
            code: "BWL-102", name: "Rechnungswesen", semester: "SoSe 2024", ects: 5, grade: 1.7, status: "passed",
            exam: { date: "2024-07-10", grade: 1.7 }
        },
        {
            code: "INF-103", name: "Datenbanken I", semester: "SoSe 2024", ects: 5, grade: 2.3, status: "passed",
            exam: { date: "2024-07-22", grade: 2.3 }
        },

        // --- 3. Semester (WiSe 24/25) - Completed ---
        {
            code: "WIN-201", name: "Geschäftsprozessmodellierung", semester: "WiSe 24/25", ects: 6, grade: 1.3, status: "passed",
            exam: { date: "2025-02-14", grade: 1.3 }
        },
        {
            code: "INF-205", name: "Software Engineering", semester: "WiSe 24/25", ects: 6, grade: 2.0, status: "passed",
            exam: { date: "2025-02-20", grade: 2.0 }
        },
        {
            code: "BWL-201", name: "Investition & Finanzierung", semester: "WiSe 24/25", ects: 5, grade: 2.7, status: "passed",
            exam: { date: "2025-02-10", grade: 2.7 }
        },

        // --- 4. Semester (SoSe 2025) - Completed ---
        {
            code: "INF-301", name: "Datenbanken II", semester: "SoSe 2025", ects: 5, grade: 1.7, status: "passed",
            exam: { date: "2025-07-15", grade: 1.7 }
        },
        {
            code: "WIN-301", name: "E-Business", semester: "SoSe 2025", ects: 5, grade: 1.0, status: "passed",
            exam: { date: "2025-07-20", grade: 1.0 }
        },
        {
            code: "WIN-302", name: "Projekt Wirtschaftsinformatik", semester: "SoSe 2025", ects: 10, grade: 1.3, status: "passed",
            exam: { date: "2025-07-25", grade: 1.3, type: "Projektarbeit" }
        },

        // --- 5. Semester (WiSe 25/26 - Current) - Active ---
        {
            code: "WIN-401", name: "IT-Projektmanagement", semester: "WiSe 25/26", ects: 5, status: "active",
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
            code: "WIN-402", name: "ERP-Systeme (SAP)", semester: "WiSe 25/26", ects: 6, status: "active",
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
            code: "INF-405", name: "Künstliche Intelligenz", semester: "WiSe 25/26", ects: 5, status: "active",
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
            code: "WIN-403", name: "IT-Recht & Compliance", semester: "WiSe 25/26", ects: 5, status: "registered",
            schedule: [
                { day: 3, start: "09:45", end: "13:00", room: "R 2.10", type: "Vorlesung", color: "green" },
                { day: 2, start: "13:45", end: "17:00", room: "R 2.10", type: "Übung", color: "green" }
            ],
            exam: {
                status: "registered", date: "2026-02-28", time: "10:00 - 11:30",
                room: "Hörsaal 4", type: "Klausur (90 min)"
            }
        }
    ],
    // Some resources are not specific to a module
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
            dueDate: "2026-02-25",
            status: "upcoming"
        }
    ],
    // Activity Log could be derived, but difficult to mock "history" from static current state.
    // We will keep a small static list or generate it.
    notifications: [
        { text: "Neue Note in <strong>Mathematik II</strong>", time: "Vor 2 Stunden", icon: "grade", colorClass: "success" },
        { text: "Skript für <strong>Web Tech</strong> hochgeladen", time: "Gestern, 15:30", icon: "upload_file", colorClass: "primary" },
        { text: "Prüfungsanmeldung <strong>Betriebssysteme</strong>", time: "15. Feb", icon: "event", colorClass: "warning" }
    ]
};
