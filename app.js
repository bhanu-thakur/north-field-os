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
const STAGE_GATES = {
    'Validation': ['Have you spoken to 5 potential customers?', 'Is the problem urgent?', 'Is there a clear acquisition channel?'],
    'First Sale': ['Is the pricing model defined?', 'Is the MVP ready to deliver value?', 'Do you have a signed contract/payment?'],
    'Delivery': ['Was the service/product delivered successfully?', 'Did the customer express satisfaction?', 'Is the process repeatable?'],
    'SOP': ['Is the entire workflow documented?', 'Are edge cases covered?', 'Can a stranger execute this blindly?'],
    'Operator': ['Is the operator hired?', 'Are they hitting the KPI targets?', 'Is your time freed up by >80%?'],
    'Automation': ['Can software replace 50% of the manual labor?', 'Is the data structured?', 'Is the ROI on automation > 5x?'],
    'Software': ['Is the code stable?', 'Can it scale?', 'Is there a moat?']
};
const computeScore = (leverage, velocity, conviction) => Math.round(((leverage * 0.5) + (velocity * 0.3) + (conviction * 0.2)) * 10);

const renderSidebar = (pendingJobsCount = 0) => {
    return `
        <aside class="side">
            <a href="#" class="brand">
                <div class="mark" style="background:#111;"><svg class="ic" style="color:#fff;"><use href="#i-compass"/></svg></div>
                <div class="bt">Dhaula<small>V4 Engine</small></div>
            </a>
            <div class="seek" onclick="app.openOmniSearch()">
                <svg class="ic"><use href="#i-search"/></svg>
                <span>Universal Command</span>
                <kbd>Ctrl+K</kbd>
            </div>
            
            <div class="navgroup">Execution</div>
            <a class="navlink ${NF.State.context === 'Morning' ? 'active' : ''}" onclick="app.go('Morning')"><svg class="ic"><use href="#i-home"/></svg> Morning Briefing</a>
            <a class="navlink ${NF.State.context === 'Discovery' ? 'active' : ''}" onclick="app.go('Discovery')"><svg class="ic"><use href="#i-bulb"/></svg> Discovery Feed</a>
            <a class="navlink ${NF.State.context === 'Pipeline' || NF.State.context === 'Opportunity' ? 'active' : ''}" onclick="app.go('Pipeline')"><svg class="ic"><use href="#i-target"/></svg> Opportunity Map</a>
            
            <div class="navgroup">Compounding</div>
            <a class="navlink ${NF.State.context === 'Territories' || NF.State.context === 'TerritoryDetail' ? 'active' : ''}" onclick="app.go('Territories')"><svg class="ic"><use href="#i-stack"/></svg> Territories</a>
            <a class="navlink ${NF.State.context === 'Businesses' ? 'active' : ''}" onclick="app.go('Businesses')"><svg class="ic"><use href="#i-building"/></svg> Business Evidence</a>
            
            <div class="navgroup" style="margin-top:24px;">System</div>
            <a class="navlink ${NF.State.context === 'People' ? 'active' : ''}" onclick="app.go('People')"><svg class="ic"><use href="#i-people"/></svg> Network</a>
            <a class="navlink ${NF.State.context === 'Settings' ? 'active' : ''}" onclick="app.go('Settings')">
                <svg class="ic"><use href="#i-target"/></svg> Settings & AI
                ${pendingJobsCount > 0 ? `<span style="background:var(--primary); color:#fff; font-size:0.7rem; padding:2px 6px; border-radius:10px; margin-left:auto; font-weight:bold;">${pendingJobsCount} Syncing</span>` : ''}
            </a>
            <a class="navlink ${NF.State.context === 'Analytics' ? 'active' : ''}" onclick="app.go('Analytics')">
                <svg class="ic"><use href="#i-spark"/></svg> Analytics & Review
            </a>
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
    opps = opps.filter(o => !o.snooze_until || o.snooze_until <= todayStr);
    
    let killDateCount = 0;
    let predictionsDueHtml = '';
    let dueTodayHtml = '';
    
    opps.forEach(o => {
        if (o.status !== 'Archived') {
            if (o.next_action_due && o.next_action_due <= todayStr) {
                dueTodayHtml += `
                    <div class="card" style="margin-bottom:8px; border-left:4px solid #b91c1c; cursor:pointer; padding:16px;" onclick="app.go('Opportunity', '${o.id}')">
                        <div style="font-size:0.85rem; color:var(--ink-soft); margin-bottom:4px;">${app.escapeHtml(o.title)}</div>
                        <div style="font-size:1.1rem; color:var(--ink);">${app.escapeHtml(o.next_action)}</div>
                    </div>
                `;
            }
            
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
            <h2 style="font-family:'Roboto Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-faint); margin-top:32px; margin-bottom:12px;">Predictions Due</h2>
            ${predictionsDueHtml}
        `;
    }
    
    if (dueTodayHtml) {
        dueTodayHtml = `
            <h2 style="font-family:'Roboto Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:#b91c1c; margin-top:32px; margin-bottom:12px;">Actions Due</h2>
            ${dueTodayHtml}
        `;
    }
    
    // Check for decaying contacts
    let people = await NF.DB.getAll('people');
    let decayedPeopleHtml = '';
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    people.forEach(p => {
        if (p.trust >= 4 && (Date.now() - p.last_interaction > thirtyDays)) {
            decayedPeopleHtml += `
                <div style="background:var(--card); padding:12px 16px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; border:1px solid #e0b4b4; border-left:4px solid #c92a2a; margin-bottom:8px;">
                    <div>
                        <span style="font-size:0.9rem; color:#c92a2a; font-weight:600;">Relationship Decay:</span>
                        <span style="font-size:0.9rem; margin-left:8px;">High-trust contact <strong>${p.name}</strong> hasn't been engaged in >30 days.</span>
                    </div>
                    <button class="btn btn--sm" onclick="app.go('PersonDetail', '${p.id}')">View</button>
                </div>
            `;
        }
    });

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
            <h2 style="font-family:'Roboto Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-faint); margin-top:32px; margin-bottom:12px;">Closest to Revenue</h2>
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
        <h2 style="font-family:'Roboto Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-faint); margin-top:32px; margin-bottom:12px;">Just-in-Time Learning</h2>
        <div id="jit-learning-container">
            <div class="card" style="padding:16px; background:var(--card); border:1px solid var(--line); border-left:4px solid var(--primary);">
                <h3 style="font-size:1.1rem; color:var(--ink); margin-bottom:6px;">${learningTopic}</h3>
                <p style="font-size:0.9rem; color:var(--ink-soft); line-height:1.5;">${learningDesc}</p>
            </div>
        </div>`;

    const isSunday = new Date().getDay() === 0;
    let sundayReportHtml = '';
    if (isSunday) {
        sundayReportHtml = `
            <div class="card" style="margin-bottom:24px; border:1px solid var(--primary-soft); background:var(--primary-soft);">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <h3 style="font-size:1.1rem; color:var(--primary);">Sunday Report</h3>
                        <p style="font-size:0.85rem; color:var(--ink-soft); margin-top:4px;">Synthesize this week's field observations and patterns.</p>
                    </div>
                    <button class="btn btn--primary" onclick="app.generateSundayReport()">Generate</button>
                </div>
                <div id="sunday-report-container" style="margin-top:16px;"></div>
            </div>
        `;
    }

    let askNorthHtml = `
        <div class="card" style="margin-bottom:24px;">
            <div style="display:flex; align-items:center; gap:8px;">
                <svg class="ic" style="color:var(--primary);"><use href="#i-spark"/></svg>
                <h3 style="margin:0; font-size:1.1rem;">Ask Dhaula</h3>
            </div>
            <div style="display:flex; gap:8px; margin-top:12px;">
                <input type="text" id="ask-north-input" class="input" placeholder="e.g., What do I know about hotels?" style="flex:1;">
                <button class="btn btn--primary" onclick="app.askNorth()">Ask</button>
            </div>
            <div id="ask-north-results" style="margin-top:16px;"></div>
        </div>
    `;

    return `
        <main class="main">
            <div class="wrap">
                ${backupBanner}
                <div class="crumb">System / Morning Briefing</div>
                <h1 class="ptitle" style="margin-bottom:8px;">Good Morning.</h1>
                
                ${sundayReportHtml}
                ${askNorthHtml}
                
                ${dueTodayHtml}
                ${killDateHtml}
                ${predictionsDueHtml}
                
                <div style="padding:16px 20px; background:rgba(0,0,0,0.02); border-radius:12px; margin-bottom:32px; font-family:'Fraunces',serif; font-size:1.1rem; color:var(--ink); border-left:4px solid var(--ink-faint);">
                    ${mentorMessage}
                </div>
                
                ${predictionsDueHtml}
                ${decayedPeopleHtml ? `<div style="margin-top:24px;">${decayedPeopleHtml}</div>` : ''}
                
                <h2 style="font-family:'Roboto Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--primary); margin-bottom:12px;">The Spearhead (Highest Leverage Action)</h2>
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
    let allObs = await NF.DB.getAll('observations') || [];
    let activePatterns = patterns.filter(p => p.status === 'Emerging');
    if (activePatterns.length === 0) return '';
    
    let html = `<h2 style="font-family:'Roboto Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-faint); margin-bottom:12px; margin-top:32px;">Emerging Patterns (Industry Bibles)</h2>`;
    let activePatternsHTML = '';
    
    for (let p of patterns.filter(pt => pt.status === 'Emerging')) {
        let pObs = [];
        for(let id of p.observation_ids) {
            let o = await NF.DB.get('observations', id);
            if(o) pObs.push(o);
        }
        
        if (pObs.length === 0) continue;
        
        pObs.sort((a,b) => b.created_at - a.created_at);
        const lastObsAgeDays = (Date.now() - pObs[0].created_at) / (1000 * 60 * 60 * 24);
        
        if (lastObsAgeDays > 45) {
            p.status = 'Dormant';
            await NF.DB.put('patterns', p);
            continue;
        }
        
        let momentum = 0;
        const halfLifeMs = 14 * 24 * 60 * 60 * 1000;
        pObs.forEach(o => {
            const ageMs = Date.now() - o.created_at;
            momentum += Math.pow(0.5, ageMs / halfLifeMs);
        });
        
        const speedLabel = momentum >= 2.0 ? "Theme is accelerating." : "Theme is emerging steadily.";
        const momentumText = `<strong style="color:var(--good-ink);">${momentum.toFixed(1)} Momentum (Half-life: 14d)</strong>. ${speedLabel}`;
        
        const obsListHtml = pObs.map(o => `<div style="font-size:0.9rem; padding:8px 0; border-bottom:1px solid rgba(0,0,0,0.05); color:var(--ink);">${app.renderObsText(o.text)} <span style="font-size:0.75rem; color:var(--ink-faint);">(${new Date(o.created_at).toLocaleDateString()})</span></div>`).join('');
        
        activePatternsHTML += `
            <div class="card" style="margin-bottom:16px; border:1px solid var(--good-soft); background:var(--good-soft);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="flex:1;">
                        <h3 class="bible-header" style="font-size:1.1rem; margin-bottom:4px; color:var(--good-ink);"><svg class="ic" style="width:16px; height:16px; margin-right:4px;"><use href="#i-spark"/></svg> ${app.escapeHtml(p.title)}</h3>
                        <p style="font-size:0.85rem; color:var(--ink-soft); margin-bottom:12px;">${momentumText}</p>
                        <details style="cursor:pointer; font-size:0.85rem; color:var(--ink-soft);">
                            <summary style="outline:none; font-weight:600; margin-bottom:8px;">View ${pObs.length} Raw Observations</summary>
                            <div style="padding-left:8px; border-left:2px solid var(--good-ink); margin-top:8px;">
                                ${obsListHtml}
                            </div>
                        </details>
                    </div>
                    <button class="btn btn--primary btn--sm" style="margin-left:16px;" onclick="app.spawnHypothesis('${p.id}')">Spawn Hypothesis</button>
                </div>
            </div>
        `;
    }
    
    if (activePatternsHTML) html += activePatternsHTML;
    
    const heatHtml = `
        <h2 class="eyebrow" style="margin-top:32px;">Capture Heat (Last 35 Days)</h2>
        ${app.generateHeatmap(allObs)}
    `;
    
    return html + heatHtml;
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
        <h2 style="font-family:'Roboto Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-faint); margin-top:32px; margin-bottom:12px;">Judgment Calibration (Founder Intel)</h2>
        <div class="card" style="padding:16px 20px; display:flex; gap:24px; align-items:flex-start;">
            <div style="flex:1;">
                <div style="font-size:2rem; font-weight:700; color:${accuracy >= 50 ? 'var(--good-ink)' : 'var(--ink)'};">${accuracy}%</div>
                <div style="font-size:0.85rem; color:var(--ink-soft); font-family:'Roboto Mono',monospace; text-transform:uppercase;">Prediction Accuracy</div>
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
    
    const res = await NF.AI.generateCachedContent(prompt, { taskClass: 'brief' }, 12);
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
    
    let activeTag = window._discoveryActiveTag || null;
    if (activeTag) {
        obs = obs.filter(o => o.text.toLowerCase().includes(activeTag.toLowerCase()));
    }
    
    const tags = new Set();
    const allObsForTags = await NF.DB.getAll('observations');
    allObsForTags.forEach(o => {
        const matches = o.text.match(/#[A-Za-z0-9_]+/g);
        if (matches) matches.forEach(m => tags.add(m.toLowerCase()));
    });
    const hour = new Date().getHours();
    const isMorning = hour < 12;
    const title = isMorning ? "Morning Plan" : "Evening Recap";
    const subtitle = isMorning ? "Clear your desk. Review active bets." : "Reflect on today's progress.";
    
    let html = `<main class="main"><div class="wrap">
        <div class="crumb">The Board / Pipeline</div>
        <div class="phead" style="margin-bottom:8px;">
            <div>
                <h1 class="ptitle">${title}</h1>
                <p style="color:var(--ink-soft); margin-top:8px;">${subtitle}</p>
            </div>
        </div>
        
        ${!isMorning ? `
            <div class="card" style="margin-bottom:24px;">
                <h3 style="font-size:0.9rem; font-weight:600; margin-bottom:12px; color:var(--primary);">Evening Reflection</h3>
                <textarea class="input" rows="2" placeholder="What did you learn today? Did you move the needle?" style="width:100%;" onblur="NF.DB.setSetting('evening_recap_' + new Date().toISOString().split('T')[0], this.value)"></textarea>
            </div>
        ` : ''}
        
        <div class="crumb">Execution / Discovery Feed</div>
        <div class="phead">
            <div>
                <h1 class="ptitle">Raw Field Discovery</h1>
                <p style="color:var(--ink-soft); margin-top:8px;">Chronological feed of your raw observations before they cluster into patterns.</p>
            </div>
            <div style="display:flex; gap:12px;">
                <button class="btn btn--sm" onclick="app.pasteNews()"><svg class="ic" style="margin-right:6px;"><use href="#i-bulb"/></svg> Paste News</button>
                <button class="btn btn--primary" onclick="app.toggleUniversalCapture()"><svg class="ic" style="margin-right:6px;"><use href="#i-bulb"/></svg> New Log</button>
            </div>
        </div>
        
        ${tags.size > 0 ? `
            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:16px;">
                <button class="pill ${!activeTag ? 'pill--brand' : ''}" style="border:none; cursor:pointer;" onclick="window._discoveryActiveTag = null; app.render()">All</button>
                ${Array.from(tags).map(t => `<button class="pill ${activeTag === t ? 'pill--brand' : ''}" style="border:none; cursor:pointer;" onclick="window._discoveryActiveTag = '${t}'; app.render()">${app.escapeHtml(t)}</button>`).join('')}
            </div>
        ` : ''}
        
        <div style="display:flex; flex-direction:column; gap:16px; margin-top:24px;">
    `;
    
    if (allObsForTags.length === 0) {
        html += `
            <div class="card" style="text-align:center; padding:40px; color:var(--ink-soft);">
                <div style="font-size:3rem; margin-bottom:16px;">🌱</div>
                <h2 style="font-size:1.5rem; color:var(--ink); margin-bottom:12px;">The field is empty.</h2>
                <p style="line-height:1.6; max-width:400px; margin:0 auto 24px;">You haven't captured any observations yet. The Pattern Engine relies on raw inputs from the field. Tap the lightbulb or press / to capture your first note.</p>
                <div style="text-align:left; max-width:600px; margin:0 auto; background:var(--bg); padding:16px; border-radius:8px; border:1px solid var(--line);">
                    <div style="font-weight:600; color:var(--ink); margin-bottom:12px;">Or Bulk Import:</div>
                    <textarea id="bulk-import-input" class="input" rows="5" placeholder="Paste observations here, one per line..." style="width:100%; margin-bottom:12px;"></textarea>
                    <button class="btn btn--primary" onclick="app.processBulkImport()">Import Lines</button>
                </div>
            </div>
        `;
    } else {
        for (let o of obs) {
            let statusHtml = o.processed 
                ? `<span style="font-size:0.75rem; color:var(--good-ink); background:var(--good-soft); padding:2px 8px; border-radius:12px;">Clustered</span>`
                : `<span style="font-size:0.75rem; color:var(--ink-soft); background:#ECEFEA; border:1px solid var(--line); padding:2px 8px; border-radius:12px;">Raw Data</span>`;
                
            html += `
                <div class="card" style="padding:16px 20px;">
                    <p class="line-clamp-2 max-68ch" onclick="this.classList.toggle('line-clamp-2')" style="font-size:1.1rem; color:var(--ink); line-height:1.5; margin-bottom:12px; cursor:pointer;">${app.renderObsText(o.text)}</p>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:0.8rem; color:var(--ink-faint);">${app.renderRelativeTime(o.created_at)}</span>
                        <div style="display:flex; gap:8px; align-items:center;">
                            ${statusHtml}
                            <button class="btn btn--sm" style="border:none; padding:4px 8px; color:#c92a2a; background:transparent;" onclick="app.deleteItem('observations', '${o.id}')">Delete Log</button>
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
                    <button class="btn btn--sm" style="border:none; padding:4px 8px; color:#c92a2a; background:transparent;" onclick="app.deleteItem('opportunities', '${o.id}')">Delete Opp</button>
                </div>
            </div>
        </div>
    `;
};

const renderPipeline = async () => {
    let opps = await NF.DB.getAll('opportunities');
    let patterns = await NF.DB.getAll('patterns');
    let allObs = await NF.DB.getAll('observations');
    
    const todayStr = new Date().toISOString().split('T')[0];
    const activeOpps = opps.filter(o => o.status !== 'Archived' && (!o.snooze_until || o.snooze_until <= todayStr));
    
    let stageCounts = {};
    LIFECYCLE.forEach(s => stageCounts[s] = 0);
    activeOpps.forEach(o => { if (stageCounts[o.status] !== undefined) stageCounts[o.status]++; });
    
    let funnelHtml = `<div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:16px; margin-bottom:16px; padding:12px; background:rgba(0,0,0,0.02); border-radius:8px; border:1px solid var(--line);">`;
    LIFECYCLE.forEach(stage => {
        funnelHtml += `<div style="font-size:0.85rem; color:var(--ink-soft);">${stage}: <strong style="color:var(--ink);">${stageCounts[stage]}</strong></div>`;
    });
    funnelHtml += `</div>`;
    
    let html = `<main class="main"><div class="wrap">
        <div class="crumb">Execution / Opportunity Map</div>
        <div class="phead">
            <h1 class="ptitle">Opportunity Map</h1>
        </div>
        <p class="psub">Strategic view of all active ventures, grouped by their core Industry Bible (Pattern).</p>
        
        ${funnelHtml}
        
        <div style="margin-top:32px;">`;
        
    // Group opportunities by pattern
    patterns.forEach(p => {
        const patternOpps = activeOpps.filter(o => {
            return o.observations && p.observation_ids && o.observations.some(obsId => p.observation_ids.includes(obsId));
        });
        
        if (patternOpps.length > 0) {
            const isUnread = p.updated_at > (p.last_seen_at || '');
            const dotHtml = isUnread ? `<span class="new-dot"></span>` : '';
            const sparkline = app.generateSparkline(p.observation_ids || [], allObs);
            
            html += `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; margin-top:24px; padding-left:8px; border-left:2px solid var(--primary);">
                    <h3 style="font-family:'Roboto Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-faint); margin:0;">${app.escapeHtml(p.title)}${dotHtml}</h3>
                    ${sparkline}
                </div>`;
            html += `<div style="padding-left:12px; margin-bottom:24px;">`;
            
            patternOpps.sort((a,b) => b.calculated_score - a.calculated_score).forEach(o => {
                html += renderOppRow(o);
            });
            html += `</div>`;
        }
    });

    const standaloneOpps = activeOpps.filter(o => {
        return !patterns.some(p => p.observation_ids && o.observations && o.observations.some(obsId => p.observation_ids.includes(obsId)));
    });
    
    if (standaloneOpps.length > 0) {
        html += `<h3 style="font-family:'Roboto Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-faint); margin-bottom:12px; margin-top:32px; padding-left:8px; border-left:2px solid var(--line);">Ungrouped Ventures</h3>`;
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
    
    const sops = await NF.DB.getAll('sops') || [];
    const oppSops = sops.filter(s => s.opportunity_id === opp.id);
    const delegationScore = Math.min(100, Math.round(
        (oppSops.length * 20) + 
        ((opp.observations || []).length * 10) + 
        (opp.next_action && opp.next_action !== 'Define specific target audience' ? 20 : 0) +
        ((opp.unit_economics && opp.unit_economics.price > 0) ? 20 : 0)
    ));
    
    const decisions = await NF.DB.getAll('decision_journal') || [];
    const oppDecisions = decisions.filter(d => d.opportunity_id === opp.id).sort((a,b) => b.created_at - a.created_at);
    
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
    
    // Linked People
    let linkedPeopleHtml = '';
    const pattern = await NF.DB.get('patterns', opp.pattern_id);
    if (pattern) {
        const obs = await NF.DB.getAll('observations');
        const patternObs = obs.filter(o => o.pattern_id === pattern.id);
        const people = await NF.DB.getAll('people');
        let linkedPeople = [];
        people.forEach(p => {
            const regex = new RegExp(`@${p.name}\\b`, 'i');
            if (patternObs.some(o => regex.test(o.text))) {
                linkedPeople.push(p);
            }
        });
        if (linkedPeople.length > 0) {
            linkedPeopleHtml = `<div class="card" style="margin-top:24px;">
                <h3 style="margin:0 0 12px 0; font-size:1rem;">Network Connections</h3>
                <div style="display:flex; flex-wrap:wrap; gap:8px;">
                    ${linkedPeople.map(p => `<button class="pill pill--brand" style="border:none; cursor:pointer;" onclick="app.go('PersonDetail', '${p.id}')">@${p.name}</button>`).join('')}
                </div>
            </div>`;
        }
    }
    
    // Compounding Timeline
    const currentIdx = LIFECYCLE.indexOf(opp.status) === -1 ? 0 : LIFECYCLE.indexOf(opp.status);
    let timelineHtml = LIFECYCLE.map((s, idx) => {
        let state = 'done';
        if (isArchived) state = idx <= currentIdx ? 'done' : '';
        else if (idx === currentIdx) state = 'now';
        else if (idx > currentIdx) state = '';
        let cls = `st ${state}`;
        if (state === 'now' && app.animatingStageOppId === opp.id) cls += ` stage-advance-anim`;
        return `<div class="${cls}">${s}</div>`;
    }).join('');

    return `
        <main class="main">
            <div class="wrap">
                <div class="crumb"><a href="#" onclick="app.go('Pipeline')">Pipeline</a> / Opportunity Execution</div>
                
                ${isKillDatePassed ? `<div style="background:#fee2e2; color:#991b1b; padding:12px 16px; border-radius:8px; margin-top:16px; font-weight:600; display:flex; align-items:center;"><svg class="ic" style="margin-right:8px;"><use href="#i-arrow"/></svg> Kill Date Passed (${app.escapeHtml(opp.exit_deadline)})</div>` : ''}
                
                ${(opp.conviction >= 8 && (!opp.evidence || opp.evidence.length < 2)) ? `
                <div style="background:#fef08a; color:#854d0e; padding:12px 16px; border-radius:8px; margin-top:16px; font-weight:600; border-left:4px solid #eab308;">
                    Dangerous Asymmetry: High conviction (${opp.conviction}/10) but low evidence. Go collect reality.
                </div>` : ''}
                
                <div class="phead" style="align-items:center;">
                    <div>
                        <span class="eyebrow">OPPORTUNITY · ${app.escapeHtml(opp.status)}</span>
                        <h1 class="ptitle" style="${isArchived ? 'text-decoration:line-through; color:var(--ink-faint);' : ''}">${app.escapeHtml(opp.title)}</h1>
                        ${isArchived ? '<span class="pill" style="margin-top:8px;">Archived (Graveyard)</span>' : ''}
                        ${!isArchived && opp.created_at ? `<div style="font-size:0.85rem; color:var(--ink-soft); margin-top:4px;">Created: ${app.renderRelativeTime(opp.created_at)}</div>` : ''}
                    </div>
                    <div style="display:flex; gap:12px; align-items:center;">
                        <div class="pill pill--brand" style="font-size:0.9rem;">Score: ${opp.calculated_score}${opp.score_source === 'fallback' ? ' <span style="opacity:0.8; font-size:0.8em; margin-left:4px;">est.</span>' : ''}</div>
                        ${!isArchived ? `<button class="btn btn--sm" onclick="app.logDecision('${opp.id}')"><svg class="ic" style="margin-right:4px;"><use href="#i-check"/></svg> Log Decision</button>` : ''}
                        ${!isArchived ? `<button class="btn btn--sm" onclick="app.snoozeOpportunity('${opp.id}')"><svg class="ic" style="margin-right:4px;"><use href="#i-clock"/></svg> Snooze</button>` : ''}
                        ${!isArchived ? (hasAI 
                            ? `<button class="btn btn--sm" id="btn-convene-board" onclick="app.runBoardAnalysis('${opp.id}')" style="background:#111; color:#fff; border:1px solid #333;"><svg class="ic" style="margin-right:6px;"><use href="#i-users"/></svg> Convene Board</button>
                               <button class="btn btn--sm" id="btn-red-team" onclick="app.runRedTeam('${opp.id}')" style="background:#991b1b; color:#fff; border:1px solid #7f1d1d;"><svg class="ic" style="margin-right:6px;"><use href="#i-target"/></svg> Red Team</button>
                               <button class="btn btn--sm" id="btn-pre-mortem" onclick="app.runPreMortem('${opp.id}')" style="background:#475569; color:#fff; border:1px solid #334155;"><svg class="ic" style="margin-right:6px;"><use href="#i-bulb"/></svg> Pre-Mortem</button>
                               <button class="btn btn--sm" id="btn-playbook" onclick="app.generatePlaybook('${opp.id}')" style="background:var(--primary); color:#fff; border:1px solid var(--primary);"><svg class="ic" style="margin-right:6px;"><use href="#i-target"/></svg> Playbook</button>`
                            : `<button class="btn btn--sm" id="btn-convene-board" style="background:#333; color:#888; border:1px solid #444; cursor:not-allowed;" title="API Key Required"><svg class="ic" style="margin-right:6px;"><use href="#i-users"/></svg> Convene Board</button>`
                        ) : ''}
                        ${!isArchived ? `<button class="btn btn--primary btn--sm" onclick="app.toggleTutor()"><svg class="ic" style="margin-right:6px;"><use href="#i-spark"/></svg> AI Tutor</button>` : ''}
                        ${!isArchived ? `
                        <div style="display:flex; flex-direction:column; align-items:flex-end;">
                            <button class="btn btn--sm" onclick="app.advanceStage('${opp.id}')">Advance Stage <svg class="ic"><use href="#i-arrow"/></svg></button>
                            <div style="font-size:0.65rem; color:var(--ink-faint); margin-top:4px; text-align:right;">Time in stage: ${Math.floor((Date.now() - (opp.last_stage_change || opp.created_at))/86400000)} days. Sunk costs are irrelevant.</div>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <h3 style="font-family:'Roboto Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-faint); margin-top:24px; margin-bottom:12px;">Compounding Timeline</h3>
                <div class="stepper" style="margin-bottom:16px;">
                    ${timelineHtml}
                </div>
                
                <div style="margin-bottom:24px; max-width:400px;">
                    <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--ink-soft); margin-bottom:6px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em;">
                        <span>Delegation Readiness</span>
                        <span>${delegationScore}%</span>
                    </div>
                    <div style="height:6px; background:var(--line); border-radius:3px; overflow:hidden;">
                        <div style="height:100%; width:${delegationScore}%; background:${delegationScore > 75 ? '#15803d' : 'var(--primary)'}; transition:width 0.3s ease;"></div>
                    </div>
                </div>
                
                ${!isArchived && STAGE_GATES[opp.status] ? `
                <div class="card" style="margin-bottom:32px;">
                    <h3 style="font-size:1rem; margin-bottom:12px;">${opp.status} Stage Gates</h3>
                    <ul class="list" style="margin:0; padding:0; list-style:none;">
                        ${STAGE_GATES[opp.status].map((gate, i) => {
                            const isChecked = (opp.gates_checked || []).includes(i);
                            return `
                            <li style="display:flex; align-items:flex-start; margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid var(--line); cursor:pointer;" onclick="app.toggleGate('${opp.id}', ${i})">
                                <input type="checkbox" ${isChecked ? 'checked' : ''} style="margin-top:4px; margin-right:12px;">
                                <div style="${isChecked ? 'text-decoration:line-through; color:var(--ink-soft);' : 'color:var(--ink);'}">${app.escapeHtml(gate)}</div>
                            </li>`;
                        }).join('')}
                    </ul>
                </div>` : ''}
                
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
                        <p style="font-size:0.9rem; color:var(--ink-soft);">${app.escapeHtml(opp.pre_mortem.failure_reason || opp.pre_mortem)}</p>
                    </div>` : ''}
                </div>
                
                <div id="playbook-container">
                    ${opp.playbook ? `
                    <div style="margin-bottom:32px; background:#fff; border:1px solid var(--line); border-radius:8px; padding:16px;">
                        <h4 style="font-size:0.85rem; text-transform:uppercase; color:var(--primary); margin-bottom:12px; letter-spacing:0.05em; border-bottom:1px solid var(--line); padding-bottom:8px;">Execution Playbook</h4>
                        
                        <div style="margin-bottom:16px;">
                            <h5 style="margin-bottom:8px;">First 72 Hours</h5>
                            <ul style="padding-left:20px; margin:0;">
                                ${(opp.playbook.first72 || []).map(action => `
                                    <li style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:flex-start;">
                                        <span>${app.escapeHtml(action)}</span>
                                        <button class="btn btn--sm" style="padding:2px 6px; font-size:0.75rem; margin-left:12px; flex-shrink:0;" onclick="app.promoteToNextAction('${opp.id}', '${app.escapeHtml(action).replace(/'/g, "\\'")}')">Make next action</button>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                        
                        <div class="grid" style="grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
                            <div>
                                <h5 style="margin-bottom:8px;">Angles</h5>
                                <ul style="padding-left:20px; margin:0; font-size:0.9rem;">
                                    ${(opp.playbook.angles || []).map(a => `<li>${app.escapeHtml(a)}</li>`).join('')}
                                </ul>
                            </div>
                            <div>
                                <h5 style="margin-bottom:8px;">Stakeholders</h5>
                                <ul style="padding-left:20px; margin:0; font-size:0.9rem;">
                                    ${(opp.playbook.stakeholders || []).map(s => `<li><strong>${app.escapeHtml(s.name)}:</strong> ${app.escapeHtml(s.leverage)}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                        
                        <div style="margin-bottom:16px; font-size:0.9rem;">
                            <strong>Positioning:</strong> ${app.escapeHtml(opp.playbook.positioning || '')}
                        </div>
                        <div style="font-size:0.9rem;">
                            <strong>Capital:</strong> ${app.escapeHtml(opp.playbook.capital || '')}
                        </div>
                        
                        ${opp.playbook.deal_closing_kit ? `
                        <div style="margin-top:16px; padding-top:16px; border-top:1px dashed var(--line); font-size:0.9rem;">
                            <h5 style="margin-bottom:8px; color:var(--primary);">Deal-Closing Kit</h5>
                            <p style="white-space:pre-wrap;">${app.escapeHtml(opp.playbook.deal_closing_kit)}</p>
                        </div>
                        ` : ''}
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
                                <div style="display:flex; gap:8px;">
                                    ${!isArchived ? `<button class="btn btn--sm" onclick="app.extractSOP('${opp.id}')"><svg class="ic" style="margin-right:4px;"><use href="#i-spark"/></svg> Save as SOP</button>` : ''}
                                    ${!isArchived ? `<button class="btn btn--sm" onclick="app.editField('${opp.id}', 'next_action', 'What is the next physical action?')">Edit</button>` : ''}
                                </div>
                            </div>
                            <p style="font-size:1.1rem; color:var(--ink);">${app.escapeHtml(opp.next_action)}</p>
                            ${opp.next_action_due ? `<p style="font-size:0.85rem; color:#b91c1c; margin-top:8px; font-weight:600;">Due: ${app.escapeHtml(opp.next_action_due)}</p>` : ''}
                            ${!isArchived ? `<button class="btn btn--sm" style="margin-top:8px;" onclick="app.editNextActionDue('${opp.id}')">Set Due Date</button>` : ''}
                            
                            <div style="margin-top:24px;">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                    <h4 style="margin:0; font-size:0.9rem; color:var(--ink-soft);">Subtasks</h4>
                                    ${!isArchived ? `<button class="btn btn--sm" onclick="app.addSubtask('${opp.id}')">+</button>` : ''}
                                </div>
                                <ul style="list-style:none; padding:0; margin:0;">
                                    ${(opp.subtasks || []).map((t, i) => `
                                        <li style="display:flex; align-items:center; margin-bottom:6px; cursor:pointer;" onclick="app.toggleSubtask('${opp.id}', ${i})">
                                            <input type="checkbox" ${t.checked ? 'checked' : ''} style="margin-right:8px;">
                                            <span style="font-size:0.9rem; ${t.checked ? 'text-decoration:line-through; color:var(--ink-soft);' : 'color:var(--ink);'}">${app.escapeHtml(t.title)}</span>
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>
                            
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; margin-top:24px;">
                                <h3 style="margin:0; font-size:1rem; color:var(--ink-faint);">Exit Conditions</h3>
                                ${!isArchived ? `<button class="btn btn--sm" onclick="app.editField('${opp.id}', 'exit_conditions', 'Define exit conditions (e.g. Kill if 3 prospects say no)')">Edit</button>` : ''}
                            </div>
                            <p style="font-size:0.9rem; color:var(--ink-soft);">${app.escapeHtml(opp.exit_conditions)}</p>
                            ${opp.exit_deadline ? `<p style="font-size:0.85rem; color:var(--ink-soft); margin-top:8px;"><strong>Kill Date:</strong> ${app.escapeHtml(opp.exit_deadline)}</p>` : ''}
                            
                            ${predictionsHtml}
                            ${linkedPeopleHtml}
                            
                            ${!isArchived && opp.status === 'Validation' ? `<button class="btn btn--sm" style="margin-top:24px; width:100%; border-color:#0284c7; color:#0369a1; justify-content:center;" onclick="app.suggestCheapestTest('${opp.id}')">Suggest Falsifying Test</button>` : ''}
                            ${!isArchived ? `<button class="btn btn--sm" style="margin-top:8px; width:100%; border-color:#e0b4b4; color:#c92a2a; justify-content:center;" onclick="app.archiveOpportunity('${opp.id}')">Send to Graveyard (Archive)</button>` : ''}
                        </div>
                        
                        <div class="card" style="margin-top:24px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                                <h3 style="font-size:1rem; margin:0;">Unit Economics</h3>
                                ${!isArchived ? `<button class="btn btn--sm" onclick="app.editUnitEconomics('${opp.id}')">Edit</button>` : ''}
                            </div>
                            ${opp.unit_economics ? `
                                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                                    <div style="font-size:0.85rem; color:var(--ink-soft);">Price: <strong style="color:var(--ink);">₹${app.formatCurrency(opp.unit_economics.price)}</strong></div>
                                    <div style="font-size:0.85rem; color:var(--ink-soft);">Cost: <strong style="color:var(--ink);">₹${app.formatCurrency(opp.unit_economics.cost)}</strong></div>
                                    <div style="font-size:0.85rem; color:var(--ink-soft);">Volume: <strong style="color:var(--ink);">${app.formatCurrency(opp.unit_economics.volume)}/mo</strong></div>
                                    <div style="font-size:0.85rem; color:var(--ink-soft);">Margin: <strong style="color:var(--ink);">₹${app.formatCurrency(opp.unit_economics.price - opp.unit_economics.cost)}</strong></div>
                                    <div style="grid-column:1 / -1; font-size:0.95rem; margin-top:8px; padding-top:8px; border-top:1px solid var(--line);">
                                        Monthly Profit: <strong>₹${app.formatCurrency((opp.unit_economics.price - opp.unit_economics.cost) * opp.unit_economics.volume)}</strong>
                                    </div>
                                </div>
                            ` : `<p style="font-size:0.85rem; color:var(--ink-soft);">Not defined.</p>`}
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
                        
                        <div class="card" style="padding:16px 20px; margin-top:24px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                                <h3 style="font-size:1rem; margin:0;">Decision Journal</h3>
                            </div>
                            ${oppDecisions.length > 0 ? `
                                <ul style="list-style:none; padding:0; margin:0;">
                                    ${oppDecisions.map(d => `
                                        <li style="margin-bottom:12px; padding-bottom:12px; border-bottom:1px solid var(--line);">
                                            <div style="font-size:0.85rem; color:var(--ink-soft); margin-bottom:4px;">${new Date(d.created_at).toLocaleDateString()}</div>
                                            <div style="font-size:0.95rem; font-weight:600;">${app.escapeHtml(d.decision)}</div>
                                            <div style="font-size:0.85rem; color:var(--ink-soft); margin-top:4px;">${app.escapeHtml(d.rationale)}</div>
                                        </li>
                                    `).join('')}
                                </ul>
                            ` : `<p style="color:var(--ink-faint); font-size:0.8rem;">No decisions logged yet.</p>`}
                        </div>
                        
                        <div class="card" style="padding:16px 20px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                                <h3 style="font-size:1rem; margin:0;">AI Scoring Engine (V4)</h3>
                                ${!isArchived ? `<button class="btn btn--sm" id="btn-run-diagnostics" onclick="app.runAIDiagnostics('${opp.id}')"><svg class="ic" style="margin-right:4px;"><use href="#i-spark"/></svg> Run Diagnostics</button>` : ''}
                            </div>
                            <div id="diagnostics-container">
                                <div style="display:flex; height:12px; border-radius:6px; overflow:hidden; cursor:pointer;" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
                                    <div style="width:${(opp.leverage || 0)/30*100}%; background:var(--primary);" title="Leverage"></div>
                                    <div style="width:${(opp.velocity || 0)/30*100}%; background:var(--primary-soft);" title="Velocity"></div>
                                    <div style="width:${(opp.conviction || 0)/30*100}%; background:var(--ink-faint);" title="Conviction"></div>
                                </div>
                                <div style="display:none; margin-top:16px;">
                                    <div style="margin-bottom:12px; font-size:0.85rem;"><strong>Leverage (${opp.leverage || 0}/10):</strong> <span style="color:var(--ink-soft);">${app.escapeHtml(opp.leverage_text) || `Driven by ${(opp.observations||[]).length} converging observations in this sector.`}</span></div>
                                    <div style="margin-bottom:12px; font-size:0.85rem;"><strong>Velocity (${opp.velocity || 0}/10):</strong> <span style="color:var(--ink-soft);">${app.escapeHtml(opp.velocity_text) || `Velocity constrained. Requires a direct validation test to unlock.`}</span></div>
                                    <div style="font-size:0.85rem;"><strong>Conviction (${opp.conviction || 0}/10):</strong> <span style="color:var(--ink-soft);">${app.escapeHtml(opp.conviction_text) || `Medium conviction. Data is strong but lacks first-sale proof.`}</span></div>
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

const renderTerritories = async () => {
    const territories = await NF.DB.getAll('territories') || [];
    let html = `<main class="main"><div class="wrap">
        <div class="crumb">Compounding / Territories</div>
        <div class="phead">
            <h1 class="ptitle">Territories</h1>
            <button class="btn btn--primary" onclick="app.addTerritory()">Declare Territory</button>
        </div>
        <p class="psub">Thematic clusters of intelligence and playbooks.</p>
        <div style="margin-top:24px; display:grid; gap:16px;">`;
        
    for(let t of territories) {
        html += `
            <div class="card" style="cursor:pointer;" onclick="app.go('TerritoryDetail', '${t.id}')">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <h3 style="font-size:1.2rem; margin:0;">${app.escapeHtml(t.name)}</h3>
                        <p style="font-size:0.85rem; color:var(--ink-soft); margin-top:4px;">Keywords: ${app.escapeHtml((t.keywords || []).join(', '))}</p>
                    </div>
                    ${t.stale ? `<span class="pill" style="background:#fee2e2; color:#991b1b;">Stale Intel</span>` : ''}
                </div>
            </div>`;
    }
    html += `</div></div></main>`;
    return html;
};

const renderTerritoryDetail = async () => {
    const t = await NF.DB.get('territories', NF.State.activeId);
    if (!t) return app.go('Territories');
    
    // Auto-link observations based on keywords
    const obs = await NF.DB.getAll('observations') || [];
    let matchingObs = [];
    if (t.keywords && t.keywords.length > 0) {
        matchingObs = obs.filter(o => {
            const text = (o.text || '').toLowerCase();
            return t.keywords.some(k => text.includes(k.toLowerCase()));
        });
    }
    
    // Stale logic
    if (t.last_observation_count !== undefined && matchingObs.length !== t.last_observation_count) {
        t.stale = true;
        await NF.DB.put('territories', t);
    }
    
    let html = `
        <main class="main">
            <div class="wrap">
                <div class="crumb"><a href="#" onclick="app.go('Territories')">Territories</a> / ${app.escapeHtml(t.name)}</div>
                <div class="phead" style="margin-bottom:24px; align-items:center;">
                    <div>
                        <span class="eyebrow">TERRITORY</span>
                        <h1 class="ptitle">${app.escapeHtml(t.name)}</h1>
                        <div style="font-size:0.85rem; color:var(--ink-soft); margin-top:4px;">Keywords: ${app.escapeHtml((t.keywords || []).join(', '))} <button class="btn btn--sm" style="border:none; padding:0; background:transparent; color:var(--primary); margin-left:8px;" onclick="app.editTerritoryKeywords('${t.id}')">Edit</button></div>
                    </div>
                    <div>
                        ${t.stale ? `<span class="pill" style="background:#fee2e2; color:#991b1b; margin-right:12px;">Stale Playbook</span>` : ''}
                        <button class="btn btn--primary" onclick="app.generateTerritoryPlaybook('${t.id}', ${matchingObs.length})"><svg class="ic" style="margin-right:4px;"><use href="#i-target"/></svg> ${t.playbook ? 'Refresh Playbook' : 'Generate Playbook'}</button>
                    </div>
                </div>
                
                <div class="card" style="margin-bottom:24px;">
                    <h3 style="font-size:1.1rem; margin-bottom:16px;">Territory Playbook</h3>
                    ${t.playbook ? `
                        <div style="white-space:pre-wrap; font-size:0.95rem;">${app.renderMarkdown(t.playbook.content, t.id)}</div>
                    ` : `<p style="color:var(--ink-soft); font-size:0.9rem;">No playbook generated yet.</p>`}
                </div>
                
                <div class="card">
                    <h3 style="font-size:1.1rem; margin-bottom:16px;">Linked Evidence (${matchingObs.length})</h3>
                    <ul class="list" style="margin:0; padding:0; list-style:none;">
                        ${matchingObs.map(o => `
                            <li style="padding:12px; border-bottom:1px solid var(--line);">
                                <div style="font-size:0.85rem; color:var(--ink-soft); margin-bottom:4px;">${new Date(o.created_at).toLocaleDateString()}</div>
                                <div style="font-size:0.95rem;">${app.escapeHtml(o.text)}</div>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        </main>
    `;
    return html;
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
    const allObs = await NF.DB.getAll('observations');
    const people = await NF.DB.getAll('people');
    // Filter opps linked to this business
    let linkedOpps = opps.filter(o => o.business_id === biz.id);

    
    let html = `
        <main class="main">
            <div class="wrap">
                <div class="crumb"><a href="#" onclick="app.go('Businesses')" style="color:var(--ink-faint); text-decoration:none;">Field Intelligence</a> / Dossier</div>
                
                <div class="phead" style="margin-bottom:24px;">
                    <div>
                        <span class="eyebrow">BUSINESS DOSSIER</span>
                        <h1 class="ptitle">${app.escapeHtml(biz.name)}</h1>
                    </div>
                    <div style="display:flex; gap:12px;">
                        <button class="btn btn--primary" onclick="app.generatePrepBrief('${biz.id}')" id="btn-prep-brief"><svg class="ic" style="margin-right:6px;"><use href="#i-spark"/></svg> Prep Brief</button>
                        <button class="btn btn--sm" onclick="app.draftOutreach('${biz.id}')" id="btn-outreach"><svg class="ic" style="margin-right:6px;"><use href="#i-target"/></svg> Draft Outreach</button>
                    </div>
                </div>
                
                ${(() => {
                    const daysSinceUpdate = Math.floor((Date.now() - new Date(biz.updated_at || biz.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24));
                    return daysSinceUpdate > 90 ? `<div class="note note--warn" style="margin-bottom:24px;"><b>Warning:</b> This business hasn't been updated in over 90 days.</div>` : '';
                })()}
                
                <div id="prep-brief-container" style="margin-bottom:24px;"></div>
                
                <div class="grid g2" style="gap:24px;">
                    <!-- Question 1 & 3 -->
                    <div style="display:flex; flex-direction:column; gap:24px;">
                        <div class="card" style="margin:0;">
                            <h2 style="font-family:'Roboto Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--primary); margin-bottom:16px;">1. Who are they?</h2>
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
                            
                            ${(() => {
                                const bizObs = allObs.filter(o => o.business_id === biz.id);
                                let linkedPeople = [];
                                people.forEach(p => {
                                    if (p.business_id === biz.id) linkedPeople.push(p);
                                    else {
                                        const regex = new RegExp(`@${p.name}\\b`, 'i');
                                        if (bizObs.some(o => regex.test(o.text))) linkedPeople.push(p);
                                    }
                                });
                                // Deduplicate
                                linkedPeople = [...new Set(linkedPeople)];
                                if (linkedPeople.length > 0) {
                                    return `<h3 style="font-size:0.9rem; margin-top:16px; margin-bottom:8px;">Network Connections:</h3>
                                    <div style="display:flex; flex-wrap:wrap; gap:8px;">
                                        ${linkedPeople.map(p => `<button class="pill pill--brand" style="border:none; cursor:pointer;" onclick="app.go('PersonDetail', '${p.id}')">@${p.name}</button>`).join('')}
                                    </div>`;
                                }
                                return '';
                            })()}
                        </div>
                        
                        <div class="card" style="margin:0;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                                <h2 style="font-family:'Roboto Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--primary); margin:0;">3. What opportunities exist?</h2>
                                <button class="btn btn--sm" onclick="app.spawnBusinessOpportunity('${biz.id}')">Spawn</button>
                            </div>
                            ${linkedOpps.length > 0 ? linkedOpps.map(o => renderOppRow(o)).join('') : '<p style="color:var(--ink-faint); font-size:0.9rem;">No opportunities linked yet.</p>'}
                        </div>
                    </div>
                    
                    <!-- Question 2 & 4 -->
                    <div style="display:flex; flex-direction:column; gap:24px;">
                        <div class="card" style="margin:0;">
                            <h2 style="font-family:'Roboto Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--primary); margin-bottom:16px;">2. What do we know?</h2>
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
                            <h2 style="font-family:'Roboto Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--primary); margin-bottom:16px;">4. What should I do next?</h2>
                            <div class="cell lever" style="background:var(--good-soft); border:none;">
                                <div class="t"><svg class="ic" style="color:var(--good)"><use href="#i-arrow"/></svg> <span style="color:#256f55;">The Spearhead Move</span></div>
                                <div class="v" style="color:#17452f; font-size:1.1rem; margin-top:8px;">${app.escapeHtml(biz.next_move)}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card" style="margin-top:24px;">
                    <h2 style="font-family:'Roboto Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--primary); margin-bottom:16px;">Milestone Timeline</h2>
                    <div>
                        ${(biz.milestones || []).slice().reverse().map(m => `
                            <div style="display:flex; gap:16px; margin-bottom:12px; align-items:flex-start;">
                                <div style="font-family:'Roboto Mono',monospace; font-size:0.75rem; color:var(--ink-faint); width:80px; flex:none; padding-top:4px;">${app.renderRelativeTime(new Date(m.date).getTime())}</div>
                                <div style="flex:1; border-left:2px solid var(--line); padding-left:16px; padding-bottom:16px; position:relative;">
                                    <div style="position:absolute; left:-6px; top:4px; width:10px; height:10px; border-radius:50%; background:var(--primary);"></div>
                                    <div style="font-weight:600; color:var(--ink);">${app.escapeHtml(m.label)}</div>
                                </div>
                            </div>
                        `).join('') || '<div style="color:var(--ink-faint); font-size:0.9rem;">No milestones yet.</div>'}
                    </div>
                </div>
                
            </div>
        </main>
    `;
    return html;
};

const renderAnalytics = async () => {
    let html = `<main class="main"><div class="wrap">
        <div class="crumb" style="display:flex; justify-content:space-between; align-items:center;">
            <span>Compounding / Analytics & Review</span>
            <button class="btn btn--primary" onclick="app.startFounderReview()" style="margin-right:12px;">Start Founder Review</button>
            <button class="btn" onclick="app.generateYearInReview()">Year in Review</button>
        </div>
        <h1 class="ptitle" style="margin-bottom:32px;">System Analytics</h1>
    `;
    
    // 1. Calculations
    const obs = await NF.DB.getAll('observations');
    const opps = await NF.DB.getAll('opportunities');
    const sops = (await NF.DB.getAll('sops')) || [];
    
    // Streak
    let streak = 0;
    const today = new Date().setHours(0,0,0,0);
    const dayMs = 86400000;
    let daysWithObs = new Set(obs.map(o => new Date(o.created_at).setHours(0,0,0,0)));
    for(let i=0; i<365; i++) {
        if(daysWithObs.has(today - i*dayMs)) streak++;
        else break;
    }
    
    // Win Rate
    const won = opps.filter(o => o.status === 'Won').length;
    const lost = opps.filter(o => o.status === 'Graveyard').length;
    const winRate = (won + lost) > 0 ? Math.round((won / (won + lost)) * 100) : 0;
    
    // Time in stage (average)
    let totalTime = 0;
    let totalOpps = 0;
    opps.forEach(o => {
        if (o.status !== 'Validation' && o.status !== 'First Sale' && o.status !== 'Graveyard' && o.status !== 'Won') {
            totalTime += (Date.now() - o.created_at) / dayMs;
            totalOpps++;
        }
    });
    const avgTime = totalOpps > 0 ? Math.round(totalTime / totalOpps) : 0;
    
    // 2. Calibration Curve (Predictions)
    let preds = [];
    opps.forEach(o => { if (o.predictions) preds.push(...o.predictions); });
    const resolvedPreds = preds.filter(p => p.resolved === true || p.resolved === false);
    
    let svgPath = '';
    if (resolvedPreds.length > 0) {
        let bins = { 10:[], 20:[], 30:[], 40:[], 50:[], 60:[], 70:[], 80:[], 90:[], 100:[] };
        resolvedPreds.forEach(p => {
            const b = Math.ceil(p.confidence / 10) * 10 || 10;
            bins[b].push(p.resolved ? 1 : 0);
        });
        
        const w = 300, h = 150;
        let points = [];
        for(let i=10; i<=100; i+=10) {
            const bin = bins[i];
            const actual = bin.length > 0 ? bin.reduce((a,b)=>a+b,0)/bin.length : (i/100);
            const x = (i/100) * w;
            const y = h - (actual * h);
            points.push(`${x},${y}`);
        }
        svgPath = `<polyline points="${points.join(' ')}" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    
    // 3. UI
    html += `
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px; margin-bottom:24px;">
            <div class="card" style="padding:24px;">
                <div style="font-size:0.85rem; color:var(--ink-soft); font-weight:600; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px;">Capture Streak</div>
                <div style="font-size:2rem; font-family:'Roboto Mono', monospace; color:var(--ink); font-weight:700;">${streak} <span style="font-size:1rem; color:var(--ink-faint);">days</span></div>
            </div>
            <div class="card" style="padding:24px;">
                <div style="font-size:0.85rem; color:var(--ink-soft); font-weight:600; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px;">Win Rate</div>
                <div style="font-size:2rem; font-family:'Roboto Mono', monospace; color:var(--ink); font-weight:700;">${winRate}%</div>
            </div>
            <div class="card" style="padding:24px;">
                <div style="font-size:0.85rem; color:var(--ink-soft); font-weight:600; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px;">Active Deal Age</div>
                <div style="font-size:2rem; font-family:'Roboto Mono', monospace; color:var(--ink); font-weight:700;">${avgTime} <span style="font-size:1rem; color:var(--ink-faint);">avg days</span></div>
            </div>
        </div>
        
        <div class="card" style="padding:24px; margin-bottom:24px;">
            <h2 style="font-size:1.2rem; margin-bottom:16px;">Founder Calibration Curve</h2>
            <div style="position:relative; width:100%; max-width:400px; height:150px; border-left:1px solid var(--line); border-bottom:1px solid var(--line);">
                <svg width="100%" height="100%" viewBox="0 0 300 150" preserveAspectRatio="none">
                    <line x1="0" y1="150" x2="300" y2="0" stroke="var(--ink-faint)" stroke-width="1" stroke-dasharray="4,4" />
                    ${svgPath}
                </svg>
                <div style="position:absolute; bottom:-20px; left:0; width:100%; display:flex; justify-content:space-between; font-size:0.7rem; color:var(--ink-faint);">
                    <span>0% Confidence</span>
                    <span>100%</span>
                </div>
            </div>
            <p style="font-size:0.85rem; color:var(--ink-soft); margin-top:24px; max-width:400px;">If the blue line is above the dotted line, you are underconfident. If below, you are overconfident.</p>
        </div>

        <div class="card" style="padding:24px; margin-bottom:24px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <h2 style="font-size:1.2rem;">Graveyard Clustering</h2>
                <button class="btn btn--sm" onclick="app.runGraveyardAnalysis()">Run Analysis</button>
            </div>
            <p style="font-size:0.85rem; color:var(--ink-soft); margin-bottom:16px;">Group dead opportunities by failure mode to find systemic blind spots.</p>
            <div id="graveyard-results" style="display:grid; grid-template-columns:1fr; gap:8px;">
                ${((await NF.DB.getSetting('graveyard_clusters')) || []).map(c => `
                    <div style="padding:12px; border:1px solid var(--line); border-radius:8px; background:var(--bg);">
                        <strong style="color:var(--ink);">${c.reason}</strong>
                        <div style="font-size:0.8rem; color:var(--ink-soft); margin-top:4px;">Affected: ${c.count} deals</div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="card" style="padding:24px; margin-bottom:24px;">
            <h2 style="font-size:1.2rem; margin-bottom:16px;">Standard Operating Procedures (SOPs)</h2>
            <p style="font-size:0.85rem; color:var(--ink-soft); margin-bottom:16px;">${sops.length} active playbooks.</p>
            <div style="display:grid; grid-template-columns:1fr; gap:8px;">
                ${sops.map(s => `
                    <div style="padding:12px; border:1px solid var(--line); border-radius:8px;">
                        <strong style="font-size:0.9rem;">${app.escapeHtml(s.title)}</strong>
                        <div style="font-size:0.85rem; color:var(--ink-soft); margin-top:8px;">${app.escapeHtml(s.content)}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    </div></main>`;
    return html;
};

const renderSettings = async () => {
    const apiKey = await NF.DB.getSetting('gemini_api_key', '');
    const apiKeySec = await NF.DB.getSetting('gemini_api_key_secondary', '');
    const keyBadge = apiKey ? `<span style="margin-left:8px; font-size:0.85rem; color:var(--good); font-weight:600;">Primary Key ✓ (ends …${apiKey.slice(-4)})</span>` : '';
    const secKeyBadge = apiKeySec ? `<span style="margin-left:8px; font-size:0.85rem; color:var(--good); font-weight:600;">Fallback Key ✓ (ends …${apiKeySec.slice(-4)})</span>` : '';
    
    const lastExport = await NF.DB.getSetting('last_export_at', 0);
    const timeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    let lastExportText = 'Never';
    if (lastExport > 0) {
        const days = Math.round((lastExport - Date.now()) / (1000 * 60 * 60 * 24));
        lastExportText = days === 0 ? 'Today' : timeFormatter.format(days, 'day');
    }
    
    const totalCalls = await NF.DB.getSetting('ai_meter_calls') || 0;
    const totalTokens = await NF.DB.getSetting('ai_meter_tokens') || 0;
    const recentLogs = await NF.DB.getSetting('ai_last_50_logs') || [];
    
    const taskClasses = ['capture', 'cluster', 'board', 'chat', 'brief'];
    let modelsHtml = '';
    for(let tc of taskClasses) {
        const selectedModel = await NF.DB.getSetting('ai_model_' + tc) || 'gemini-2.5-flash-lite';
        const temp = await NF.DB.getSetting('ai_temp_' + tc) || (tc === 'board' ? 0.4 : 0.2);
        modelsHtml += `
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--line); padding:8px 0;">
                <div style="font-weight:600; text-transform:capitalize; width:100px;">${tc}</div>
                <select id="setting-model-${tc}" class="input" style="padding:4px 8px;">
                    <option value="gemini-2.5-flash-lite" ${selectedModel === 'gemini-2.5-flash-lite' ? 'selected' : ''}>Flash Lite</option>
                    <option value="gemini-2.5-flash" ${selectedModel === 'gemini-2.5-flash' ? 'selected' : ''}>Flash</option>
                    <option value="gemini-2.5-pro" ${selectedModel === 'gemini-2.5-pro' ? 'selected' : ''}>Pro</option>
                </select>
                <input type="number" id="setting-temp-${tc}" class="input" style="width:60px; padding:4px;" step="0.1" min="0" max="2" value="${temp}">
            </div>
        `;
    }
    
    return `
        <main class="main">
            <div class="wrap">
                <div class="crumb" style="display:flex; justify-content:space-between; align-items:center;">
                    <span>System / Settings & AI</span>
                    <select class="input" style="padding:4px 8px; font-size:0.8rem;" onchange="NF.DB.switchDatabase(this.value)">
                        <option value="NorthFieldOS">Workspace: Main</option>
                        <option value="NorthFieldOS_Alt">Workspace: Alt</option>
                    </select>
                </div>
                <h1 class="ptitle" style="margin-bottom:32px;">System Settings</h1>
                
                <div class="card" style="padding:24px;">
                    <h2 style="font-size:1.2rem; margin-bottom:8px;">Gemini API Integration</h2>
                    <p style="font-size:0.9rem; color:var(--ink-soft); margin-bottom:16px;">
                        Unlock real AI analysis for the Pattern Engine, Prep Briefs, and Just-in-Time Learning. 
                        Your API key is saved locally in your browser and used to make direct, free calls to Google's generative AI.
                    </p>
                    
                    <label style="display:flex; align-items:center; font-size:0.85rem; font-weight:600; margin-bottom:8px;">Primary Gemini Key ${keyBadge}</label>
                    <input type="password" id="setting-api-key" value="" class="input" style="width:100%; max-width:400px; margin-bottom:16px;" placeholder="AIzaSy...">
                    
                    <label style="display:flex; align-items:center; font-size:0.85rem; font-weight:600; margin-bottom:8px;">Secondary (Fallback) Gemini Key ${secKeyBadge}</label>
                    <input type="password" id="setting-api-key-secondary" value="" class="input" style="width:100%; max-width:400px; margin-bottom:16px;" placeholder="AIzaSy... (Failover)">
                    
                    <label style="display:block; margin-bottom:4px; font-size:0.85rem; color:var(--ink-soft); font-weight:600;">Known Biases (One per line)</label>
                    <textarea id="setting-biases" class="input" style="width:100%; max-width:400px; min-height:80px; margin-bottom:16px;" placeholder="e.g. Overestimates demand\nUnderestimates build time">${app.escapeHtml(((await NF.DB.getSetting('founder_intel')) || {}).biases ? ((await NF.DB.getSetting('founder_intel')) || {}).biases.join('\n') : '')}</textarea>
                    
                    <div>
                        <button class="btn btn--primary" onclick="app.saveSettings()">Save Settings</button>
                        <button class="btn btn--sm" style="margin-left:8px;" onclick="app.testAPIConnection()"><svg class="ic" style="margin-right:4px;"><use href="#i-spark"/></svg> Test Connection</button>
                    </div>
                </div>

                <div class="card" style="padding:24px; margin-top:24px;">
                    <h2 style="font-size:1.2rem; margin-bottom:8px;">AI Model Routing</h2>
                    <p style="font-size:0.9rem; color:var(--ink-soft); margin-bottom:16px;">Tune the model size and creativity (temperature) for each internal engine task.</p>
                    <div style="max-width:400px; margin-bottom:16px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--line); padding:8px 0; color:var(--ink-soft); font-size:0.8rem; font-weight:600;">
                            <div style="width:100px;">Task Engine</div>
                            <div>Model Tier</div>
                            <div style="width:60px;">Temp</div>
                        </div>
                        ${modelsHtml}
                    </div>
                </div>

                <div class="card" style="padding:24px; margin-top:24px;">
                    <h2 style="font-size:1.2rem; margin-bottom:8px;">Telemetry & Budgets</h2>
                    <p style="font-size:0.9rem; color:var(--ink-soft); margin-bottom:16px;">Total API lifetime usage tracked locally on this device.</p>
                    <div style="display:flex; gap:24px; margin-bottom:16px; font-family:'Roboto Mono', monospace; font-size:1.1rem; color:var(--primary);">
                        <div><b>${totalCalls.toLocaleString()}</b> <span style="font-size:0.8rem; color:var(--ink-soft);">Calls</span></div>
                        <div><b>${totalTokens.toLocaleString()}</b> <span style="font-size:0.8rem; color:var(--ink-soft);">Tokens (est)</span></div>
                    </div>
                    <details>
                        <summary style="cursor:pointer; color:var(--ink-faint); font-size:0.9rem; margin-bottom:8px;">View last 50 calls...</summary>
                        <div style="max-height:200px; overflow-y:auto; background:var(--bg); border:1px solid var(--line); border-radius:8px; padding:8px; font-family:'Roboto Mono', monospace; font-size:0.8rem;">
                            ${recentLogs.map(l => `<div style="padding:4px 0; border-bottom:1px solid var(--line); display:flex; justify-content:space-between;"><span>${new Date(l.ts).toLocaleTimeString()} - ${l.task} ${l.secondary ? '(Fallback)' : ''}</span> <span>${l.model} - ${l.tokens}t</span></div>`).join('')}
                        </div>
                    </details>
                </div>

                <div class="card" style="padding:24px; margin-top:24px;">
                    <h2 style="font-size:1.2rem; margin-bottom:8px;">Display Settings</h2>
                    <p style="font-size:0.9rem; color:var(--ink-soft); margin-bottom:16px;">
                        Choose your preferred UI theme. Dark mode is easier on the eyes in low light.
                    </p>
                    <div style="display:flex; align-items:center; gap:16px;">
                        <select id="setting-theme" class="input" style="width:200px;" onchange="app.toggleTheme(this.value)">
                            <option value="system">System Default</option>
                            <option value="light">Light Mode</option>
                            <option value="dark">Dark Mode</option>
                        </select>
                    </div>
                </div>
                
                <div class="card" style="padding:24px; margin-top:24px;">
                    <h2 style="font-size:1.2rem; margin-bottom:8px;">Data Backup & Sync</h2>
                    <p style="font-size:0.9rem; color:var(--ink-soft); margin-bottom:16px;">
                        Export your entire database to a JSON file, restore from a backup, or export as QR payload.
                    </p>
                    <div style="display:flex; align-items:center; gap:16px; margin-bottom:16px;">
                        <button class="btn btn--sm" onclick="app.exportBackup()">Export Backup</button>
                        <button class="btn btn--sm" style="background:transparent; color:var(--primary); border:1px solid var(--line);" onclick="app.exportQR()"><svg class="ic" style="margin-right:4px;"><use href="#i-users"/></svg> Export QR</button>
                        <span style="font-size:0.85rem; color:var(--ink-soft);">Last export: ${lastExportText}</span>
                    </div>
                    <div style="border-top:1px solid var(--line); padding-top:16px;">
                        <label style="display:block; font-size:0.85rem; font-weight:600; margin-bottom:8px;">Import Backup</label>
                        <div style="display:flex; gap:8px;">
                            <input type="file" id="backup-file" accept=".json" class="input" style="flex:1;">
                            <button class="btn btn--sm" onclick="app.importBackup()">Restore</button>
                        </div>
                    </div>
                    
                    <div id="qr-export-container" style="display:none; margin-top:16px; padding:16px; background:white; text-align:center; border-radius:8px;">
                        <div id="qr-canvas"></div>
                        <p style="font-size:0.8rem; color:#666; margin-top:8px;">Scan with another device to transfer data. (Max ~2KB payload for standard QR, will truncate if DB is large).</p>
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

const renderPeople = async () => {
    let people = await NF.DB.getAll('people');
    people.sort((a,b) => b.last_interaction - a.last_interaction);
    
    let html = `<main class="main"><div class="wrap">
        <div class="crumb">System / Network</div>
        <div class="phead">
            <div>
                <h1 class="ptitle">Network</h1>
                <p style="color:var(--ink-soft); margin-top:8px;">Your automated Rolodex. People are automatically captured and linked when you mention @Name in your observations.</p>
            </div>
        </div>
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap:16px;">
    `;
    
    if (people.length === 0) {
        html += `<div style="grid-column: 1 / -1; padding:32px; text-align:center; color:var(--ink-faint); background:var(--card); border-radius:12px; border:1px solid var(--line);">No people captured yet. Mention someone like "@Elon" in your observations to add them.</div>`;
    } else {
        const timeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
        people.forEach(p => {
            const days = Math.round((p.last_interaction - Date.now()) / (1000 * 60 * 60 * 24));
            const activeText = days === 0 ? 'Today' : timeFormatter.format(days, 'day');
            html += `
                <div class="card" style="padding:16px; cursor:pointer;" onclick="app.go('PersonDetail', '${p.id}')">
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                        <div style="width:40px; height:40px; border-radius:50%; background:var(--primary-soft); color:var(--primary); display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:1.2rem;">
                            ${p.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style="font-weight:600; font-size:1.1rem; color:var(--ink);">${p.name}</div>
                            <div style="font-size:0.8rem; color:var(--ink-soft);">Active ${activeText}</div>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    html += `</div></div></main>`;
    return html;
};

const renderPersonDetail = async () => {
    const p = await NF.DB.get('people', NF.State.activeId);
    if (!p) return `<main class="main"><div class="wrap">Person not found.</div></main>`;
    
    const obs = await NF.DB.getAll('observations');
    const nameRegex = new RegExp(`@${p.name}\\b`, 'i');
    
    // Find observations mentioning this person
    const relatedObs = obs.filter(o => nameRegex.test(o.text));
    relatedObs.sort((a, b) => b.created_at - a.created_at);
    
    let html = `<main class="main"><div class="wrap">
        <div class="crumb"><a href="#" onclick="app.go('People'); return false;">Network</a> / ${p.name}</div>
        
        <div class="phead" style="align-items:flex-end;">
            <div>
                <span class="eyebrow">PERSON DOSSIER</span>
                <h1 class="ptitle" style="display:flex; align-items:center; gap:16px;">
                    <div style="width:64px; height:64px; border-radius:50%; background:var(--primary-soft); color:var(--primary); display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:2rem;">
                        ${p.name.charAt(0).toUpperCase()}
                    </div>
                    ${p.name}
                </h1>
            </div>
        </div>
        
        <div class="card" style="margin-bottom:32px;">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:16px;">
                <div>
                    <label class="label">Role / Company</label>
                    <input type="text" id="person-role" class="input" value="${app.escapeHtml(p.role || '')}" placeholder="e.g. CEO at Acme">
                </div>
                <div>
                    <label class="label">Phone</label>
                    <input type="text" id="person-phone" class="input" value="${app.escapeHtml(p.phone || '')}" placeholder="Phone number">
                </div>
                <div>
                    <label class="label">Trust Level (1-5)</label>
                    <input type="number" id="person-trust" class="input" value="${p.trust || 3}" min="1" max="5">
                </div>
                <div>
                    <label class="label">Favors Owed / Asked</label>
                    <input type="text" id="person-favors" class="input" value="${app.escapeHtml((p.favors?.owed || []).join(', '))}" placeholder="e.g. Intro to VC">
                </div>
            </div>
            <h2 style="font-family:'Roboto Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--primary); margin-bottom:16px;">Notes</h2>
            <textarea id="person-notes" class="input" style="min-height:100px; resize:vertical; font-size:0.9rem;" placeholder="Add private notes about ${p.name}...">${p.notes || ''}</textarea>
            <div style="display:flex; justify-content:flex-end; margin-top:12px;">
                <button class="btn btn--sm" onclick="app.savePersonNotes('${p.id}')">Save Profile</button>
            </div>
        </div>
        
        <h2 style="font-family:'Roboto Mono',monospace; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-faint); margin-bottom:24px;">Interaction Timeline (${relatedObs.length})</h2>
        <div class="stepper" style="margin-bottom:32px;">
    `;
    
    if (relatedObs.length === 0) {
        html += `<div style="color:var(--ink-faint); padding:16px 0;">No interactions recorded yet.</div>`;
    } else {
        relatedObs.forEach((o, index) => {
            const dateStr = new Date(o.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
            html += `
                <div class="stepper-item ${index === 0 ? 'active' : ''}">
                    <div class="stepper-icon"></div>
                    <div class="stepper-content">
                        <div class="stepper-title" style="font-size:0.8rem; color:var(--ink-faint);">${dateStr}</div>
                        <div class="stepper-desc" style="color:var(--ink); font-size:1rem; margin-top:4px;">${app.renderObsText(o.text)}</div>
                    </div>
                </div>
            `;
        });
    }
    
    html += `</div></div></main>`;
    return html;
};

const app = {
    addTerritory: async () => {
        const name = await app.showDialog('prompt', 'Declare Territory', 'Enter a name for this intelligence cluster:');
        if (!name) return;
        const keywordsStr = await app.showDialog('prompt', 'Keywords', 'Enter comma-separated keywords to track:');
        const keywords = keywordsStr ? keywordsStr.split(',').map(k => k.trim()) : [];
        
        await NF.DB.put('territories', {
            id: 'terr_' + Date.now(),
            name,
            keywords,
            created_at: Date.now(),
            stale: true,
            last_observation_count: 0
        });
        app.render();
    },
    editTerritoryKeywords: async (id) => {
        const t = await NF.DB.get('territories', id);
        const keywordsStr = await app.showDialog('prompt', 'Edit Keywords', 'Enter comma-separated keywords:', t.keywords.join(', '));
        if (keywordsStr !== null) {
            t.keywords = keywordsStr.split(',').map(k => k.trim()).filter(Boolean);
            t.stale = true;
            await NF.DB.put('territories', t);
            app.render();
        }
    },
    generateTerritoryPlaybook: async (id, obsCount) => {
        const t = await NF.DB.get('territories', id);
        NF.UI.toast('Generating Territory Playbook...');
        
        const obs = await NF.DB.getAll('observations') || [];
        const matchingObs = obs.filter(o => t.keywords.some(k => (o.text || '').toLowerCase().includes(k.toLowerCase())));
        
        const prompt = `We are tracking a new territory: "${t.name}".
        Evidence collected:
        ${matchingObs.map(o => o.text).join('\\n')}
        
        Generate a comprehensive playbook mapping the stakeholders, leverage points, first-mover sequencing, and capital-efficient execution angles.
        Strictly adhere to the Sharp-not-dirty doctrine.
        Return raw markdown format.`;
        
        const res = await app.generateContent(prompt, { systemInstruction: (window.PERSONAS?.STRATEGIST || '') + '\\n\\n' + (window.PERSONAS?.OPERATOR || ''), taskClass: 'board' });
        
        if (res.ok && res.text) {
            t.playbook = { content: res.text, updated_at: Date.now() };
            t.stale = false;
            t.last_observation_count = obsCount;
            await NF.DB.put('territories', t);
            app.render();
        } else {
            NF.UI.toast('Failed to generate playbook.');
        }
    },
    pasteNews: async () => {
        const text = await app.showDialog('prompt', 'Paste News / Intelligence', 'Paste the raw text of the news or event here:');
        if (!text) return;
        
        NF.UI.toast('Extracting angles...');
        const prompt = `You are the STRATEGIST and OPERATOR. Read this raw news item:
        ---
        ${text}
        ---
        Extract the core development and propose 3 to 4 distinct, highly-actionable opportunity angles.
        Format your response as a strictly valid JSON array of objects, where each object represents an angle:
        [{"title": "Angle 1", "description": "Why this matters and how to play it"}, ...]`;
        
        const angles = await app.generateJSON(prompt, { systemInstruction: (window.PERSONAS?.STRATEGIST || '') + '\\n\\n' + (window.PERSONAS?.OPERATOR || ''), taskClass: 'cluster' });
        
        if (angles && angles.length > 0) {
            // Log raw news as observation
            await NF.DB.put('observations', {
                id: 'obs_' + Date.now(),
                text: 'News Intel: ' + text.substring(0, 100) + '...',
                full_text: text,
                created_at: Date.now()
            });
            
            const div = document.createElement('div');
            div.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:9999; display:flex; justify-content:center; align-items:center; padding:16px; backdrop-filter:blur(10px);';
            div.innerHTML = `
                <div style="background:var(--card); width:100%; max-width:600px; border-radius:12px; overflow:hidden; box-shadow:0 12px 32px rgba(0,0,0,0.2); max-height:80vh; display:flex; flex-direction:column;">
                    <div style="padding:16px 24px; border-bottom:1px solid var(--line); font-weight:600;">Spawn Opportunities from News</div>
                    <div style="padding:24px; overflow-y:auto; flex:1;">
                        <p style="font-size:0.9rem; color:var(--ink-soft); margin-bottom:16px;">Select the angles you want to pursue. Unchecked ones will be discarded.</p>
                        ${angles.map((a, i) => `
                            <label style="display:flex; align-items:flex-start; margin-bottom:16px; padding:12px; border:1px solid var(--line); border-radius:8px; cursor:pointer;">
                                <input type="checkbox" id="news-angle-${i}" checked style="margin-top:4px; margin-right:12px;">
                                <div>
                                    <div style="font-weight:600; margin-bottom:4px;">${app.escapeHtml(a.title)}</div>
                                    <div style="font-size:0.85rem; color:var(--ink-soft);">${app.escapeHtml(a.description)}</div>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                    <div style="padding:16px 24px; border-top:1px solid var(--line); display:flex; justify-content:flex-end; gap:12px;">
                        <button class="btn" id="news-cancel">Cancel</button>
                        <button class="btn btn--primary" id="news-save">Spawn Selected</button>
                    </div>
                </div>
            `;
            document.body.appendChild(div);
            
            document.getElementById('news-cancel').onclick = () => document.body.removeChild(div);
            document.getElementById('news-save').onclick = async () => {
                for (let i = 0; i < angles.length; i++) {
                    if (document.getElementById(`news-angle-${i}`).checked) {
                        const draft = await app.draftOpportunityExit(angles[i].title);
                        await NF.DB.put('opportunities', {
                            id: 'opp_' + Date.now() + '_' + i,
                            title: angles[i].title,
                            leverage: 5,
                            velocity: 5,
                            conviction: 5,
                            calculated_score: 50,
                            status: 'Validation',
                            next_action: 'Define specific target audience',
                            exit_conditions: draft.exit_conditions || '',
                            exit_deadline: draft.exit_deadline || '',
                            evidence: [],
                            observations: [],
                            created_at: Date.now()
                        });
                    }
                }
                document.body.removeChild(div);
                app.go('Pipeline');
            };
        } else {
            NF.UI.toast('Failed to extract angles.');
        }
    },
    addBusinessMilestone: async (bizId, label) => {
        if (!bizId) return;
        const biz = await NF.DB.get('businesses', bizId);
        if (!biz) return;
        biz.milestones = biz.milestones || [];
        biz.milestones.push({ date: new Date().toISOString(), label });
        biz.updated_at = new Date().toISOString();
        await NF.DB.put('businesses', biz);
    },
    
    showWelcomeOverlay: () => {
        let step = 1;
        const div = document.createElement('div');
        div.style.cssText = 'position:fixed; inset:0; background:var(--bg); z-index:9999; display:flex; flex-direction:column; justify-content:center; align-items:center; padding:24px; text-align:center; transition:opacity 0.3s;';
        document.body.appendChild(div);
        
        const renderStep = () => {
            let content = '';
            if (step === 1) content = `
                <div style="font-size:3rem; margin-bottom:16px;">👋</div>
                <h1 style="font-family:'Roboto', sans-serif; font-size:2rem; margin-bottom:16px; color:var(--ink);">Welcome to Dhaula</h1>
                <p style="font-size:1.1rem; color:var(--ink-soft); max-width:400px; line-height:1.6; margin-bottom:32px;">You capture raw observations from the field. Our local Pattern Engine clusters them into emerging industry themes.</p>
                <button class="btn btn--primary btn--lg" onclick="document.getElementById('welcome-next').click()">Next</button>
            `;
            else if (step === 2) content = `
                <div style="font-size:3rem; margin-bottom:16px;">⚙️</div>
                <h1 style="font-family:'Roboto', sans-serif; font-size:2rem; margin-bottom:16px; color:var(--ink);">The Engine</h1>
                <p style="font-size:1.1rem; color:var(--ink-soft); max-width:400px; line-height:1.6; margin-bottom:32px;">When a pattern gains enough momentum, the engine promotes it. You can explicitly "Convene the Board" to debate it and spawn structured Opportunities.</p>
                <button class="btn btn--primary btn--lg" onclick="document.getElementById('welcome-next').click()">Next</button>
            `;
            else if (step === 3) content = `
                <div style="font-size:3rem; margin-bottom:16px;">🎯</div>
                <h1 style="font-family:'Roboto', sans-serif; font-size:2rem; margin-bottom:16px; color:var(--ink);">The Board</h1>
                <p style="font-size:1.1rem; color:var(--ink-soft); max-width:400px; line-height:1.6; margin-bottom:32px;">Manage your active bets on the Desk through stage-gates. Kill bad ideas fast, double down on traction. Let's get to work.</p>
                <button class="btn btn--primary btn--lg" onclick="document.getElementById('welcome-next').click()">Start</button>
            `;
            
            div.innerHTML = content + `<button id="welcome-next" style="display:none;"></button>`;
            document.getElementById('welcome-next').onclick = () => {
                if (step < 3) { step++; renderStep(); }
                else {
                    div.style.opacity = '0';
                    setTimeout(() => document.body.removeChild(div), 300);
                }
            };
        };
        renderStep();
    },

    openOmniSearch: () => {
        app._omniFilter = 'all';
        const div = document.createElement('div');
        div.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:10000; display:flex; justify-content:center; align-items:flex-start; padding-top:10vh;';
        div.innerHTML = `
            <div style="background:var(--card); width:100%; max-width:600px; border-radius:12px; box-shadow:var(--shadow); overflow:hidden; display:flex; flex-direction:column;">
                <input type="text" id="omni-input" class="input" placeholder="Search everywhere (Ctrl+K)..." style="width:100%; border:none; border-bottom:1px solid var(--line); border-radius:0; padding:20px; font-size:1.1rem; outline:none;" autocomplete="off">
                <div style="padding:12px 20px; border-bottom:1px solid var(--line); display:flex; gap:8px; background:var(--bg);" id="omni-filters">
                    <button class="pill" data-filter="all" style="border:none; cursor:pointer;">All</button>
                    <button class="pill" data-filter="obs" style="border:none; cursor:pointer;">Notes</button>
                    <button class="pill" data-filter="opps" style="border:none; cursor:pointer;">Deals</button>
                    <button class="pill" data-filter="pats" style="border:none; cursor:pointer;">Patterns</button>
                    <button class="pill" data-filter="ppl" style="border:none; cursor:pointer;">People</button>
                </div>
                <div id="omni-results" style="max-height:60vh; overflow-y:auto; padding:8px;"></div>
            </div>
        `;
        document.body.appendChild(div);
        
        const input = document.getElementById('omni-input');
        const results = document.getElementById('omni-results');
        const filterBtns = div.querySelectorAll('#omni-filters button');
        
        const updateFilters = () => {
            filterBtns.forEach(b => {
                if(b.dataset.filter === app._omniFilter) {
                    b.classList.add('pill--brand');
                    b.style.background = 'var(--primary)';
                    b.style.color = '#fff';
                } else {
                    b.classList.remove('pill--brand');
                    b.style.background = 'transparent';
                    b.style.color = 'var(--ink-faint)';
                    b.style.boxShadow = 'inset 0 0 0 1px var(--line)';
                }
            });
        };
        updateFilters();
        
        const highlight = (text, q) => {
            if (!q) return app.escapeHtml(text);
            const safeQ = q.replace(/[.*+?^$\{()|[\]\\]/g, '\\$&');
            const regex = new RegExp('(' + safeQ + ')', 'gi');
            return app.escapeHtml(text).replace(regex, '<mark style="background:var(--watch); color:#000; padding:0 2px; border-radius:2px;">$1</mark>');
        };

        const executeSearch = async () => {
            const q = input.value.toLowerCase().trim();
            if (!q) { results.innerHTML = ''; return; }
            
            const obs = await NF.DB.getAll('observations');
            const opps = await NF.DB.getAll('opportunities');
            const pats = await NF.DB.getAll('patterns');
            const ppl = await NF.DB.getAll('people');
            
            let r_obs = obs.filter(o => o.text.toLowerCase().includes(q));
            let r_opps = opps.filter(o => o.title.toLowerCase().includes(q));
            let r_pats = pats.filter(p => p.title.toLowerCase().includes(q));
            let r_ppl = ppl.filter(p => p.name.toLowerCase().includes(q));
            
            if (app._omniFilter !== 'all') {
                if (app._omniFilter !== 'obs') r_obs = [];
                if (app._omniFilter !== 'opps') r_opps = [];
                if (app._omniFilter !== 'pats') r_pats = [];
                if (app._omniFilter !== 'ppl') r_ppl = [];
            }
            
            if (app._omniFilter === 'all') {
                r_obs = r_obs.slice(0,3);
                r_opps = r_opps.slice(0,3);
                r_pats = r_pats.slice(0,3);
                r_ppl = r_ppl.slice(0,3);
            }
            
            let html = '';
            r_opps.forEach(o => html += `<div style="padding:12px; cursor:pointer; border-radius:8px;" onclick="document.body.removeChild(this.parentElement.parentElement.parentElement); app.go('Opportunity', '${o.id}')"><div style="font-size:0.75rem; color:var(--ink-faint); font-family:'Roboto Mono',monospace; margin-bottom:4px;">OPPORTUNITY</div><div style="font-weight:600; color:var(--ink); line-height:1.4;">${highlight(o.title, q)}</div></div>`);
            r_pats.forEach(p => html += `<div style="padding:12px; cursor:pointer; border-radius:8px;" onclick="document.body.removeChild(this.parentElement.parentElement.parentElement); app.go('Pattern', '${p.id}')"><div style="font-size:0.75rem; color:var(--ink-faint); font-family:'Roboto Mono',monospace; margin-bottom:4px;">PATTERN</div><div style="font-weight:600; color:var(--ink); line-height:1.4;">${highlight(p.title, q)}</div></div>`);
            r_ppl.forEach(p => html += `<div style="padding:12px; cursor:pointer; border-radius:8px;" onclick="document.body.removeChild(this.parentElement.parentElement.parentElement); app.goPersonByName('${p.name}')"><div style="font-size:0.75rem; color:var(--ink-faint); font-family:'Roboto Mono',monospace; margin-bottom:4px;">PERSON</div><div style="font-weight:600; color:var(--ink); line-height:1.4;">${highlight(p.name, q)}</div></div>`);
            r_obs.forEach(o => html += `<div style="padding:12px; cursor:pointer; border-radius:8px;" onclick="document.body.removeChild(this.parentElement.parentElement.parentElement);"><div style="font-size:0.75rem; color:var(--ink-faint); font-family:'Roboto Mono',monospace; margin-bottom:4px;">OBSERVATION</div><div style="color:var(--ink-soft); font-size:0.9rem; line-height:1.5;">${highlight(o.text, q)}</div></div>`);
            
            results.innerHTML = html || '<div style="padding:32px; color:var(--ink-faint); text-align:center;">No results found</div>';
        };

        input.focus();
        div.onclick = (e) => { if (e.target === div) document.body.removeChild(div); };
        input.oninput = executeSearch;
        
        filterBtns.forEach(b => b.onclick = () => {
            app._omniFilter = b.dataset.filter;
            updateFilters();
            executeSearch();
            input.focus();
        });
    },

    dismissBackupBanner: async () => {
        await NF.DB.setSetting('backup_banner_dismissed', true);
        app.render();
    },
    
    processBulkImport: async () => {
        const val = document.getElementById('bulk-import-input').value.trim();
        if (!val) return;
        const lines = val.split('\n').map(l => l.trim()).filter(Boolean);
        for (let l of lines) {
            await NF.DB.put('observations', {
                text: l,
                processed: false,
                created_at: Date.now()
            });
        }
        NF.UI.toast(`Imported ${lines.length} observations.`);
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
    go: async (context, id = null) => {
        NF.State.context = context;
        NF.State.activeId = id;
        
        if (id) {
            let entityType = null;
            if (context === 'Opportunity') entityType = 'opportunities';
            else if (context === 'PersonDetail') entityType = 'people';
            else if (context === 'BusinessDetail') entityType = 'businesses';
            
            if (entityType) {
                const item = await NF.DB.get(entityType, id);
                if (item) {
                    item.last_seen_at = new Date().toISOString();
                    await NF.DB.put(entityType, item);
                }
            }
        }
        
        app.render();
    },
    
    timeAgo: (dateString) => {
        if (!dateString) return '';
        const now = new Date();
        const past = new Date(dateString);
        const diffInSeconds = Math.floor((now - past) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 30) return `${diffInDays}d ago`;
        const diffInMonths = Math.floor(diffInDays / 30);
        if (diffInMonths < 12) return `${diffInMonths}mo ago`;
        const diffInYears = Math.floor(diffInDays / 365);
        return `${diffInYears}y ago`;
    },
    
    formatCurrency: (num) => {
        if (num === null || num === undefined) return '0';
        return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(num);
    },
    
    renderRelativeTime: (dateString) => {
        if (!dateString) return '';
        return `<span title="${app.escapeHtml(dateString)}">${app.timeAgo(dateString)}</span>`;
    },
    
    generateSparkline: (obsIds, allObs) => {
        const now = Date.now();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        const start = now - thirtyDays;
        let bins = new Array(30).fill(0);
        const patternObs = allObs.filter(o => obsIds.includes(o.id) && new Date(o.created_at).getTime() >= start);
        patternObs.forEach(o => {
            const time = new Date(o.created_at).getTime();
            const dayIdx = Math.floor((time - start) / (24 * 60 * 60 * 1000));
            if (dayIdx >= 0 && dayIdx < 30) bins[dayIdx]++;
        });
        const max = Math.max(1, ...bins);
        const width = 60;
        const height = 20;
        const dx = width / 29;
        let points = bins.map((val, i) => `${i * dx},${height - (val / max) * height}`).join(' ');
        return `<svg width="${width}" height="${height}" style="overflow:visible;" viewBox="0 0 ${width} ${height}"><polyline points="${points}" fill="none" stroke="var(--primary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    },
    generateHeatmap: (allObs) => {
        const now = new Date();
        now.setHours(0,0,0,0);
        const days = 35;
        const start = now.getTime() - (days - 1) * 86400000;
        let bins = new Array(days).fill(0);
        allObs.forEach(o => {
            const time = new Date(o.created_at).setHours(0,0,0,0);
            const dayIdx = Math.floor((time - start) / 86400000);
            if (dayIdx >= 0 && dayIdx < days) bins[dayIdx]++;
        });
        let html = '<div class="heat-grid">';
        bins.forEach(val => {
            let heat = 0;
            if (val >= 5) heat = 4;
            else if (val >= 3) heat = 3;
            else if (val >= 2) heat = 2;
            else if (val >= 1) heat = 1;
            html += `<div class="heat-cell" data-heat="${heat}" title="${val} captures"></div>`;
        });
        html += '</div>';
        return html;
    },
    
    render: async () => {
        const root = document.getElementById('app-root');
        const jobs = await NF.DB.getAll('ai_jobs');
        const pendingJobsCount = jobs.filter(j => j.status === 'pending').length;
        let html = renderSidebar(pendingJobsCount);
        
        if (NF.State.context === 'Morning') {
            html += await renderMorning();
        } else if (NF.State.context === 'Discovery') html += await renderDiscovery();
        else if (NF.State.context === 'Pipeline') html += await renderPipeline();
        else if (NF.State.context === 'Opportunity') html += await renderOpportunity();
        else if (NF.State.context === 'Territories') html += await renderTerritories();
        else if (NF.State.context === 'TerritoryDetail') html += await renderTerritoryDetail();
        else if (NF.State.context === 'Businesses') html += await renderBusinesses();
        else if (NF.State.context === 'BusinessDetail') html += await renderBusinessDetail();
        else if (NF.State.context === 'People') html += await renderPeople();
        else if (NF.State.context === 'PersonDetail') html += await renderPersonDetail();
        else if (NF.State.context === 'Settings') html += await renderSettings();
        else if (NF.State.context === 'Analytics') html += await renderAnalytics();
        
        root.innerHTML = html;
        
        // Add FAB for mobile capture
        root.innerHTML += `<button class="fab-mobile" onclick="app.toggleUniversalCapture()"><svg class="ic"><use href="#i-bulb"/></svg></button>`;
        
        // Add Mobile More Menu
        root.innerHTML += `
        <div id="mobnav-more" onclick="if(event.target===this) app.toggleMoreMenu()" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:9998; align-items:flex-end;">
            <div style="width:100%; background:var(--card); border-radius:16px 16px 0 0; padding-bottom:env(safe-area-inset-bottom);">
                <div style="padding:16px 24px; border-bottom:1px solid var(--line); font-weight:600;">More Options</div>
                <a class="navlink" onclick="app.toggleMoreMenu(); app.go('Discovery')" style="display:flex; padding:16px 24px; border-bottom:1px solid var(--line); align-items:center; gap:12px; color:var(--ink); text-decoration:none;"><svg class="ic"><use href="#i-bulb"/></svg> Discovery Feed</a>
                <a class="navlink" onclick="app.toggleMoreMenu(); app.go('People')" style="display:flex; padding:16px 24px; border-bottom:1px solid var(--line); align-items:center; gap:12px; color:var(--ink); text-decoration:none;"><svg class="ic"><use href="#i-people"/></svg> Network</a>
                <a class="navlink" onclick="app.toggleMoreMenu(); app.go('Analytics')" style="display:flex; padding:16px 24px; border-bottom:1px solid var(--line); align-items:center; gap:12px; color:var(--ink); text-decoration:none;"><svg class="ic"><use href="#i-spark"/></svg> Analytics & Review</a>
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
    savePersonNotes: async (personId) => {
        const p = await NF.DB.get('people', personId);
        if (p) {
            p.notes = document.getElementById('person-notes').value;
            p.role = document.getElementById('person-role').value;
            p.phone = document.getElementById('person-phone').value;
            p.trust = parseInt(document.getElementById('person-trust').value) || 3;
            p.favors = p.favors || { asked: [], owed: [] };
            const favorsStr = document.getElementById('person-favors').value;
            if (favorsStr) p.favors.owed = favorsStr.split(',').map(s => s.trim());
            else p.favors.owed = [];
            
            await NF.DB.put('people', p);
            NF.UI.toast('Profile saved.');
        }
    },
    goPersonByName: async (name) => {
        const people = await NF.DB.getAll('people');
        const p = people.find(x => x.name.toLowerCase() === name.toLowerCase());
        if (p) {
            app.toggleMoreMenu();
            app.go('PersonDetail', p.id);
        } else {
            NF.UI.toast('Person not found.');
        }
    },
    renderObsText: (text) => {
        let escaped = app.escapeHtml(text);
        return escaped.replace(/@([A-Za-z0-9_]+)/g, '<a href="#" onclick="app.goPersonByName(\'$1\'); return false;" class="pill pill--brand" style="cursor:pointer; display:inline-block; padding:2px 6px; margin:0 2px;">@$1</a>');
    },
    toggleTheme: (val) => {
        let theme = val;
        if (val === 'system') {
            localStorage.removeItem('nf_theme');
            theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        } else {
            localStorage.setItem('nf_theme', val);
        }
        document.documentElement.setAttribute('data-theme', theme);
    },

    importBase64: async (b64) => {
        try {
            const str = decodeURIComponent(escape(atob(b64)));
            const payload = JSON.parse(str);
            if (payload && payload.stores) {
                const confirm = await app.showDialog('confirm', 'Import Sync Data', 'Do you want to import this sync payload? Existing matching records will be updated.');
                if (confirm) {
                    await NF.DB.importAll(payload);
                    NF.UI.toast('Sync payload imported successfully.');
                    window.location.href = window.location.pathname; // Clean URL
                }
            }
        } catch (e) {
            NF.UI.toast('Failed to parse sync data.');
            console.error('Import QR Error:', e);
        }
    },
    exportQR: async () => {
        const payload = await NF.DB.exportAll();
        // Since DBs can get large quickly, we compress and chunk or fallback to base64.
        const str = JSON.stringify(payload);
        const b64 = btoa(unescape(encodeURIComponent(str)));
        
        const cont = document.getElementById('qr-export-container');
        cont.style.display = 'block';
        cont.innerHTML = `<h3 style="color:#000;">Scan with Camera</h3><img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent('northos://import?data=' + b64.slice(0, 1500))}" style="margin-top:16px;">
        <p style="font-size:0.8rem; color:#666; margin-top:8px;">Note: V1 QR Export currently limits payload to ~1.5KB.</p>`;
    },
    saveSettings: async () => {
        const apiKey = document.getElementById('setting-api-key').value.trim();
        if (apiKey !== "") {
            await NF.DB.setSetting('gemini_api_key', apiKey);
        }
        
        const apiKeySec = document.getElementById('setting-api-key-secondary').value.trim();
        if (apiKeySec !== "") {
            await NF.DB.setSetting('gemini_api_key_secondary', apiKeySec);
        }
        
        const taskClasses = ['capture', 'cluster', 'board', 'chat', 'brief'];
        for(let tc of taskClasses) {
            const m = document.getElementById('setting-model-' + tc);
            const t = document.getElementById('setting-temp-' + tc);
            if (m && m.value) await NF.DB.setSetting('ai_model_' + tc, m.value);
            if (t && t.value) await NF.DB.setSetting('ai_temp_' + tc, parseFloat(t.value));
        }
        
        const biases = document.getElementById('setting-biases').value.split('\n').map(s => s.trim()).filter(Boolean);
        let intel = await NF.DB.getSetting('founder_intel') || {};
        intel.biases = biases;
        await NF.DB.setSetting('founder_intel', intel);
        
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
    processJobQueue: async () => {
        const apiKey = await NF.DB.getSetting('gemini_api_key');
        if (!apiKey) return;
        
        const jobs = await NF.DB.getAll('ai_jobs');
        const pending = jobs.filter(j => j.status === 'pending');
        if (pending.length === 0) return;
        
        for (let job of pending) {
            if (job.type === 'vision_ocr') {
                const obs = await NF.DB.get('observations', job.target_id);
                if (!obs) continue;
                const media = await NF.DB.get('media', obs.media_id);
                if (!media || !media.data) continue;
                
                // Assuming data is data URL: data:image/jpeg;base64,.....
                const mime = media.data.split(';')[0].split(':')[1];
                const base64 = media.data.split(',')[1];
                
                const prompt = "Extract any text from this image and provide a brief description of the contents. Only return the text and description, no markdown or preamble.";
                
                const body = {
                    contents: [{
                        parts: [
                            { text: prompt },
                            { inlineData: { mimeType: mime, data: base64 } }
                        ]
                    }],
                    generationConfig: { temperature: 0.1 }
                };
                
                try {
                    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
                        body: JSON.stringify(body)
                    });
                    if (res.ok) {
                        const data = await res.json();
                        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text) {
                            obs.text = text;
                            await NF.DB.put('observations', obs);
                            job.status = 'completed';
                            await NF.DB.put('ai_jobs', job);
                            app.render();
                        }
                    } else {
                        job.status = 'failed';
                        await NF.DB.put('ai_jobs', job);
                    }
                } catch(e) {
                    console.error("Job OCR Failed", e);
                }
            }
        }
    },
    runGraveyardAnalysis: async () => {
        const opps = await NF.DB.getAll('opportunities');
        const dead = opps.filter(o => o.status === 'Graveyard');
        if (dead.length === 0) {
            NF.UI.toast('No graveyard deals to analyze.');
            return;
        }
        
        NF.UI.toast('Running Graveyard Analysis...');
        const prompt = `Analyze these dead deals. Group them into recurring failure modes (e.g. "Pricing too high", "Timing off").
        Format strictly as JSON array of objects: [{"reason": "Brief Name", "count": number}]
        Return raw JSON only.
        
        Deals:
        ${dead.map(d => `Title: ${d.title} | Exit Conditions: ${d.exit_conditions}`).join('\\n')}`;
        
        let clusters = await app.generateJSON(prompt, { systemInstruction: "You are a ruthless post-mortem analyst.", taskClass: 'cluster' });
        if (clusters) {
            await NF.DB.setSetting('graveyard_clusters', clusters);
            app.render();
            NF.UI.toast('Analysis complete.');
        } else {
            NF.UI.toast('Analysis failed.');
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
                            let p = {
                                id: patternId,
                                title: cluster.title,
                                status: 'Emerging',
                                observation_ids: cluster.observation_ids
                            };
                            await NF.DB.put('patterns', p);
                    
                    if (p.status === 'Emerging') {
                        const firstHit = await NF.DB.getSetting('milestone_first_pattern');
                        if (!firstHit) {
                            await NF.DB.setSetting('milestone_first_pattern', true);
                            NF.UI.toast(`🎯 Milestone: First Pattern Emerged! (${p.title})`, { duration: 8000 });
                        }
                    }
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
    generateSundayReport: async () => {
        const btn = document.querySelector('[onclick="app.generateSundayReport()"]');
        if (btn) btn.innerText = "Generating...";
        const container = document.getElementById('sunday-report-container');
        if (container) container.innerHTML = '<div class="skeleton"></div>';
        
        const obs = await NF.DB.getAll('observations');
        const patterns = await NF.DB.getAll('patterns');
        const opps = await NF.DB.getAll('opportunities');
        
        const lastWeek = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const recentObs = obs.filter(o => o.created_at > lastWeek);
        const recentPatterns = patterns.filter(p => p.status === 'Emerging');
        const stalledOpps = opps.filter(o => o.status !== 'Archived' && o.status !== 'Scale' && o.exit_deadline && o.exit_deadline < new Date().toISOString().split('T')[0]);
        
        const prompt = `You are a ruthless Chief of Staff writing the Sunday Report for the founder.
        Recent captures (${recentObs.length}): ${recentObs.map(o => o.text).join(' | ')}
        Emerging themes (${recentPatterns.length}): ${recentPatterns.map(p => p.title).join(' | ')}
        Stalled deals (${stalledOpps.length}): ${stalledOpps.map(o => o.title).join(' | ')}
        
        Synthesize this week's field observations and patterns. Highlight cluster movement, explicitly call out the stalled deals, and recommend ONE focus for the upcoming week.
        Keep it concise, actionable, and formatted in HTML without markdown block backticks. Use <h3>, <p>, and <ul>.`;
        
        const res = await NF.AI.generateCachedContent(prompt, { taskClass: 'brief', noCache: true });
        
        if (btn) btn.innerText = "Generate";
        if (res && res.ok && container) {
            let htmlRes = res.text.replace(/```html/gi, '').replace(/```/g, '').trim();
            container.innerHTML = `
                <div style="background:#fff; padding:24px; border:1px solid var(--line); border-radius:8px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:16px;">
                        <span class="report-header" style="font-weight:600; color:var(--primary);">DHAULA OS - SUNDAY REPORT</span>
                        <span style="color:var(--ink-soft);">${new Date().toLocaleDateString()}</span>
                    </div>
                    ${htmlRes}
                    <button class="btn btn--sm" style="margin-top:16px;" onclick="window.print()">Print Report</button>
                </div>
            `;
        } else if (container) {
            container.innerHTML = `<p style="color:#c92a2a;">Failed to generate report.</p>`;
        }
    },
    
    askNorth: async () => {
        const input = document.getElementById('ask-north-input');
        const query = input.value.trim();
        if (!query) return;
        
        const btn = document.querySelector('[onclick="app.askNorth()"]');
        if (btn) btn.innerText = "Searching...";
        
        const container = document.getElementById('ask-north-results');
        if (container) container.innerHTML = '<div class="skeleton"></div>';
        
        const keywords = query.toLowerCase().split(' ').filter(w => w.length > 3);
        const obs = await NF.DB.getAll('observations');
        const people = await NF.DB.getAll('people');
        
        let contextText = '';
        if (keywords.length > 0) {
            const matches = obs.filter(o => keywords.some(kw => o.text.toLowerCase().includes(kw)));
            matches.sort((a,b) => b.created_at - a.created_at);
            const top15 = matches.slice(0, 15);
            contextText = top15.map(o => `- ${o.text} (Date: ${new Date(o.created_at).toLocaleDateString()})`).join('\n');
            
            const matchedPeople = people.filter(p => keywords.some(kw => p.name.toLowerCase().includes(kw) || (p.notes && p.notes.toLowerCase().includes(kw))));
            if (matchedPeople.length > 0) {
                contextText += '\n\nPeople Context:\n' + matchedPeople.map(p => `- ${p.name}, Role: ${p.role}, Notes: ${p.notes}`).join('\n');
            }
        }
        
        const prompt = `User Query: "${query}"\n\nDatabase Context (Ground your answer strictly in this data):\n${contextText || 'No direct context found.'}\n\nProvide a concise, cited answer formatted as HTML (no markdown code blocks). If the data doesn't answer it, state that explicitly based on the context.`;
        
        const res = await NF.AI.generateCachedContent(prompt, { taskClass: 'brief' }, 12);
        
        if (btn) btn.innerText = "Ask";
        if (res && res.ok && container) {
            let htmlRes = res.text.replace(/```html/gi, '').replace(/```/g, '').trim();
            container.innerHTML = `
                <div style="background:#fff; padding:16px; border:1px solid var(--line); border-radius:8px; font-size:0.95rem; line-height:1.5;">
                    ${htmlRes}
                </div>
            `;
        } else if (container) {
            container.innerHTML = `<p style="color:#c92a2a;">Failed to query Ask Dhaula.</p>`;
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
        const res = await NF.AI.generateCachedContent(prompt, { taskClass: 'brief' }, 24);
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
        Unit Economics: Price: ${opp.unit_economics?.price}, Cost: ${opp.unit_economics?.cost}, Volume: ${opp.unit_economics?.volume}
        
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
    promoteToNextAction: async (oppId, action) => {
        const opp = await NF.DB.get('opportunities', oppId);
        if (!opp) return;
        opp.next_action = action;
        
        const date = await app.showDialog('prompt', 'Due Date', 'When is this due? (YYYY-MM-DD):');
        if (date) {
            opp.next_action_due = date;
        }
        
        await NF.DB.put('opportunities', opp);
        NF.UI.toast('Promoted to Next Action');
        app.render();
    },
    generatePlaybook: async (oppId) => {
        const opp = await NF.DB.get('opportunities', oppId);
        const btn = document.getElementById('btn-playbook');
        if (btn) btn.innerHTML = 'Generating...';
        
        const prompt = `You are the STRATEGIST and OPERATOR. Generate a playbook for this opportunity: "${opp.title}".
        Status: ${opp.status}. Next Action: ${opp.next_action}.
        
        Return strictly valid JSON in this format:
        {
          "angles": ["Angle 1", "Angle 2"],
          "stakeholders": [{"name": "Role", "leverage": "How to influence"}],
          "first72": ["Action 1", "Action 2", "Action 3"],
          "positioning": "Strategic positioning statement",
          "capital": "Capital math and efficiency",
          "deal_closing_kit": "If this is a service/B2B deal, include 3-tier pricing anchor and scripts. Otherwise omit."
        }
        
        Remember the Sharp-not-dirty doctrine.`;
        
        const res = await app.generateJSON(prompt, { systemInstruction: (window.PERSONAS?.STRATEGIST || '') + '\\n\\n' + (window.PERSONAS?.OPERATOR || ''), taskClass: 'board' });
        
        if (res) {
            opp.playbook = res;
            await NF.DB.put('opportunities', opp);
            app.render();
        } else {
            NF.UI.toast('Failed to generate playbook.');
        }
        if (btn) btn.innerHTML = '<svg class="ic" style="margin-right:6px;"><use href="#i-target"/></svg> Playbook';
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
        
        const res = await NF.AI.generateCachedContent(prompt, { systemInstruction: sysPrompt, taskClass: 'chat' }, 24);
        
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
        await NF.DB.setSetting('capture_draft', el.value);
    },
    
    _ucPhotoBlob: null,
    handlePhotoSelect: (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            app._ucPhotoBlob = ev.target.result;
            const preview = document.getElementById('uc-photo-preview');
            preview.style.display = 'block';
            preview.style.backgroundImage = `url(${app._ucPhotoBlob})`;
        };
        reader.readAsDataURL(file);
    },
    clearPhoto: () => {
        app._ucPhotoBlob = null;
        document.getElementById('uc-photo').value = '';
        document.getElementById('uc-photo-preview').style.display = 'none';
    },

    _jaccard: (s1, s2) => {
        const w1 = new Set(s1.toLowerCase().split(/\\W+/).filter(Boolean));
        const w2 = new Set(s2.toLowerCase().split(/\\W+/).filter(Boolean));
        if (w1.size===0 || w2.size===0) return 0;
        const intersection = new Set([...w1].filter(x => w2.has(x)));
        const union = new Set([...w1, ...w2]);
        return intersection.size / union.size;
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
    
    captureObservation: async (forceBypassCheck = false) => {
        let text = document.getElementById('uc-input').value.trim();
        const photoBlob = app._ucPhotoBlob;
        
        if(!text && !photoBlob) {
            app.toggleUniversalCapture();
            return;
        }
        
        // Jaccard Duplicate Check
        if (text && !forceBypassCheck) {
            const recentObs = (await NF.DB.getAll('observations')).slice(0, 100);
            for (let ro of recentObs) {
                if (app._jaccard(text, ro.text) >= 0.7) {
                    const merge = await app.showDialog('confirm', 'Near Duplicate Found', 'This observation looks very similar to an existing one. Append to existing or save as new?');
                    if (merge) {
                        ro.text_history = ro.text_history || [];
                        ro.text_history.push(ro.text);
                        ro.text += '\\n' + text;
                        await NF.DB.put('observations', ro);
                        document.getElementById('uc-input').value = '';
                        await NF.DB.setSetting('capture_draft', '');
                        app.clearPhoto();
                        app.toggleUniversalCapture();
                        app.render();
                        return;
                    } else {
                        break; // Save as new
                    }
                }
            }
        }
        
        let mediaId = null;
        if (photoBlob) {
            mediaId = 'media_' + Date.now();
            await NF.DB.put('media', { id: mediaId, data: photoBlob, created_at: Date.now() });
        }
        
        document.getElementById('uc-input').value = '';
        await NF.DB.setSetting('capture_draft', '');
        app.clearPhoto();
        app.toggleUniversalCapture();
        
        let lat = null, lng = null;
        try {
            const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
            });
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
        } catch (e) {
            // gracefully fallback if denied or timeout
        }
        
        // Optimistic Save
        const obsObj = {
            text: text || '(Photo Attachment)',
            processed: false,
            media_id: mediaId,
            location: lat ? { lat, lng } : null,
            created_at: Date.now()
        };
        const obsId = await NF.DB.put('observations', obsObj);
        app.render();
        
        if (mediaId && !text) {
            // Queue for vision processing
            await NF.DB.put('ai_jobs', {
                id: 'job_' + Date.now(),
                type: 'vision_ocr',
                target_id: obsId,
                status: 'pending',
                created_at: Date.now()
            });
            app.render(); // Update pending badge
            app.processJobQueue(); // Attempt to process immediately if online
        }
        
        let undoClicked = false;
        
        // Extract @names and upsert to people store
        const nameRegex = /@([A-Za-z0-9_]+)/g;
        let match;
        const capturedPeople = [];
        while ((match = nameRegex.exec(text)) !== null) {
            const name = match[1];
            capturedPeople.push(name);
            const existingPeople = await NF.DB.getAll('people');
            const existing = existingPeople.find(p => p.name.toLowerCase() === name.toLowerCase());
            if (!existing) {
                await NF.DB.put('people', { name: name, business_id: null, trust_level: 'Neutral', created_at: Date.now() });
            }
            if (existing) {
                existing.last_interaction = Date.now();
                await NF.DB.put('people', existing);
            } else {
                await NF.DB.put('people', {
                    name: name,
                    created_at: Date.now(),
                    last_interaction: Date.now(),
                    notes: '',
                    role: '',
                    business_id: null,
                    phone: '',
                    trust: 3,
                    favors: { asked: [], owed: [] }
                });
            }
        }
        
        if (capturedPeople.length > 0) {
            NF.UI.toast(`Captured and linked to: ${capturedPeople.join(', ')}`);
        }
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
            const stageGates = STAGE_GATES[opp.status] || [];
            const checkedCount = (opp.gates_checked || []).length;
            
            if (stageGates.length > 0 && checkedCount < stageGates.length) {
                const override = await app.showDialog('prompt', 'Stage Gates Incomplete', `You have only cleared ${checkedCount}/${stageGates.length} gates for ${opp.status}. To force advance, type 'OVERRIDE'.`);
                if (override !== 'OVERRIDE') return;
                
                opp.evidence = opp.evidence || [];
                opp.evidence.push(`Forced stage advance from ${opp.status} without clearing all gates.`);
            } else {
                const confirmed = await app.showDialog('confirm', 'Advance Stage', `Move to ${LIFECYCLE[idx+1]}? Have you met the exit conditions?`);
                if (!confirmed) return;
            }
            
            if (opp.status === 'First Sale') {
                const customer = await app.showDialog('prompt', 'First Customer', 'Who is the first paying customer?');
                if (customer) opp.first_customer = customer;
                
                const firstSaleHit = await NF.DB.getSetting('milestone_first_sale');
                if (!firstSaleHit) {
                    await NF.DB.setSetting('milestone_first_sale', true);
                    NF.UI.toast(`🎯 Milestone: First Sale Achieved! (${opp.title})`, { duration: 8000 });
                }
            }
            
            opp.status = LIFECYCLE[idx+1];
            opp.gates_checked = []; // reset for next stage
            if (opp.business_id) await app.addBusinessMilestone(opp.business_id, `Advanced to ${opp.status}`);
            await NF.DB.put('opportunities', opp);
            app.animatingStageOppId = opp.id;
            app.render();
            setTimeout(() => {
                if (app.animatingStageOppId === opp.id) {
                    app.animatingStageOppId = null;
                    app.render();
                }
            }, 650);
        } else {
            NF.UI.toast(`This opportunity has reached maximum enterprise value (${LIFECYCLE[LIFECYCLE.length - 1]}).`);
        }
    },
    
    toggleGate: async (oppId, gateIndex) => {
        const opp = await NF.DB.get('opportunities', oppId);
        if (!opp.gates_checked) opp.gates_checked = [];
        if (opp.gates_checked.includes(gateIndex)) {
            opp.gates_checked = opp.gates_checked.filter(g => g !== gateIndex);
        } else {
            opp.gates_checked.push(gateIndex);
        }
        await NF.DB.put('opportunities', opp);
        app.render();
    },
    
    addSubtask: async (oppId) => {
        const title = await app.showDialog('prompt', 'New Subtask', 'What is the subtask?');
        if (!title) return;
        const opp = await NF.DB.get('opportunities', oppId);
        if (!opp.subtasks) opp.subtasks = [];
        opp.subtasks.push({ title, checked: false });
        await NF.DB.put('opportunities', opp);
        app.render();
    },
    
    toggleSubtask: async (oppId, index) => {
        const opp = await NF.DB.get('opportunities', oppId);
        if (opp.subtasks && opp.subtasks[index]) {
            opp.subtasks[index].checked = !opp.subtasks[index].checked;
            await NF.DB.put('opportunities', opp);
            app.render();
        }
    },
    
    editUnitEconomics: async (oppId) => {
        const opp = await NF.DB.get('opportunities', oppId);
        opp.unit_economics = opp.unit_economics || { price: 0, cost: 0, volume: 0 };
        
        const price = await app.showDialog('prompt', 'Unit Price', `Current: ${opp.unit_economics.price}`);
        if (price === null) return;
        const cost = await app.showDialog('prompt', 'Unit Cost', `Current: ${opp.unit_economics.cost}`);
        if (cost === null) return;
        const volume = await app.showDialog('prompt', 'Volume (Units/mo)', `Current: ${opp.unit_economics.volume}`);
        if (volume === null) return;
        
        opp.unit_economics.price = Number(price) || 0;
        opp.unit_economics.cost = Number(cost) || 0;
        opp.unit_economics.volume = Number(volume) || 0;
        
        await NF.DB.put('opportunities', opp);
        app.render();
    },
    
    suggestCheapestTest: async (oppId) => {
        const opp = await NF.DB.get('opportunities', oppId);
        NF.UI.toast("Analyzing for cheapest falsifying test...");
        
        const prompt = `Review the opportunity titled "${opp.title}". Next Action: ${opp.next_action}. 
        Suggest the single cheapest, fastest falsifying test to validate demand or feasibility within 48 hours. Focus on extreme resource efficiency.`;
        
        const res = await NF.AI.generateCachedContent(prompt, { taskClass: 'brief', noCache: true });
        
        if (res && res.ok) {
            await app.showDialog('alert', 'Cheapest Falsifying Test', res.text);
        } else {
            NF.UI.toast("Failed to generate test.");
        }
    },
    
    snoozeOpportunity: async (oppId) => {
        const date = await app.showDialog('prompt', 'Snooze Until', 'Enter date to hide this deal until (YYYY-MM-DD):');
        if (!date) return;
        const opp = await NF.DB.get('opportunities', oppId);
        opp.snooze_until = date;
        await NF.DB.put('opportunities', opp);
        app.render();
    },
    
    editNextActionDue: async (oppId) => {
        const date = await app.showDialog('prompt', 'Next Action Due Date', 'Enter due date (YYYY-MM-DD):');
        if (!date) return;
        const opp = await NF.DB.get('opportunities', oppId);
        opp.next_action_due = date;
        await NF.DB.put('opportunities', opp);
        app.render();
    },
    
    extractSOP: async (oppId) => {
        const opp = await NF.DB.get('opportunities', oppId);
        if (!opp) return;
        
        NF.UI.toast('Extracting SOP from actions...');
        const prompt = `Based on this opportunity, its next actions, and context, draft a Standard Operating Procedure (SOP) that could be delegated.
        Title: ${opp.title}
        Next Action: ${opp.next_action}
        Subtasks: ${(opp.subtasks||[]).map(t=>t.title).join(', ')}
        Evidence: ${(opp.observations||[]).join(', ')}
        
        Output strictly valid JSON: {"title": "SOP Title", "content": "SOP Steps and Guidelines"}`;
        
        const res = await app.generateJSON(prompt, { systemInstruction: "You are an operations manager. Output raw JSON only.", taskClass: 'brief' });
        
        if (res && res.title && res.content) {
            await NF.DB.put('sops', {
                id: 'sop_' + Date.now(),
                opportunity_id: oppId,
                title: res.title,
                content: res.content,
                created_at: Date.now()
            });
            NF.UI.toast('SOP extracted and saved to library.');
            app.render();
        } else {
            NF.UI.toast('Failed to extract SOP.');
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
            opp.gates_checked = [];
            await NF.DB.put('opportunities', opp);
            app.animatingStageOppId = opp.id;
            app.render();
            setTimeout(() => {
                if (app.animatingStageOppId === opp.id) {
                    app.animatingStageOppId = null;
                    app.render();
                }
            }, 650);
            
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

    showPostMortemDialog: async (id) => {
        const opp = await NF.DB.get('opportunities', id);
        if (!opp) return;

        const div = document.createElement('div');
        div.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:9999; display:flex; justify-content:center; align-items:center; padding:16px;';
        div.innerHTML = `
            <div style="background:var(--card); width:100%; max-width:500px; border-radius:12px; overflow:hidden; box-shadow:0 12px 32px rgba(0,0,0,0.2);">
                <div style="padding:16px 24px; border-bottom:1px solid var(--line); font-weight:600; font-family:'Roboto Mono',monospace;">Graveyard Post-Mortem</div>
                <div style="padding:24px;">
                    <label style="display:block; margin-bottom:4px; font-size:0.85rem; color:var(--ink-soft);">Why did this die? (Cause of death)</label>
                    <input id="pm-cause" type="text" class="input" placeholder="e.g. Lost to competitor on price" style="margin-bottom:16px;"/>
                    
                    <label style="display:block; margin-bottom:4px; font-size:0.85rem; color:var(--ink-soft);">Predicted vs Actual (What did we get wrong?)</label>
                    <input id="pm-pred" type="text" class="input" placeholder="e.g. Thought they had budget, they didn't" style="margin-bottom:16px;"/>
                    
                    <label style="display:block; margin-bottom:4px; font-size:0.85rem; color:var(--ink-soft);">Key Lesson (How do we avoid this?)</label>
                    <input id="pm-lesson" type="text" class="input" placeholder="e.g. Always qualify budget before validation test" style="margin-bottom:24px;"/>
                    
                    <div style="display:flex; justify-content:flex-end; gap:12px;">
                        <button id="pm-skip" class="btn btn--sm" style="border:none; color:var(--ink-soft);">Skip</button>
                        <button id="pm-save" class="btn btn--primary btn--sm">Log to Record</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(div);
        
        document.getElementById('pm-skip').onclick = async () => {
            opp.archive_reason = 'Skipped post-mortem';
            await NF.DB.put('opportunities', opp);
            document.body.removeChild(div);
            app.render();
        };
        
        document.getElementById('pm-save').onclick = async () => {
            const cause = document.getElementById('pm-cause').value;
            const pred = document.getElementById('pm-pred').value;
            const lesson = document.getElementById('pm-lesson').value;
            
            if (!cause || !pred || !lesson) {
                NF.UI.toast('Please fill out all fields, or Skip.');
                return;
            }
            
            opp.archive_reason = cause;
            opp.predicted_vs_actual = pred;
            opp.lessons_learned = lesson;
            if (opp.business_id) await app.addBusinessMilestone(opp.business_id, `Archived Opportunity: ${opp.title} (${cause})`);
            await NF.DB.put('opportunities', opp);
            
            let intel = await NF.DB.getSetting('founder_intel') || { prediction_accuracy: 0, predictions_resolved: 0, recent_lessons: [], biases: [] };
            intel.recent_lessons.unshift({ date: new Date().toISOString(), text: `From ${opp.title}: ${lesson}` });
            if (intel.recent_lessons.length > 20) intel.recent_lessons.pop();
            await NF.DB.setSetting('founder_intel', intel);
            
            document.body.removeChild(div);
            app.render();
        };
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
    
    draftOutreach: async (bizId) => {
        const biz = await NF.DB.get('businesses', bizId);
        if (!biz) return;
        
        NF.UI.toast('Drafting outreach...');
        const prompt = `Draft a highly personalized, concise cold email (or message) for the decision maker at this business.
        Business: ${biz.name}
        Decision Maker: ${biz.decision_maker}
        Known Problems: ${(biz.known_problems || []).join(', ')}
        Communication Style: ${biz.communication_style || 'Direct, professional'}
        
        The goal is to get a 15-minute call or a reply. Do not use generic pleasantries. Use the known problems to show you understand their context.`;
        
        const res = await app.generateContent(prompt, { systemInstruction: "You are an expert sales strategist. Output only the email body and subject line.", taskClass: 'brief' });
        
        if (res.ok && res.text) {
            const div = document.createElement('div');
            div.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:9999; display:flex; justify-content:center; align-items:center; padding:16px;';
            div.innerHTML = `
                <div style="background:var(--card); width:100%; max-width:600px; border-radius:12px; overflow:hidden; box-shadow:0 12px 32px rgba(0,0,0,0.2); display:flex; flex-direction:column; max-height:80vh;">
                    <div style="padding:16px 24px; border-bottom:1px solid var(--line); font-weight:600;">Drafted Outreach</div>
                    <div style="padding:24px; overflow-y:auto; flex:1;">
                        <textarea class="input" style="width:100%; height:300px; resize:vertical;">${app.escapeHtml(res.text)}</textarea>
                    </div>
                    <div style="padding:16px 24px; border-top:1px solid var(--line); display:flex; justify-content:flex-end;">
                        <button class="btn btn--primary" id="btn-close-outreach">Close</button>
                    </div>
                </div>
            `;
            document.body.appendChild(div);
            document.getElementById('btn-close-outreach').onclick = () => document.body.removeChild(div);
        } else {
            NF.UI.toast('Failed to draft outreach.');
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
        
        await NF.DB.setSetting('founder_intel', intel);
        app.render();
    },
    
    startFounderReview: () => {
        const div = document.createElement('div');
        div.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:9999; display:flex; justify-content:center; align-items:center; padding:16px; backdrop-filter:blur(10px);';
        div.innerHTML = `
            <div style="background:var(--card); width:100%; max-width:600px; border-radius:12px; overflow:hidden; box-shadow:0 12px 32px rgba(0,0,0,0.2);">
                <div style="padding:16px 24px; border-bottom:1px solid var(--line); font-weight:600; font-family:'Roboto Mono',monospace;">Monthly Founder Review</div>
                <div style="padding:24px;">
                    <p style="color:var(--ink-soft); font-size:0.9rem; margin-bottom:24px;">A focused reflection on the past 30 days. No vanity metrics, only compounding truth.</p>
                    <div style="margin-bottom:16px;">
                        <label style="display:block; margin-bottom:8px; font-weight:600; font-size:0.85rem;">What is the most painful truth you learned this month?</label>
                        <textarea id="fr-truth" class="input" style="height:80px; resize:vertical;"></textarea>
                    </div>
                    <div style="margin-bottom:24px;">
                        <label style="display:block; margin-bottom:8px; font-weight:600; font-size:0.85rem;">What system or SOP needs to be built to avoid repeating a mistake?</label>
                        <textarea id="fr-system" class="input" style="height:80px; resize:vertical;"></textarea>
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:12px;">
                        <button class="btn" id="fr-cancel">Cancel</button>
                        <button class="btn btn--primary" id="fr-save">Commit to Journal</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(div);
        
        document.getElementById('fr-cancel').onclick = () => { document.body.removeChild(div); };
        document.getElementById('fr-save').onclick = async () => {
            const truth = document.getElementById('fr-truth').value.trim();
            const system = document.getElementById('fr-system').value.trim();
            if(!truth && !system) return;
            
            const decision = {
                id: 'dec_' + Date.now(),
                opportunity_id: 'system',
                decision: 'Monthly Review Reflection',
                rationale: `Painful Truth: ${truth}\\n\\nSystem Needed: ${system}`,
                created_at: Date.now()
            };
            await NF.DB.put('decision_journal', decision);
            
            if (system) {
                // Auto-prompt to create SOP
                const confirmSOP = confirm('You noted a system to build. Would you like to draft a new Standard Operating Procedure for it now?');
                if (confirmSOP) {
                    await NF.DB.put('sops', {
                        id: 'sop_' + Date.now(),
                        title: 'Draft: ' + system.substring(0, 30) + '...',
                        content: 'System rationale: ' + system,
                        created_at: Date.now()
                    });
                }
            }
            
            document.body.removeChild(div);
            NF.UI.toast('Review logged to Decision Journal.');
            app.render();
        };
    },
    
    generateYearInReview: async () => {
        NF.UI.toast('Generating Year in Review. This may take a moment...');
        const obs = await NF.DB.getAll('observations') || [];
        const opps = await NF.DB.getAll('opportunities') || [];
        const decisions = await NF.DB.getAll('decision_journal') || [];
        
        const now = Date.now();
        const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);
        
        const recentObs = obs.filter(o => o.created_at > oneYearAgo);
        const recentOpps = opps.filter(o => o.created_at > oneYearAgo);
        const wonOpps = recentOpps.filter(o => o.status === 'Won');
        const lostOpps = recentOpps.filter(o => o.status === 'Lost');
        const recentDecisions = decisions.filter(d => d.created_at > oneYearAgo);
        
        const winRate = recentOpps.length > 0 ? Math.round((wonOpps.length / (wonOpps.length + lostOpps.length || 1)) * 100) : 0;
        
        const prompt = `Write an Executive "Year in Review" Shareholder Letter for the founder based on the following data from the past 365 days.
        Data:
        - Observations captured: ${recentObs.length}
        - Opportunities spawned: ${recentOpps.length}
        - Deals Won: ${wonOpps.length}
        - Deals Lost/Killed: ${lostOpps.length}
        - Win Rate: ${winRate}%
        - Top 3 Lessons from Decision Journal: ${recentDecisions.map(d => d.rationale).join(' | ').substring(0, 500)}
        
        Format as a professional, deeply reflective, and actionable letter in HTML. Use <h2>, <h3>, <p>, and <ul>. No markdown backticks.`;
        
        const res = await NF.AI.generateCachedContent(prompt, { taskClass: 'brief', noCache: true });
        
        if (res && res.ok) {
            let htmlRes = res.text.replace(/```html/gi, '').replace(/```/g, '').trim();
            const div = document.createElement('div');
            div.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:9999; display:flex; justify-content:center; padding:32px; overflow-y:auto; backdrop-filter:blur(10px);';
            div.innerHTML = `
                <div style="background:#fff; width:100%; max-width:800px; border-radius:12px; padding:32px; box-shadow:0 12px 32px rgba(0,0,0,0.2); position:relative; min-height:max-content; margin:auto;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:24px; border-bottom:2px solid var(--ink); padding-bottom:16px;">
                        <div>
                            <span style="font-weight:700; color:var(--ink); font-family:'Roboto', sans-serif; font-size:1.5rem;">YEAR IN REVIEW</span>
                            <div style="color:var(--ink-soft); font-size:0.9rem; margin-top:4px;">${new Date().getFullYear()} Annual Report</div>
                        </div>
                        <div style="display:flex; gap:12px;">
                            <button class="btn" id="yir-close">Close</button>
                            <button class="btn btn--primary" onclick="window.print()">Print Report</button>
                        </div>
                    </div>
                    <div style="font-family:'Roboto', sans-serif; line-height:1.6; color:var(--ink);">
                        ${htmlRes}
                    </div>
                </div>
            `;
            document.body.appendChild(div);
            document.getElementById('yir-close').onclick = () => document.body.removeChild(div);
        } else {
            NF.UI.toast('Failed to generate Year in Review.');
        }
    },

    logDecision: (oppId) => {
        return new Promise(async (resolve) => {
            const opp = await NF.DB.get('opportunities', oppId);
            if (!opp) return resolve(false);
            
            const div = document.createElement('div');
            div.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:9999; display:flex; justify-content:center; align-items:center; padding:16px;';
            div.innerHTML = `
                <div style="background:var(--card); width:100%; max-width:500px; border-radius:12px; overflow:hidden; box-shadow:0 12px 32px rgba(0,0,0,0.2);">
                    <div style="padding:16px 24px; border-bottom:1px solid var(--line); font-weight:600; font-family:'Roboto Mono',monospace;">Log a Decision</div>
                    <div style="padding:24px;">
                        <p style="font-size:0.85rem; color:var(--ink-soft); margin-bottom:16px;">Document the decision context so your future self can evaluate the thinking, not just the outcome.</p>
                        <div style="margin-bottom:16px;">
                            <label style="display:block; margin-bottom:8px; font-weight:600; font-size:0.85rem;">The Decision Made</label>
                            <input type="text" id="dec-title" class="input" placeholder="e.g. Pivoted target audience to enterprise">
                        </div>
                        <div style="margin-bottom:24px;">
                            <label style="display:block; margin-bottom:8px; font-weight:600; font-size:0.85rem;">Rationale & Options Considered</label>
                            <textarea id="dec-rationale" class="input" style="height:100px; resize:vertical;" placeholder="Why this path? What did we reject?"></textarea>
                        </div>
                        <div style="display:flex; justify-content:flex-end; gap:12px;">
                            <button class="btn" id="dec-cancel">Cancel</button>
                            <button class="btn btn--primary" id="dec-save">Save Decision</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(div);
            
            document.getElementById('dec-cancel').onclick = () => { document.body.removeChild(div); resolve(false); };
            document.getElementById('dec-save').onclick = async () => {
                const title = document.getElementById('dec-title').value.trim();
                const rationale = document.getElementById('dec-rationale').value.trim();
                if (!title) return;
                
                const dec = {
                    id: 'dec_' + Date.now(),
                    opportunity_id: oppId,
                    decision: title,
                    rationale: rationale,
                    created_at: Date.now()
                };
                await NF.DB.put('decision_journal', dec);
                
                document.body.removeChild(div);
                app.render();
                resolve(true);
            };
        });
    },

    logPrediction: (oppId) => {
        return new Promise(async (resolve) => {
            const opp = await NF.DB.get('opportunities', oppId);
            if (!opp) return resolve(false);
            
            const div = document.createElement('div');
            div.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:9999; display:flex; justify-content:center; align-items:center; padding:16px;';
            div.innerHTML = `
                <div style="background:var(--card); width:100%; max-width:500px; border-radius:12px; overflow:hidden; box-shadow:0 12px 32px rgba(0,0,0,0.2);">
                    <div style="padding:16px 24px; border-bottom:1px solid var(--line); font-weight:600; font-family:'Roboto Mono',monospace;">Log a Prediction</div>
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
                    NF.UI.toast('Please fill out all fields.');
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
            div.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:9999; display:flex; justify-content:center; align-items:center; padding:16px;';
            div.innerHTML = `
                <div style="background:var(--card); width:100%; max-width:500px; border-radius:12px; overflow:hidden; box-shadow:0 12px 32px rgba(0,0,0,0.2);">
                    <div style="padding:16px 24px; border-bottom:1px solid var(--line); font-weight:600; font-family:'Roboto Mono',monospace;">Spawn Opportunity</div>
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
        
        // Opportunity Cost Prompt
        const activeOpps = await NF.DB.getAll('opportunities');
        const active = activeOpps.filter(o => o.status !== 'Won' && o.status !== 'Graveyard').sort((a,b) => b.calculated_score - a.calculated_score).slice(0, 3);
        if (active.length > 0) {
            const oppCostConfirmed = await new Promise(resolve => {
                const div = document.createElement('div');
                div.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:9999; display:flex; justify-content:center; align-items:center; padding:16px;';
                div.innerHTML = `
                    <div style="background:var(--card); width:100%; max-width:500px; border-radius:12px; overflow:hidden; box-shadow:0 12px 32px rgba(0,0,0,0.2);">
                        <div style="padding:16px 24px; border-bottom:1px solid var(--line); font-weight:600; font-family:'Roboto Mono',monospace;">Opportunity Cost Check</div>
                        <div style="padding:24px;">
                            <p style="font-size:0.9rem; color:var(--ink-soft); margin-bottom:16px;">You are currently pursuing these top deals:</p>
                            <ul style="list-style:none; padding:0; margin:0 0 24px 0;">
                                ${active.map((o, i) => `<li style="padding:8px 12px; background:var(--bg); border:1px solid var(--line); margin-bottom:4px; border-radius:6px; font-size:0.85rem;">#${i+1} ${app.escapeHtml(o.title)} (Score: ${o.calculated_score})</li>`).join('')}
                            </ul>
                            <p style="font-size:0.95rem; font-weight:600; margin-bottom:24px;">Does "${app.escapeHtml(title)}" realistically beat the median of these active deals? If not, kill it now.</p>
                            <div style="display:flex; justify-content:flex-end; gap:12px;">
                                <button class="btn" id="oc-kill" style="color:var(--ink-soft);">Kill it</button>
                                <button class="btn btn--primary" id="oc-proceed">It beats them. Proceed.</button>
                            </div>
                        </div>
                    </div>
                `;
                document.body.appendChild(div);
                document.getElementById('oc-kill').onclick = () => { document.body.removeChild(div); resolve(false); };
                document.getElementById('oc-proceed').onclick = () => { document.body.removeChild(div); resolve(true); };
            });
            if (!oppCostConfirmed) return;
        }

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
            predictions: [],
            gates_checked: [],
            next_action_due: null,
            subtasks: [],
            unit_economics: { price: 0, cost: 0, volume: 0 },
            first_customer: null,
            snooze_until: null,
            created_at: Date.now()
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
            predictions: [],
            gates_checked: [],
            next_action_due: null,
            subtasks: [],
            unit_economics: { price: 0, cost: 0, volume: 0 },
            first_customer: null,
            snooze_until: null,
            created_at: Date.now()
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
        
        let importData = urlParams.get('data');
        if (importData) {
            await app.importBase64(importData);
        }
        
        if (combinedShare) {
            // Overwrite draft if we received a share
            await NF.DB.setSetting('capture_draft', combinedShare);
        }
        
        app.render();
        
        if (combinedShare || isCaptureShortcut) {
            // Clean URL so refresh doesn't duplicate
            window.history.replaceState({}, document.title, window.location.pathname);
            app.toggleUniversalCapture();
        }
        
        // First Run Init Check
        const obsCheck = await NF.DB.getAll('observations');
        const oppCheck = await NF.DB.getAll('opportunities');
        if (obsCheck.length === 0 && oppCheck.length === 0) {
            const id1 = 'demo-obs-' + Date.now() + '1';
            const id2 = 'demo-obs-' + Date.now() + '2';
            const id3 = 'demo-obs-' + Date.now() + '3';
            await NF.DB.put('observations', { id: id1, text: "Talked to a hotel manager, they are struggling with staffing the front desk on weekends. They pay $20/hr but people keep quitting.", created_at: Date.now() - 100000 });
            await NF.DB.put('observations', { id: id2, text: "Another hotel mentioned same thing. Front desk turnover is killing their guest experience.", created_at: Date.now() - 50000 });
            await NF.DB.put('observations', { id: id3, text: "Saw a #post on Reddit about hotel front desk clerks being overworked.", created_at: Date.now() - 10000 });
            
            await NF.DB.put('patterns', { id: 'demo-pat-' + Date.now() + '1', title: 'Hotel Front Desk Staffing Crisis', observation_ids: [id1, id2, id3], status: 'Emerging', created_at: Date.now() - 5000, momentum: 0.85, updated_at: new Date().toISOString() });
            await NF.DB.put('patterns', { id: 'demo-pat-' + Date.now() + '2', title: 'AI Automation in Hospitality', observation_ids: [], status: 'Dormant', created_at: Date.now() - 4000, momentum: 0.1, updated_at: new Date().toISOString() });
            
            app.showWelcomeOverlay();
            app.render(); // Re-render to show dummy data
        }
        
        window.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                app.openOmniSearch();
            }
        });
        
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

