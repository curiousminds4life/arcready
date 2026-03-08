import re

with open('js/svg-circuits.js', 'r') as f:
    text = f.read()

# circuit-a and circuit-practice use: r="10" fill="#FFD700" 
text = re.sub(r'r="10" fill="#FFD700"', 'r="18" fill="#FFD700"', text)

# circuit-b uses: <circle id="tp" cx="0" cy="0" r="4" fill="#1A1A1A" />
text = re.sub(r'<circle id="tp" cx="0" cy="0" r="4" fill="#1A1A1A"', '<circle id="tp" cx="0" cy="0" r="12" fill="#1A1A1A"', text)

# Test point text labels: e.g. font-size="9" font-weight="bold" fill="#555">TP1
text = re.sub(r'font-size="9" font-weight="bold" fill="#555">TP', 'font-size="16" font-weight="bold" fill="#111">TP', text)

with open('js/svg-circuits.js', 'w') as f:
    f.write(text)

print("Fixed SVGs!")
