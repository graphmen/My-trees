import os

app_jsx_path = r"c:\Users\ndebelem.ZINGSERVER1\Desktop\2026\QField\frontend\src\App.jsx"

with open(app_jsx_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 6000 <= i <= 6350:
        if 'Floating Map Toggle Switcher' in line:
            print(f"Line {i+1}: {line.strip()}")
