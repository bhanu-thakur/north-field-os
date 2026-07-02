import re
import glob

def replace_in_file(filename, old, new):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    new_content = content.replace(old, new)
    if content != new_content:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(new_content)

replace_in_file('index.html', 'Kantha OS', 'Dhaula OS')
replace_in_file('index.html', 'Kantha<', 'Dhaula<')
replace_in_file('app.js', 'KANTHA OS', 'DHAULA OS')
replace_in_file('app.js', 'Kantha OS', 'Dhaula OS')
replace_in_file('app.js', 'Kantha<', 'Dhaula<')
replace_in_file('app.js', 'Ask Kantha', 'Ask Dhaula')
replace_in_file('README.md', 'Kantha OS', 'Dhaula OS')
replace_in_file('AI_CONTEXT.md', 'Kantha OS', 'Dhaula OS')
replace_in_file('BUILD_PLAN.md', 'Kantha OS', 'Dhaula OS')
replace_in_file('CHANGELOG.md', 'Kantha OS', 'Dhaula OS')
replace_in_file('manifest.webmanifest', 'Kantha OS', 'Dhaula OS')
replace_in_file('manifest.webmanifest', '"Kantha"', '"Dhaula"')
replace_in_file('sw.js', 'kantha-os-v1', 'dhaula-os-v4')
