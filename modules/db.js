window.NF = window.NF || {};

NF.DB = (function() {
    let DB_NAME = 'NorthFieldOS';
    const DB_VERSION = 8; // Bumped for territories
    let dbInstance = null;

    const STORES = [
        'opportunities',
        'campaigns',
        'businesses',
        'observations',
        'patterns',
        'people',
        'ai_jobs',
        'media',
        'decision_journal',
        'sops',
        'territories',
        'settings'
    ];

    function init() {
        return new Promise((resolve, reject) => {
            if (dbInstance) return resolve(dbInstance);
            
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = (e) => reject(e.target.error);
            
            request.onsuccess = (e) => {
                dbInstance = e.target.result;
                resolve(dbInstance);
            };
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                
                // Clear old V2 stores if they exist (destructive reset for V3 Pivot)
                const existingStores = Array.from(db.objectStoreNames);
                existingStores.forEach(s => {
                    if (!STORES.includes(s)) db.deleteObjectStore(s);
                });

                STORES.forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        db.createObjectStore(storeName, { keyPath: 'id' });
                    }
                });
            };
        });
    }

    // The V3 Metadata & Scoring Standard
    function _applyMetadata(storeName, item, isUpdate = false) {
        const now = Date.now();
        if (!isUpdate) {
            item.id = item.id || `nf_${now}_${Math.random().toString(36).substr(2, 9)}`;
            item.created_at = item.created_at || now;
            item.lifecycle_status = item.lifecycle_status || 'Active'; // Active, Paused, Archived, Dead
        }
        item.updated_at = now;
        
        // Ensure baseline fields exist
        if (typeof item.confidence === 'undefined') item.confidence = null;
        if (typeof item.source === 'undefined') item.source = 'Human';
        if (typeof item.evidence === 'undefined') item.evidence = [];
        if (typeof item.is_ai_generated === 'undefined') item.is_ai_generated = false;
        
        // Settings / Founder Intel
        if (storeName === 'settings') {
            if (item.id === 'founder_intel') {
                item.value = item.value || {
                    strengths: [],
                    biases: [],
                    prediction_accuracy: 50, // 0-100%
                    recent_lessons: []
                };
            }
        }
        
        // V3 Specific Defaults for Opportunities
        if (storeName === 'opportunities') {
            item.status = item.status || 'Validation'; // Validation -> First Sale -> Delivery -> SOP -> Operator -> Automation -> Software
            
            // Core 3 Variables (V4 Simplification)
            item.leverage = item.leverage || 0;
            item.velocity = item.velocity || 0;
            item.conviction = item.conviction || 0;
            
            // Calculate arbitrary 0-100 score based on 3 variables
            const sum = item.leverage + item.velocity + item.conviction;
            item.calculated_score = Math.max(0, Math.min(100, Math.floor((sum / 30) * 100)));
            
            item.next_action = item.next_action || 'Needs Action Plan';
            item.exit_conditions = item.exit_conditions || 'Undefined';
            
            // Graveyard / Archiving
            item.archive_reason = item.archive_reason || '';
            item.predicted_vs_actual = item.predicted_vs_actual || '';
            item.lessons_learned = item.lessons_learned || '';
            
            // Migrate old evidence to observations conceptually
            item.observations = item.observations || (item.evidence || []);
        }
        
        if (storeName === 'observations') {
            item.text = item.text || '';
            item.linked_pattern_id = item.linked_pattern_id || null;
            item.linked_business_id = item.linked_business_id || null;
            item.processed = item.processed || false; // True if pattern engine has analyzed it
        }
        
        if (storeName === 'businesses') {
            item.name = item.name || 'Unnamed Entity';
            item.decision_maker = item.decision_maker || 'Unknown';
            item.key_contacts = item.key_contacts || []; // Array of contact objects
            item.trust_level = item.trust_level || 'Cold'; // Cold, Warm, High
            item.communication_style = item.communication_style || 'Direct';
            item.known_problems = item.known_problems || [];
            item.objections = item.objections || [];
            item.active_experiments = item.active_experiments || [];
            item.next_move = item.next_move || 'Needs Action';
        }
        
        if (storeName === 'patterns') {
            item.title = item.title || 'New Pattern Detected';
            item.status = item.status || 'Emerging'; // Emerging, Investigating, Rejected
            item.observation_ids = item.observation_ids || [];
        }
        
        return item;
    }

    async function get(storeName, id) {
        const db = await init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.get(id);
            request.onsuccess = () => {
                const res = request.result;
                if (res && res._deleted_at && storeName !== 'settings') resolve(undefined);
                else resolve(res);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async function getAll(storeName) {
        const db = await init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => {
                const arr = request.result;
                if (storeName === 'settings') resolve(arr);
                else resolve(arr.filter(x => !x._deleted_at));
            };
            request.onerror = () => reject(request.error);
        });
    }

    async function put(storeName, item) {
        const db = await init();
        
        let isUpdate = false;
        if (item.id) {
            try {
                const existing = await get(storeName, item.id);
                if (existing) isUpdate = true;
            } catch(e) {}
        }
        
        const enrichedItem = _applyMetadata(storeName, item, isUpdate);
        
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.put(enrichedItem);
            request.onsuccess = () => resolve(enrichedItem);
            request.onerror = () => reject(request.error);
        });
    }

    async function remove(storeName, id) {
        if (storeName === 'settings') {
            const db = await init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);
                const request = store.delete(id);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
        
        const db = await init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const getReq = store.get(id);
            getReq.onsuccess = () => {
                const existing = getReq.result;
                if (existing) {
                    existing._deleted_at = Date.now();
                    const putReq = store.put(existing);
                    putReq.onsuccess = () => resolve();
                    putReq.onerror = () => reject(putReq.error);
                } else {
                    resolve();
                }
            };
            getReq.onerror = () => reject(getReq.error);
        });
    }
    
    async function getSetting(key, defaultValue = null) {
        const res = await get('settings', key);
        return res ? res.value : defaultValue;
    }
    
    async function setSetting(key, value) {
        return put('settings', { id: key, value });
    }

    async function switchDatabase(name) {
        if (dbInstance) {
            dbInstance.close();
        }
        DB_NAME = name;
        dbInstance = null;
        await init();
    }

    async function nukeDatabase() {
        const db = await init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORES, 'readwrite');
            STORES.forEach(storeName => {
                // Don't nuke settings so we keep the API key and founder intel baseline
                if (storeName !== 'settings') {
                    tx.objectStore(storeName).clear();
                }
            });
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async function exportAll() {
        const db = await init();
        const exportData = {
            version: DB_VERSION,
            exported_at: Date.now(),
            stores: {}
        };
        for (const storeName of STORES) {
            exportData.stores[storeName] = await getAll(storeName);
        }
        await setSetting('last_export_at', exportData.exported_at);
        await setSetting('last_export_obs_count', (exportData.stores['observations'] || []).length);
        
        const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const d = new Date();
        const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        a.href = url;
        a.download = `north-backup-${ds}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async function importAll(jsonString) {
        const data = NF.AI.extractJSON(jsonString);
        if (!data) throw new Error('Invalid backup format (JSON parse failed)');
        if (!data.version || !data.stores) throw new Error('Invalid backup format');
        if (data.version > DB_VERSION) {
            throw new Error(`Backup version (${data.version}) is newer than current app version (${DB_VERSION}). Please update the app.`);
        }
        
        for (const storeName of Object.keys(data.stores)) {
            if (STORES.includes(storeName)) {
                for (const item of data.stores[storeName]) {
                    await put(storeName, item); 
                }
            }
        }
    }

    return {
        init,
        get,
        getAll,
        put,
        delete: remove,
        getSetting,
        setSetting,
        exportAll, nukeDatabase,
        importAll,
        switchDatabase: async (newName) => {
            if (dbInstance) {
                dbInstance.close();
                dbInstance = null;
            }
            DB_NAME = newName || 'NorthFieldOS';
            await init();
            window.location.reload();
        }
    };
})();

NF.AI = (function() {
    async function hashString(str) {
        const msgBuffer = new TextEncoder().encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function generateCachedContent(prompt, opts = {}, ttlHours = 24) {
        if (opts.noCache) return await generateContent(prompt, opts);
        
        const hash = await hashString(prompt + (opts.systemInstruction || ''));
        const cacheKey = 'aicache_' + hash;
        const cached = await get('settings', cacheKey);
        
        if (cached) {
            const ageHours = (Date.now() - cached.value.timestamp) / (1000 * 60 * 60);
            if (ageHours < ttlHours) {
                return { ok: true, text: cached.value.text, cached: true };
            }
        }
        
        const res = await generateContent(prompt, opts);
        if (res.ok) {
            await put('settings', { id: cacheKey, value: { text: res.text, timestamp: Date.now() } });
        }
        return res;
    }

    async function generateContent(prompt, opts = {}) {
        let apiKey = await NF.DB.getSetting('gemini_api_key');
        let secondaryKey = await NF.DB.getSetting('gemini_api_key_secondary');
        let currentKeyIsSecondary = false;
        
        let consecutiveErrors = await NF.DB.getSetting('gemini_consecutive_errors') || 0;
        if (consecutiveErrors >= 2 && secondaryKey) {
            apiKey = secondaryKey;
            currentKeyIsSecondary = true;
        }

        if (!apiKey) return { ok: false, text: null, error: 'no_key' };
        
        const tokenBudgets = { capture: 300, cluster: 2000, board: 1500, chat: 600, brief: 800 };
        const tc = opts.taskClass || 'capture';
        const maxTokens = opts.maxOutputTokens || tokenBudgets[tc] || 300;
        
        const modelTier = await NF.DB.getSetting('ai_model_' + tc) || 'gemini-2.5-flash-lite';
        const temp = parseFloat(await NF.DB.getSetting('ai_temp_' + tc)) || opts.temperature || 0.2;
        
        const promptString = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);
        const inputTokens = Math.ceil((promptString.length + (opts.systemInstruction ? opts.systemInstruction.length : 0)) / 4);
        
        try {
            const body = {
                contents: [{ parts: Array.isArray(prompt) ? prompt : [{ text: prompt }] }],
                generationConfig: { 
                    temperature: temp,
                    maxOutputTokens: maxTokens
                }
            };
            
            if (opts.systemInstruction) {
                body.system_instruction = { parts: [{ text: opts.systemInstruction }] };
            }

            const doFetch = () => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelTier}:generateContent`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey
                },
                body: JSON.stringify(body)
            });

            let res = await doFetch();
            
            if (res.status === 429) {
                await new Promise(r => setTimeout(r, 2000 + Math.random() * 1000));
                res = await doFetch();
            }
            
            if (!res.ok) {
                const errText = await res.text();
                console.error('Gemini API Error:', res.status, errText);
                await NF.DB.setSetting('gemini_consecutive_errors', consecutiveErrors + 1);
                return { ok: false, text: null, error: 'http_' + res.status };
            }
            
            const data = await res.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text === undefined) {
                console.error('Gemini API Error: Invalid payload or safety block', data);
                await NF.DB.setSetting('gemini_consecutive_errors', consecutiveErrors + 1);
                return { ok: false, text: null, error: 'empty_candidate' };
            }
            
            await NF.DB.setSetting('gemini_consecutive_errors', 0);
            
            // Telemetry
            const outputTokens = Math.ceil(text.length / 4);
            const totalTokens = inputTokens + outputTokens;
            
            let totalCalls = (await NF.DB.getSetting('ai_meter_calls')) || 0;
            let totalTokensMeter = (await NF.DB.getSetting('ai_meter_tokens')) || 0;
            let recentLogs = (await NF.DB.getSetting('ai_last_50_logs')) || [];
            
            totalCalls += 1;
            totalTokensMeter += totalTokens;
            recentLogs.unshift({ ts: Date.now(), task: tc, model: modelTier, tokens: totalTokens, secondary: currentKeyIsSecondary });
            if (recentLogs.length > 50) recentLogs.pop();
            
            await NF.DB.setSetting('ai_meter_calls', totalCalls);
            await NF.DB.setSetting('ai_meter_tokens', totalTokensMeter);
            await NF.DB.setSetting('ai_last_50_logs', recentLogs);
            
            return { ok: true, text: text, error: null };
        } catch (err) {
            console.error('Gemini API Error: Network failure.', err);
            await NF.DB.setSetting('gemini_consecutive_errors', consecutiveErrors + 1);
            return { ok: false, text: null, error: 'network' };
        }
    }
    function extractJSON(text) {
        if (!text) return null;
        let clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        let match = clean.match(/[\{\[][\s\S]*[\}\]]/);
        if (match) clean = match[0];
        try {
            return JSON.parse(clean);
        } catch (e) {
            return null;
        }
    }
    
    return { generateContent, generateCachedContent, extractJSON };
})();
