import os
import json

def get_file_content(path):
    if not os.path.exists(path): return ""
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

data = {
    "manifest": get_file_content("manifest.webmanifest"),
    "build_plan": get_file_content("BUILD_PLAN.md"),
    "app_js_length": len(get_file_content("app.js")), 
    "css_length": len(get_file_content("css/design-system.css"))
}

os.makedirs("flutter_migration_docs", exist_ok=True)
with open("flutter_migration_docs/project_snapshot.json", "w") as f:
    json.dump(data, f, indent=2)
