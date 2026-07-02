import re
import glob

def replace_in_file(filename, old, new):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    new_content = content.replace(old, new)
    if content != new_content:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(new_content)

replace_in_file('index.html', 'North Field OS', 'Kantha OS')
replace_in_file('index.html', 'North<', 'Kantha<')
replace_in_file('app.js', 'NORTH FIELD OS', 'KANTHA OS')
replace_in_file('app.js', 'North Field OS', 'Kantha OS')
replace_in_file('app.js', 'North<', 'Kantha<')
replace_in_file('app.js', 'Ask North', 'Ask Kantha')
replace_in_file('README.md', 'North Field OS', 'Kantha OS')
replace_in_file('AI_CONTEXT.md', 'North Field OS', 'Kantha OS')
replace_in_file('BUILD_PLAN.md', 'North Field OS', 'Kantha OS')
replace_in_file('CHANGELOG.md', 'North Field OS', 'Kantha OS')
