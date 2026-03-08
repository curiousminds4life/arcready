import json
import re

with open('data/questions-theory.json', 'r') as f:
    questions = json.load(f)

for q in questions:
    if 'svgId' in q:
        text_to_scan = q.get('question', '')
        options = q.get('options', {})
        for opt in options.values():
            text_to_scan += ' ' + opt
        
        # Test original JS regex logic
        tpRegex = re.compile(r'TP(\d+)', re.IGNORECASE)
        matches = tpRegex.findall(text_to_scan)
        
        # Look for "test point(s) X and Y"
        fallback_matches = re.findall(r'test point[s]?\s+(\d+)(?:\s+(?:and|or|to|-)\s+(\d+))?', text_to_scan, re.IGNORECASE)
        
        print(f"[{q['id']}] Q: {q['question']}")
        print(f"    -> TP Matches    : {matches}")
        print(f"    -> Words Matches : {fallback_matches}")
        
