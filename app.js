window.NF = window.NF || {};

// --- GLOBAL STATE ---
NF.State = {
    context: 'Morning', // Morning, Discovery, Pipeline, Opportunity, Businesses, BusinessDetail, Review
    activeId: null // Used for routing to specific Opportunity/Business
};

NF.UI = {
    toast: (msg, opts = {}) => {
        const root = document.getElementById('toast-root');
        if (!root) return;
        
        const duration = opts.duration || 4000;
        
        const t = document.createElement('div');
        t.className = 'toast';
        t.innerHTML = `<span>${app.escapeHtml(msg)}</span>`;
        
        if (opts.action) {
            const btn = document.createElement('span');
            btn.className = 'toast-action';
            btn.textContent = opts.action.label;
            btn.onclick = () => {
                opts.action.fn();
                t.classList.add('hiding');
                setTimeout(() => t.remove(), 200);
            };
            t.appendChild(btn);
        }
        
        // Tap to dismiss
        t.addEventListener('click', (e) => {
            if (e.target.classList.contains('toast-action')) return;
            t.classList.add('hiding');
            setTimeout(() => t.remove(), 200);
        });
        
        root.appendChild(t);
        
        // Stack max 2
        while (root.children.length > 2) {
            root.removeChild(root.firstChild);
        }
        
        setTimeout(() => {
            if (document.body.contains(t)) {
                t.classList.add('hiding');
                setTimeout(() => t.remove(), 200);
            }
        }, duration);
    }
};

const LIFECYCLE = ['Validation','First Sale','Delivery','SOP','Operator','Automation','Software'];
const computeScore = (leverage, velocity, conviction) => Math.round(((leverage * 0.5) + (velocity * 0.3) + (conviction * 0.2)) * 10);

const renderSidebar = () => {
    return `
        <aside class="side">
            <a href="#" class="brand">
                <div class="mark" style="background:#111;"><svg class="ic" style="color:#fff;"><use href="#i-compass"/></svg></div>
                <div class="bt">North<small>V4 Engine</small></div>
            </a>
            <div class="seek" onclick="app.showDialog('alert', 'Feature Placeholder', 'Universal Command opens spotlight')">
                <svg class="ic"><use href="#i-search"/></svg>
                <span>Universal Command</span>
                <kbd>/</kbd>
            </div>
            
            <div class="navgroup">Execution</div>
            <a class="navlink ${NF.State.context === 'Morning' ? 'active' : ''}" onclick="app.go('Morning')"><svg class="ic"><use href="#i-home"/></svg> Morning Briefing</a>
            <a class="navlink ${NF.State.context === 'Discovery' ? 'active' : ''}" onclick="app.go('Discovery')"><svg class="ic"><use href="#i-bulb"/></svg> Discovery Feed</a>
            <a class="navlink ${NF.State.context === 'Pipeline' || NF.State.context === 'Opportunity' ? 'active' : ''}" onclick="app.go('Pipeline')"><svg class="ic"><use href="#i-target"/></svg> Opportunity Map</a>
            
            <div class="navgroup">Compounding</div>
            <a class="navlink ${NF.State.context === 'Businesses' ? 'active' : ''}" onclick="app.go('Businesses')"><svg class="ic"><use href="#i-building"/></svg> Business Evidence</a>
            
            <div class="navgroup" style="margin-top:24px;">System</div>
            <a class="navlink ${NF.State.context === 'Settings' ? 'active' : ''}" onclick="app.go('Settings')"><svg class="ic"><use href="#i-target"/></svg> Settings & AI</a>
            <a class="navlink" style="color:var(--primary);" onclick="app.startSimulator()"><svg class="ic"><use href="#i-star"/></svg> Run Simulator</a>
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
            <a class="${NF.State.context === 'Settings' || NF.State.context === 'Discovery' ? 'active' : ''}" onclick="app.toggleMoreMenu()">
                <svg class="ic"><use href="#i-grid"/></svg>
                <span>More</span>
            </a>
        </nav>
    `;
};

const renderMorning = async () => {
    let opps = await NF.DB.getAll('opportunities');
    let patterns = await NF.DB.getAll('patterns');
    const allObs = await NF.DB.getAll('observations');
    
    const lastExport = await NF.DB.getSetting('last_export_at', 0);
    const lastExportObsCount = await NF.DB.getSetting('last_export_obs_count', 0);
    const bannerDismissed = await NF.DB.getSetting('backup_banner_dismissed', false);
    const daysSinceExport = (Date.now() - lastExport) / (1000 * 60 * 60 * 24);
    let backupBanner = '';
    if (!bannerDismissed && allObs.length > lastExportObsCount && (lastExport === 0 || daysSinceExport > 7)) {
        backupBanner = `
            <div style="background:var(--primary-soft); padding:12px 16px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
                <span style="font-size:0.9rem; color:var(--primary); font-weight:600;">You have un-backed-up data. Export a backup now.</span>
                <div>
                    <button class="btn btn--sm" style="background:var(--primary); color:#fff; border:none;" onclick="app.go('Settings')">Go to Settings</button>
                    <button class="btn btn--sm" style="border:none; color:var(--primary);" onclick="app.dismissBackupBanner()">Dismiss</button>
                </div>
            </div>
        `;
    }
    
    // Calculate Predictions & Kill Dates
    const todayStr = new Date().toISOString().split('T')[0];
    let killDateCount = 0;
    let predictionsDueHtml = '';
    
    opps.forEach(o => {
        if (o.status !== 'Archived') {
            if (o.exit_deadline && o.exit_deadline < todayStr) killDateCount++;
            
            if (o.predictions && o.predictions.length > 0) {
                o.predictions.forEach(p => {
                    if (p.status === 'pending' && p.resolve_date <= todayStr) {
                        predictionsDueHtml += `
                            <div class="card" style="margin-bottom:8px; border-left:4px solid var(--warning); padding:16px;">
                                <div style="font-size:0.85rem; color:var(--ink-soft); margin-bottom:4px;">Opportunity: <strong>${app.escapeHtml(o.title)}</strong></div>
                                <div style="font-size:1.1rem; color:var(--ink); margin-bottom:12px;">"${app.escapeHtml(p.statement)}"</div>
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <span style="font-size:0.85rem; color:var(--ink-soft);">Confidence: ${p.confidence}%</span>
                                    <div style="display:flex; gap:8px;">
                                        <button class="btn btn--sm" style="background:#fee2e2; color:#991b1b; border:none;" onclick="app.resolvePrediction('${o.id}', '${p.id}', false)">Wrong</button>
                                        <button class="btn btn--sm" style="background:#dcfce7; color:#166534; border:none;" onclick="app.resolvePrediction('${o.id}', '${p.id}', true)">Right</button>
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                });
            }
        }
    });

    if (predictionsDueHtml) {
        predictionsDueHtml = `
            <h2 style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-faint); margin-top:32px; margin-bottom:12px;">Predictions Due</h2>
            ${predictionsDueHtml}
        `;
    }

    let killDateHtml = '';
    if (killDateCount > 0) {
        killDateHtml = `
            <div style="background:#fee2e2; color:#991b1b; padding:12px 16px; border-radius:8px; margin-bottom:24px; font-weight:600; display:flex; align-items:center;">
                <svg class="ic" style="margin-right:8px;"><use href="#i-arrow"/></svg> ${killDateCount} deal${killDateCount > 1 ? 's' : ''} past kill date. Review Pipeline immediately.
            </div>
        `;
    }
    
    // 1. Mentor Mode / Dormant Connections (Grounded in Data)
    let mentorMessage = '';
    if (allObs.length < 10) {
        mentorMessage = `You've only captured ${allObs.length} observations. Volume precedes pattern recognition. Thin-data mode: Go out and capture ${10 - allObs.length} more raw notes from the field.`;
    } else if (patterns.length > 0) {
        let maxObsPat = patterns.sort((a,b) => b.observation_ids.length - a.observation_ids.length)[0];
        mentorMessage = `You've logged ${maxObsPat.observation_ids.length} notes about "${maxObsPat.title.replace('Pattern: ','')}". The market is screaming at you. Are you going to act on it?`;
    } else {
        mentorMessage = "You haven't logged any field observations today. What are you ignoring?";
    }
    
    // 2. The Spearhead (Highest Leverage)
    let spearheadHtml = `<div class="card" style="padding:24px; text-align:center; color:var(--ink-soft);"><p>No active opportunities. Log observations to spawn one.</p></div>`;
    let bestOpp = null;
    if (opps.length > 0) {
        bestOpp = opps.sort((a,b) => b.calculated_score - a.calculated_score)[0];
        spearheadHtml = `
            <div class="card cat" style="--bc: var(--good); margin-bottom:16px; border-color:var(--good-soft); cursor:pointer;" onclick="app.go('Opportunity', '${bestOpp.id}')">
                <div class="card-top">
                    <div class="card-title">
                        <div class="ico" style="background:var(--good-soft); color:var(--good);"><svg class="ic"><use href="#i-star"/></svg></div>
                        <div>
                            <h3 style="font-size:1.6rem; margin-bottom:4px; color:var(--ink);">${bestOpp.title}</h3>
                            <div style="display:flex; gap:8px;">
                                <div class="pill pill--brand">Stage: ${bestOpp.status}</div>
                                <div class="pill" style="background:#ECEFEA; color:var(--ink-soft);">Score: ${bestOpp.calculated_score}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="grid g1" style="margin-top:24px; border-top:1px dashed var(--line); padding-top:24px;">
                    <div class="cell lever" style="background:var(--good-soft);">
                        <div class="t"><svg class="ic" style="color:var(--good)"><use href="#i-arrow"/></svg> <span style="color:#256f55;">Next Physical Action</span></div>
                        <div class="v" style="color:#17452f; font-size:1.1rem; margin-top:8px;">${bestOpp.next_action}</div>
                    </div>
                    ${bestOpp.board_analysis ? `
                    <div style="margin-top:16px; background:#fff; border:1px solid var(--line); border-radius:8px; padding:16px;">
                        <h4 style="font-size:0.85rem; text-transform:uppercase; color:var(--ink-soft); margin-bottom:12px; letter-spacing:0.05em;">Board Directives</h4>
                        <div class="grid" style="grid-template-columns:1fr 1fr; gap:12px;">
                            <div style="font-size:0.85rem; padding:8px; background:rgba(29,78,216,0.05); border-left:3px solid #1d4ed8; color:var(--ink);"><strong>CEO:</strong> ${bestOpp.board_analysis.ceo}</div>
                            <div style="font-size:0.85rem; padding:8px; background:rgba(21,128,61,0.05); border-left:3px solid #15803d; color:var(--ink);"><strong>CFO:</strong> ${bestOpp.board_analysis.cfo}</div>
                            <div style="font-size:0.85rem; padding:8px; background:rgba(107,33,168,0.05); border-left:3px solid #6b21a8; color:var(--ink);"><strong>CTO:</strong> ${bestOpp.board_analysis.cto}</div>
                            <div style="font-size:0.85rem; padding:8px; background:rgba(194,65,12,0.05); border-left:3px solid #c2410c; color:var(--ink);"><strong>CPO:</strong> ${bestOpp.board_analysis.cpo}</div>
                        </div>
                    </div>` : ''}
                </div>
            </div>`;
    }
    
    // 3. Closest to Revenue
    let revenueHtml = '';
    const revenueOpps = opps.filter(o => o.status === LIFECYCLE[0] || o.status === LIFECYCLE[1]).sort((a,b) => b.velocity - a.velocity);
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
    
    // 5. Parallel Learning (Grounded in Data)
    let learningTopic = "Mental Models for Observation";
    let learningDesc = "Review core principles of reading the market to accelerate your thin-data capture.";
    
    let intel = await NF.DB.getSetting('founder_intel');
    if (bestOpp) {
        learningTopic = `Execution Playbook: ${bestOpp.status}`;
        learningDesc = `To unblock your Spearhead opportunity, review tactical guides on executing the "${bestOpp.next_action}" step.`;
    } else if (intel && intel.recent_lessons && intel.recent_lessons.length > 0) {
        learningTopic = `Post-Mortem: ${intel.recent_lessons[0].substring(0,25)}...`;
        learningDesc = `Based on your recent Graveyard lesson, review how to prevent this failure mode in future ventures.`;
    }
    
    let learningHtml = `
        <h2 style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-faint); margin-top:32px; margin-bottom:12px;">Just-in-Time Learning</h2>
        <div id="jit-learning-container">
            <div class="card" style="padding:16px; background:var(--card); border:1px solid var(--line); border-left:4px solid var(--primary);">
                <h3 style="font-size:1.1rem; color:var(--ink); margin-bottom:6px;">${learningTopic}</h3>
                <p style="font-size:0.9rem; color:var(--ink-soft); line-height:1.5;">${learningDesc}</p>
            </div>
        </div>`;

    return `
        <main class="main">
            <div class="wrap">
                ${backupBanner}
                <div class="crumb">System / Morning Briefing</div>
                <h1 class="ptitle" style="margin-bottom:8px;">Good Morning.</h1>
                
                ${killDateHtml}
                
                <div style="padding:16px 20px; background:rgba(0,0,0,0.02); border-radius:12px; margin-bottom:32px; font-family:'Fraunces',serif; font-size:1.1rem; color:var(--ink); border-left:4px solid var(--ink-faint);">
                    ${mentorMessage}
                </div>
                
                ${predictionsDueHtml}
                
                <h2 style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--primary); margin-bottom:12px;">The Spearhead (Highest Leverage Action)</h2>
                ${spearheadHtml}
                
                ${revenueHtml}
                
                <div id="emerging-patterns-container"></div>
                
                <div id="founder-intel-container"></div>
                
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
        let obsCount = p.observation_ids.length;
        let momentumText = `${obsCount} related field observations detected.`;
        
        if (obsCount > 1) {
            let pObs = [];
            for(let id of p.observation_ids) {
                let o = await NF.DB.get('observations', id);
                if(o) pObs.push(o);
            }
            if (pObs.length > 1) {
                pObs.sort((a,b) => a.created_at - b.created_at);
                let first = pObs[0].created_at;
                let last = pObs[pObs.length-1].created_at;
                let diffDays = Math.max(1, Math.ceil((last - first) / (1000 * 60 * 60 * 24)));
                let velocity = pObs.length / diffDays;
                let speedLabel = velocity >= 1 ? "Theme is accelerating rapidly." : "Theme is emerging steadily.";
                momentumText = `<strong style="color:var(--good-ink);">${pObs.length} mentions in ${diffDays} day${diffDays > 1 ? 's' : ''}.</strong> ${speedLabel}`;
            }
        }
        
        html += `
            <div class="card" style="margin-bottom:16px; border:1px solid var(--good-soft); background:var(--good-soft);">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <h3 style="font-size:1.1rem; margin-bottom:4px; color:var(--good-ink);"><svg class="ic" style="width:16px; height:16px; margin-right:4px;"><use href="#i-spark"/></svg> ${p.title}</h3>
                        <p style="font-size:0.85rem; color:var(--ink-soft);">${momentumText}</p>
                    </div>
                    <button class="btn btn--primary btn--sm" onclick="app.spawnHypothesis('${p.id}')">Spawn Hypothesis</button>
                </div>
            </div>
        `;
    }
    return html;
};

const renderFounderIntel = async () => {
    let intel = await NF.DB.getSetting('founder_intel');
    if (!intel) intel = { recent_lessons: [] };
    
    const opps = await NF.DB.getAll('opportunities');
    const archived = opps.filter(o => o.status === 'Archived').length;
    const businesses = await NF.DB.getAll('businesses');
    const success = businesses.length; 
    
    let accuracy = 0;
    if (archived + success > 0) {
        accuracy = Math.round((success / (archived + success)) * 100);
    }

    let lessonsHtml = intel.recent_lessons.length > 0 
        ? intel.recent_lessons.slice(0,3).map(l => `<li style="margin-bottom:8px;">${l}</li>`).join('') 
        : '<p style="color:var(--ink-faint); font-size:0.85rem;">No post-mortems logged yet. Move an opportunity to the graveyard to extract a lesson.</p>';

    return `
        <h2 style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-faint); margin-top:32px; margin-bottom:12px;">Judgment Calibration (Founder Intel)</h2>
        <div class="card" style="padding:16px 20px; display:flex; gap:24px; align-items:flex-start;">
            <div style="flex:1;">
                <div style="font-size:2rem; font-weight:700; color:${accuracy >= 50 ? 'var(--good-ink)' : 'var(--ink)'};">${accuracy}%</div>
                <div style="font-size:0.85rem; color:var(--ink-soft); font-family:'JetBrains Mono',monospace; text-transform:uppercase;">Prediction Accuracy</div>
                <div style="font-size:0.75rem; color:var(--ink-faint); margin-top:4px;">${success} Wins / ${archived} Graveyards</div>
            </div>
            <div style="flex:3; border-left:1px solid var(--line); padding-left:24px;">
                <h3 style="font-size:0.9rem; margin-bottom:8px; color:var(--ink);">Recent Extracted Lessons</h3>
                <ul class="list" style="margin:0; font-size:0.85rem; color:var(--ink-soft);">
                    ${lessonsHtml}
                </ul>
            </div>
        </div>
    `;
};

const renderJitLearning = async () => {
    const hasGemini = await NF.DB.getSetting('gemini_api_key');
    if (!hasGemini) return null; // Fallback to default renderMorning HTML
    
    let opps = await NF.DB.getAll('opportunities');
    if (opps.length === 0) return null;
    
    const bestOpp = opps.sort((a,b) => b.calculated_score - a.calculated_score)[0];
    
    const prompt = `Act as a brutal, highly-tactical startup sales mentor. 
    My highest leverage opportunity is: "${bestOpp.title}"
    My explicit next physical action is: "${bestOpp.next_action}".
    
    Give me a ruthless, tactical 3-bullet cold approach playbook on exactly how to reach out to them and what to say. 
    Focus STRICTLY on non-technical business strategy, sales, and operations. Do NOT teach technical skills (e.g. if the opportunity involves video editing, teach me how to sell to the studio, not how to edit videos).
    Format as HTML (use <ul> and <li style="margin-bottom:8px;">). Do not include markdown code block backticks.`;
    
    const res = await NF.AI.generateContent(prompt, { taskClass: 'brief' });
    if (!res || !res.ok) {
        NF.UI.toast('Failed to generate prep brief: ' + (res?.error || 'unknown'));
        return null;
    }
    
    let htmlRes = res.text.replace(/```html/gi, '').replace(/```/g, '').trim();
    return `
        <div class="card" style="padding:16px; background:var(--card); border:1px solid var(--primary-soft); border-left:4px solid var(--primary);">
            <h3 style="font-size:1.1rem; color:var(--primary); margin-bottom:12px;">AI Playbook: ${bestOpp.next_action}</h3>
            <div style="font-size:0.95rem; color:var(--ink); line-height:1.5;">${htmlRes}</div>
        </div>
    `;
};

const renderDiscovery = async () => {
    let obs = await NF.DB.getAll('observations');
    obs.sort((a,b) => b.created_at - a.created_at);
    
    let html = `<main class="main"><div class="wrap">
        <div class="crumb">Execution / Discovery Feed</div>
        <div class="phead">
            <div>
                <h1 class="ptitle">Raw Field Discovery</h1>
                <p style="color:var(--ink-soft); margin-top:8px;">Chronological feed of your raw observations before they cluster into patterns.</p>
            </div>
            <button class="btn btn--primary" onclick="app.toggleUniversalCapture()"><svg class="ic" style="margin-right:6px;"><use href="#i-bulb"/></svg> New Log</button>
        </div>
        <div style="display:flex; flex-direction:column; gap:16px; margin-top:24px;">
    `;
    
    if (obs.length === 0) {
        html += `<div class="card" style="text-align:center; padding:40px; color:var(--ink-soft);">No field observations logged. Press / to capture your first note.</div>`;
    } else {
        for (let o of obs) {
            let date = new Date(o.created_at).toLocaleString();
            let statusHtml = o.processed 
                ? `<span style="font-size:0.75rem; color:var(--good-ink); background:var(--good-soft); padding:2px 8px; border-radius:12px;">Clustered</span>`
                : `<span style="font-size:0.75rem; color:var(--ink-soft); background:#ECEFEA; border:1px solid var(--line); padding:2px 8px; border-radius:12px;">Raw Data</span>`;
                
            html += `
                <div class="card" style="padding:16px 20px;">
                    <p style="font-size:1.1rem; color:var(--ink); line-height:1.5; margin-bottom:12px;">${app.escapeHtml(o.text)}</p>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:0.8rem; color:var(--ink-faint);">${date}</span>
                        <div style="display:flex; gap:8px; align-items:center;">
                            ${statusHtml}
                            <button class="btn btn--sm" style="border:none; padding:4px 8px; color:#c92a2a; background:transparent;" onclick="app.deleteItem('observations', '${o.id}')">Delete</button>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    html += `</div></div></main>`;
    return html;
};

const renderOppRow = (o) => {
    const isArchived = o.status === 'Archived';
    return `
        <div class="card opp-row" data-id="${o.id}" style="margin-bottom:8px; padding:0; overflow:hidden; position:relative; opacity:${isArchived ? '0.6' : '1'};">
            <div class="swipe-bg swipe-bg-archive" style="position:absolute; inset:0; background:#c92a2a; color:#fff; display:flex; align-items:center; padding:0 24px; font-weight:bold; justify-content:flex-end; z-index:0;">Archive</div>
            <div class="swipe-bg swipe-bg-advance" style="position:absolute; inset:0; background:#2b8a3e; color:#fff; display:flex; align-items:center; padding:0 24px; font-weight:bold; justify-content:flex-start; z-index:0;">Advance</div>
            <div class="opp-card-inner" style="background:var(--card); position:relative; z-index:2; padding:12px 16px; display:flex; justify-content:space-between; align-items:center; transition: transform 0.2s;" 
                ontouchstart="app.handleSwipeStart(event)" 
                ontouchmove="app.handleSwipeMove(event)" 
                ontouchend="app.handleSwipeEnd(event, '${o.id}')">
                <div style="cursor:pointer; flex:1;" onclick="app.go('Opportunity', '${o.id}')">
                    <div style="font-weight:600; color:var(--ink); ${isArchived ? 'text-decoration:line-through;' : ''}">${o.title}</div>
                    <div style="font-size:0.85rem; color:var(--ink-soft); margin-top:4px;">Stage: ${o.status}</div>
                    ${o.bias_flag ? `<div style="margin-top:8px; font-size:0.8rem; background:#fef08a; color:#854d0e; padding:4px 8px; border-radius:4px; display:inline-block;"><strong>Bias Flag:</strong> ${app.escapeHtml(o.bias_flag)}</div>` : ''}
                </div>
                <div style="display:flex; align-items:center; gap:12px;">
                    <div class="pill ${isArchived ? '' : 'pill--brand'}">Score: ${o.calculated_score}</div>
                    <button class="btn btn--sm" style="border:none; padding:4px 8px; color:#c92a2a; background:transparent;" onclick="app.deleteItem('opportunities', '${o.id}')">Delete</button>
                </div>
            </div>
        </div>
    `;
};

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
            return o.observations && p.observation_ids && o.observations.some(obsId => p.observation_ids.includes(obsId));
        });
        
        if (patternOpps.length > 0) {
            html += `<h3 style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-faint); margin-bottom:12px; margin-top:24px; padding-left:8px; border-left:2px solid var(--primary);">${p.title}</h3>`;
            html += `<div style="padding-left:12px; margin-bottom:24px;">`;
            
            patternOpps.sort((a,b) => b.calculated_score - a.calculated_score).forEach(o => {
                html += renderOppRow(o);
            });
            html += `</div>`;
        }
    });

    const standaloneOpps = opps.filter(o => {
        return !patterns.some(p => p.observation_ids && o.observations && o.observations.some(obsId => p.observation_ids.includes(obsId)));
    });
    
    if (standaloneOpps.length > 0) {
        html += `<h3 style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-faint); margin-bottom:12px; margin-top:32px; padding-left:8px; border-left:2px solid var(--line);">Ungrouped Ventures</h3>`;
        html += `<div style="padding-left:12px; margin-bottom:24px;">`;
        
        standaloneOpps.sort((a,b) => b.calculated_score - a.calculated_score).forEach(o => {
            html += renderOppRow(o);
        });
        html += `</div>`;
    }
    
    html += `</div></div></main>`;
    return html;
};

const renderTutorHistory = (history) => {
    if (!history || history.length === 0) {
        return `<div style="text-align:center; color:var(--ink-faint); margin-top:40px;">No curriculum started. Ask a question or upload a file to begin.</div>`;
    }
    return history.map(m => `
        <div class="tutor-msg ${m.role === 'user' ? 'user' : 'ai'}">
            ${app.escapeHtml(m.text).replace(/\n/g, '<br>')}
        </div>
    `).join('');
};

const renderOpportunity = async () => {
    const opp = await NF.DB.get('opportunities', NF.State.activeId);
    if (!opp) return app.go('Pipeline');
    
    const isArchived = opp.status === 'Archived';
    const todayStr = new Date().toISOString().split('T')[0];
    const isKillDatePassed = opp.exit_deadline && opp.exit_deadline < todayStr && !isArchived;
    
    // Predictions HTML
    let predictionsHtml = `<div class="card" style="margin-top:24px; border-left:4px solid var(--primary); background:rgba(0,0,0,0.02);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h3 style="margin:0;">Predictions</h3>
            ${!isArchived ? `<button class="btn btn--sm" onclick="app.logPrediction('${opp.id}')">Log Prediction</button>` : ''}
        </div>
        <ul class="list" style="margin:0; padding-left:16px;">`;
    if (opp.predictions && opp.predictions.length > 0) {
        opp.predictions.forEach(p => {
            let statusBadge = '';
            if (p.status === 'right') statusBadge = `<span class="pill" style="background:#dcfce7; color:#166534; font-size:0.7em;">Right</span>`;
            else if (p.status === 'wrong') statusBadge = `<span class="pill" style="background:#fee2e2; color:#991b1b; font-size:0.7em;">Wrong</span>`;
            else statusBadge = `<span class="pill" style="background:#f1f5f9; color:#475569; font-size:0.7em;">Pending</span>`;
            
            predictionsHtml += `<li style="margin-bottom:8px;">
                <div style="font-size:0.9rem;">${app.escapeHtml(p.statement)} ${statusBadge}</div>
                <div style="font-size:0.75rem; color:var(--ink-soft);">Confidence: ${p.confidence}% | Resolves: ${app.escapeHtml(p.resolve_date)}</div>
            </li>`;
        });
    } else {
        predictionsHtml += `<li style="color:var(--ink-faint); font-size:0.85rem; list-style:none; margin-left:-16px;">No predictions logged.</li>`;
    }
    predictionsHtml += `</ul></div>`;
    const apiKey = await NF.DB.getSetting('gemini_api_key', '');
    const hasAI = !!apiKey;
    
    // Compounding Timeline
    const currentIdx = LIFECYCLE.indexOf(opp.status) === -1 ? 0 : LIFECYCLE.indexOf(opp.status);
    let timelineHtml = LIFECYCLE.map((s, idx) => {
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
                
                ${isKillDatePassed ? `<div style="background:#fee2e2; color:#991b1b; padding:12px 16px; border-radius:8px; margin-top:16px; font-weight:600; display:flex; align-items:center;"><svg class="ic" style="margin-right:8px;"><use href="#i-arrow"/></svg> Kill Date Passed (${app.escapeHtml(opp.exit_deadline)})</div>` : ''}
                
                <div class="phead" style="align-items:center;">
                    <div>
                        <h1 class="ptitle" style="${isArchived ? 'text-decoration:line-through; color:var(--ink-faint);' : ''}">${app.escapeHtml(opp.title)}</h1>
                        ${isArchived ? '<span class="pill" style="margin-top:8px;">Archived (Graveyard)</span>' : ''}
                    </div>
                    <div style="display:flex; gap:12px; align-items:center;">
                        <div class="pill pill--brand" style="font-size:0.9rem;">Score: ${opp.calculated_score}${opp.score_source === 'fallback' ? ' <span style="opacity:0.8; font-size:0.8em; margin-left:4px;">est.</span>' : ''}</div>
                        ${!isArchived ? (hasAI 
                            ? `<button class="btn btn--sm" id="btn-convene-board" onclick="app.runBoardAnalysis('${opp.id}')" style="background:#111; color:#fff; border:1px solid #333;"><svg class="ic" style="margin-right:6px;"><use href="#i-users"/></svg> Convene Board</button>
                               <button class="btn btn--sm" id="btn-red-team" onclick="app.runRedTeam('${opp.id}')" style="background:#991b1b; color:#fff; border:1px solid #7f1d1d;"><svg class="ic" style="margin-right:6px;"><use href="#i-target"/></svg> Red Team</button>
                               <button class="btn btn--sm" id="btn-pre-mortem" onclick="app.runPreMortem('${opp.id}')" style="background:#475569; color:#fff; border:1px solid #334155;"><svg class="ic" style="margin-right:6px;"><use href="#i-bulb"/></svg> Pre-Mortem</button>`
                            : `<button class="btn btn--sm" id="btn-convene-board" style="background:#333; color:#888; border:1px solid #444; cursor:not-allowed;" title="API Key Required"><svg class="ic" style="margin-right:6px;"><use href="#i-users"/></svg> Convene Board</button>`
                        ) : ''}
                        ${!isArchived ? `<button class="btn btn--primary btn--sm" onclick="app.toggleTutor()"><svg class="ic" style="margin-right:6px;"><use href="#i-spark"/></svg> AI Tutor</button>` : ''}
                        ${!isArchived ? `<button class="btn btn--sm" onclick="app.advanceStage('${opp.id}')">Advance Stage <svg class="ic"><use href="#i-arrow"/></svg></button>` : ''}
                    </div>
                </div>
                
                <h3 style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-faint); margin-top:24px; margin-bottom:12px;">Compounding Timeline</h3>
                <div class="stepper" style="margin-bottom:32px;">
                    ${timelineHtml}
                </div>
                
                ${opp.bias_flag ? `
                <div style="margin-bottom:32px; background:#fef08a; border-left:4px solid #eab308; border-radius:4px; padding:12px 16px;">
                    <h4 style="font-size:0.85rem; text-transform:uppercase; color:#854d0e; margin-bottom:8px; letter-spacing:0.05em;">Founder Bias Detected</h4>
                    <p style="font-size:0.9rem; color:#713f12;">${app.escapeHtml(opp.bias_flag)}</p>
                </div>` : ''}
                
                <div id="board-analysis-container">
                    ${opp.board_analysis ? `
                    <div style="margin-bottom:32px; background:#fff; border:1px solid var(--line); border-radius:8px; padding:16px;">
                        <h4 style="font-size:0.85rem; text-transform:uppercase; color:var(--ink-soft); margin-bottom:12px; letter-spacing:0.05em;">Board Directives</h4>
                        <div class="grid" style="grid-template-columns:1fr 1fr; gap:12px;">
                            <div style="font-size:0.85rem; padding:8px; background:rgba(29,78,216,0.05); border-left:3px solid #1d4ed8; color:var(--ink);"><strong>CEO:</strong> ${opp.board_analysis.ceo}</div>
                            <div style="font-size:0.85rem; padding:8px; background:rgba(21,128,61,0.05); border-left:3px solid #15803d; color:var(--ink);"><strong>CFO:</strong> ${opp.board_analysis.cfo}</div>
                            <div style="font-size:0.85rem; padding:8px; background:rgba(107,33,168,0.05); border-left:3px solid #6b21a8; color:var(--ink);"><strong>CTO:</strong> ${opp.board_analysis.cto}</div>
                            <div style="font-size:0.85rem; padding:8px; background:rgba(194,65,12,0.05); border-left:3px solid #c2410c; color:var(--ink);"><strong>CPO:</strong> ${opp.board_analysis.cpo}</div>
                        </div>
                    </div>` : ''}
                </div>
                
                <div id="red-team-container">
                    ${opp.red_team ? `
                    <div style="margin-bottom:32px; background:#fff; border:1px solid #fecaca; border-radius:8px; padding:16px; border-left:4px solid #ef4444;">
                        <h4 style="font-size:0.85rem; text-transform:uppercase; color:#b91c1c; margin-bottom:12px; letter-spacing:0.05em;">Red Team Analysis</h4>
                        <p style="font-size:0.9rem; margin-bottom:8px;"><strong>Strongest case against:</strong> ${app.escapeHtml(opp.red_team.strongest_case_against)}</p>
                        <p style="font-size:0.9rem; color:var(--ink-soft);"><strong>Cheapest falsifying test:</strong> ${app.escapeHtml(opp.red_team.cheapest_falsifying_test)}</p>
                    </div>` : ''}
                </div>
                
                <div id="pre-mortem-container">
                    ${opp.pre_mortem ? `
                    <div style="margin-bottom:32px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:16px;">
                        <h4 style="font-size:0.85rem; text-transform:uppercase; color:#334155; margin-bottom:12px; letter-spacing:0.05em;">Pre-Mortem</h4>
                        <p style="font-size:0.9rem; color:var(--ink-soft);">${app.escapeHtml(opp.pre_mortem.failure_reason)}</p>
                    </div>` : ''}
                </div>
                
                ${isArchived ? `
                <div class="card" style="margin-bottom:24px; border-left:4px solid var(--ink-faint); background:rgba(0,0,0,0.02);">
                    <h3 style="font-size:1.1rem; margin-bottom:8px;">Graveyard Post-Mortem</h3>
                    <p style="font-size:0.9rem; color:var(--ink-soft); margin-bottom:4px;"><strong>Reason:</strong> ${app.escapeHtml(opp.archive_reason)}</p>
                    <p style="font-size:0.9rem; color:var(--ink-soft); margin-bottom:4px;"><strong>Predicted vs Actual:</strong> ${app.escapeHtml(opp.predicted_vs_actual)}</p>
                    <p style="font-size:0.9rem; color:var(--ink-soft);"><strong>Lesson:</strong> ${app.escapeHtml(opp.lessons_learned)}</p>
                </div>
                ` : ''}
                
                <div class="grid g2">
                    <div>
                        <div class="card cat" style="--bc: var(--primary);">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                                <h3 style="margin:0;">Next Action</h3>
                                ${!isArchived ? `<button class="btn btn--sm" onclick="app.editField('${opp.id}', 'next_action', 'What is the next physical action?')">Edit</button>` : ''}
                            </div>
                            <p style="font-size:1.1rem; color:var(--ink);">${app.escapeHtml(opp.next_action)}</p>
                            
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; margin-top:24px;">
                                <h3 style="margin:0; font-size:1rem; color:var(--ink-faint);">Exit Conditions</h3>
                                ${!isArchived ? `<button class="btn btn--sm" onclick="app.editField('${opp.id}', 'exit_conditions', 'Define exit conditions (e.g. Kill if 3 prospects say no)')">Edit</button>` : ''}
                            </div>
                            <p style="font-size:0.9rem; color:var(--ink-soft);">${app.escapeHtml(opp.exit_conditions)}</p>
                            ${opp.exit_deadline ? `<p style="font-size:0.85rem; color:var(--ink-soft); margin-top:8px;"><strong>Kill Date:</strong> ${app.escapeHtml(opp.exit_deadline)}</p>` : ''}
                            
                            ${predictionsHtml}
                            
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
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                                <h3 style="font-size:1rem; margin:0;">AI Scoring Engine (V4)</h3>
                                ${!isArchived ? `<button class="btn btn--sm" id="btn-run-diagnostics" onclick="app.runAIDiagnostics('${opp.id}')"><svg class="ic" style="margin-right:4px;"><use href="#i-spark"/></svg> Run Diagnostics</button>` : ''}
                            </div>
                            <div id="diagnostics-container" class="minigrid" style="--m: 3;">
                                <div class="cell">
                                    <div class="t">Leverage</div>
                                    <div class="v">${opp.leverage || 0}/10</div>
                                    <div style="font-size:0.75rem; color:var(--ink-soft); margin-top:6px; line-height:1.4;">${app.escapeHtml(opp.leverage_text) || `Driven by ${(opp.observations||[]).length} converging observations in this sector.`}</div>
                                </div>
                                <div class="cell">
                                    <div class="t">Velocity</div>
                                    <div class="v">${opp.velocity || 0}/10</div>
                                    <div style="font-size:0.75rem; color:var(--ink-soft); margin-top:6px; line-height:1.4;">${app.escapeHtml(opp.velocity_text) || `Velocity constrained. Requires a direct validation test to unlock.`}</div>
                                </div>
                                <div class="cell">
                                    <div class="t">Conviction</div>
                                    <div class="v">${opp.conviction || 0}/10</div>
                                    <div style="font-size:0.75rem; color:var(--ink-soft); margin-top:6px; line-height:1.4;">${app.escapeHtml(opp.conviction_text) || `Medium conviction. Data is strong but lacks first-sale proof.`}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            </div>
            
            <div id="tutor-sidebar" class="tutor-sidebar">
                <div class="tutor-header">
                    <h2 style="font-size:1.1rem; color:var(--ink); margin:0; display:flex; align-items:center;"><svg class="ic" style="margin-right:8px; color:var(--primary);"><use href="#i-spark"/></svg> AI Business Tutor</h2>
                    <button class="btn btn--sm" style="border:none; padding:4px;" onclick="app.toggleTutor()"><svg class="ic"><use href="#i-cross"/></svg></button>
                </div>
                <div id="tutor-chat" class="tutor-chat">
                    ${renderTutorHistory(opp.tutor_history || [])}
                </div>
                <div class="tutor-input-area">
                    <textarea id="tutor-input" class="input" style="height:60px; resize:none;" placeholder="Ask about strategy, approach, or negotiation..."></textarea>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <input type="file" id="tutor-file" style="display:none;" accept=".txt,.csv,.md,.json" onchange="app.handleTutorFile(event)">
                        <button class="btn btn--sm" style="border:none; background:transparent;" onclick="document.getElementById('tutor-file').click()"><svg class="ic" style="margin-right:4px;"><use href="#i-bulb"/></svg> Attach File (.txt)</button>
                        <button class="btn btn--primary btn--sm" onclick="app.sendTutorMessage('${opp.id}')">Send</button>
                    </div>
                </div>
            </div>
            
        </main>
    `;
};

const renderBusinesses = async () => {
    let businesses = await NF.DB.getAll('businesses');
    
    let html = `<main class="main"><div class="wrap">
        <div class="crumb">Compounding / Business Evidence</div>
        <div class="phead">
            <h1 class="ptitle">Field Intelligence</h1>
            <button class="btn btn--primary" onclick="app.toggleAddBusiness()">Add Entity</button>
        </div>
        <p class="psub">Track reality and trust, not just CRM data.</p>
        <div style="margin-top:24px;">`;
        
    for(let b of businesses) {
        html += `
            <div class="card" style="margin-bottom:12px; cursor:pointer; border:1px solid var(--line);" onclick="app.go('BusinessDetail', '${b.id}')">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <h3 style="font-size:1.2rem;">${app.escapeHtml(b.name)}</h3>
                        <p style="font-size:0.9rem; color:var(--ink-soft); margin-top:4px;">DM: ${app.escapeHtml(b.decision_maker)}</p>
                    </div>
                    <div class="pill ${b.trust_level === 'High' ? 'pill--brand' : ''}">${app.escapeHtml(b.trust_level)} Trust</div>
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
    // Filter opps linked to this business
    let linkedOpps = opps.filter(o => o.business_id === biz.id);

    
    let html = `
        <main class="main">
            <div class="wrap">
                <div class="crumb"><a href="#" onclick="app.go('Businesses')" style="color:var(--ink-faint); text-decoration:none;">Field Intelligence</a> / Dossier</div>
                
                <div class="phead" style="margin-bottom:24px;">
                    <div>
                        <h1 class="ptitle">${app.escapeHtml(biz.name)}</h1>
                    </div>
                    <button class="btn btn--primary" onclick="app.generatePrepBrief('${biz.id}')" id="btn-prep-brief"><svg class="ic" style="margin-right:6px;"><use href="#i-spark"/></svg> Prep Brief</button>
                </div>
                
                <div id="prep-brief-container" style="margin-bottom:24px;"></div>
                
                <div class="grid g2" style="gap:24px;">
                    <!-- Question 1 & 3 -->
                    <div style="display:flex; flex-direction:column; gap:24px;">
                        <div class="card" style="margin:0;">
                            <h2 style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--primary); margin-bottom:16px;">1. Who are they?</h2>
                            <div style="margin-bottom:12px; display:flex; gap:8px;">
                                <div class="pill">DM: ${app.escapeHtml(biz.decision_maker)}</div>
                                <div class="pill ${biz.trust_level === 'High' ? 'pill--brand' : ''}">Trust: ${app.escapeHtml(biz.trust_level)}</div>
                            </div>
                            <p style="font-size:0.9rem; color:var(--ink-soft); margin-bottom:4px;"><strong>Style:</strong> ${app.escapeHtml(biz.communication_style)}</p>
                            <h3 style="font-size:0.9rem; margin-top:16px; margin-bottom:8px;">Key Contacts:</h3>
                            <ul class="list" style="padding-left:16px; margin-top:0;">
                                ${(biz.key_contacts || []).map(c => `<li style="margin-bottom:4px;">${app.escapeHtml(c)}</li>`).join('')}
                                ${(biz.key_contacts || []).length === 0 ? '<li style="color:var(--ink-faint);">None logged.</li>' : ''}
                            </ul>
                        </div>
                        
                        <div class="card" style="margin:0;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                                <h2 style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--primary); margin:0;">3. What opportunities exist?</h2>
                                <button class="btn btn--sm" onclick="app.spawnBusinessOpportunity('${biz.id}')">Spawn</button>
                            </div>
                            ${linkedOpps.length > 0 ? linkedOpps.map(o => renderOppRow(o)).join('') : '<p style="color:var(--ink-faint); font-size:0.9rem;">No opportunities linked yet.</p>'}
                        </div>
                    </div>
                    
                    <!-- Question 2 & 4 -->
                    <div style="display:flex; flex-direction:column; gap:24px;">
                        <div class="card" style="margin:0;">
                            <h2 style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--primary); margin-bottom:16px;">2. What do we know?</h2>
                            <h3 style="font-size:0.9rem; margin-bottom:8px;">The Reality / Known Patterns:</h3>
                            <ul class="list" style="padding-left:16px; margin-top:0; margin-bottom:16px;">
                                ${(biz.known_problems || []).map(p => `<li style="margin-bottom:8px;">${app.escapeHtml(p)}</li>`).join('')}
                            </ul>
                            <h3 style="font-size:0.9rem; margin-bottom:8px;">Objections & Leverage Points:</h3>
                            <ul class="list" style="padding-left:16px; margin-top:0;">
                                ${(biz.objections || []).map(o => `<li style="margin-bottom:8px;">${app.escapeHtml(o)}</li>`).join('')}
                                ${(biz.objections || []).length === 0 ? '<li style="color:var(--ink-faint);">None logged.</li>' : ''}
                            </ul>
                        </div>
                        
                        <div class="card" style="margin:0; border:2px solid var(--primary-soft);">
                            <h2 style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--primary); margin-bottom:16px;">4. What should I do next?</h2>
                            <div class="cell lever" style="background:var(--good-soft); border:none;">
                                <div class="t"><svg class="ic" style="color:var(--good)"><use href="#i-arrow"/></svg> <span style="color:#256f55;">The Spearhead Move</span></div>
                                <div class="v" style="color:#17452f; font-size:1.1rem; margin-top:8px;">${app.escapeHtml(biz.next_move)}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
            </div>
        </main>
    `;
    return html;
};

const renderSettings = async () => {
    const apiKey = await NF.DB.getSetting('gemini_api_key', '');
    const keyBadge = apiKey ? `<span style="margin-left:8px; font-size:0.85rem; color:var(--good); font-weight:600;">Key saved ✓ (ends …${apiKey.slice(-4)})</span>` : '';
    const lastExport = await NF.DB.getSetting('last_export_at', 0);
    
    const timeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    let lastExportText = 'Never';
    if (lastExport > 0) {
        const days = Math.round((lastExport - Date.now()) / (1000 * 60 * 60 * 24));
        lastExportText = days === 0 ? 'Today' : timeFormatter.format(days, 'day');
    }
    return `
        <main class="main">
            <div class="wrap">
                <div class="crumb">System / Settings & AI</div>
                <h1 class="ptitle" style="margin-bottom:32px;">System Settings</h1>
                
                <div class="card" style="padding:24px;">
                    <h2 style="font-size:1.2rem; margin-bottom:8px;">Gemini API Integration</h2>
                    <p style="font-size:0.9rem; color:var(--ink-soft); margin-bottom:16px;">
                        Unlock real AI analysis for the Pattern Engine, Prep Briefs, and Just-in-Time Learning. 
                        Your API key is saved locally in your browser and used to make direct, free calls to Google's generative AI.
                    </p>
                    
                    <label style="display:flex; align-items:center; font-size:0.85rem; font-weight:600; margin-bottom:8px;">Gemini API Key ${keyBadge}</label>
                    <input type="password" id="setting-api-key" value="" class="input" style="width:100%; max-width:400px; margin-bottom:16px;" placeholder="AIzaSy...">
                    
                    <label style="display:block; margin-bottom:4px; font-size:0.85rem; color:var(--ink-soft); font-weight:600;">Known Biases (One per line)</label>
                    <textarea id="setting-biases" class="input" style="width:100%; max-width:400px; min-height:80px; margin-bottom:16px;" placeholder="e.g. Overestimates demand\nUnderestimates build time">${app.escapeHtml(((await NF.DB.getSetting('founder_intel')) || {}).biases ? ((await NF.DB.getSetting('founder_intel')) || {}).biases.join('\n') : '')}</textarea>
                    
                    <div>
                        <button class="btn btn--primary" onclick="app.saveSettings()">Save Settings</button>
                        <button class="btn btn--sm" style="margin-left:8px;" onclick="app.testAPIConnection()"><svg class="ic" style="margin-right:4px;"><use href="#i-spark"/></svg> Test Connection</button>
                    </div>
                </div>
                
                <div class="card" style="padding:24px; margin-top:24px;">
                    <h2 style="font-size:1.2rem; margin-bottom:8px;">Data Backup</h2>
                    <p style="font-size:0.9rem; color:var(--ink-soft); margin-bottom:16px;">
                        Export your entire database to a JSON file, or restore from a previous backup.
                    </p>
                    <div style="display:flex; align-items:center; gap:16px; margin-bottom:16px;">
                        <button class="btn btn--sm" onclick="app.exportBackup()">Export Backup</button>
                        <span style="font-size:0.85rem; color:var(--ink-soft);">Last export: ${lastExportText}</span>
                    </div>
                    <div style="border-top:1px solid var(--line); padding-top:16px;">
                        <label style="display:block; font-size:0.85rem; font-weight:600; margin-bottom:8px;">Import Backup</label>
                        <div style="display:flex; gap:8px;">
                            <input type="file" id="backup-file" accept=".json" class="input" style="flex:1;">
                            <button class="btn btn--sm" onclick="app.importBackup()">Restore</button>
                        </div>
                    </div>
                </div>

                <div class="card" style="padding:24px; margin-top:24px; border-color:#e0b4b4;">
                    <h2 style="font-size:1.2rem; margin-bottom:8px; color:#c92a2a;">Danger Zone</h2>
                    <p style="font-size:0.9rem; color:var(--ink-soft); margin-bottom:16px;">
                        Permanently delete all field observations, opportunities, patterns, and businesses. This action cannot be undone. Your API key and Founder Intel will be preserved.
                    </p>
                    <button class="btn btn--sm" style="border-color:#e0b4b4; color:#c92a2a; justify-content:center; width:100%; max-width:200px;" onclick="app.clearAllData()">Wipe Database</button>
                </div>
            </div>
        </main>
    `;
};

const app = {
    dismissBackupBanner: async () => {
        await NF.DB.setSetting('backup_banner_dismissed', true);
        app.render();
    },
    exportBackup: async () => {
        NF.UI.toast('Preparing your backup file...');
        await NF.DB.exportAll();
        app.render();
    },
    importBackup: async () => {
        const fileInput = document.getElementById('backup-file');
        if (!fileInput.files || fileInput.files.length === 0) return;
        
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                NF.UI.toast('Merging backup data. Please wait...');
                await NF.DB.importAll(e.target.result);
                NF.UI.toast('Backup restored successfully.');
                app.render();
            } catch (err) {
                NF.UI.toast(err.message || 'Corrupt or invalid backup file.');
            }
        };
        reader.readAsText(file);
    },
    escapeHtml: (unsafe) => {
        if (typeof unsafe !== 'string') return unsafe;
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    },
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
        } else if (NF.State.context === 'Discovery') html += await renderDiscovery();
        else if (NF.State.context === 'Pipeline') html += await renderPipeline();
        else if (NF.State.context === 'Opportunity') html += await renderOpportunity();
        else if (NF.State.context === 'Businesses') html += await renderBusinesses();
        else if (NF.State.context === 'BusinessDetail') html += await renderBusinessDetail();
        else if (NF.State.context === 'Settings') html += await renderSettings();
        
        root.innerHTML = html;
        
        // Add FAB for mobile capture
        root.innerHTML += `<button class="fab-mobile" onclick="app.toggleUniversalCapture()"><svg class="ic"><use href="#i-bulb"/></svg></button>`;
        
        // Add Mobile More Menu
        root.innerHTML += `
        <div id="mobnav-more" onclick="if(event.target===this) app.toggleMoreMenu()" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:9998; align-items:flex-end;">
            <div style="width:100%; background:var(--card); border-radius:16px 16px 0 0; padding-bottom:env(safe-area-inset-bottom);">
                <div style="padding:16px 24px; border-bottom:1px solid var(--line); font-weight:600;">More Options</div>
                <a class="navlink" onclick="app.toggleMoreMenu(); app.go('Discovery')" style="display:flex; padding:16px 24px; border-bottom:1px solid var(--line); align-items:center; gap:12px; color:var(--ink); text-decoration:none;"><svg class="ic"><use href="#i-bulb"/></svg> Discovery Feed</a>
                <a class="navlink" onclick="app.toggleMoreMenu(); app.go('Settings')" style="display:flex; padding:16px 24px; border-bottom:1px solid var(--line); align-items:center; gap:12px; color:var(--ink); text-decoration:none;"><svg class="ic"><use href="#i-target"/></svg> Settings & AI</a>
                <a class="navlink" onclick="app.toggleMoreMenu(); app.startSimulator()" style="display:flex; padding:16px 24px; align-items:center; gap:12px; color:var(--primary); text-decoration:none;"><svg class="ic"><use href="#i-star"/></svg> Run Simulator</a>
            </div>
        </div>`;
        
        // Post-render injections
        if (NF.State.context === 'Morning') {
            const patternContainer = document.getElementById('emerging-patterns-container');
            if (patternContainer) patternContainer.innerHTML = await renderEmergingPatterns();
            
            const intelContainer = document.getElementById('founder-intel-container');
            if (intelContainer) intelContainer.innerHTML = await renderFounderIntel();
            
            const jitContainer = document.getElementById('jit-learning-container');
            if (jitContainer) {
                const jitHtml = await renderJitLearning();
                if (jitHtml) jitContainer.innerHTML = jitHtml;
            }
        }
        
        window.scrollTo(0,0);
    },
    saveSettings: async () => {
        const apiKey = document.getElementById('setting-api-key').value.trim();
        if (apiKey !== "") {
            await NF.DB.setSetting('gemini_api_key', apiKey);
        }
        
        const biases = document.getElementById('setting-biases').value.split('\n').map(s => s.trim()).filter(Boolean);
        let intel = await NF.DB.getSetting('founder_intel') || {};
        intel.biases = biases;
        await NF.DB.putSetting('founder_intel', intel);
        
        NF.UI.toast('Settings have been saved.');
    },
    _patternEngineTimer: null,
    generateJSON: async (prompt, opts) => {
        let currentPrompt = prompt;
        for (let i = 0; i < 2; i++) {
            const res = await NF.AI.generateContent(currentPrompt, opts);
            if (res.ok) {
                const parsed = NF.AI.extractJSON(res.text);
                if (parsed !== null) return parsed;
            }
            currentPrompt = prompt + "\n\nReturn ONLY valid JSON. No prose.";
            console.warn("AI returned malformed JSON, retrying...");
        }
        NF.UI.toast("AI returned an unreadable answer — tap to retry");
        return null;
    },
    testAPIConnection: async () => {
        const apiKey = await NF.DB.getSetting('gemini_api_key');
        if (!apiKey) {
            return NF.UI.toast('Please save an API key first.');
        }
        NF.UI.toast('Sending a test ping to Gemini API...');
        const res = await NF.AI.generateContent("Reply with the word 'SUCCESS' if you receive this message.", { taskClass: 'chat' });
        if (res.ok && res.text.includes('SUCCESS')) {
            NF.UI.toast('The Gemini API is working perfectly.');
        } else {
            NF.UI.toast('Failed to connect. Please verify your API key and internet connection.');
        }
    },
    runPatternEngine: async () => {
        const obs = await NF.DB.getAll('observations');
        let unprocessed = obs.filter(o => !o.processed);
        if (unprocessed.length > 20) unprocessed = unprocessed.slice(0, 20); // Cap input size to optimize tokens
        if (unprocessed.length < 3) return; 
        
        const hasGemini = await NF.DB.getSetting('gemini_api_key');
        if (hasGemini) {
            const prompt = `Analyze these raw field observations. 
Look for cross-domain analogies or recurring bottlenecks across different industries or contexts.
If you find a distinct cluster of 3 or more related observations, return a JSON array of pattern objects.
Format MUST be strictly this JSON array: [{"title": "Pattern: [Descriptive Name]", "observation_ids": ["id1", "id2", "id3"]}]
Return ONLY the raw JSON array. No markdown formatting, no backticks.

Observations to analyze:
${unprocessed.map(o => `ID: ${o.id} | Text: ${o.text}`).join('\n')}`;

            let clusters = await app.generateJSON(prompt, { systemInstruction: "You are a ruthless business strategist. Output valid raw JSON only.", taskClass: 'cluster' });
            if (clusters) {
                for (let cluster of clusters) {
                        if (cluster.observation_ids && cluster.observation_ids.length >= 3) {
                            const patternId = 'pat_' + Date.now() + '_' + Math.floor(Math.random()*1000);
                            await NF.DB.put('patterns', {
                                id: patternId,
                                title: cluster.title,
                                status: 'Emerging',
                                observation_ids: cluster.observation_ids
                            });
                            for (let id of cluster.observation_ids) {
                                let o = await NF.DB.get('observations', id);
                                if (o && !o.processed) {
                                    o.processed = true;
                                    o.linked_pattern_id = patternId;
                                    await NF.DB.put('observations', o);
                                }
                            }
                        console.log(`Gemini AI Engine: Detected cross-domain pattern: ${cluster.title}`);
                    }
                }
            }
            return; // Skip local JS grouping since Gemini handled it
        }
        
        // Basic Semantic Clustering (Local Fallback)
        const stopWords = ['the','is','at','which','and','on','in','a','an','of','to','it','this','that','he','she','they','but','for','with','about','his','her','their'];
        const extractKeywords = (text) => {
            return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(' ')
                .filter(w => w.length > 3 && !stopWords.includes(w));
        };
        
        let keywordMap = {}; 
        unprocessed.forEach(o => {
            const kw = extractKeywords(o.text);
            const uniqueKw = [...new Set(kw)];
            uniqueKw.forEach(k => {
                if(!keywordMap[k]) keywordMap[k] = [];
                keywordMap[k].push(o);
            });
        });
        
        for (const [keyword, cluster] of Object.entries(keywordMap)) {
            const stillUnprocessed = cluster.filter(o => !o.processed);
            if (stillUnprocessed.length >= 3) {
                const patternId = 'pat_' + Date.now() + '_' + keyword;
                const title = `Pattern: ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}`;
                
                await NF.DB.put('patterns', {
                    id: patternId,
                    title: title,
                    status: 'Emerging',
                    observation_ids: stillUnprocessed.map(c => c.id)
                });
                
                for (const o of stillUnprocessed) {
                    o.processed = true;
                    o.linked_pattern_id = patternId;
                    await NF.DB.put('observations', o);
                }
                console.log(`Local AI Engine: Detected semantic pattern around "${keyword}"`);
            }
        }
    },
    generatePrepBrief: async (bizId) => {
        const btn = document.getElementById('btn-prep-brief');
        const container = document.getElementById('prep-brief-container');
        const hasGemini = await NF.DB.getSetting('gemini_api_key');
        
        if (!hasGemini) {
            NF.UI.toast('Please configure your Gemini API Key in Settings to generate an AI Prep Brief.');
            return;
        }
        
        if (btn) btn.innerHTML = 'Analyzing...';
        
        const biz = await NF.DB.get('businesses', bizId);
        const prompt = `Act as a high-stakes executive briefer. I am about to walk into a meeting with this business.
        Give me a highly concise, ruthless 3-bullet prep brief.
        Include: 1) The core reality/problem they face, 2) How I should communicate with the DM, 3) The exact next move I must execute.
        Format as HTML (use <ul> and <li style="margin-bottom:8px;">). Do not include markdown code block backticks.
        
        Business Data:
        Name: ${biz.name}
        Decision Maker: ${biz.decision_maker}
        Style: ${biz.communication_style || 'Unknown'}
        Trust Level: ${biz.trust_level}
        Problems: ${(biz.known_problems||[]).join(', ')}
        Objections: ${(biz.objections||[]).join(', ')}
        Next Move: ${biz.next_move}`;
        container.innerHTML = '<div class="skeleton"></div>';
        const res = await NF.AI.generateContent(prompt, { taskClass: 'brief' });
        if (res && res.ok) {
            let htmlRes = res.text.replace(/```html/gi, '').replace(/```/g, '').trim();
            container.innerHTML = `
                <div class="card" style="border:1px solid var(--primary-soft); background:var(--card); border-left:4px solid var(--primary);">
                    <h3 style="font-size:1.1rem; color:var(--primary); margin-bottom:12px;">AI Executive Brief</h3>
                    <div style="font-size:0.95rem; color:var(--ink); line-height:1.5;">${htmlRes}</div>
                </div>
            `;
        } else {
            container.innerHTML = `<div class="retry-block">
                <span>Failed to generate brief.</span>
                <button onclick="app.generatePrepBrief('${bizId}')">Retry</button>
            </div>`;
        }
        
        if (btn) btn.innerHTML = '<svg class="ic" style="margin-right:6px;"><use href="#i-spark"/></svg> Prep Brief';
    },
    runAIDiagnostics: async (oppId) => {
        const btn = document.getElementById('btn-run-diagnostics');
        const hasGemini = await NF.DB.getSetting('gemini_api_key');
        
        if (!hasGemini) {
            NF.UI.toast('Please configure your Gemini API Key in Settings to run AI Diagnostics.');
            return;
        }
        
        if (btn) btn.innerHTML = 'Diagnosing...';
        
        const opp = await NF.DB.get('opportunities', oppId);
        
        const container = document.getElementById('diagnostics-container');
        if (container) container.innerHTML = '<div class="skeleton" style="grid-column: 1 / -1; min-height:80px;"></div>';
        
        const prompt = `Act as a ruthless startup advisor. Evaluate this opportunity and score it strictly from 1 to 10 for Leverage, Velocity, and Conviction.
        Leverage: High upside, low relative effort?
        Velocity: Can we move fast, or are we blocked?
        Conviction: Is the evidence strong?
        
        Context: "${opp.title}"
        Observations: ${opp.observations.join('; ')}
        
        Return ONLY valid JSON like: {"leverage": 8, "leverage_text": "...", "velocity": 3, "velocity_text": "...", "conviction": 9, "conviction_text": "..."}
        `;
        
        const scores = await app.generateJSON(prompt, { taskClass: 'board' });
        if (scores) {
            opp.leverage = scores.leverage;
            opp.leverage_text = scores.leverage_text;
            opp.velocity = scores.velocity;
            opp.velocity_text = scores.velocity_text;
            opp.conviction = scores.conviction;
            opp.conviction_text = scores.conviction_text;
            
            opp.calculated_score = computeScore(opp.leverage, opp.velocity, opp.conviction);
            opp.score_source = 'ai';
            
            await NF.DB.put('opportunities', opp);
            app.render();
        } else {
            if (container) container.innerHTML = `<div class="retry-block" style="grid-column: 1 / -1;">
                <span>Failed to run diagnostics.</span>
                <button onclick="app.runAIDiagnostics('${oppId}')">Retry</button>
            </div>`;
        }
        
        if (btn) btn.innerHTML = '<svg class="ic" style="margin-right:4px;"><use href="#i-spark"/></svg> Run Diagnostics';
    },
    runBoardAnalysis: async (oppId) => {
        const btn = document.getElementById('btn-convene-board');
        const hasGemini = await NF.DB.getSetting('gemini_api_key');
        if (!hasGemini) return NF.UI.toast('Please configure your Gemini API Key to convene the board.');
        if (btn) btn.innerHTML = 'Convening Board...';
        const opp = await NF.DB.get('opportunities', oppId);
        
        const container = document.getElementById('board-analysis-container');
        if (container) container.innerHTML = '<div class="skeleton"></div>';
        
        const prompt = `Act as a Virtual Board of Directors for this startup opportunity. You must debate this sequentially, arguing with each other.
        
        Format your response as a sequential debate:
        1. CEO: Argue FOR the opportunity (vision and macro-market fit).
        2. CFO: Argue AGAINST the opportunity, explicitly citing the opportunity's numbers, unit economics, or lack thereof. MUST include one "base-rate" sentence for this specific category of startup (e.g., "90% of local delivery startups fail due to CAC.").
        3. CTO: Evaluate technical feasibility based on the CEO and CFO's arguments.
        4. CPO: Deliver the final verdict (Build, Kill, or Pivot) based on user experience and the previous arguments.
        
        Opportunity: ${opp.title}
        Next Action: ${opp.next_action}
        Observations: ${opp.observations.join(', ')}
        
        Return ONLY a raw JSON object exactly in this format:
        {
          "ceo": "CEO's argument for.",
          "cfo": "CFO's argument against, including a base-rate sentence.",
          "cto": "CTO's technical feasibility.",
          "cpo": "CPO's final verdict."
        }`;
        
        const board = await app.generateJSON(prompt, { taskClass: 'board' });
        if (board) {
            opp.board_analysis = board;
            await NF.DB.put('opportunities', opp);
            app.render();
        } else {
            if (container) container.innerHTML = `<div class="retry-block">
                <span>Failed to generate Board Analysis.</span>
                <button onclick="app.runBoardAnalysis('${oppId}')">Retry</button>
            </div>`;
        }
        if (btn) btn.innerHTML = '<svg class="ic" style="margin-right:4px;"><use href="#i-users"/></svg> Convene Board';
    },
    runRedTeam: async (oppId) => {
        const btn = document.getElementById('btn-red-team');
        const hasGemini = await NF.DB.getSetting('gemini_api_key');
        if (!hasGemini) return NF.UI.toast('Please configure your Gemini API Key to run Red Team.');
        if (btn) btn.innerHTML = 'Red Teaming...';
        const opp = await NF.DB.get('opportunities', oppId);
        
        const container = document.getElementById('red-team-container');
        if (container) container.innerHTML = '<div class="skeleton"></div>';
        
        const prompt = `Act as an adversarial Red Team for this startup opportunity. Give me the absolute strongest, most brutal case AGAINST this working, and the cheapest/fastest test we can run this week to falsify the hypothesis.
        
        Opportunity: ${opp.title}
        Next Action: ${opp.next_action}
        Observations: ${opp.observations.join(', ')}
        
        Return ONLY a raw JSON object exactly in this format:
        {
          "strongest_case_against": "The brutal reality...",
          "cheapest_falsifying_test": "What to do this week to prove it fails."
        }`;
        
        const res = await app.generateJSON(prompt, { taskClass: 'board' });
        if (res) {
            opp.red_team = res;
            await NF.DB.put('opportunities', opp);
            app.render();
        } else {
            if (container) container.innerHTML = `<div class="retry-block"><span>Failed to generate Red Team analysis.</span><button onclick="app.runRedTeam('${oppId}')">Retry</button></div>`;
        }
        if (btn) btn.innerHTML = '<svg class="ic" style="margin-right:6px;"><use href="#i-target"/></svg> Red Team';
    },
    runPreMortem: async (oppId) => {
        const btn = document.getElementById('btn-pre-mortem');
        const hasGemini = await NF.DB.getSetting('gemini_api_key');
        if (!hasGemini) return NF.UI.toast('Please configure your Gemini API Key to run Pre-Mortem.');
        if (btn) btn.innerHTML = 'Simulating Failure...';
        const opp = await NF.DB.get('opportunities', oppId);
        
        const container = document.getElementById('pre-mortem-container');
        if (container) container.innerHTML = '<div class="skeleton"></div>';
        
        const prompt = `Assume it's exactly 1 year from now. This opportunity ("${opp.title}") has completely failed. Tell me why. Be specific, brutal, and highly plausible based on the context.
        Observations: ${opp.observations.join(', ')}
        
        Return ONLY a raw JSON object exactly in this format:
        {
          "failure_reason": "The story of how and why it failed..."
        }`;
        
        const res = await app.generateJSON(prompt, { taskClass: 'board' });
        if (res) {
            opp.pre_mortem = res;
            await NF.DB.put('opportunities', opp);
            app.render();
        } else {
            if (container) container.innerHTML = `<div class="retry-block"><span>Failed to generate Pre-Mortem.</span><button onclick="app.runPreMortem('${oppId}')">Retry</button></div>`;
        }
        if (btn) btn.innerHTML = '<svg class="ic" style="margin-right:6px;"><use href="#i-bulb"/></svg> Pre-Mortem';
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
    
    // --- AI Tutor Logic ---
    toggleTutor: () => {
        const sidebar = document.getElementById('tutor-sidebar');
        if (sidebar) {
            sidebar.classList.toggle('open');
            if (sidebar.classList.contains('open')) {
                const chatBox = document.getElementById('tutor-chat');
                chatBox.scrollTop = chatBox.scrollHeight;
            }
        }
    },
    
    handleTutorFile: (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            app._pendingTutorFile = `\n\n[FILE ATTACHMENT: ${file.name}]\n${ev.target.result}\n`;
            NF.UI.toast(`${file.name} is ready to be sent with your next message.`);
        };
        reader.readAsText(file);
    },
    
    sendTutorMessage: async (oppId) => {
        const input = document.getElementById('tutor-input');
        const text = input.value.trim();
        const fileContext = app._pendingTutorFile || '';
        
        if (!text && !fileContext) return;
        
        const opp = await NF.DB.get('opportunities', oppId);
        if (!opp.tutor_history) opp.tutor_history = [];
        
        const fullMessage = text + fileContext;
        
        opp.tutor_history.push({ role: 'user', text: fullMessage });
        app._pendingTutorFile = null;
        input.value = '';
        
        const chatBox = document.getElementById('tutor-chat');
        chatBox.innerHTML = renderTutorHistory(opp.tutor_history);
        
        // Inject Skeleton
        chatBox.insertAdjacentHTML('beforeend', '<div id="tutor-skeleton" class="tutor-msg ai skeleton" style="min-height:60px; margin-top:16px;"></div>');
        chatBox.scrollTop = chatBox.scrollHeight;
        
        const sysPrompt = `Act as an elite business mentor. STRICT CONSTRAINT: You must ONLY teach non-technical business skills (strategy, sales, operations, marketing, negotiation). Refuse to teach technical hard skills like video editing, coding, or engineering. If asked for technical skills, pivot back to how to SELL or OPERATE a business around those skills. Be highly actionable and concise.`;
        const historyText = opp.tutor_history.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n\n');
        const prompt = `Opportunity Context: "${opp.title}" (Stage: ${opp.status})\n\nConversation History:\n${historyText}\n\nAI (Respond concisely):`;
        
        const res = await NF.AI.generateContent(prompt, { systemInstruction: sysPrompt, taskClass: 'chat' });
        
        const skel = document.getElementById('tutor-skeleton');
        if (res && res.ok) {
            opp.tutor_history.push({ role: 'ai', text: res.text });
            await NF.DB.put('opportunities', opp);
            if (chatBox) {
                chatBox.innerHTML = renderTutorHistory(opp.tutor_history);
                chatBox.scrollTop = chatBox.scrollHeight;
            }
        } else {
            opp.tutor_history.pop(); // Remove user msg from DB intent, but it was not saved anyway
            if (skel) {
                skel.outerHTML = `<div class="retry-block" style="margin-top:16px;">
                    <span>Failed to generate response.</span>
                    <button onclick="app.sendTutorMessage('${oppId}')">Retry</button>
                </div>`;
            }
        }
    },
    
    // --- End Custom Dialog Logic ---
    
    toggleAddBusiness: () => {
        const modal = document.getElementById('add-business-backdrop');
        if (modal.style.display === 'flex') {
            modal.style.display = 'none';
        } else {
            modal.style.display = 'flex';
            document.getElementById('add-business-name').focus();
        }
    },
    
    createBusiness: async () => {
        const name = document.getElementById('add-business-name').value.trim();
        const industry = document.getElementById('add-business-industry').value.trim();
        const dm = document.getElementById('add-business-dm').value.trim();
        const phone = document.getElementById('add-business-phone').value.trim();
        const notes = document.getElementById('add-business-notes').value.trim();
        
        if (!name) {
            NF.UI.toast('Business name is required.');
            return;
        }
        
        const id = 'biz_' + Date.now();
        await NF.DB.put('businesses', {
            id,
            name,
            industry: industry || 'Unknown',
            decision_maker: dm || 'Unknown',
            phone: phone || '',
            notes: notes || '',
            key_contacts: dm ? [dm] : [],
            trust_level: 'Cold',
            communication_style: 'Direct',
            known_problems: [],
            objections: [],
            active_experiments: [],
            next_move: 'Needs Action'
        });
        
        document.getElementById('add-business-name').value = '';
        document.getElementById('add-business-dm').value = '';
        app.toggleAddBusiness();
        app.go('Business', id);
    },

    _speechRecognition: null,
    
    handleCaptureInput: async (e) => {
        const el = e.target;
        // Auto-expand up to ~6 lines (approx 140px depending on line-height)
        el.style.height = '40px';
        const newHeight = Math.min(el.scrollHeight, 140);
        el.style.height = newHeight + 'px';
        
        // Auto-save draft
        await NF.DB.putSetting('capture_draft', el.value);
    },
    
    toggleVoiceCapture: () => {
        if (!('webkitSpeechRecognition' in window)) {
            NF.UI.toast('Voice dictation not supported in this browser.');
            return;
        }
        
        const btn = document.getElementById('btn-mic');
        const input = document.getElementById('uc-input');
        
        if (app._speechRecognition) {
            app._speechRecognition.stop();
            return;
        }
        
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';
        
        let startVal = input.value;
        if (startVal && !startVal.endsWith(' ')) startVal += ' ';
        
        recognition.onstart = () => {
            btn.classList.add('mic-listening');
            app._speechRecognition = recognition;
        };
        
        recognition.onresult = (event) => {
            let interim = '';
            let final = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript;
                } else {
                    interim += event.results[i][0].transcript;
                }
            }
            input.value = startVal + final + interim;
            input.dispatchEvent(new Event('input')); // trigger auto-expand and save
            if (final) {
                startVal = input.value;
                if (!startVal.endsWith(' ')) startVal += ' ';
            }
        };
        
        recognition.onerror = (e) => {
            console.error('Speech recognition error', e);
            btn.classList.remove('mic-listening');
            app._speechRecognition = null;
        };
        
        recognition.onend = () => {
            btn.classList.remove('mic-listening');
            app._speechRecognition = null;
        };
        
        recognition.start();
    },

    toggleMoreMenu: () => {
        const modal = document.getElementById('mobnav-more');
        if (modal) {
            modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
        }
    },

    toggleUniversalCapture: async () => {
        const modal = document.getElementById('uc-backdrop');
        const input = document.getElementById('uc-input');
        
        if (modal.style.display === 'flex') {
            modal.style.display = 'none';
            if (app._speechRecognition) app._speechRecognition.stop();
        } else {
            modal.style.display = 'flex';
            
            // Hide mic if unsupported
            const btnMic = document.getElementById('btn-mic');
            if (btnMic && !('webkitSpeechRecognition' in window)) {
                btnMic.style.display = 'none';
            }
            
            const draft = await NF.DB.getSetting('capture_draft');
            if (draft) {
                input.value = draft;
                input.dispatchEvent(new Event('input'));
            } else if (!input.value) {
                input.style.height = '40px';
            }
            
            input.focus();
        }
    },
    
    captureObservation: async () => {
        const text = document.getElementById('uc-input').value.trim();
        if(!text) {
            app.toggleUniversalCapture();
            return;
        }
        
        document.getElementById('uc-input').value = '';
        await NF.DB.putSetting('capture_draft', '');
        app.toggleUniversalCapture();
        
        // Optimistic Save
        const obsId = await NF.DB.put('observations', {
            text: text,
            processed: false,
            created_at: Date.now()
        });
        
        app.render();
        
        let undoClicked = false;
        NF.UI.toast('Captured', {
            duration: 5000,
            action: {
                label: 'Undo',
                fn: async () => {
                    undoClicked = true;
                    await NF.DB.remove('observations', obsId);
                    app.render();
                }
            }
        });
        
        const hasGemini = await NF.DB.getSetting('gemini_api_key');
        if (!hasGemini) {
            // Local parsing fallback
            const stopWords = ['the','is','at','which','and','on','in','a','an','of','to','it','this','that','he','she','they','but','for','with','about','his','her','their'];
            const kw = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(' ').filter(w => w.length > 3 && !stopWords.includes(w));
            if (kw.length > 0) {
                const obs = await NF.DB.getAll('observations');
                for (let word of kw) {
                    let matches = obs.filter(o => o.text.toLowerCase().includes(word));
                    if (matches.length >= 2) {
                        let suffix = 'th';
                        if (matches.length === 2) suffix = 'nd';
                        if (matches.length === 3) suffix = 'rd';
                        if (!undoClicked) NF.UI.toast(`Captured. ${matches.length}${suffix} note mentioning "${word}" — this is becoming a pattern.`);
                        break;
                    }
                }
            }
        } else {
            // AI Parsing Background Task
            const businesses = await NF.DB.getAll('businesses');
            const bizList = businesses.map(b => `{ id: "${b.id}", name: "${b.name}" }`).join(', ');
            
            const prompt = `Act as an aggressive startup deal assessor. Process this raw field observation: "${text}".
            1. Is this just a passive observation OR a high-leverage immediate deal (like an upsell, strong pain point, massive inefficiency, or an explicit intent to pitch/sell)?
            2. If the user states they are going to pitch, sell, or take action, or if it implies an immediate high-value business opportunity, set type to "deal". Otherwise "passive".
            3. Clean up the text.
            4. If it mentions one of these businesses (${bizList}), return its EXACT id.
            5. If type="deal", provide a short, punchy deal_title and a specific next_action.
            
            Format as JSON exactly like: 
            {
              "type": "passive" | "deal",
              "cleaned_text": "...",
              "business_id": "id or null",
              "deal_title": "title or null",
              "next_action": "action or null"
            }`;
            
            const aiData = await app.generateJSON(prompt, { taskClass: 'capture' });
            
            if (aiData && !undoClicked) {
                // Verify the observation hasn't been deleted
                let currentObs = await NF.DB.get('observations', obsId);
                if (currentObs) {
                    if (aiData.cleaned_text) currentObs.text = aiData.cleaned_text;
                    let linkedBizId = null;
                    if (aiData.business_id && aiData.business_id !== 'null') {
                        linkedBizId = aiData.business_id;
                        currentObs.business_id = linkedBizId;
                    }
                    
                    if (aiData.type === 'deal' && aiData.deal_title) {
                        currentObs.processed = true;
                        await NF.DB.put('observations', currentObs);
                        
                        const newOpp = {
                            title: aiData.deal_title,
                            status: 'Validation',
                            next_action: aiData.next_action || 'Execute immediately',
                            exit_conditions: 'Deal fails to close',
                            observations: [currentObs.text],
                            evidence: [currentObs.text],
                            leverage: 8,
                            velocity: 8,
                            conviction: 8,
                            leverage_text: "High upside immediate deal detected by AI.",
                            velocity_text: "High velocity potential.",
                            conviction_text: "Strong initial signal from capture.",
                            calculated_score: 80,
                            created_at: Date.now()
                        };
                        if (linkedBizId) newOpp.business_id = linkedBizId;
                        const oppId = await NF.DB.put('opportunities', newOpp);
                        
                        app.render();
                        
                        // We replaced alert/confirm entirely, wait, if it's an instant deal, we show a toast with an action to open the playbook!
                        NF.UI.toast(`⚡ High-Leverage Deal Detected: ${aiData.deal_title}`, {
                            duration: 10000,
                            action: {
                                label: 'Open Playbook',
                                fn: () => app.go('Opportunity', oppId)
                            }
                        });
                    } else {
                        await NF.DB.put('observations', currentObs);
                        if (linkedBizId) {
                            const biz = await NF.DB.get('businesses', linkedBizId);
                            if (biz) NF.UI.toast(`Captured and auto-linked to dossier: ${biz.name}.`);
                        }
                    }
                }
            }
        }
        
        if (!undoClicked) {
            if (app._patternEngineTimer) clearTimeout(app._patternEngineTimer);
            app._patternEngineTimer = setTimeout(() => {
                app.runPatternEngine().then(async () => {
                    const container = document.getElementById('emerging-patterns-container');
                    if (container) container.innerHTML = await renderEmergingPatterns();
                });
            }, 8000);
        }
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
        const idx = LIFECYCLE.indexOf(opp.status);
        
        if (idx > -1 && idx < LIFECYCLE.length - 1) {
            const confirmed = await app.showDialog('confirm', 'Advance Stage', `Move to ${LIFECYCLE[idx+1]}? Have you met the exit conditions?`);
            if (confirmed) {
                opp.status = LIFECYCLE[idx+1];
                await NF.DB.put('opportunities', opp);
                app.render();
            }
        } else {
            NF.UI.toast(`This opportunity has reached maximum enterprise value (${LIFECYCLE[LIFECYCLE.length - 1]}).`);
        }
    },
    
    _swipeState: { startX: 0, currentX: 0, swiping: false, element: null },
    
    handleSwipeStart: (e) => {
        const touch = e.touches[0];
        app._swipeState.startX = touch.clientX;
        app._swipeState.currentX = touch.clientX;
        app._swipeState.swiping = true;
        app._swipeState.element = e.currentTarget;
        app._swipeState.element.style.transition = 'none';
    },
    
    handleSwipeMove: (e) => {
        if (!app._swipeState.swiping || !app._swipeState.element) return;
        const touch = e.touches[0];
        app._swipeState.currentX = touch.clientX;
        const deltaX = app._swipeState.currentX - app._swipeState.startX;
        
        if (Math.abs(deltaX) > 20) {
            // Prevent vertical scrolling while swiping
            if(e.cancelable) e.preventDefault();
        }
        
        app._swipeState.element.style.transform = `translateX(${deltaX}px)`;
        
        const parent = app._swipeState.element.parentElement;
        const bgAdvance = parent.querySelector('.swipe-bg-advance');
        const bgArchive = parent.querySelector('.swipe-bg-archive');
        if (deltaX > 0) {
            if(bgAdvance) bgAdvance.style.zIndex = 1;
            if(bgArchive) bgArchive.style.zIndex = 0;
        } else {
            if(bgArchive) bgArchive.style.zIndex = 1;
            if(bgAdvance) bgAdvance.style.zIndex = 0;
        }
    },
    
    handleSwipeEnd: (e, id) => {
        if (!app._swipeState.swiping || !app._swipeState.element) return;
        app._swipeState.swiping = false;
        
        const deltaX = app._swipeState.currentX - app._swipeState.startX;
        const el = app._swipeState.element;
        el.style.transition = 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
        
        const threshold = window.innerWidth * 0.3; // 30% of screen width
        
        if (deltaX > threshold) {
            el.style.transform = `translateX(100%)`;
            setTimeout(() => app.advanceStageSwipe(id), 200);
        } else if (deltaX < -threshold) {
            el.style.transform = `translateX(-100%)`;
            setTimeout(() => app.archiveOpportunitySwipe(id), 200);
        } else {
            el.style.transform = `translateX(0)`;
        }
        app._swipeState.element = null;
    },
    
    advanceStageSwipe: async (id) => {
        const opp = await NF.DB.get('opportunities', id);
        const idx = LIFECYCLE.indexOf(opp.status);
        if (idx > -1 && idx < LIFECYCLE.length - 1) {
            const oldStatus = opp.status;
            opp.status = LIFECYCLE[idx+1];
            await NF.DB.put('opportunities', opp);
            app.render();
            
            NF.UI.toast(`Advanced to ${opp.status}`, {
                duration: 5000,
                action: {
                    label: 'Undo',
                    fn: async () => {
                        opp.status = oldStatus;
                        await NF.DB.put('opportunities', opp);
                        app.render();
                    }
                }
            });
        } else {
            app.render();
        }
    },
    
    archiveOpportunitySwipe: async (id) => {
        const opp = await NF.DB.get('opportunities', id);
        if (opp.status === 'Archived') {
            app.render();
            return;
        }
        
        const oldStatus = opp.status;
        opp.status = 'Archived';
        opp.archive_reason = 'Archived via swipe gesture';
        await NF.DB.put('opportunities', opp);
        app.render();
        
        NF.UI.toast('Opportunity Archived', {
            duration: 5000,
            action: {
                label: 'Undo',
                fn: async () => {
                    opp.status = oldStatus;
                    opp.archive_reason = undefined;
                    await NF.DB.put('opportunities', opp);
                    app.render();
                }
            }
        });
        
        // Immediately pop the post-mortem
        app.showPostMortemDialog(id);
    },

    archiveOpportunity: async (id) => {
        const opp = await NF.DB.get('opportunities', id);
        opp.status = 'Archived';
        await NF.DB.put('opportunities', opp);
        app.render();
        
        app.showPostMortemDialog(id);
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
    
    draftOpportunityExit: async (title) => {
        const hasGemini = await NF.DB.getSetting('gemini_api_key');
        if (!hasGemini) {
            return {
                exit_conditions: '1. No validation in 14 days.\n2. Customer refuses to pay.',
                exit_deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                bias_flag: null
            };
        }
        
        const intel = await NF.DB.getSetting('founder_intel') || {};
        const biases = intel.biases && intel.biases.length > 0 ? intel.biases.join(', ') : '';
        const biasPromptPart = biases ? `\nThe founder has these known biases: [${biases}]. If this opportunity seems heavily influenced by these biases, provide a "bias_flag" string pointing it out. Otherwise, return null for bias_flag.` : '';
        
        NF.UI.toast('Drafting exit conditions via AI...');
        const prompt = `Draft exit conditions for this opportunity: "${title}".
We need ruthless kill discipline. Provide EXACTLY 2 highly-measurable exit conditions that, if met, mean we abandon the idea immediately. Also provide a resolve-by date (ISO format YYYY-MM-DD, typically 14-30 days from today).${biasPromptPart}
Output strictly valid JSON: {"exit_conditions": "1. ...\\n2. ...", "exit_deadline": "YYYY-MM-DD", "bias_flag": "Warning string or null"}`;
        
        const res = await app.generateJSON(prompt, { systemInstruction: "You are a ruthless strategist. Output raw JSON only.", taskClass: 'brief' });
        if (res && res.exit_conditions && res.exit_deadline) {
            return res;
        } else {
            return {
                exit_conditions: '1. No validation in 14 days.\n2. Customer refuses to pay.',
                exit_deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                bias_flag: null
            };
        }
    },
    
    resolvePrediction: async (oppId, predId, isRight) => {
        const opp = await NF.DB.get('opportunities', oppId);
        if (!opp) return;
        
        const pred = (opp.predictions || []).find(p => p.id === predId);
        if (!pred) return;
        
        pred.status = isRight ? 'right' : 'wrong';
        await NF.DB.put('opportunities', opp);
        
        let intel = await NF.DB.getSetting('founder_intel') || {};
        intel.prediction_stats = intel.prediction_stats || { right: 0, total: 0, accuracy: 0 };
        intel.prediction_stats.total += 1;
        if (isRight) intel.prediction_stats.right += 1;
        intel.prediction_stats.accuracy = Math.round((intel.prediction_stats.right / intel.prediction_stats.total) * 100);
        
        if (!isRight) {
            const lesson = await app.showDialog('prompt', 'Post-Mortem: Wrong Prediction', `Your prediction "${pred.statement}" was wrong. What is the fundamental lesson here?`);
            if (lesson) {
                intel.recent_lessons = intel.recent_lessons || [];
                intel.recent_lessons.unshift(lesson);
                if (intel.recent_lessons.length > 5) intel.recent_lessons.pop();
            }
        }
        
        await NF.DB.putSetting('founder_intel', intel);
        app.render();
    },
    
    logPrediction: (oppId) => {
        return new Promise(async (resolve) => {
            const opp = await NF.DB.get('opportunities', oppId);
            if (!opp) return resolve(false);
            
            const div = document.createElement('div');
            div.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:9999; display:flex; justify-content:center; align-items:center; padding:16px;';
            div.innerHTML = `
                <div style="background:var(--card); width:100%; max-width:500px; border-radius:12px; overflow:hidden; box-shadow:0 12px 32px rgba(0,0,0,0.2);">
                    <div style="padding:16px 24px; border-bottom:1px solid var(--line); font-weight:600; font-family:'JetBrains Mono',monospace;">Log a Prediction</div>
                    <div style="padding:24px;">
                        <label style="display:block; margin-bottom:4px; font-size:0.85rem; color:var(--ink-soft);">What do you predict will happen?</label>
                        <input id="pred-statement" type="text" class="input" placeholder="e.g. 5 customers will buy" style="margin-bottom:16px;"/>
                        
                        <label style="display:block; margin-bottom:4px; font-size:0.85rem; color:var(--ink-soft);">Confidence (50% - 99%)</label>
                        <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
                            <input id="pred-conf" type="range" min="50" max="99" value="75" style="flex:1;"/>
                            <span id="pred-conf-val" style="font-weight:600; font-family:monospace;">75%</span>
                        </div>
                        
                        <label style="display:block; margin-bottom:4px; font-size:0.85rem; color:var(--ink-soft);">Resolve-By Date</label>
                        <input id="pred-date" type="date" class="input" value="${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}" style="margin-bottom:24px;"/>
                        
                        <div style="display:flex; justify-content:flex-end; gap:12px;">
                            <button id="pred-cancel" class="btn btn--sm" style="border:none; color:var(--ink-soft);">Cancel</button>
                            <button id="pred-save" class="btn btn--primary btn--sm">Commit Prediction</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(div);
            
            document.getElementById('pred-conf').oninput = (e) => {
                document.getElementById('pred-conf-val').textContent = e.target.value + '%';
            };
            
            document.getElementById('pred-cancel').onclick = () => {
                document.body.removeChild(div);
                resolve(false);
            };
            document.getElementById('pred-save').onclick = async () => {
                const statement = document.getElementById('pred-statement').value.trim();
                const confidence = parseInt(document.getElementById('pred-conf').value);
                const resolve_date = document.getElementById('pred-date').value;
                if (!statement || !resolve_date) {
                    alert('Please fill out all fields.');
                    return;
                }
                
                opp.predictions = opp.predictions || [];
                opp.predictions.push({
                    id: 'pred_' + Date.now(),
                    statement: statement,
                    confidence: confidence,
                    resolve_date: resolve_date,
                    status: 'pending'
                });
                
                await NF.DB.put('opportunities', opp);
                document.body.removeChild(div);
                app.render();
                resolve(true);
            };
        });
    },

    showSpawnReviewDialog: (oppObj) => {
        return new Promise((resolve) => {
            const div = document.createElement('div');
            div.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:9999; display:flex; justify-content:center; align-items:center; padding:16px;';
            div.innerHTML = `
                <div style="background:var(--card); width:100%; max-width:500px; border-radius:12px; overflow:hidden; box-shadow:0 12px 32px rgba(0,0,0,0.2);">
                    <div style="padding:16px 24px; border-bottom:1px solid var(--line); font-weight:600; font-family:'JetBrains Mono',monospace;">Spawn Opportunity</div>
                    <div style="padding:24px;">
                        <label style="display:block; margin-bottom:4px; font-size:0.85rem; color:var(--ink-soft);">Title</label>
                        <input id="spawn-title" type="text" class="input" value="${app.escapeHtml(oppObj.title)}" style="margin-bottom:16px;"/>
                        
                        <label style="display:block; margin-bottom:4px; font-size:0.85rem; color:var(--ink-soft);">AI Drafted Exit Conditions</label>
                        <textarea id="spawn-exit" class="input" style="min-height:100px; margin-bottom:16px;">${app.escapeHtml(oppObj.exit_conditions)}</textarea>
                        
                        <label style="display:block; margin-bottom:4px; font-size:0.85rem; color:var(--ink-soft);">Resolve-By Date (Kill Date)</label>
                        <input id="spawn-date" type="date" class="input" value="${app.escapeHtml(oppObj.exit_deadline)}" style="margin-bottom:24px;"/>
                        
                        <div style="display:flex; justify-content:flex-end; gap:12px;">
                            <button id="spawn-cancel" class="btn btn--sm" style="border:none; color:var(--ink-soft);">Cancel</button>
                            <button id="spawn-save" class="btn btn--primary btn--sm">Commit & Spawn</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(div);
            
            document.getElementById('spawn-cancel').onclick = () => {
                document.body.removeChild(div);
                resolve(false);
            };
            document.getElementById('spawn-save').onclick = () => {
                oppObj.title = document.getElementById('spawn-title').value.trim();
                oppObj.exit_conditions = document.getElementById('spawn-exit').value.trim();
                oppObj.exit_deadline = document.getElementById('spawn-date').value;
                document.body.removeChild(div);
                resolve(true);
            };
        });
    },

    spawnHypothesis: async (patternId) => {
        const pattern = await NF.DB.get('patterns', patternId);
        const title = await app.showDialog('prompt', 'Spawn Hypothesis', 'What opportunity could solve this pattern?');
        if (!title) return;
        
        const draft = await app.draftOpportunityExit(title);
        
        const oppObj = {
            id: 'opp_' + Date.now(),
            title: title,
            leverage: 5,
            velocity: 5,
            conviction: 5,
            calculated_score: 50,
            status: 'Validation',
            next_action: 'Define specific target audience',
            exit_conditions: draft.exit_conditions,
            exit_deadline: draft.exit_deadline,
            evidence: [],
            observations: pattern.observation_ids || [],
            predictions: []
        };
        
        const confirmed = await app.showSpawnReviewDialog(oppObj);
        if (confirmed) {
            await NF.DB.put('opportunities', oppObj);
            
            const hasGemini = await NF.DB.getSetting('gemini_api_key');
            if (hasGemini) {
                app.runAIDiagnostics(oppObj.id).then(() => app.render());
            }
            
            app.go('Pipeline');
        }
    },
    spawnBusinessOpportunity: async (bizId) => {
        const title = await app.showDialog('prompt', 'Spawn Opportunity', 'What opportunity are you pursuing here?');
        if (!title) return;
        
        const draft = await app.draftOpportunityExit(title);
        
        const oppObj = {
            id: 'opp_' + Date.now(),
            title: title,
            leverage: 5,
            velocity: 5,
            conviction: 5,
            calculated_score: computeScore(5, 5, 5),
            score_source: 'fallback',
            status: LIFECYCLE[0],
            next_action: 'Define specific target audience',
            exit_conditions: draft.exit_conditions,
            exit_deadline: draft.exit_deadline,
            bias_flag: draft.bias_flag || null,
            evidence: [],
            observations: [],
            business_id: bizId,
            predictions: []
        };
        
        const confirmed = await app.showSpawnReviewDialog(oppObj);
        if (confirmed) {
            await NF.DB.put('opportunities', oppObj);
            
            const hasGemini = await NF.DB.getSetting('gemini_api_key');
            if (hasGemini) {
                app.runAIDiagnostics(oppObj.id).then(() => app.render());
            }
            
            app.go('Opportunity', oppObj.id);
        }
    },
    // --- INTERACTIVE SIMULATOR ---
    _tourState: { step: 0, active: false },
    
    startSimulator: async () => {
        // Switch to isolated demo database so real data is never touched
        await NF.DB.switchDatabase('NorthFieldOS_Demo');
        
        // Wipe Demo Data to start fresh
        const stores = ['observations', 'patterns', 'opportunities', 'businesses', 'settings'];
        const db = await NF.DB.init();
        const tx = db.transaction(stores, 'readwrite');
        stores.forEach(s => tx.objectStore(s).clear());
        
        // Wait for wipe to finish
        await new Promise(r => {
            tx.oncomplete = () => r();
            tx.onerror = () => r();
        });
        
        app._tourState.step = 0;
        app._tourState.active = true;
        app.go('Morning');
        document.getElementById('tour-backdrop').style.display = 'flex';
        app.nextTourStep();
    },
    
    endSimulator: async () => {
        app._tourState.active = false;
        document.getElementById('tour-backdrop').style.display = 'none';
        
        // Restore real user data
        await NF.DB.switchDatabase('NorthFieldOS');
        app.go('Morning');
    },
    
    typewriterEffect: async (el, text, delay=20) => {
        el.value = '';
        for (let i = 0; i < text.length; i++) {
            el.value += text.charAt(i);
            await new Promise(r => setTimeout(r, delay));
        }
    },
    
    nextTourStep: async () => {
        if (!app._tourState.active) return;
        app._tourState.step++;
        const step = app._tourState.step;
        const titleEl = document.getElementById('tour-step-title');
        const descEl = document.getElementById('tour-step-desc');
        const btnNext = document.getElementById('tour-btn-next');
        
        btnNext.disabled = true;
        btnNext.textContent = 'Executing...';
        
        if (step === 1) {
            titleEl.textContent = 'Step 1: Universal Capture';
            descEl.textContent = 'As a founder, your job is to observe. We capture raw field intelligence without breaking context. Let\'s simulate pressing `/` to log an observation.';
            await new Promise(r => setTimeout(r, 1000));
            
            // Programmatically open capture
            const modal = document.getElementById('uc-backdrop');
            modal.style.display = 'flex';
            const input = document.getElementById('uc-input');
            input.focus();
            
            await app.typewriterEffect(input, "Arthur mentioned his current logistics supplier is totally failing him on next-day delivery. It's bottlenecking his restaurants.");
            
            btnNext.disabled = false;
            btnNext.textContent = 'Next';
            
        } else if (step === 2) {
            // Save observation
            const now = Date.now();
            const text = document.getElementById('uc-input').value;
            await NF.DB.put('observations', { id: 'obs_1', text, processed: true, linked_pattern_id: 'demo_pat_1', created_at: now });
            document.getElementById('uc-input').value = '';
            document.getElementById('uc-backdrop').style.display = 'none';
            
            titleEl.textContent = 'Step 2: The Pattern Engine & Momentum';
            descEl.textContent = 'The AI runs silently in the background, clustering observations by semantic meaning and tracking momentum across time. Notice the "Operational Bottlenecks" pattern here showing velocity.';
            
            // Inject another fake observation to trigger cluster
            await NF.DB.put('observations', { id: 'obs_2', text: 'Another restaurant owner complained about logistics yesterday.', processed: true, linked_pattern_id: 'demo_pat_1', created_at: now - (86400000 * 2) });
            await NF.DB.put('observations', { id: 'obs_3', text: 'Logistics margin squeeze is everywhere right now.', processed: true, linked_pattern_id: 'demo_pat_1', created_at: now - (86400000 * 5) });
            await NF.DB.put('observations', { id: 'obs_4', text: 'Delivery delays are killing restaurant retention.', processed: true, linked_pattern_id: 'demo_pat_1', created_at: now - (86400000 * 12) });
            await NF.DB.put('observations', { id: 'obs_5', text: 'Spoke to a chef. Supply chain is their #1 pain point.', processed: true, linked_pattern_id: 'demo_pat_1', created_at: now - (86400000 * 14) });
            
            // Inject Pattern deterministically
            await NF.DB.put('patterns', {
                id: 'demo_pat_1',
                title: 'Pattern: Operational Bottlenecks',
                status: 'Emerging',
                observation_ids: ['obs_1', 'obs_2', 'obs_3', 'obs_4', 'obs_5'] // Link them for the UI to calculate momentum
            });
            
            app.go('Morning');
            
            btnNext.disabled = false;
            btnNext.textContent = 'Next';
            
        } else if (step === 3) {
            titleEl.textContent = 'Step 3: Spawn Hypothesis';
            descEl.textContent = 'When a Pattern shows promise, you spawn a Hypothesis. This moves the idea from passive observation to active execution. Let\'s spawn a Hypothesis and look at the Map.';
            
            // Inject Opportunity
            await NF.DB.put('opportunities', {
                id: 'demo_opp_1',
                title: 'B2B Restaurant Logistics SaaS',
                leverage: 9, velocity: 8, conviction: 7, calculated_score: 85,
                status: 'Validation',
                next_action: 'Pitch Arthur a lightweight logistics router pilot',
                exit_conditions: 'Kill if Arthur refuses a free pilot',
                evidence: [],
                observations: []
            });
            
            app.go('Pipeline');
            
            btnNext.disabled = false;
            btnNext.textContent = 'Next';
            
        } else if (step === 4) {
            titleEl.textContent = 'Step 4: Compounding Timeline';
            descEl.textContent = 'This is where execution happens. Notice the Compounding Timeline at the top. Every Opportunity requires a strict Next Action and Exit Condition. You never passively hold ideas.';
            
            app.go('Opportunity', 'demo_opp_1');
            
            btnNext.disabled = false;
            btnNext.textContent = 'Next';
            
        } else if (step === 5) {
            titleEl.textContent = 'Step 5: Execution & The Graveyard';
            descEl.textContent = 'As you execute, you advance the stage. If it fails, the "Send to Graveyard" button forces a post-mortem to extract the core lesson, silently calibrating your Founder Intel.';
            
            // Advance stage deterministically
            const opp = await NF.DB.get('opportunities', 'demo_opp_1');
            opp.status = 'First Sale';
            await NF.DB.put('opportunities', opp);
            
            app.go('Opportunity', 'demo_opp_1'); // re-render
            
            btnNext.disabled = false;
            btnNext.textContent = 'Next';

        } else if (step === 6) {
            titleEl.textContent = 'Step 6: The Intelligence Web';
            descEl.textContent = 'If a Hypothesis survives, it matures into a Business. Dossiers strictly answer 4 questions: Who are they? What do we know? What are the opportunities? What is the Next Move?';
            
            // Inject Business
            await NF.DB.put('businesses', {
                id: 'demo_biz_1',
                name: "Arthur's Restaurants",
                decision_maker: 'Arthur Shelby',
                trust_level: 'High',
                known_problems: ['Logistics failing next-day delivery', 'High margin squeeze'],
                active_experiments: ['Pitched lightweight router pilot'],
                next_move: 'Close the pilot contract this Friday',
                key_contacts: ['Arthur Shelby (CEO)', 'Linda (Ops Manager)'],
                objections: ['Too complex to switch providers'],
                communication_style: 'Direct, impatient, wants bottom-line numbers.'
            });
            
            app.go('BusinessDetail', 'demo_biz_1');
            
            btnNext.disabled = false;
            btnNext.textContent = 'Finish Tour';
            
        } else {
            app.endSimulator();
        }
    },
    
    deleteItem: async (storeName, id) => {
        const confirm = await app.showDialog('confirm', 'Confirm Deletion', 'Are you sure you want to permanently delete this item?');
        if (confirm) {
            await NF.DB.remove(storeName, id);
            app.render();
        }
    },
    
    clearAllData: async () => {
        const confirm = await app.showDialog('confirm', 'Wipe Database', 'Are you ABSOLUTELY sure? This will delete all observations, opportunities, and patterns. Your API key will be saved.');
        if (confirm) {
            await NF.DB.nukeDatabase();
            NF.UI.toast('All field data has been deleted.');
            app.go('Morning');
        }
    }
};

window.addEventListener('DOMContentLoaded', async () => {
    try {
        await NF.DB.init();
        
        // Handle share_target and PWA shortcuts
        const urlParams = new URLSearchParams(window.location.search);
        let sharedText = urlParams.get('text') || '';
        let sharedTitle = urlParams.get('title') || '';
        let sharedUrl = urlParams.get('url') || '';
        let isCaptureShortcut = urlParams.get('capture') === '1';
        
        let combinedShare = [sharedTitle, sharedText, sharedUrl].filter(Boolean).join('\n\n');
        
        if (combinedShare) {
            // Overwrite draft if we received a share
            await NF.DB.putSetting('capture_draft', combinedShare);
        }
        
        app.render();
        
        if (combinedShare || isCaptureShortcut) {
            // Clean URL so refresh doesn't duplicate
            window.history.replaceState({}, document.title, window.location.pathname);
            app.toggleUniversalCapture();
        }
        
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

