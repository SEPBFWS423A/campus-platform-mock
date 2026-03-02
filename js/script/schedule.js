import { timeToMinutes, escapeHTML } from './utils.js';

export function renderSchedule(data) {
    const weekHeader = document.querySelector('.calendar-controls h3');
    if (weekHeader) weekHeader.textContent = data.config.weekLabel;

    const grid = document.querySelector('.calendar-grid-detailed');
    if (grid) {
        const timeColumn = grid.firstElementChild.outerHTML;
        const dayColumns = data.config.weekDays.map((dayLabel, dayIndex) => {
            let dayEvents = [];
            data.modules.forEach(m => {
                if (m.schedule) {
                    m.schedule.filter(s => s.day === dayIndex).forEach(s => {
                        const startMin = timeToMinutes(s.start);
                        const endMin = timeToMinutes(s.end);
                        const duration = endMin - startMin;
                        const top = startMin - 480;
                        const height = duration;

                        dayEvents.push({
                            title: m.name,
                            time: `${s.start} - ${s.end}`,
                            loc: s.room,
                            color: s.color || "blue",
                            top: top,
                            height: height
                        });
                    });
                }
            });

            const isCurrent = dayIndex === 1;

            return `
                <div class="day-column">
                    <div class="day-header ${isCurrent ? 'current-day' : ''}">${dayLabel}</div>
                    <div class="day-content">
                        ${dayEvents.map(event => `
                            <div class="calendar-event ${event.color}" style="top: ${event.top}px; height: ${event.height}px;">
                                <span class="event-time">${escapeHTML(event.time)}</span>
                                <span class="event-title">${escapeHTML(event.title)}</span>
                                <span class="event-loc">${escapeHTML(event.loc)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
             `;
        }).join('');

        grid.innerHTML = timeColumn + dayColumns;
    }
}
