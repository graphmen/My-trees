import os

app_jsx_path = r"c:\Users\ndebelem.ZINGSERVER1\Desktop\2026\QField\frontend\src\App.jsx"

with open(app_jsx_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'renderEligibilityDashboard' in line or 'strong s' in line or 'strong' in line and i > 2500 and i < 3000:
        print(f"Line {i+1}: {line.strip()}")
