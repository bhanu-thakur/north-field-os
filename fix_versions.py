import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()
text = re.sub(r'<title>.*?</title>', '<title>Dhaula OS v4.0</title>', text)
text = re.sub(r'<span>V.*?</span>', '<span>v4.0</span>', text, flags=re.IGNORECASE)
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)

with open('app.js', 'r', encoding='utf-8') as f:
    text = f.read()
text = re.sub(r'<span>V.*?</span>', '<span>v4.0</span>', text, flags=re.IGNORECASE)
with open('app.js', 'w', encoding='utf-8') as f:
    f.write(text)

with open('sw.js', 'r', encoding='utf-8') as f:
    text = f.read()
text = re.sub(r"const CACHE_NAME = '.*?';", "const CACHE_NAME = 'dhaula-os-v4.0';", text)
with open('sw.js', 'w', encoding='utf-8') as f:
    f.write(text)
