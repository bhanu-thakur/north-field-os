window.NF = window.NF || {};

NF.Bibles = {
    init: () => {
        // Seed default Industry categories if none exist
        if (!localStorage.getItem('nf:bible_industry')) {
            NF.Store.set('bible_industry', [
                { id: 'ind_hospitality', name: 'Hospitality', bottlenecks: [], ops: [] },
                { id: 'ind_schools', name: 'Schools', bottlenecks: [], ops: [] },
                { id: 'ind_retail', name: 'Retail', bottlenecks: [], ops: [] }
            ]);
        }
        // Seed empty People directory
        if (!localStorage.getItem('nf:bible_people')) {
            NF.Store.set('bible_people', []);
        }
    },
    
    getIndustries: () => NF.Store.get('bible_industry', []),
    getPeople: () => NF.Store.get('bible_people', []),
    
    addTagToObservation: (obsId, tagString) => {
        const obsList = NF.Store.get('observations');
        const obs = obsList.find(o => o.id === obsId);
        if (obs) {
            obs.tags = obs.tags || [];
            if (!obs.tags.includes(tagString)) {
                obs.tags.push(tagString);
                NF.Store.set('observations', obsList);
            }
        }
    },
    
    addBottleneck: (industryId, description) => {
        const industries = NF.Store.get('bible_industry', []);
        const ind = industries.find(i => i.id === industryId);
        if (ind) {
            ind.bottlenecks.push(description);
            NF.Store.set('bible_industry', industries);
        }
    },
    
    addPerson: (name, context) => {
        const people = NF.Store.get('bible_people', []);
        if (!people.find(p => p.name === name)) {
            people.push({ id: 'p_'+Date.now(), name, context });
            NF.Store.set('bible_people', people);
        }
    }
};
