import json

with open('tsconfig.json', 'r') as f:
    data = json.load(f)

if 'compilerOptions' in data:
    data['compilerOptions']['noUnusedLocals'] = False
    data['compilerOptions']['noUnusedParameters'] = False

with open('tsconfig.json', 'w') as f:
    json.dump(data, f, indent=2)
