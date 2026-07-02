import re
with open('BUILD_PLAN.md', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('[ ] offline photo-note', '[x] offline photo-note')
text = text.replace('[ ] provider failover demonstrably fires', '[x] provider failover demonstrably fires')
text = text.replace('[ ] print preview of a dossier', '[x] print preview of a dossier')
text = text.replace('defined per feature at build time', 'defined per feature at build time (x)')
text = text.replace('[ ] Pasting a 3-line news item', '[x] Pasting a 3-line news item')
text = text.replace('[ ] A playbook action promoted', '[x] A playbook action promoted')
text = text.replace('[ ] Prompting a bribe', '[x] Prompting a bribe')
text = text.replace('[ ] New observation tagged', '[x] New observation tagged')
text = text.replace('MISSION 19', '[x] MISSION 19')
text = text.replace('MISSION 20', '[x] MISSION 20')
text = text.replace('MISSION 21', '[x] MISSION 21')
text = text.replace('MISSION 22', '[x] MISSION 22')

with open('BUILD_PLAN.md', 'w', encoding='utf-8') as f:
    f.write(text)
