import re
import glob

files = glob.glob('**/*.js', recursive=True) + glob.glob('**/*.css', recursive=True) + glob.glob('**/*.html', recursive=True)

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fonts
    content = content.replace("family=Inter:wght@400;500;600;700&family=JetBrains+Mono", "family=Roboto:wght@400;500;700&family=Roboto+Mono")
    content = content.replace("'Inter'", "'Roboto'")
    content = content.replace("Inter,", "Roboto,")
    content = content.replace("'JetBrains Mono'", "'Roboto Mono'")
    content = content.replace("Georgia,serif", "'Roboto', sans-serif")
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
