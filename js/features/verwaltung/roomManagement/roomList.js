import { escapeHTML } from '../../../core/utils.js';
import { showModal, closeModal, showConfirmDialog } from '../../../core/modal.js';
import { renderRoomManagement } from './index.js';

export function renderRoomList(data) {
    const panel = document.getElementById('room-list');
    if (!panel) return;

    const rooms = [...data.rooms].sort((a, b) => a.name.localeCompare(b.name, 'de'));

    panel.innerHTML = `
        <div class="card">
            <div class="card-header room-card-header">
                <h3>Neuen Raum anlegen</h3>
            </div>
            <form class="inline-create-form" id="room-create-form" autocomplete="off">
                <div class="form-group">
                    <label for="new-room-name">Raumname</label>
                    <input type="text" id="new-room-name" class="form-control" placeholder="z.B. Hörsaal 3" required>
                </div>
                <div class="form-group">
                    <label for="new-room-seats">Plätze</label>
                    <input type="number" id="new-room-seats" class="form-control" min="0" step="1" placeholder="0" required>
                </div>
                <div class="form-group">
                    <label for="new-room-exam-seats">Klausurplätze</label>
                    <input type="number" id="new-room-exam-seats" class="form-control" min="0" step="1" placeholder="0" required>
                </div>
                <button type="submit" class="btn btn-sm btn-primary">
                    <span class="material-symbols-rounded">add</span> Anlegen
                </button>
            </form>
            <div id="room-create-error" class="management-alert error room-hidden"></div>
        </div>

        <div class="card room-card-spacing">
            <div class="card-header room-card-header">
                <h3>Alle Räume</h3>
            </div>
            ${rooms.length === 0
                ? `<div class="management-empty">
                        <span class="material-symbols-rounded">meeting_room</span>
                        <p>Noch keine Räume angelegt.</p>
                   </div>`
                : `<div class="room-table-wrapper">
                    <table class="management-table" id="rooms-table">
                        <thead>
                            <tr>
                                <th scope="col">Name</th>
                                <th scope="col">Plätze</th>
                                <th scope="col">Klausurplätze</th>
                                <th scope="col">Belegungen</th>
                                <th scope="col">Aktionen</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rooms.map(room => `
                                <tr data-room-id="${room.id}">
                                    <td class="room-name-cell">${escapeHTML(room.name)}</td>
                                    <td>${room.seats}</td>
                                    <td>${room.examSeats}</td>
                                    <td>${Array.isArray(room.bookings) ? room.bookings.length : 0}</td>
                                    <td>
                                        <div class="actions-cell">
                                            <button class="btn-icon-only edit-room-btn" title="Bearbeiten" data-room-id="${room.id}">
                                                <span class="material-symbols-rounded">edit</span>
                                            </button>
                                            <button class="btn-icon-only danger delete-room-btn" title="Löschen" data-room-id="${room.id}">
                                                <span class="material-symbols-rounded">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                  </div>`
            }
        </div>
    `;

    const form = document.getElementById('room-create-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleCreateRoom(data);
        });
    }

    panel.querySelectorAll('.edit-room-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const roomId = parseInt(btn.dataset.roomId);
            openEditRoomModal(data, roomId);
        });
    });

    panel.querySelectorAll('.delete-room-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const roomId = parseInt(btn.dataset.roomId);
            handleDeleteRoom(data, roomId);
        });
    });
}

function handleCreateRoom(data) {
    const nameInput = document.getElementById('new-room-name');
    const seatsInput = document.getElementById('new-room-seats');
    const examSeatsInput = document.getElementById('new-room-exam-seats');
    const errorDiv = document.getElementById('room-create-error');

    const name = nameInput.value.trim();
    const seats = parseInt(seatsInput.value, 10);
    const examSeats = parseInt(examSeatsInput.value, 10);

    if (errorDiv) errorDiv.classList.add('room-hidden');

    if (!name) {
        showCreateError(errorDiv, 'Bitte einen Raumnamen eingeben.');
        nameInput.focus();
        return;
    }

    const duplicate = data.rooms.some(r => r.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
        showCreateError(errorDiv, `Ein Raum mit dem Namen "${escapeHTML(name)}" existiert bereits.`);
        nameInput.focus();
        return;
    }

    if (Number.isNaN(seats) || seats < 0 || !Number.isInteger(seats)) {
        showCreateError(errorDiv, 'Plätze müssen eine ganze Zahl >= 0 sein.');
        seatsInput.focus();
        return;
    }

    if (Number.isNaN(examSeats) || examSeats < 0 || !Number.isInteger(examSeats)) {
        showCreateError(errorDiv, 'Klausurplätze müssen eine ganze Zahl >= 0 sein.');
        examSeatsInput.focus();
        return;
    }

    if (examSeats > seats) {
        showCreateError(errorDiv, 'Klausurplätze dürfen die Gesamtplätze nicht übersteigen.');
        examSeatsInput.focus();
        return;
    }

    const maxId = data.rooms.reduce((max, r) => Math.max(max, r.id || 0), 0);
    const newRoom = {
        id: maxId + 1,
        name: name,
        seats: seats,
        examSeats: examSeats,
        bookings: []
    };

    data.rooms.push(newRoom);
    renderRoomManagement(data);
}

function showCreateError(errorDiv, message) {
    if (!errorDiv) return;
    errorDiv.innerHTML = `<span class="material-symbols-rounded room-error-icon">error</span> ${message}`;
    errorDiv.classList.remove('room-hidden');
}

function openEditRoomModal(data, roomId) {
    const room = data.rooms.find(r => r.id === roomId);
    if (!room) return;

    const bodyHTML = `
        <form class="management-form" id="edit-room-form" autocomplete="off">
            <div class="form-group">
                <label for="edit-room-name">Raumname</label>
                <input type="text" id="edit-room-name" class="form-control" value="${escapeHTML(room.name)}" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="edit-room-seats">Plätze</label>
                    <input type="number" id="edit-room-seats" class="form-control" value="${room.seats}" min="0" step="1" required>
                </div>
                <div class="form-group">
                    <label for="edit-room-exam-seats">Klausurplätze</label>
                    <input type="number" id="edit-room-exam-seats" class="form-control" value="${room.examSeats}" min="0" step="1" required>
                </div>
            </div>
            <div id="edit-room-error" class="management-alert error room-hidden"></div>
        </form>
    `;

    const footerHTML = `
        <button class="btn btn-outline modal-cancel-btn" type="button">Abbrechen</button>
        <button class="btn btn-primary modal-save-btn" type="button">Speichern</button>
    `;

    showModal('Raum bearbeiten', bodyHTML, footerHTML);

    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;

    const cancelBtn = overlay.querySelector('.modal-cancel-btn');
    const saveBtn = overlay.querySelector('.modal-save-btn');

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => closeModal(), { once: true });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            handleSaveRoom(data, room);
        }, { once: true });
    }
}

function handleSaveRoom(data, room) {
    const nameInput = document.getElementById('edit-room-name');
    const seatsInput = document.getElementById('edit-room-seats');
    const examSeatsInput = document.getElementById('edit-room-exam-seats');
    const errorDiv = document.getElementById('edit-room-error');

    const name = nameInput.value.trim();
    const seats = parseInt(seatsInput.value, 10);
    const examSeats = parseInt(examSeatsInput.value, 10);

    if (errorDiv) errorDiv.classList.add('room-hidden');

    if (!name) {
        showCreateError(errorDiv, 'Bitte einen Raumnamen eingeben.');
        nameInput.focus();
        return;
    }

    const duplicate = data.rooms.some(r => r.id !== room.id && r.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
        showCreateError(errorDiv, `Ein Raum mit dem Namen "${escapeHTML(name)}" existiert bereits.`);
        nameInput.focus();
        return;
    }

    if (Number.isNaN(seats) || seats < 0 || !Number.isInteger(seats)) {
        showCreateError(errorDiv, 'Plätze müssen eine ganze Zahl >= 0 sein.');
        seatsInput.focus();
        return;
    }

    if (Number.isNaN(examSeats) || examSeats < 0 || !Number.isInteger(examSeats)) {
        showCreateError(errorDiv, 'Klausurplätze müssen eine ganze Zahl >= 0 sein.');
        examSeatsInput.focus();
        return;
    }

    if (examSeats > seats) {
        showCreateError(errorDiv, 'Klausurplätze dürfen die Gesamtplätze nicht übersteigen.');
        examSeatsInput.focus();
        return;
    }

    room.name = name;
    room.seats = seats;
    room.examSeats = examSeats;

    closeModal();
    renderRoomManagement(data);
}

function handleDeleteRoom(data, roomId) {
    const room = data.rooms.find(r => r.id === roomId);
    if (!room) return;

    showConfirmDialog(
        'Raum löschen',
        `Möchten Sie den Raum "${escapeHTML(room.name)}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
        () => {
            const index = data.rooms.findIndex(r => r.id === roomId);
            if (index !== -1) {
                data.rooms.splice(index, 1);
            }
            renderRoomManagement(data);
        }
    );
}
