import os

main_py_path = r"c:\Users\ndebelem.ZINGSERVER1\Desktop\2026\QField\backend\main.py"

with open(main_py_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '@app.get' in line and ('verification' in line or 'audit' in line or 'meal' in line):
        print(f"Line {i+1}: {line.strip()}")
