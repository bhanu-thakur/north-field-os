import re

# 1. Update index.html (Universal Capture Modal)
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

html = html.replace('background:rgba(255,255,255,0.85); backdrop-filter:blur(10px); z-index:9999; justify-content:center; align-items:flex-end;', 
                    'background:rgba(0,0,0,0.4); backdrop-filter:blur(10px); z-index:9999; justify-content:center; align-items:center; padding:16px;')
html = html.replace('border-radius:16px 16px 0 0;', 'border-radius:16px;')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

# 2. Update app.js modals
with open('app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

app_js = app_js.replace('background:rgba(0,0,0,0.8)', 'background:rgba(0,0,0,0.4)')
app_js = app_js.replace('background:rgba(0,0,0,0.6)', 'background:rgba(0,0,0,0.4)')
app_js = app_js.replace('background:rgba(0,0,0,0.5)', 'background:rgba(0,0,0,0.4)')

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(app_js)

# 3. Update CSS for Material UI text fields
with open('css/design-system.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Replace input style
old_input = ".input,select.input,textarea.input{width:100%;border:1px solid var(--line-strong);border-radius:9px;padding:9px 11px;font-family:inherit;font-size:.88rem;background:var(--card);color:var(--ink)}"
new_input = ".input,select.input,textarea.input{width:100%;border:none;border-bottom:2px solid var(--line-strong);border-radius:6px 6px 0 0;padding:12px 14px;font-family:inherit;font-size:1rem;background:rgba(120,130,125,0.06);color:var(--ink);transition:border-color 0.2s, background 0.2s;}"

old_focus = ".input:focus{outline:none;border-color:var(--primary)}"
new_focus = ".input:focus{outline:none;border-bottom-color:var(--primary);background:rgba(120,130,125,0.1);}"

css = css.replace(old_input, new_input)
css = css.replace(old_focus, new_focus)

with open('css/design-system.css', 'w', encoding='utf-8') as f:
    f.write(css)

