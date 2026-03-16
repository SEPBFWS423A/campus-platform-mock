export function getDozentCourses(data, userId) {
    return data.modules.filter(m => m.dozentId === userId);
}

export function getActiveDozentCourses(data, userId) {
    return data.modules.filter(
        m => m.dozentId === userId && (m.status === 'active' || m.status === 'registered')
    );
}
