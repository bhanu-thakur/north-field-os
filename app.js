window.NF = window.NF || {};

// --- STORE (LocalStorage Wrapper) ---
NF.Store = {
    get: (key, def = []) => JSON.parse(localStorage.getItem(`nf:${key}`)) || def,
    set: (key, val) => localStorage.setItem(`nf:${key}`, JSON.stringify(val)),
    addObs: (rawText) => {
        const obsList = NF.Store.get('observations');
        obsList.unshift({
            id: 'obs_' + Date.now(),
            timestamp: Date.now(),
            raw: rawText,
            status: 'inbox'
        });
        NF.Store.set('observations', obsList);
    },
    getInbox: () => NF.Store.get('observations').filter(o => o.status === 'inbox')
};

// --- VIEWS ---
const VIEWS = {
    '/': () => {
        const inboxCount = NF.Store.getInbox().length;
        return `
            <h1>Mission Console</h1>
            <div class="card">
                <span class="pill alert">Priority</span>
                <h2>Process Inbox</h2>
                <p>You have ${inboxCount} unprocessed observations.</p>
            </div>
            <div class="card">
                <h2>Today's Directive</h2>
                <p>No experiments active. Pitch WhatsApp automation to 5 hotels today.</p>
            </div>
        `;
    },
    '/capture': () => `
        <h1>Quick Capture</h1>
        <textarea id="capture-input" placeholder="What did you observe?"></textarea>
        <button class="btn" onclick="app.saveCapture()">Save Observation</button>
    `,
    '/inbox': () => {
        const inbox = NF.Store.getInbox();
        if (inbox.length === 0) return `<h1>Inbox</h1><p>Zero inbox. You are caught up.</p>`;
        
        let html = `<h1>Observation Inbox</h1>`;
        inbox.forEach(obs => {
            const date = new Date(obs.timestamp).toLocaleDateString();
            html += `
                <div class="card">
                    <span class="pill">Raw Note • ${date}</span>
                    <p style="margin-top:8px; color:var(--text);">${obs.raw}</p>
                    <button class="btn" style="margin-top:12px; background:var(--surface); color:var(--accent); border:1px solid var(--accent)" onclick="app.markProcessed('${obs.id}')">Mark Processed</button>
                </div>
            `;
        });
        return html;
    }
};

// --- APP LOGIC ---
const app = {
    render: () => {
        const hash = window.location.hash.slice(1) || '/';
        const viewFn = VIEWS[hash] || VIEWS['/'];
        document.getElementById('view').innerHTML = viewFn();
        
        // Update nav active state
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.toggle('active', el.getAttribute('href') === '#' + hash);
        });
    },
    saveCapture: () => {
        const input = document.getElementById('capture-input');
        if (input && input.value.trim()) {
            NF.Store.addObs(input.value.trim());
            window.location.hash = '#/';
        }
    },
    markProcessed: (id) => {
        const obsList = NF.Store.get('observations');
        const obs = obsList.find(o => o.id === id);
        if (obs) obs.status = 'processed';
        NF.Store.set('observations', obsList);
        app.render();
    }
};

// --- INIT ---
window.addEventListener('hashchange', app.render);
window.addEventListener('DOMContentLoaded', app.render);
