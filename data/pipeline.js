window.NF = window.NF || {};
NF.Pipeline = {
    init: () => {
        if (!localStorage.getItem('nf:pipeline')) {
            NF.Store.set('pipeline', []);
        }
    },
    getDeals: () => NF.Store.get('pipeline', []),
    addDeal: (title, value, stage) => {
        const deals = NF.Pipeline.getDeals();
        deals.push({ id: 'deal_' + Date.now(), title, value, stage });
        NF.Store.set('pipeline', deals);
    },
    updateDealStage: (id, newStage) => {
        const deals = NF.Pipeline.getDeals();
        const deal = deals.find(d => d.id === id);
        if (deal) { deal.stage = newStage; NF.Store.set('pipeline', deals); }
    }
};
