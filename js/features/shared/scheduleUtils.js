import { timeToMinutes } from '../../core/utils.js';

export function getWeekData(date = new Date(), weekOffset = 0) {
    const day = date.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + diff + weekOffset * 7);

    const jan4 = new Date(monday.getFullYear(), 0, 4);
    const dayOfYear = Math.floor((monday - new Date(monday.getFullYear(), 0, 1)) / 86400000);
    const weekNumber = Math.ceil((dayOfYear + jan4.getDay()) / 7);

    const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];
    const days = [];
    for (let i = 0; i < 5; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        days.push(`${dayNames[i]} ${dd}.${mm}`);
    }

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    const monDD = String(monday.getDate()).padStart(2, '0');
    const monMM = String(monday.getMonth() + 1).padStart(2, '0');
    const friDD = String(friday.getDate()).padStart(2, '0');
    const friMM = String(friday.getMonth() + 1).padStart(2, '0');

    const label = `KW ${weekNumber} (${monDD}.${monMM} - ${friDD}.${friMM})`;
    return { label, days, monday };
}

export function buildTodaysSchedule(modules, config) {
    const currentDayIndex = (new Date(config.currentDate).getDay() + 6) % 7;
    let todaysEvents = [];

    modules.forEach(m => {
        if (m.schedule) {
            m.schedule.forEach(s => {
                if (s.day === currentDayIndex) {
                    todaysEvents.push({
                        time: s.start,
                        endTime: s.end,
                        title: m.name,
                        room: s.room,
                        type: s.type,
                        code: m.code,
                        status: 'future'
                    });
                }
            });
        }
    });

    todaysEvents.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
    const currentSimTime = timeToMinutes(config.currentTime);

    todaysEvents = todaysEvents.map(e => {
        const eStart = timeToMinutes(e.time);
        const eEnd = e.endTime ? timeToMinutes(e.endTime) : eStart + 90;
        let status = 'future';
        if (eEnd < currentSimTime) status = 'past';
        else if (eStart <= currentSimTime && eEnd >= currentSimTime) status = 'current';
        return { ...e, status };
    });

    return todaysEvents;
}
