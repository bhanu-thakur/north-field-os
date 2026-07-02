window.NF = window.NF || {};

NF.DB = (function() {
    let DB_NAME = 'NorthFieldOS';
    const DB_VERSION = 4; // Bumped to force schema upgrade for observations/patterns
    let dbInstance = null;

    const STORES = [
        'opportunities',
        'campaigns',
        'businesses',
        'observations',
        'patterns',
        'ai_jobs',
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
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function getAll(storeName) {
        const db = await init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
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
        const db = await init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
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

    return {
        init, get, getAll, put, remove, getSetting, setSetting, switchDatabase, nukeDatabase
    };
})();

NF.AI = (function() {
    async function generateContent(prompt, opts = {}) {
        const apiKey = await NF.DB.getSetting('gemini_api_key');
        if (!apiKey) return null;
        
        try {
            const body = {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { 
                    temperature: opts.temperature || 0.2,
                    maxOutputTokens: opts.maxOutputTokens || 300
                }
            };
            
            if (opts.systemInstruction) {
                body.system_instruction = { parts: [{ text: opts.systemInstruction }] };
            }

            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey
                },
                body: JSON.stringify(body)
            });
            
            if (!res.ok) {
                const errText = await res.text();
                console.error('Gemini API Error:', res.status, errText);
                return null;
            }
            
            const data = await res.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text === undefined) {
                console.error('Gemini API Error: Invalid payload or safety block', data);
                return null;
            }
            return text;
        } catch (err) {
            console.error('Gemini API Error: Network failure.');
            return null;
        }
    }
    
    return { generateContent };
})();
