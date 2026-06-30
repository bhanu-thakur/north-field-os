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
            status: 'inbox',
            tags: []
        });
        NF.Store.set('observations', obsList);
    },
    getInbox: () => NF.Store.get('observations').filter(o => o.status === 'inbox')
};

// --- VIEWS ---
const VIEWS = {
    '/': () => {
        const inboxCount = NF.Store.getInbox().length;
        const activeDeals = (window.NF.Pipeline ? NF.Pipeline.getDeals() : []).filter(d => d.stage !== 'Closed').length;
        return `
            <h1>Mission Console</h1>
            <div class="card">
                <span class="pill alert">Priority</span>
                <h2>Process Inbox</h2>
                <p>You have ${inboxCount} unprocessed observations.</p>
            </div>
            <div class="card">
                <h2>Execution</h2>
                <p>You have ${activeDeals} active deals in your pipeline.</p>
                <button class="btn" style="margin-top:12px;" onclick="location.hash='#/boardroom'">Go to Boardroom</button>
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
            const tagsHtml = (obs.tags || []).map(t => `<span class="pill" style="margin-right:4px;">${t}</span>`).join('');
            html += `
                <div class="card" id="card-${obs.id}">
                    <span class="pill" style="background:#424940">Raw Note • ${date}</span>
                    <p style="margin-top:8px; color:var(--text);">${obs.raw}</p>
                    <div style="margin-top:12px;" id="tags-${obs.id}">${tagsHtml}</div>
                    
                    <button class="btn" style="margin-top:12px; background:var(--accent); color:#111e08;" onclick="app.aiProcess('${obs.id}')" id="btn-${obs.id}">
                        Auto-Extract (AI)
                    </button>
                    <button class="btn" style="margin-top:12px; background:var(--surface); color:var(--accent); border:1px solid var(--accent)" onclick="app.markProcessed('${obs.id}')">Mark Processed Manually</button>
                </div>
            `;
        });
        return html;
    },
    '/bibles': () => {
        const industries = window.NF.Bibles ? NF.Bibles.getIndustries() : [];
        const people = window.NF.Bibles ? NF.Bibles.getPeople() : [];
        
        let html = `<h1>The Bibles</h1>`;
        html += `<h2>Industries</h2>`;
        industries.forEach(ind => {
            html += `
                <div class="card">
                    <h3>${ind.name}</h3>
                    <p style="margin-top:4px; font-size:14px;">${ind.bottlenecks.length} Bottlenecks • ${ind.ops.length} SOPs</p>
                    ${ind.bottlenecks.map(b => `<div style="margin-top:8px; padding-left:8px; border-left:2px solid var(--accent); color:var(--text-muted); font-size:12px;">${b}</div>`).join('')}
                </div>
            `;
        });
        
        html += `<h2 style="margin-top:24px;">People</h2>`;
        if (people.length === 0) html += `<p>No people logged yet.</p>`;
        people.forEach(p => {
            html += `
                <div class="card">
                    <h3>${p.name}</h3>
                    <p style="margin-top:4px; font-size:14px;">${p.context}</p>
                </div>
            `;
        });
        
        return html;
    },
    '/boardroom': () => {
        const deals = window.NF.Pipeline ? NF.Pipeline.getDeals() : [];
        const entries = window.NF.Journal ? NF.Journal.getEntries() : [];
        
        let html = `<h1>The Boardroom</h1>`;
        
        // Weekly Review Section
        html += `
            <div class="card" id="weekly-review-card">
                <h2>Sunday Weekly Review</h2>
                <p style="margin-bottom:12px;">Run the AI personas to generate strategic guidance.</p>
                <button class="btn" onclick="app.runWeeklyReview()" id="btn-weekly-review">Generate AI Board Review</button>
            </div>
            <div id="weekly-review-results"></div>
        `;

        // Opportunity Pipeline
        html += `<h2 style="margin-top:24px; display:flex; justify-content:space-between; align-items:center;">Opportunity Pipeline <button onclick="app.addDealPrompt()" style="background:none; color:var(--accent); border:none; font-size:16px; cursor:pointer;">+ Add</button></h2>`;
        if (deals.length === 0) html += `<p>No active deals.</p>`;
        deals.forEach(d => {
            html += `
                <div class="card" style="border-left: 4px solid var(--accent)">
                    <h3>${d.title}</h3>
                    <p style="color:var(--accent); font-weight:bold; margin-top:4px;">${d.value}</p>
                    <span class="pill" style="margin-top:8px;">Stage: ${d.stage}</span>
                </div>
            `;
        });

        // Decision Journal
        html += `<h2 style="margin-top:24px; display:flex; justify-content:space-between; align-items:center;">Decision Journal <button onclick="app.addJournalPrompt()" style="background:none; color:var(--accent); border:none; font-size:16px; cursor:pointer;">+ Add</button></h2>`;
        if (entries.length === 0) html += `<p>No decisions logged.</p>`;
        entries.forEach(e => {
            html += `
                <div class="card">
                    <span class="pill">${new Date(e.date).toLocaleDateString()}</span>
                    <h3 style="margin-top:8px;">${e.decision}</h3>
                    <p style="margin-top:4px; font-size:14px; color:var(--text-muted);"><strong>Why:</strong> ${e.rationale}</p>
                    <p style="margin-top:4px; font-size:14px; color:var(--text-muted);"><strong>Outcome:</strong> ${e.outcome || 'Pending'}</p>
                </div>
            `;
        });

        return html;
    },
    '/settings': () => {
        const currentKey = NF.Store.get('gemini_api_key', '');
        return `
            <h1>Settings</h1>
            <div class="card">
                <h2>Gemini API Key</h2>
                <p style="margin-bottom:12px;">Enter your Google Gemini API key to enable live AI compounding. Leave blank to use offline simulation mode.</p>
                <input type="password" id="api-key-input" value="${currentKey}" style="width:100%; padding:12px; background:var(--bg); border:1px solid var(--border); color:var(--text); border-radius:4px;">
                <button class="btn" style="margin-top:12px;" onclick="app.saveSettings()">Save Settings</button>
            </div>
        `;
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
    saveSettings: () => {
        const input = document.getElementById('api-key-input');
        if (input) {
            NF.Store.set('gemini_api_key', input.value.trim());
            alert('Settings saved!');
        }
    },
    aiProcess: async (id) => {
        const btn = document.getElementById(`btn-${id}`);
        if(btn) { btn.innerText = "Extracting Entities..."; btn.disabled = true; }
        
        const obsList = NF.Store.get('observations');
        const obs = obsList.find(o => o.id === id);
        
        if (obs && window.NF.AI) {
            const extraction = await NF.AI.processObservation(obs.raw);
            
            // Auto-apply tags
            obs.tags = [...new Set([...(obs.tags||[]), ...(extraction.tags||[])])];
            
            // Auto-apply bottlenecks/people to bibles
            if (window.NF.Bibles) {
                if (extraction.bottlenecks) {
                    extraction.bottlenecks.forEach(b => {
                        NF.Bibles.addBottleneck(b.industryId, b.description);
                    });
                }
                if (extraction.new_people) {
                    extraction.new_people.forEach(p => {
                        NF.Bibles.addPerson(p.name, p.context);
                    });
                }
            }
            
            // Mark processed
            obs.status = 'processed';
            NF.Store.set('observations', obsList);
            app.render();
        }
    },
    markProcessed: (id) => {
        const obsList = NF.Store.get('observations');
        const obs = obsList.find(o => o.id === id);
        if (obs) obs.status = 'processed';
        NF.Store.set('observations', obsList);
        app.render();
    },
    addDealPrompt: () => {
        const title = prompt("Deal Name (e.g., Hotel Alpine WhatsApp):");
        if (!title) return;
        const value = prompt("Estimated Value (e.g., ₹50,000):");
        if (window.NF.Pipeline) {
            NF.Pipeline.addDeal(title, value || 'TBD', 'Discovery');
            app.render();
        }
    },
    addJournalPrompt: () => {
        const decision = prompt("Decision (e.g., Walked away from client):");
        if (!decision) return;
        const rationale = prompt("Rationale:");
        if (window.NF.Journal) {
            NF.Journal.addEntry(decision, rationale || '', 'Pending');
            app.render();
        }
    },
    runWeeklyReview: async () => {
        const btn = document.getElementById('btn-weekly-review');
        if(btn) { btn.innerText = "Summoning The Board..."; btn.disabled = true; }
        
        if (window.NF.BoardRoom) {
            const review = await NF.BoardRoom.runWeeklyReview();
            let html = `
                <div class="card" style="border:1px solid var(--accent); margin-top:12px;">
                    <p style="color:var(--text);">${review.summary}</p>
                </div>
            `;
            review.personas.forEach(p => {
                html += `
                    <div class="card" style="margin-top:12px;">
                        <span class="pill" style="background:var(--accent); color:#111e08">${p.role}</span>
                        <p style="margin-top:8px;">"${p.advice}"</p>
                    </div>
                `;
            });
            document.getElementById('weekly-review-results').innerHTML = html;
            if(btn) { btn.innerText = "Generate AI Board Review"; btn.disabled = false; }
        }
    }
};

// --- INIT ---
window.addEventListener('hashchange', app.render);
window.addEventListener('DOMContentLoaded', () => {
    if (window.NF.Bibles) NF.Bibles.init();
    if (window.NF.Pipeline) NF.Pipeline.init();
    if (window.NF.Journal) NF.Journal.init();
    app.render();
});
