export function renderDownloads(data) {
    const filesContent = document.querySelector('.files-content');
    if (!filesContent) return;

    const uploadZone = `
        <div class="upload-zone mb-4" style="margin-bottom: 1rem;">
            <span class="material-icons-round upload-icon">cloud_upload</span>
            <h3>Datei hochladen</h3>
            <p>Drag & Drop oder klicken</p>
        </div>
    `;

    let allFiles = [];

    // 1. Extract and categorize module files
    data.modules.forEach(m => {
        if (m.files) {
            m.files.forEach(f => {
                let category = "Vorlesungsskripte";
                if (f.name.includes("Übung") || f.type === 'zip' || f.name.includes("Aufgaben")) {
                    category = "Übungsblätter";
                }

                allFiles.push({
                    ...f,
                    source: m.name,
                    date: f.date,
                    category: category,
                    icon: getFileIcon(f.type)
                });
            });
        }
    });

    // 2. Extract and categorize general files
    if (data.generalFiles) {
        data.generalFiles.forEach(cat => {
            cat.files.forEach(f => {
                let category = "Bescheinigungen";
                if (cat.category === "Allgemein") category = "Bescheinigungen";

                allFiles.push({
                    ...f,
                    source: f.source || "Allgemein",
                    date: f.date,
                    category: category,
                    icon: getFileIcon(f.type)
                });
            });
        });
    }

    // 3. Update Badges
    const updateBadge = (id, count) => {
        const el = document.getElementById(id);
        if (el) el.textContent = count;
    };

    const countScripts = allFiles.filter(f => f.category === "Vorlesungsskripte").length;
    const countAssignments = allFiles.filter(f => f.category === "Übungsblätter").length;
    const countCerts = allFiles.filter(f => f.category === "Bescheinigungen").length;
    const countLinks = 0;

    updateBadge('badge-all', allFiles.length);
    updateBadge('badge-scripts', countScripts);
    updateBadge('badge-assignments', countAssignments);
    updateBadge('badge-certs', countCerts);
    updateBadge('badge-links', countLinks);


    // 4. Render Groups
    const categories = ["Vorlesungsskripte", "Übungsblätter", "Bescheinigungen"];
    const categoryIcons = {
        "Vorlesungsskripte": "description",
        "Übungsblätter": "assignment",
        "Bescheinigungen": "verified_user"
    };

    const fileSections = categories.map(catName => {
        const files = allFiles.filter(f => f.category === catName);
        if (files.length === 0) return '';

        return `
            <section class="file-section" data-category="${catName}">
                <header class="file-section-header">
                    <h3><span class="material-icons-round">${categoryIcons[catName] || 'folder'}</span> ${catName}</h3>
                    <button class="btn-icon-sm"><span class="material-icons-round">more_horiz</span></button>
                </header>
                <div class="file-list-group">
                    ${files.map(file => `
                        <div class="file-list-item">
                            <div class="file-type-icon-sm ${file.type}">
                                <span class="material-icons-round">${file.icon}</span>
                            </div>
                            <div class="file-info-row">
                                <div class="file-main-info">
                                    <span class="file-name">${file.name}</span>
                                    <div class="file-meta-row">
                                        <span class="meta-pill">${file.source}</span>
                                        <span class="meta-pill">${file.size}</span>
                                        <span>${file.date}</span>
                                    </div>
                                </div>
                                <div class="file-actions-row">
                                    <button class="btn-icon-sm" title="Vorschau"><span class="material-icons-round">visibility</span></button>
                                    <button class="btn-icon-sm" title="Download"><span class="material-icons-round">download</span></button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }).join('');

    filesContent.innerHTML = uploadZone + fileSections;

    // Initialize Filter Logic
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
        const newItem = item.cloneNode(true);
        if (item.parentNode) {
            item.parentNode.replaceChild(newItem, item);
        }

        newItem.addEventListener('click', () => {
            document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
            newItem.classList.add('active');

            const catSpan = newItem.querySelector('span:nth-child(2)');
            const catName = catSpan ? catSpan.textContent.trim() : '';

            const sections = filesContent.querySelectorAll('.file-section');
            sections.forEach(sec => {
                const secCat = sec.getAttribute('data-category');
                if (catName === "Alle Dateien" || secCat === catName) {
                    sec.style.display = 'block';
                    sec.style.animation = 'fadeIn 0.3s ease-out';
                } else {
                    sec.style.display = 'none';
                }
            });
        });
    });
}

function getFileIcon(type) {
    switch (type) {
        case 'pdf': return 'picture_as_pdf';
        case 'doc': return 'description';
        case 'zip': return 'folder_zip';
        case 'img': return 'image';
        default: return 'insert_drive_file';
    }
}
