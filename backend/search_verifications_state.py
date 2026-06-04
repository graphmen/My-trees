import os

app_jsx_path = r"c:\Users\ndebelem.ZINGSERVER1\Desktop\2026\QField\frontend\src\App.jsx"

with open(app_jsx_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'verificationsSubTab' in line or 'verificationsOutcomes' in line or 'auditsOutcomes' in line or 'auditSubTab' in line:
        print(f"Line {i+1}: {line.strip()}")
