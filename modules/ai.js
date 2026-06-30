window.NF = window.NF || {};

NF.AI = {
    // A prompt template that forces structured JSON output
    systemPrompt: `You are the Compounding Engine for North Field OS.
Your job is to analyze a raw field observation and extract entities for the Knowledge Graph.
Return ONLY raw JSON, no markdown formatting.
Schema:
{
  "tags": ["ind_hospitality", "people_rajat", ...],
  "bottlenecks": [
     { "industryId": "ind_hospitality", "description": "The bottleneck described" }
  ],
  "new_people": [
     { "name": "Name", "context": "Context from note" }
  ]
}`,

    processObservation: async (rawText) => {
        const apiKey = NF.Store.get('gemini_api_key', '');
        
        if (!apiKey) {
            // SIMULATION MODE (Offline or No API Key)
            console.log("No API key found. Running offline simulation.");
            return new Promise((resolve) => {
                setTimeout(() => {
                    const mockTags = [];
                    if (rawText.toLowerCase().includes('hotel') || rawText.toLowerCase().includes('hospitality')) mockTags.push('ind_hospitality');
                    if (rawText.toLowerCase().includes('school')) mockTags.push('ind_schools');
                    
                    resolve({
                        tags: mockTags,
                        bottlenecks: [],
                        new_people: []
                    });
                }, 1000);
            });
        }

        // REAL API MODE
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        { role: 'user', parts: [{ text: NF.AI.systemPrompt + "\n\nObservation: " + rawText }] }
                    ],
                    generationConfig: {
                        responseMimeType: "application/json"
                    }
                })
            });
            
            const data = await response.json();
            const textJSON = data.candidates[0].content.parts[0].text;
            return JSON.parse(textJSON);
        } catch (err) {
            console.error("AI Extraction Failed", err);
            return { tags: [], bottlenecks: [], new_people: [] };
        }
    }
};
