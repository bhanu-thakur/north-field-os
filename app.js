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
    const allObs = await NF.DB.getAll('observations');
    
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
                <div class="crumb">System / Morning Briefing</div>
                <h1 class="ptitle" style="margin-bottom:8px;">Good Morning.</h1>
                
                <div style="padding:16px 20px; background:rgba(0,0,0,0.02); border-radius:12px; margin-bottom:32px; font-family:'Fraunces',serif; font-size:1.1rem; color:var(--ink); border-left:4px solid var(--ink-faint);">
                    ${mentorMessage}
                </div>
                
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
    
    const res = await NF.AI.generateContent(prompt);
    if (!res) return null;
    
    let htmlRes = res.replace(/```html/gi, '').replace(/```/g, '').trim();
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
                    <p style="font-size:1.1rem; color:var(--ink); line-height:1.5; margin-bottom:12px;">${o.text}</p>
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
                const isArchived = o.status === 'Archived';
                html += `
                    <div class="card" style="margin-bottom:8px; padding:12px 16px; display:flex; justify-content:space-between; align-items:center; opacity:${isArchived ? '0.6' : '1'};">
                        <div style="cursor:pointer; flex:1;" onclick="app.go('Opportunity', '${o.id}')">
                            <div style="font-weight:600; color:var(--ink); ${isArchived ? 'text-decoration:line-through;' : ''}">${o.title}</div>
                            <div style="font-size:0.85rem; color:var(--ink-soft); margin-top:4px;">Stage: ${o.status}</div>
                        </div>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div class="pill ${isArchived ? '' : 'pill--brand'}">Score: ${o.calculated_score}</div>
                            <button class="btn btn--sm" style="border:none; padding:4px 8px; color:#c92a2a; background:transparent;" onclick="app.deleteItem('opportunities', '${o.id}')">Delete</button>
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        }
    });

    const standaloneOpps = opps.filter(o => {
        return !patterns.some(p => p.observation_ids && o.observations && o.observations.some(obsId => p.observation_ids.includes(obsId)));
    });
    
    if (standaloneOpps.length > 0) {
        html += `<h3 style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-faint); margin-bottom:12px; margin-top:24px; padding-left:8px; border-left:2px solid var(--primary);">Standalone Opportunities</h3>`;
        html += `<div style="padding-left:12px; margin-bottom:24px;">`;
        
        standaloneOpps.sort((a,b) => b.calculated_score - a.calculated_score).forEach(o => {
            const isArchived = o.status === 'Archived';
            html += `
                <div class="card" style="margin-bottom:8px; padding:12px 16px; display:flex; justify-content:space-between; align-items:center; opacity:${isArchived ? '0.6' : '1'};">
                    <div style="cursor:pointer; flex:1;" onclick="app.go('Opportunity', '${o.id}')">
                        <div style="font-weight:600; color:var(--ink); ${isArchived ? 'text-decoration:line-through;' : ''}">${o.title}</div>
                        <div style="font-size:0.85rem; color:var(--ink-soft); margin-top:4px;">Stage: ${o.status}</div>
                    </div>
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div class="pill ${isArchived ? '' : 'pill--brand'}">Score: ${o.calculated_score}</div>
                        <button class="btn btn--sm" style="border:none; padding:4px 8px; color:#c92a2a; background:transparent;" onclick="app.deleteItem('opportunities', '${o.id}')">Delete</button>
                    </div>
                </div>
            `;
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
            ${m.text.replace(/\n/g, '<br>')}
        </div>
    `).join('');
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
                        ${!isArchived ? `<button class="btn btn--primary btn--sm" onclick="app.toggleTutor()"><svg class="ic" style="margin-right:6px;"><use href="#i-spark"/></svg> AI Tutor</button>` : ''}
                        ${!isArchived ? `<button class="btn btn--sm" onclick="app.advanceStage('${opp.id}')">Advance Stage <svg class="ic"><use href="#i-arrow"/></svg></button>` : ''}
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
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                                <h3 style="font-size:1rem; margin:0;">AI Scoring Engine (V4)</h3>
                                ${!isArchived ? `<button class="btn btn--sm" id="btn-run-diagnostics" onclick="app.runAIDiagnostics('${opp.id}')"><svg class="ic" style="margin-right:4px;"><use href="#i-spark"/></svg> Run Diagnostics</button>` : ''}
                            </div>
                            <div class="minigrid" style="--m: 3;">
                                <div class="cell">
                                    <div class="t">Leverage</div>
                                    <div class="v">${opp.leverage || 0}/10</div>
                                    <div style="font-size:0.75rem; color:var(--ink-soft); margin-top:6px; line-height:1.4;">${opp.leverage_text || `Driven by ${(opp.observations||[]).length} converging observations in this sector.`}</div>
                                </div>
                                <div class="cell">
                                    <div class="t">Velocity</div>
                                    <div class="v">${opp.velocity || 0}/10</div>
                                    <div style="font-size:0.75rem; color:var(--ink-soft); margin-top:6px; line-height:1.4;">${opp.velocity_text || `Velocity constrained. Requires a direct validation test to unlock.`}</div>
                                </div>
                                <div class="cell">
                                    <div class="t">Conviction</div>
                                    <div class="v">${opp.conviction || 0}/10</div>
                                    <div style="font-size:0.75rem; color:var(--ink-soft); margin-top:6px; line-height:1.4;">${opp.conviction_text || `Medium conviction. Data is strong but lacks first-sale proof.`}</div>
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
                    <div>
                        <h1 class="ptitle">${biz.name}</h1>
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

const renderSettings = async () => {
    const apiKey = await NF.DB.getSetting('gemini_api_key', '');
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
                    
                    <label style="display:block; font-size:0.85rem; font-weight:600; margin-bottom:8px;">Gemini API Key</label>
                    <input type="password" id="setting-api-key" value="${apiKey}" class="input" style="width:100%; max-width:400px; margin-bottom:16px;" placeholder="AIzaSy...">
                    
                    <div>
                        <button class="btn btn--primary" onclick="app.saveSettings()">Save Settings</button>
                        <button class="btn btn--sm" style="margin-left:8px;" onclick="app.testAPIConnection()"><svg class="ic" style="margin-right:4px;"><use href="#i-spark"/></svg> Test Connection</button>
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
        await NF.DB.setSetting('gemini_api_key', apiKey);
        app.showDialog('alert', 'Settings Saved', 'API Key has been securely saved to local storage.');
    },
    testAPIConnection: async () => {
        const apiKey = await NF.DB.getSetting('gemini_api_key');
        if (!apiKey) {
            return app.showDialog('alert', 'Error', 'Please save an API key first.');
        }
        app.showDialog('alert', 'Testing...', 'Sending a test ping to Gemini API...');
        const res = await NF.AI.generateContent("Reply with the word 'SUCCESS' if you receive this message.");
        if (res && res.includes('SUCCESS')) {
            app.showDialog('alert', 'Connection Successful', 'The Gemini API is working perfectly.');
        } else {
            app.showDialog('alert', 'Connection Failed', 'Failed to connect. Please verify your API key and internet connection.');
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

            let res = await NF.AI.generateContent(prompt, { systemInstruction: "You are a ruthless business strategist. Output valid raw JSON only.", maxOutputTokens: 1000 });
            if (res) {
                try {
                    let text = res.replace(/```json/g, '').replace(/```/g, '').trim();
                    let clusters = JSON.parse(text);
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
                } catch(e) { console.error('Gemini parse error in Pattern Engine', e); }
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
            app.showDialog('alert', 'API Key Required', 'Please configure your Gemini API Key in Settings to generate an AI Prep Brief.');
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
        
        const res = await NF.AI.generateContent(prompt);
        if (res) {
            let htmlRes = res.replace(/```html/gi, '').replace(/```/g, '').trim();
            container.innerHTML = `
                <div class="card" style="border:1px solid var(--primary-soft); background:var(--card); border-left:4px solid var(--primary);">
                    <h3 style="font-size:1.1rem; color:var(--primary); margin-bottom:12px;">AI Executive Brief</h3>
                    <div style="font-size:0.95rem; color:var(--ink); line-height:1.5;">${htmlRes}</div>
                </div>
            `;
        } else {
            app.showDialog('alert', 'Generation Failed', 'Could not generate brief. Please verify your API key and connection.');
        }
        
        if (btn) btn.innerHTML = '<svg class="ic" style="margin-right:6px;"><use href="#i-spark"/></svg> Prep Brief';
    },
    runAIDiagnostics: async (oppId) => {
        const btn = document.getElementById('btn-run-diagnostics');
        const hasGemini = await NF.DB.getSetting('gemini_api_key');
        
        if (!hasGemini) {
            app.showDialog('alert', 'API Key Required', 'Please configure your Gemini API Key in Settings to run AI Diagnostics.');
            return;
        }
        
        if (btn) btn.innerHTML = 'Diagnosing...';
        
        const opp = await NF.DB.get('opportunities', oppId);
        
        const prompt = `Act as a ruthless startup advisor. Evaluate this opportunity and score it strictly from 1 to 10 for Leverage, Velocity, and Conviction.
        Leverage: High upside, low relative effort?
        Velocity: Can we move fast, or are we blocked?
        Conviction: Is the evidence strong?
        
        Opportunity: ${opp.title}
        Status: ${opp.status}
        Next Action: ${opp.next_action}
        Exit Conditions: ${opp.exit_conditions}
        Observations Count: ${(opp.observations||[]).length}
        
        You MUST return ONLY a raw JSON object in this exact format (no markdown, no backticks, no other text):
        {
          "leverage": 8,
          "leverage_text": "High upside due to...",
          "velocity": 4,
          "velocity_text": "Blocked by...",
          "conviction": 6,
          "conviction_text": "Evidence suggests..."
        }
        `;
        
        const res = await NF.AI.generateContent(prompt);
        if (res) {
            try {
                const cleaned = res.replace(/```json/gi, '').replace(/```/g, '').trim();
                const scores = JSON.parse(cleaned);
                opp.leverage = scores.leverage;
                opp.leverage_text = scores.leverage_text;
                opp.velocity = scores.velocity;
                opp.velocity_text = scores.velocity_text;
                opp.conviction = scores.conviction;
                opp.conviction_text = scores.conviction_text;
                
                // Recalculate score
                opp.calculated_score = Math.round(((opp.leverage * 0.5) + (opp.velocity * 0.3) + (opp.conviction * 0.2)) * 10);
                
                await NF.DB.put('opportunities', opp);
                app.render();
            } catch (e) {
                console.error("Failed to parse AI diagnostics:", e);
                app.showDialog('alert', 'Error', 'Failed to parse AI response. Please try again.');
            }
        } else {
            app.showDialog('alert', 'Error', 'Failed to generate diagnostics. Check API key.');
        }
        
        if (btn) btn.innerHTML = '<svg class="ic" style="margin-right:4px;"><use href="#i-spark"/></svg> Run Diagnostics';
    },
    runBoardAnalysis: async (oppId) => {
        const btn = document.getElementById('btn-convene-board');
        const hasGemini = await NF.DB.getSetting('gemini_api_key');
        if (!hasGemini) return app.showDialog('alert', 'API Key Required', 'Please configure your Gemini API Key to convene the board.');
        if (btn) btn.innerHTML = 'Convening Board...';
        const opp = await NF.DB.get('opportunities', oppId);
        const prompt = `Act as a Virtual Board of Directors for this startup opportunity. Evaluate it from four distinct personas:
        CEO: Focuses on vision, macro-market fit, and existential risk. Is this a big enough problem?
        CFO: Focuses on unit economics, monetization, and margin. How do we make money?
        CTO: Focuses on technical feasibility, building, and architecture. How hard is this to execute?
        CPO: Focuses on user experience, product mechanics, and customer love. How do we make them love it?
        
        Opportunity: ${opp.title}
        Next Action: ${opp.next_action}
        Observations: ${opp.observations.join(', ')}
        
        Return ONLY a raw JSON object exactly in this format:
        {
          "ceo": "CEO's brutally honest 2-sentence take.",
          "cfo": "CFO's brutally honest 2-sentence take.",
          "cto": "CTO's brutally honest 2-sentence take.",
          "cpo": "CPO's brutally honest 2-sentence take."
        }`;
        
        const res = await NF.AI.generateContent(prompt, { maxOutputTokens: 800 });
        if (res) {
            try {
                const cleaned = res.replace(/```json/gi, '').replace(/```/g, '').trim();
                let match = cleaned.match(/\{[\s\S]*\}/);
                const board = JSON.parse(match ? match[0] : cleaned);
                opp.board_analysis = board;
                await NF.DB.put('opportunities', opp);
                app.render();
            } catch (e) {
                app.showDialog('alert', 'Error', 'Failed to parse Board Analysis.');
            }
        } else {
            app.showDialog('alert', 'Error', 'Failed to generate Board Analysis. Check API key.');
        }
        if (btn) btn.innerHTML = '<svg class="ic" style="margin-right:4px;"><use href="#i-users"/></svg> Convene Board';
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
            app.showDialog('alert', 'File Attached', `${file.name} is ready to be sent with your next message.`);
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
        chatBox.scrollTop = chatBox.scrollHeight;
        
        const sysPrompt = `Act as an elite business mentor. STRICT CONSTRAINT: You must ONLY teach non-technical business skills (strategy, sales, operations, marketing, negotiation). Refuse to teach technical hard skills like video editing, coding, or engineering. If asked for technical skills, pivot back to how to SELL or OPERATE a business around those skills. Be highly actionable and concise.`;
        const historyText = opp.tutor_history.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n\n');
        const prompt = `Opportunity Context: "${opp.title}" (Stage: ${opp.status})\n\nConversation History:\n${historyText}\n\nAI (Respond concisely):`;
        
        const res = await NF.AI.generateContent(prompt, { systemInstruction: sysPrompt, maxOutputTokens: 600 });
        if (res) {
            opp.tutor_history.push({ role: 'ai', text: res });
            await NF.DB.put('opportunities', opp);
            const updatedChatBox = document.getElementById('tutor-chat');
            if (updatedChatBox) {
                updatedChatBox.innerHTML = renderTutorHistory(opp.tutor_history);
                updatedChatBox.scrollTop = updatedChatBox.scrollHeight;
            }
        } else {
            app.showDialog('alert', 'Error', 'Failed to generate response. Check your API key.');
            opp.tutor_history.pop();
        }
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
        
        document.getElementById('uc-input').value = '';
        app.toggleUniversalCapture();
        
        const hasGemini = await NF.DB.getSetting('gemini_api_key');
        let linkedBizId = null;
        let finalNote = text;
        let signalMsg = 'Observation silently logged to Pattern Engine.';
        let isInstantDeal = false;
        
        if (hasGemini) {
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
            }
            `;
            
            const res = await NF.AI.generateContent(prompt, { maxOutputTokens: 600 });
            if (res) {
                try {
                    let cleaned = res.replace(/```json/gi, '').replace(/```/g, '').trim();
                    let match = cleaned.match(/\{[\s\S]*\}/);
                    if (match) cleaned = match[0];
                    
                    const aiData = JSON.parse(cleaned);
                    
                    if (aiData.cleaned_text) finalNote = aiData.cleaned_text;
                    if (aiData.business_id && aiData.business_id !== 'null') {
                        linkedBizId = aiData.business_id;
                    }
                    
                    if (aiData.type === 'deal' && aiData.deal_title) {
                        isInstantDeal = true;
                        // Instant Opportunity Generation
                        const newOpp = {
                            title: aiData.deal_title,
                            status: 'Validation',
                            next_action: aiData.next_action || 'Execute immediately',
                            exit_conditions: 'Deal fails to close',
                            observations: [finalNote],
                            evidence: [finalNote],
                            leverage: 8,
                            velocity: 8,
                            conviction: 8,
                            leverage_text: "High upside immediate deal detected by AI.",
                            velocity_text: "High velocity potential.",
                            conviction_text: "Strong initial signal from capture.",
                            calculated_score: 80,
                            created_at: Date.now()
                        };
                        const oppId = await NF.DB.put('opportunities', newOpp);
                        
                        // Always save observation too
                        const newObs = {
                            text: finalNote,
                            processed: true,
                            created_at: Date.now()
                        };
                        if (linkedBizId) newObs.business_id = linkedBizId;
                        await NF.DB.put('observations', newObs);
                        
                        app.render();
                        
                        const goNow = await app.showDialog('confirm', '⚡ High-Leverage Deal Detected', `AI mapped an immediate opportunity from your note:\n\n"${aiData.deal_title}"\n\nGo to Execution Playbook now?`);
                        if (goNow) {
                            app.go('Opportunity', oppId);
                        }
                        return;
                    }
                } catch(e) { console.error("Capture AI JSON parse error", e); }
            }
        }
        
        if (!isInstantDeal) {
            const newObs = {
                text: finalNote,
                processed: false,
                created_at: Date.now()
            };
            if (linkedBizId) newObs.business_id = linkedBizId;
            
            await NF.DB.put('observations', newObs);
            
            if (linkedBizId) {
                const biz = await NF.DB.get('businesses', linkedBizId);
                if (biz) signalMsg = `Captured and auto-linked to dossier: ${biz.name}.`;
            } else if (!hasGemini) {
                // Dynamic "This Mattered" Signal
                const stopWords = ['the','is','at','which','and','on','in','a','an','of','to','it','this','that','he','she','they','but','for','with','about','his','her','their'];
                const kw = finalNote.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(' ').filter(w => w.length > 3 && !stopWords.includes(w));
                
                if (kw.length > 0) {
                    const obs = await NF.DB.getAll('observations');
                    for (let word of kw) {
                        let matches = obs.filter(o => o.text.toLowerCase().includes(word));
                        if (matches.length >= 2) {
                            let suffix = 'th';
                            if (matches.length === 2) suffix = 'nd';
                            if (matches.length === 3) suffix = 'rd';
                            signalMsg = `Captured. ${matches.length}${suffix} note mentioning "${word}" — this is becoming a pattern.`;
                            break;
                        }
                    }
                }
            }
            
            app.showDialog('alert', 'Saved', signalMsg);
            app.render();
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
        const reason = await app.showDialog('prompt', 'Graveyard: Why did this fail? (Rant freely)');
        if (!reason) return;
        
        let predicted = 'Unknown';
        let lesson = 'Unknown';
        
        const hasGemini = await NF.DB.getSetting('gemini_api_key');
        if (hasGemini) {
            // Briefly show a processing dialog or just rely on the slight delay
            // We will just wait. The UI will pause.
            const prompt = `Act as a brutal startup coach. The founder just killed an opportunity for this reason: "${reason}".
            Extract the core failure mode and lesson.
            Format as JSON: {"predicted_vs_actual": "Short analysis of what they thought would happen vs reality", "lesson": "The core mental model to take away"}`;
            
            const res = await NF.AI.generateContent(prompt);
            if (res) {
                try {
                    const cleaned = res.replace(/```json/gi, '').replace(/```/g, '').trim();
                    const aiData = JSON.parse(cleaned);
                    predicted = aiData.predicted_vs_actual || 'Unknown';
                    lesson = aiData.lesson || 'Unknown';
                } catch(e) { console.error("Failed to parse AI post-mortem:", e); }
            }
        } 
        
        if (!hasGemini || lesson === 'Unknown') {
            predicted = await app.showDialog('prompt', 'Graveyard: What did you predict vs what actually happened?');
            lesson = await app.showDialog('prompt', 'Graveyard: What is the core lesson to extract?');
        }
        
        opp.status = 'Archived';
        opp.archive_reason = reason;
        opp.predicted_vs_actual = predicted || 'Unknown';
        opp.lessons_learned = lesson || 'Unknown';
        
        await NF.DB.put('opportunities', opp);
        
        // Update founder intel with a lesson silently
        let intel = await NF.DB.getSetting('founder_intel');
        if (!intel) intel = { recent_lessons: [], prediction_accuracy: 50 };
        if (lesson && lesson !== 'Unknown') {
            if (!intel.recent_lessons) intel.recent_lessons = [];
            intel.recent_lessons.unshift(lesson);
            if(intel.recent_lessons.length > 10) intel.recent_lessons.pop();
            await NF.DB.setSetting('founder_intel', intel);
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
    },    spawnHypothesis: async (patternId) => {
        const pattern = await NF.DB.get('patterns', patternId);
        const title = await app.showDialog('prompt', 'Spawn Hypothesis', 'What opportunity could solve this pattern?');
        if (!title) return;
        
        // Mock AI Scoring for V4 variables
        await NF.DB.put('opportunities', {
            title: title,
            leverage: Math.floor(Math.random() * 5) + 5,
            velocity: Math.floor(Math.random() * 5) + 5,
            conviction: Math.floor(Math.random() * 5) + 5,
            calculated_score: Math.floor(Math.random() * 40) + 60,
            status: 'Validation',
            next_action: 'Define specific target audience',
            exit_conditions: 'Kill if no validation in 14 days',
            evidence: [],
            observations: pattern.observation_ids || []
        });
        app.go('Pipeline');
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
            app.showDialog('alert', 'Database Wiped', 'All field data has been deleted.');
            app.go('Morning');
        }
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
