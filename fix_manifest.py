import json

with open('manifest.webmanifest', 'r', encoding='utf-8') as f:
    manifest = json.load(f)

manifest['shortcuts'][0]['url'] = './?capture=1'
manifest['share_target']['action'] = './'

with open('manifest.webmanifest', 'w', encoding='utf-8') as f:
    json.dump(manifest, f, indent=2)
