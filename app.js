window.NF = window.NF || {};

// --- GLOBAL STATE ---
NF.State = {
    context: 'Morning', // Morning, Discovery, Pipeline, Opportunity, Businesses, BusinessDetail, Review
    activeId: null // Used for routing to specific Opportunity/Business
};

const renderSidebar = () => {
    return `
        <aside class="side">
            <a href="#" class="brand">
                <div class="mark" style="background:#111;"><svg class="ic" style="color:#fff;"><use href="#i-compass"/></svg></div>
                <div class="bt">North<small>V3 Engine</small></div>
            </a>
            <div class="seek" onclick="app.showDialog('alert', 'Feature Placeholder', 'Universal Command opens spotlight')">
                <svg class="ic"><use href="#i-search"/></svg>
                <span>Universal Command</span>
                <kbd>/</kbd>
            </div>
            
            <div class="navgroup">Execution</div>
            <a class="navlink ${NF.State.context === 'Morning' ? 'active' : ''}" onclick="app.go('Morning')"><svg class="ic"><use href="#i-home"/></svg> Morning Briefing</a>
            <a class="navlink ${NF.State.context === 'Pipeline' || NF.State.context === 'Opportunity' ? 'active' : ''}" onclick="app.go('Pipeline')"><svg class="ic"><use href="#i-target"/></svg> Opportunity Map</a>
            
            <div class="navgroup">Compounding</div>
            <a class="navlink ${NF.State.context === 'Businesses' ? 'active' : ''}" onclick="app.go('Businesses')"><svg class="ic"><use href="#i-building"/></svg> Business Evidence</a>
        </aside>
        
        <!-- Mobile Bottom Nav -->
        <nav class="mobnav">
            <a class="${NF.State.context === 'Morning' ? 'active' : ''}" onclick="app.go('Morning')">
                <svg class="ic"><use href="#i-home"/></svg>
                <span>Desk</span>
            </a>
            <a class="${NF.State.context === 'Pipeline' || NF.State.context === 'Opportunity' ? 'active' : ''}" onclick="app.go('Pipeline')">
                <svg class="ic"><use href="#i-target"/></svg>
                <span>Map</span>
            </a>
            <a class="${NF.State.context === 'Businesses' ? 'active' : ''}" onclick="app.go('Businesses')">
                <svg class="ic"><use href="#i-building"/></svg>
                <span>Dossiers</span>
            </a>
            <a onclick="app.toggleUniversalCapture()">
                <svg class="ic"><use href="#i-bulb"/></svg>
                <span>Capture</span>
            </a>
        </nav>
    `;
};

const renderMorning = async () => {
    let opps = await NF.DB.getAll('opportunities');
    let patterns = await NF.DB.getAll('patterns');
    
    // 1. Mentor Mode / Dormant Connections
    let mentorMessage = "You haven't logged any field observations today. What are you ignoring?";
    if (opps.length > 3) mentorMessage = `You have ${opps.length} active opportunities. Are you spreading your leverage too thin?`;
    
    // 2. The Spearhead (Highest Leverage)
    let spearheadHtml = `<div class="card" style="padding:24px; text-align:center; color:var(--ink-soft);"><p>No active opportunities. Log observations to spawn one.</p></div>`;
    if (opps.length > 0) {
        const best = opps.sort((a,b) => b.calculated_score - a.calculated_score)[0];
        spearheadHtml = `
            <div class="card cat" style="--bc: var(--good); margin-bottom:16px; border-color:var(--good-soft); cursor:pointer;" onclick="app.go('Opportunity', '${best.id}')">
                <div class="card-top">
                    <div class="card-title">
                        <div class="ico" style="background:var(--good-soft); color:var(--good);"><svg class="ic"><use href="#i-star"/></svg></div>
                        <div>
                            <h3 style="font-size:1.6rem; margin-bottom:4px; color:var(--ink);">${best.title}</h3>
                            <div style="display:flex; gap:8px;">
                                <div class="pill pill--brand">Stage: ${best.status}</div>
                                <div class="pill" style="background:#ECEFEA; color:var(--ink-soft);">Score: ${best.calculated_score}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="grid g1" style="margin-top:24px; border-top:1px dashed var(--line); padding-top:24px;">
                    <div class="cell lever" style="background:var(--good-soft);">
                        <div class="t"><svg class="ic" style="color:var(--good)"><use href="#i-arrow"/></svg> <span style="color:#256f55;">Next Physical Action</span></div>
                        <div class="v" style="color:#17452f; font-size:1.1rem; margin-top:8px;">${best.next_action}</div>
                    </div>
                </div>
            </div>`;
    }
    
    // 3. Closest to Revenue
    let revenueHtml = '';
    const revenueOpps = opps.filter(o => o.status === 'Validation' || o.status === 'First Sale').sort((a,b) => b.velocity - a.velocity);
    if (revenueOpps.length > 0) {
        const closest = revenueOpps[0];
        revenueHtml = `
            <h2 style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-faint); margin-top:32px; margin-bottom:12px;">Closest to Revenue</h2>
            <div class="card" style="padding:16px; border:1px solid var(--line); cursor:pointer; display:flex; justify-content:space-between; align-items:center;" onclick="app.go('Opportunity', '${closest.id}')">
                <div>
                    <h3 style="font-size:1.1rem; color:var(--ink); margin-bottom:4px;">${closest.title}</h3>
                    <p style="font-size:0.85rem; color:var(--ink-soft);">High Velocity · Stage: ${closest.status}</p>
                </div>
                <div class="pill pill--brand">Focus</div>
            </div>`;
    }
    
    // 5. Parallel Learning
    const topics = ['Mental Models for Leverage', 'Negotiation Dynamics', 'Scaling B2B Sales', 'Identifying Bottlenecks'];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    let learningHtml = `
        <h2 style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-faint); margin-top:32px; margin-bottom:12px;">Parallel Learning</h2>
        <div class="card" style="padding:16px; background:var(--card); border:1px solid var(--line); border-left:4px solid var(--primary);">
            <h3 style="font-size:1.1rem; color:var(--ink); margin-bottom:6px;">${randomTopic}</h3>
            <p style="font-size:0.9rem; color:var(--ink-soft); line-height:1.5;">Review the core principles of this topic today when you are off the field to improve pattern recognition.</p>
        </div>`;

    return `
        <main class="main">
            <div class="wrap">
                <div class="crumb">System / Morning Briefing</div>
                <h1 class="ptitle" style="margin-bottom:8px;">Good Morning.</h1>
                
                <div style="padding:16px 20px; background:rgba(0,0,0,0.02); border-radius:12px; margin-bottom:32px; font-family:'Fraunces',serif; font-size:1.1rem; color:var(--ink); border-left:4px solid var(--ink-faint);">
                    ${mentorMessage}
                </div>
                
                <h2 style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--primary); margin-bottom:12px;">The Spearhead (Highest Leverage Action)</h2>
                ${spearheadHtml}
                
                ${revenueHtml}
                
                <div id="emerging-patterns-container"></div>
                
                ${learningHtml}
            </div>
        </main>
    `;
};

const renderEmergingPatterns = async () => {
    let patterns = await NF.DB.getAll('patterns');
    let activePatterns = patterns.filter(p => p.status === 'Emerging');
    if (activePatterns.length === 0) return '';
    
    let html = `<h2 style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-faint); margin-bottom:12px; margin-top:32px;">Emerging Patterns (Industry Bibles)</h2>`;
    
    for (let p of activePatterns) {
        html += `
            <div class="card" style="margin-bottom:16px; border:1px solid var(--good-soft); background:var(--good-soft);">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <h3 style="font-size:1.1rem; margin-bottom:4px; color:var(--good-ink);"><svg class="ic" style="width:16px; height:16px; margin-right:4px;"><use href="#i-spark"/></svg> ${p.title}</h3>
                        <p style="font-size:0.85rem; color:var(--ink-soft);">${p.observation_ids.length} related field observations detected.</p>
                    </div>
                    <button class="btn btn--primary btn--sm" onclick="app.spawnHypothesis('${p.id}')">Spawn Hypothesis</button>
                </div>
            </div>
        `;
    }
    return html;
};

// renderDiscovery removed as it is now a global modal.

const renderPipeline = async () => {
    let opps = await NF.DB.getAll('opportunities');
    let patterns = await NF.DB.getAll('patterns');
    
    let html = `<main class="main"><div class="wrap">
        <div class="crumb">Execution / Opportunity Map</div>
        <div class="phead">
            <h1 class="ptitle">Opportunity Map</h1>
        </div>
        <p class="psub">Strategic view of all active ventures, grouped by their core Industry Bible (Pattern).</p>
        
        <div style="margin-top:32px;">`;
        
    // Group opportunities by pattern
    patterns.forEach(p => {
        const patternOpps = opps.filter(o => {
            // Find if this opp was born from this pattern
            return o.observations && p.observation_ids && o.observations.some(obsId => p.observation_ids.includes(obsId));
        });
        
        if (patternOpps.length > 0) {
            html += `<h3 style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-faint); margin-bottom:12px; margin-top:24px; padding-left:8px; border-left:2px solid var(--primary);">${p.title}</h3>`;
            html += `<div style="padding-left:12px; margin-bottom:24px;">`;
            
            patternOpps.sort((a,b) => b.calculated_score - a.calculated_score).forEach(o => {
                const isArchived = o.status === 'Archived';
                html += `
                    <div class="card" style="margin-bottom:8px; padding:12px 16px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; opacity:${isArchived ? '0.6' : '1'};" onclick="app.go('Opportunity', '${o.id}')">
                        <div>
                            <div style="font-weight:600; color:var(--ink); ${isArchived ? 'text-decoration:line-through;' : ''}">${o.title}</div>
                            <div style="font-size:0.85rem; color:var(--ink-soft); margin-top:4px;">Stage: ${o.status}</div>
                        </div>
                        <div class="pill ${isArchived ? '' : 'pill--brand'}">Score: ${o.calculated_score}</div>
                    </div>
                `;
            });
            html += `</div>`;
        }
    });
    
    html += `</div></div></main>`;
    return html;
};

const renderOpportunity = async () => {
    const opp = await NF.DB.get('opportunities', NF.State.activeId);
    if (!opp) return app.go('Pipeline');
    
    const isArchived = opp.status === 'Archived';
    
    // Compounding Timeline
    const stages = ['Observation', 'Pattern', 'Hypothesis', 'Validation', 'First Sale', 'Business'];
    const currentIdx = stages.indexOf(opp.status) === -1 ? 3 : stages.indexOf(opp.status);
    let timelineHtml = stages.map((s, idx) => {
        let state = 'done';
        if (isArchived) state = idx <= currentIdx ? 'done' : '';
        else if (idx === currentIdx) state = 'now';
        else if (idx > currentIdx) state = '';
        return `<div class="st ${state}">${s}</div>`;
    }).join('');

    return `
        <main class="main">
            <div class="wrap">
                <div class="crumb"><a href="#" onclick="app.go('Pipeline')">Pipeline</a> / Opportunity Execution</div>
                
                <div class="phead" style="align-items:center;">
                    <div>
                        <h1 class="ptitle" style="${isArchived ? 'text-decoration:line-through; color:var(--ink-faint);' : ''}">${opp.title}</h1>
                        ${isArchived ? '<span class="pill" style="margin-top:8px;">Archived (Graveyard)</span>' : ''}
                    </div>
                    <div style="display:flex; gap:12px; align-items:center;">
                        <div class="pill pill--brand" style="font-size:0.9rem;">Score: ${opp.calculated_score}</div>
                        ${!isArchived ? `<button class="btn btn--primary btn--sm" onclick="app.advanceStage('${opp.id}')">Advance Stage <svg class="ic"><use href="#i-arrow"/></svg></button>` : ''}
                    </div>
                </div>
                
                <h3 style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-faint); margin-top:24px; margin-bottom:12px;">Compounding Timeline</h3>
                <div class="stepper" style="margin-bottom:32px;">
                    ${timelineHtml}
                </div>
                
                ${isArchived ? `
                <div class="card" style="margin-bottom:24px; border-left:4px solid var(--ink-faint); background:rgba(0,0,0,0.02);">
                    <h3 style="font-size:1.1rem; margin-bottom:8px;">Graveyard Post-Mortem</h3>
                    <p style="font-size:0.9rem; color:var(--ink-soft); margin-bottom:4px;"><strong>Reason:</strong> ${opp.archive_reason}</p>
                    <p style="font-size:0.9rem; color:var(--ink-soft); margin-bottom:4px;"><strong>Predicted vs Actual:</strong> ${opp.predicted_vs_actual}</p>
                    <p style="font-size:0.9rem; color:var(--ink-soft);"><strong>Lesson:</strong> ${opp.lessons_learned}</p>
                </div>
                ` : ''}
                
                <div class="grid g2">
                    <div>
                        <div class="card cat" style="--bc: var(--primary);">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                                <h3 style="margin:0;">Next Action</h3>
                                ${!isArchived ? `<button class="btn btn--sm" onclick="app.editField('${opp.id}', 'next_action', 'What is the next physical action?')">Edit</button>` : ''}
                            </div>
                            <p style="font-size:1.1rem; color:var(--ink);">${opp.next_action}</p>
                            
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; margin-top:24px;">
                                <h3 style="margin:0; font-size:1rem; color:var(--ink-faint);">Exit Conditions</h3>
                                ${!isArchived ? `<button class="btn btn--sm" onclick="app.editField('${opp.id}', 'exit_conditions', 'Define exit conditions (e.g. Kill if 3 prospects say no)')">Edit</button>` : ''}
                            </div>
                            <p style="font-size:0.9rem; color:var(--ink-soft);">${opp.exit_conditions}</p>
                            
                            ${!isArchived ? `<button class="btn btn--sm" style="margin-top:24px; width:100%; border-color:#e0b4b4; color:#c92a2a; justify-content:center;" onclick="app.archiveOpportunity('${opp.id}')">Send to Graveyard (Archive)</button>` : ''}
                        </div>
                    </div>
                    <div>
                        <div class="card" style="padding:16px 20px;">
                            <h3 style="font-size:1rem; margin-bottom:12px;">Observation Log (${(opp.observations || []).length})</h3>
                            <ul class="list">
                                ${(opp.observations || []).map(e => `<li>Found via AI Pattern</li>`).join('')}
                                ${!(opp.observations || []).length ? '<p style="color:var(--ink-faint); font-size:0.8rem;">No evidence captured yet.</p>' : ''}
                            </ul>
                        </div>
                        
                        <div class="card" style="padding:16px 20px;">
                            <h3 style="font-size:1rem; margin-bottom:12px;">AI Scoring Engine (V4)</h3>
                            <div class="minigrid" style="--m: 3;">
                                <div class="cell"><div class="t">Leverage</div><div class="v">${opp.leverage}/10</div></div>
                                <div class="cell"><div class="t">Velocity</div><div class="v">${opp.velocity}/10</div></div>
                                <div class="cell"><div class="t">Conviction</div><div class="v">${opp.conviction}/10</div></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    `;
};

const renderBusinesses = async () => {
    let businesses = await NF.DB.getAll('businesses');
    if (businesses.length === 0) {
        // Mock a business for testing
        await NF.DB.put('businesses', {
            id: 'biz_1',
            name: 'Willow Hotel (Shimla)',
            decision_maker: 'Raj (Owner)',
            trust_level: 'Warm',
            known_problems: ['OTA Commissions', 'Staff Turnover'],
            active_experiments: ['WhatsApp Bot Pitch'],
            next_move: 'Follow up on WhatsApp Bot demo'
        });
        businesses = await NF.DB.getAll('businesses');
    }
    
    let html = `<main class="main"><div class="wrap">
        <div class="crumb">Compounding / Business Evidence</div>
        <div class="phead">
            <h1 class="ptitle">Field Intelligence</h1>
        </div>
        <p class="psub">Track reality and trust, not just CRM data.</p>
        <div style="margin-top:24px;">`;
        
    for(let b of businesses) {
        html += `
            <div class="card" style="margin-bottom:12px; cursor:pointer; border:1px solid var(--line);" onclick="app.go('BusinessDetail', '${b.id}')">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <h3 style="font-size:1.2rem;">${b.name}</h3>
                        <p style="font-size:0.9rem; color:var(--ink-soft); margin-top:4px;">DM: ${b.decision_maker}</p>
                    </div>
                    <div class="pill ${b.trust_level === 'High' ? 'pill--brand' : ''}">${b.trust_level} Trust</div>
                </div>
            </div>
        `;
    }
    html += `</div></div></main>`;
    return html;
};

const renderBusinessDetail = async () => {
    const biz = await NF.DB.get('businesses', NF.State.activeId);
    let opps = await NF.DB.getAll('opportunities');
    // Filter opps linked to this business (via observations conceptually, or just all active for now if missing direct link)
    // We will just show all active opportunities as a placeholder for linked ones since we didn't add explicit biz_id to opps in V4.
    let linkedOpps = opps.slice(0, 2); // Mocking linked opps for now
    
    let html = `
        <main class="main">
            <div class="wrap">
                <div class="crumb"><a href="#" onclick="app.go('Businesses')" style="color:var(--ink-faint); text-decoration:none;">Field Intelligence</a> / Dossier</div>
                
                <div class="phead" style="margin-bottom:24px;">
                    <h1 class="ptitle">${biz.name}</h1>
                </div>
                
                <div class="grid g2" style="gap:24px;">
                    <!-- Question 1 & 3 -->
                    <div style="display:flex; flex-direction:column; gap:24px;">
                        <div class="card" style="margin:0;">
                            <h2 style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--primary); margin-bottom:16px;">1. Who are they?</h2>
                            <div style="margin-bottom:12px; display:flex; gap:8px;">
                                <div class="pill">DM: ${biz.decision_maker}</div>
                                <div class="pill ${biz.trust_level === 'High' ? 'pill--brand' : ''}">Trust: ${biz.trust_level}</div>
                            </div>
                            <p style="font-size:0.9rem; color:var(--ink-soft); margin-bottom:4px;"><strong>Style:</strong> ${biz.communication_style}</p>
                            <h3 style="font-size:0.9rem; margin-top:16px; margin-bottom:8px;">Key Contacts:</h3>
                            <ul class="list" style="padding-left:16px; margin-top:0;">
                                ${(biz.key_contacts || []).map(c => `<li style="margin-bottom:4px;">${c}</li>`).join('')}
                                ${(biz.key_contacts || []).length === 0 ? '<li style="color:var(--ink-faint);">None logged.</li>' : ''}
                            </ul>
                        </div>
                        
                        <div class="card" style="margin:0;">
                            <h2 style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--primary); margin-bottom:16px;">3. What opportunities exist?</h2>
                            ${linkedOpps.map(o => `
                                <div style="padding:12px; border:1px solid var(--line); border-radius:8px; margin-bottom:8px; cursor:pointer;" onclick="app.go('Opportunity', '${o.id}')">
                                    <h3 style="font-size:0.95rem; margin-bottom:4px; color:var(--ink);">${o.title}</h3>
                                    <div class="pill pill--brand" style="font-size:0.7rem;">${o.status}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Question 2 & 4 -->
                    <div style="display:flex; flex-direction:column; gap:24px;">
                        <div class="card" style="margin:0;">
                            <h2 style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--primary); margin-bottom:16px;">2. What do we know?</h2>
                            <h3 style="font-size:0.9rem; margin-bottom:8px;">The Reality / Known Patterns:</h3>
                            <ul class="list" style="padding-left:16px; margin-top:0; margin-bottom:16px;">
                                ${(biz.known_problems || []).map(p => `<li style="margin-bottom:8px;">${p}</li>`).join('')}
                            </ul>
                            <h3 style="font-size:0.9rem; margin-bottom:8px;">Objections & Leverage Points:</h3>
                            <ul class="list" style="padding-left:16px; margin-top:0;">
                                ${(biz.objections || []).map(o => `<li style="margin-bottom:8px;">${o}</li>`).join('')}
                                ${(biz.objections || []).length === 0 ? '<li style="color:var(--ink-faint);">None logged.</li>' : ''}
                            </ul>
                        </div>
                        
                        <div class="card" style="margin:0; border:2px solid var(--primary-soft);">
                            <h2 style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--primary); margin-bottom:16px;">4. What should I do next?</h2>
                            <div class="cell lever" style="background:var(--good-soft); border:none;">
                                <div class="t"><svg class="ic" style="color:var(--good)"><use href="#i-arrow"/></svg> <span style="color:#256f55;">The Spearhead Move</span></div>
                                <div class="v" style="color:#17452f; font-size:1.1rem; margin-top:8px;">${biz.next_move}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
            </div>
        </main>
    `;
    return html;
};

const app = {
    go: (context, id = null) => {
        NF.State.context = context;
        NF.State.activeId = id;
        app.render();
    },
    render: async () => {
        const root = document.getElementById('app-root');
        let html = renderSidebar();
        
        if (NF.State.context === 'Morning') {
            html += await renderMorning();
        } else if (NF.State.context === 'Pipeline') html += await renderPipeline();
        else if (NF.State.context === 'Opportunity') html += await renderOpportunity();
        else if (NF.State.context === 'Businesses') html += await renderBusinesses();
        else if (NF.State.context === 'BusinessDetail') html += await renderBusinessDetail();
        
        root.innerHTML = html;
        
        // Post-render injections
        if (NF.State.context === 'Morning') {
            const patternContainer = document.getElementById('emerging-patterns-container');
            if (patternContainer) patternContainer.innerHTML = await renderEmergingPatterns();
        }
        
        window.scrollTo(0,0);
    },
    // --- AI Pattern Engine (Background Mock) ---
    runPatternEngine: async () => {
        const obs = await NF.DB.getAll('observations');
        const unprocessed = obs.filter(o => !o.processed);
        if (unprocessed.length < 3) return; // Need critical mass to detect pattern
        
        // Mock semantic clustering: Just take the first 3 unprocessed and group them
        const cluster = unprocessed.slice(0, 3);
        const patternId = 'pat_' + Date.now();
        
        await NF.DB.put('patterns', {
            id: patternId,
            title: 'Pattern: Operational Bottlenecks', // Mock AI title
            status: 'Emerging',
            observation_ids: cluster.map(c => c.id)
        });
        
        // Mark as processed
        for (const o of cluster) {
            o.processed = true;
            o.linked_pattern_id = patternId;
            await NF.DB.put('observations', o);
        }
        
        console.log('North AI Pattern Engine: Detected new pattern!');
    },
    // --- Custom Dialog Logic ---
    _dialogResolver: null,
    _dialogMode: 'prompt', // 'prompt', 'confirm', 'alert'
    
    showDialog: (mode, title, msgOrDefault = '') => {
        return new Promise((resolve) => {
            const backdrop = document.getElementById('dialog-backdrop');
            const titleEl = document.getElementById('dialog-title');
            const msgEl = document.getElementById('dialog-msg');
            const inputEl = document.getElementById('dialog-input');
            const btnCancel = document.getElementById('dialog-btn-cancel');
            const btnConfirm = document.getElementById('dialog-btn-confirm');
            
            app._dialogMode = mode;
            titleEl.textContent = title;
            
            if (mode === 'prompt') {
                msgEl.style.display = 'none';
                inputEl.style.display = 'block';
                inputEl.value = msgOrDefault;
                btnCancel.style.display = 'inline-flex';
                btnConfirm.textContent = 'Save';
            } else if (mode === 'confirm') {
                msgEl.style.display = 'block';
                msgEl.textContent = msgOrDefault;
                inputEl.style.display = 'none';
                btnCancel.style.display = 'inline-flex';
                btnConfirm.textContent = 'Confirm';
            } else if (mode === 'alert') {
                msgEl.style.display = 'block';
                msgEl.textContent = msgOrDefault;
                inputEl.style.display = 'none';
                btnCancel.style.display = 'none';
                btnConfirm.textContent = 'OK';
            }
            
            backdrop.style.display = 'flex';
            if (mode === 'prompt') inputEl.focus();
            
            app._dialogResolver = resolve;
        });
    },
    closeDialog: (isConfirm) => {
        document.getElementById('dialog-backdrop').style.display = 'none';
        
        let result = null;
        if (app._dialogMode === 'prompt') {
            result = isConfirm ? document.getElementById('dialog-input').value : null;
        } else {
            result = isConfirm; // true/false for confirm, true for alert
        }
        
        if (app._dialogResolver) app._dialogResolver(result);
        app._dialogResolver = null;
    },
    // --- End Custom Dialog Logic ---
    toggleUniversalCapture: () => {
        const modal = document.getElementById('uc-backdrop');
        if (modal.style.display === 'flex') {
            modal.style.display = 'none';
        } else {
            modal.style.display = 'flex';
            document.getElementById('uc-input').focus();
        }
    },
    captureObservation: async () => {
        const text = document.getElementById('uc-input').value.trim();
        if(!text) {
            app.toggleUniversalCapture();
            return;
        }
        
        await NF.DB.put('observations', {
            text: text,
            processed: false
        });
        
        document.getElementById('uc-input').value = '';
        app.toggleUniversalCapture();
        app.showDialog('alert', 'Saved', 'Observation silently logged to Pattern Engine.');
        app.render(); // Re-render to show any immediate effects
    },
    addEvidence: async (id) => {
        const text = await app.showDialog('prompt', 'Enter evidence/observation:');
        if(!text) return;
        const opp = await NF.DB.get('opportunities', id);
        opp.evidence.push(text);
        
        // Recalculate score based on evidence length (mock AI scoring boost)
        if (opp.evidence.length % 2 === 0 && opp.confidence < 100) {
            opp.calculated_score = Math.min(100, opp.calculated_score + 2);
        }
        
        await NF.DB.put('opportunities', opp);
        app.render();
    },
    advanceStage: async (id) => {
        const opp = await NF.DB.get('opportunities', id);
        const stages = ['Validation', 'First Sale', 'Delivery', 'SOP', 'Business'];
        const idx = stages.indexOf(opp.status);
        
        if (idx < stages.length - 1) {
            const confirmed = await app.showDialog('confirm', 'Advance Stage', `Advance opportunity from ${opp.status} to ${stages[idx+1]}?`);
            if (confirmed) {
                opp.status = stages[idx+1];
                await NF.DB.put('opportunities', opp);
                app.render();
            }
        } else {
            app.showDialog('alert', 'Max Stage Reached', 'This opportunity has reached maximum enterprise value (Business stage).');
        }
    },
    archiveOpportunity: async (id) => {
        const opp = await NF.DB.get('opportunities', id);
        const reason = await app.showDialog('prompt', 'Graveyard: Why did this fail?');
        if (!reason) return;
        
        const predicted = await app.showDialog('prompt', 'Graveyard: What did you predict vs what actually happened?');
        const lesson = await app.showDialog('prompt', 'Graveyard: What is the core lesson to extract?');
        
        opp.status = 'Archived';
        opp.archive_reason = reason || 'Unknown';
        opp.predicted_vs_actual = predicted || 'Unknown';
        opp.lessons_learned = lesson || 'Unknown';
        
        await NF.DB.put('opportunities', opp);
        
        // Update founder intel with a lesson silently
        let intel = await NF.DB.get('settings', 'founder_intel');
        if (intel && lesson) {
            intel.value.recent_lessons.unshift(lesson);
            if(intel.value.recent_lessons.length > 10) intel.value.recent_lessons.pop();
            await NF.DB.put('settings', intel);
        }
        
        app.render();
    },
    editField: async (id, field, promptText) => {
        const opp = await NF.DB.get('opportunities', id);
        const currentVal = opp[field] === 'Undefined' ? '' : opp[field];
        const newVal = await app.showDialog('prompt', promptText, currentVal);
        
        if (newVal !== null) {
            opp[field] = newVal || 'Undefined';
            await NF.DB.put('opportunities', opp);
            app.render();
        }
    },
    spawnHypothesis: async (patternId) => {
        const pattern = await NF.DB.get('patterns', patternId);
        const title = await app.showDialog('prompt', 'Spawn Hypothesis', 'What opportunity could solve this pattern?');
        if (!title) return;
        
        // Mock AI Scoring for V4 variables
        await NF.DB.put('opportunities', {
            title: title,
            leverage: Math.floor(Math.random() * 5) + 5,
            velocity: Math.floor(Math.random() * 5) + 5,
            conviction: Math.floor(Math.random() * 5) + 5,
            next_action: 'Validate with 3 pattern sources',
            observations: pattern.observation_ids // Carry over the evidence
        });
        
        pattern.status = 'Investigating';
        await NF.DB.put('patterns', pattern);
        
        app.go('Pipeline');
    }
};

window.addEventListener('DOMContentLoaded', async () => {
    try {
        await NF.DB.init();
        app.render();
        // Silently run engine on boot without blocking UI
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => app.runPatternEngine());
        } else {
            setTimeout(() => app.runPatternEngine(), 1000);
        }
    } catch (err) {
        document.getElementById('app-root').innerHTML = `
            <div style="padding:40px; text-align:center;">
                <h1 style="color:var(--ink); margin-bottom:16px;">Storage Error</h1>
                <p style="color:var(--ink-soft); line-height:1.5;">North OS cannot boot. Your browser blocked access to the local database.</p>
                <p style="color:var(--ink-soft); line-height:1.5; margin-top:8px;">If you are opening this via <strong>file://</strong>, try using a local web server (e.g. VS Code Live Server, Python HTTP Server), or change your browser settings to allow local storage for local files.</p>
                <div style="margin-top:24px; padding:16px; background:#ffebeb; color:#c92a2a; border-radius:8px; font-family:monospace; text-align:left; font-size:0.85rem;">
                    Error Details: ${err.message || err.toString()}
                </div>
            </div>
        `;
    }
});

window.addEventListener('keydown', (e) => {
    // If pressing '/' outside of an input, open Universal Capture
    if (e.key === '/' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        app.toggleUniversalCapture();
    }
    // If pressing Escape inside Universal Capture, close it
    if (e.key === 'Escape') {
        const uc = document.getElementById('uc-backdrop');
        if (uc && uc.style.display === 'flex') {
            app.toggleUniversalCapture();
        }
    }
});
