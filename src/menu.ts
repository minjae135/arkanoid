import { UPDATES } from './updates.js';

document.addEventListener('DOMContentLoaded', () => {
    const viewUpdates = document.getElementById('view-updates');
    const updatesBackdrop = document.getElementById('updates-backdrop');
    const updatesClose = document.getElementById('updates-close');
    const updatesList = document.getElementById('updates-list');

    viewUpdates?.addEventListener('click', (e) => {
        e.preventDefault();
        renderUpdates();
        if (updatesBackdrop) updatesBackdrop.hidden = false;
    });

    updatesClose?.addEventListener('click', () => {
        if (updatesBackdrop) updatesBackdrop.hidden = true;
    });

    updatesBackdrop?.addEventListener('click', (e) => {
        if (e.target === updatesBackdrop) updatesBackdrop.hidden = true;
    });

    function renderUpdates() {
        if (!updatesList) return;
        updatesList.innerHTML = UPDATES.map(upd => `
            <div class="update-entry">
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; border-bottom: 1px solid rgba(0, 243, 255, 0.3); padding-bottom: 4px;">
                    <span style="font: 700 16px 'Orbitron', sans-serif; color: var(--neon-cyan);">${upd.version}</span>
                    <span style="font-size: 12px; color: #8a94ad;">${upd.date}</span>
                </div>
                <ul style="margin: 0; padding-left: 18px; color: #cfe7ff; font-size: 13px; line-height: 1.6;">
                    ${upd.content.map(item => `<li style="margin-bottom: 4px;">${item}</li>`).join('')}
                </ul>
            </div>
        `).join('');
    }
});
