import os

app_jsx_path = r"c:\Users\ndebelem.ZINGSERVER1\Desktop\2026\QField\frontend\src\App.jsx"

with open(app_jsx_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'Floating Map Toggle Switcher' in line or 'sitesSubTab' in line:
        if 5800 <= i <= 6600:
            print(f"Line {i+1}: {line.strip()}")
