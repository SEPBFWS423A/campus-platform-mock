import { escapeHTML } from '../../core/utils.js';

const FAQ = [
    {
        keywords: ['stundenplan', 'vorlesung', 'kalender', 'schedule'],
        answer: 'Deinen Stundenplan findest du unter <strong>Stundenplan</strong> in der Navigation. Dort siehst du sowohl eine Wochenübersicht als auch einen Kalender.',
        roles: ['student']
    },
    {
        keywords: ['note', 'noten', 'ergebnis', 'ergebnisse', 'bewertung'],
        answer: 'Deine Noten findest du unter <strong>Notenübersicht</strong>. Dort siehst du alle bestandenen und offenen Module mit ECTS und Durchschnitt.',
        roles: ['student']
    },
    {
        keywords: ['prüfung', 'pruefung', 'klausur', 'exam', 'anmeldung'],
        answer: 'Unter <strong>Prüfungen</strong> findest du alle anstehenden Prüfungstermine, Räume und den Anmeldestatus.',
        roles: ['student']
    },
    {
        keywords: ['abgabe', 'upload', 'einreichung', 'submission'],
        answer: 'Deine Abgaben verwaltest du unter <strong>Abgaben</strong>. Dort siehst du offene, eingereichte und bewertete Arbeiten.',
        roles: ['student']
    },
    {
        keywords: ['download', 'material', 'datei', 'skript', 'unterlagen'],
        answer: 'Lernmaterialien findest du im Bereich <strong>Downloads</strong>. Dort sind Skripte, Übungsblätter und weitere Dateien sortiert nach Modul.',
        roles: ['student', 'dozent']
    },
    {
        keywords: ['kurs', 'kurse', 'modul', 'teilnehmer'],
        answer: 'Unter <strong>Meine Kurse</strong> findest du alle dir zugewiesenen Module, den Kalender und die Teilnehmerlisten.',
        roles: ['dozent']
    },
    {
        keywords: ['note', 'noten', 'bewertung', 'grading', 'benotung'],
        answer: 'Noten vergibst du unter <strong>Benotung</strong>. Wähle einen Kurs und trage die Noten der Studierenden ein.',
        roles: ['dozent']
    },
    {
        keywords: ['raum', 'räume', 'raumverwaltung', 'buchung'],
        answer: 'Die Raumverwaltung findest du unter <strong>Raumverwaltung</strong>. Dort kannst du Räume einsehen, Belegungspläne prüfen und Buchungen verwalten.',
        roles: ['verwaltung']
    },
    {
        keywords: ['benutzer', 'nutzer', 'user', 'verwaltung', 'konto'],
        answer: 'Unter <strong>Benutzerverwaltung</strong> kannst du Benutzerkonten einsehen und verwalten — Studierende, Dozenten und Verwaltungspersonal.',
        roles: ['verwaltung']
    },
    {
        keywords: ['veranstaltung', 'event', 'planung', 'reihe'],
        answer: 'Veranstaltungsreihen verwaltest du unter <strong>Veranstaltungen</strong>. Dort kannst du Reihen anlegen, bearbeiten und die automatische Raumplanung nutzen.',
        roles: ['verwaltung']
    },
    {
        keywords: ['prüfungsamt', 'exam', 'ergebnis', 'prüfungsergebnis', 'csv'],
        answer: 'Prüfungsergebnisse verwaltest du unter <strong>Prüfungsamt</strong>. Dort kannst du Noten eintragen, CSV-Dateien importieren und Notenverteilungen einsehen.',
        roles: ['verwaltung']
    },
    {
        keywords: ['passwort', 'kennwort', 'ändern', 'password'],
        answer: 'Dein Passwort kannst du über dein <strong>Profilmenü</strong> oben rechts ändern. Klicke auf deinen Namen und wähle "Passwort ändern".',
        roles: ['student', 'dozent', 'verwaltung']
    },
    {
        keywords: ['dark', 'dunkel', 'theme', 'design', 'modus'],
        answer: 'Den Dark Mode kannst du über das <strong>Mond-Symbol</strong> oben rechts in der Navigationsleiste aktivieren.',
        roles: ['student', 'dozent', 'verwaltung']
    },
    {
        keywords: ['hilfe', 'help', 'support', 'kontakt', 'problem'],
        answer: 'Bei technischen Problemen wende dich bitte an den <strong>IT-Support</strong> unter support@campus-platform.de oder nutze das Ticketsystem im Intranet.',
        roles: ['student', 'dozent', 'verwaltung']
    }
];

const GREETING = 'Hallo! 👋 Ich bin der <strong>CampusPlatform AI-Chat</strong>. Wie kann ich dir helfen?';
const FALLBACK = 'Das habe ich leider nicht verstanden. Versuche es mit einem anderen Stichwort, z.\u00a0B. "Stundenplan", "Noten" oder "Prüfung".';

let panelOpen = false;
let currentRole = null;
let messages = [];

function getQuickReplies() {
    if (currentRole === 'student') return ['Stundenplan', 'Noten', 'Prüfungen', 'Abgaben'];
    if (currentRole === 'dozent') return ['Meine Kurse', 'Benotung', 'Downloads'];
    if (currentRole === 'verwaltung') return ['Raumverwaltung', 'Benutzer', 'Veranstaltungen', 'Prüfungsamt'];
    return ['Hilfe'];
}

function findAnswer(input) {
    const lower = input.toLowerCase().trim();
    if (!lower) return FALLBACK;

    let bestMatch = null;
    let bestScore = 0;

    for (const faq of FAQ) {
        if (!faq.roles.includes(currentRole)) continue;
        let score = 0;
        for (const kw of faq.keywords) {
            if (lower.includes(kw)) score++;
        }
        if (score > bestScore) {
            bestScore = score;
            bestMatch = faq;
        }
    }

    return bestMatch ? bestMatch.answer : FALLBACK;
}

function buildHTML() {
    return `
        <button class="chat-fab" id="chat-fab" type="button" aria-label="Chat öffnen">
            <span class="material-symbols-rounded">chat</span>
        </button>
        <div class="chat-panel" id="chat-panel">
            <div class="chat-header">
                <div class="chat-header-icon">
                    <span class="material-symbols-rounded">smart_toy</span>
                </div>
                <div class="chat-header-info">
                    <div class="chat-header-title">CampusPlatform AI-Chat</div>
                    <div class="chat-header-subtitle">Frag mich alles rund ums Studium</div>
                </div>
            </div>
            <div class="chat-messages" id="chat-messages"></div>
            <div class="chat-quick-replies" id="chat-quick-replies"></div>
            <div class="chat-input-area">
                <input type="text" class="chat-input" id="chat-input" placeholder="Nachricht eingeben…" autocomplete="off" />
                <button class="chat-send-btn" id="chat-send" type="button" aria-label="Senden">
                    <span class="material-symbols-rounded">send</span>
                </button>
            </div>
        </div>`;
}

function renderMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    container.innerHTML = messages.map(m =>
        `<div class="chat-msg ${m.from}">${m.html}</div>`
    ).join('');

    container.scrollTop = container.scrollHeight;
}

function renderQuickReplies() {
    const container = document.getElementById('chat-quick-replies');
    if (!container) return;

    const replies = getQuickReplies();
    container.innerHTML = replies.map(r =>
        `<button class="chat-quick-btn" type="button">${escapeHTML(r)}</button>`
    ).join('');

    container.querySelectorAll('.chat-quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            handleUserMessage(btn.textContent);
        });
    });
}

function addBotMessage(html) {
    messages.push({ from: 'bot', html });
    renderMessages();
}

function addUserMessage(text) {
    messages.push({ from: 'user', html: escapeHTML(text) });
    renderMessages();
}

function showTypingThenReply(html) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const typing = document.createElement('div');
    typing.className = 'chat-typing';
    typing.innerHTML = '<span class="chat-typing-dot"></span><span class="chat-typing-dot"></span><span class="chat-typing-dot"></span>';
    container.appendChild(typing);
    container.scrollTop = container.scrollHeight;

    const delay = 400 + Math.random() * 400;
    setTimeout(() => {
        typing.remove();
        addBotMessage(html);
    }, delay);
}

function handleUserMessage(text) {
    addUserMessage(text);
    const answer = findAnswer(text);
    showTypingThenReply(answer);
}

function togglePanel() {
    panelOpen = !panelOpen;
    const panel = document.getElementById('chat-panel');
    const fab = document.getElementById('chat-fab');
    if (!panel || !fab) return;

    panel.classList.toggle('visible', panelOpen);
    fab.classList.toggle('open', panelOpen);
    fab.querySelector('.material-symbols-rounded').textContent = panelOpen ? 'close' : 'chat';
    fab.setAttribute('aria-label', panelOpen ? 'Chat schließen' : 'Chat öffnen');

    if (panelOpen) {
        const input = document.getElementById('chat-input');
        if (input) setTimeout(() => input.focus(), 100);
    }
}

export function initChatWidget(role) {
    currentRole = role || 'student';
    messages = [];

    const wrapper = document.createElement('div');
    wrapper.id = 'chat-widget';
    wrapper.innerHTML = buildHTML();
    document.body.appendChild(wrapper);

    addBotMessage(GREETING);
    renderQuickReplies();

    document.getElementById('chat-fab').addEventListener('click', togglePanel);

    document.getElementById('chat-send').addEventListener('click', () => {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text) return;
        input.value = '';
        handleUserMessage(text);
    });

    document.getElementById('chat-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('chat-send').click();
        }
    });
}
