window.NF = window.NF || {};
NF.Journal = {
    init: () => {
        if (!localStorage.getItem('nf:journal')) {
            NF.Store.set('journal', []);
        }
    },
    getEntries: () => NF.Store.get('journal', []),
    addEntry: (decision, rationale, outcome) => {
        const entries = NF.Journal.getEntries();
        entries.unshift({ id: 'dj_' + Date.now(), date: Date.now(), decision, rationale, outcome });
        NF.Store.set('journal', entries);
    }
};
