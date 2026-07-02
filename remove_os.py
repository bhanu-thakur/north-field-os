import os
import glob

files = glob.glob('**/*.js', recursive=True) + glob.glob('**/*.html', recursive=True) + glob.glob('**/*.json', recursive=True) + glob.glob('**/*.md', recursive=True) + glob.glob('**/*.webmanifest', recursive=True)

for filepath in files:
    if 'dhaula_app' in filepath:
        continue # skip flutter dir
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = content.replace('Dhaula OS', 'Dhaula')
        
        if content != new_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
    except Exception as e:
        pass
