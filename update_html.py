import os
import glob
import re

html_files = glob.glob('frontend/*.html')

importmap = """  <script type="importmap">
    {
      "imports": {
        "firebase/app": "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js",
        "firebase/auth": "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js",
        "firebase/compat/app": "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js",
        "firebase/compat/firestore": "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"
      }
    }
  </script>"""

for f in html_files:
    if "login" in f or "signup" in f:
        continue
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    if 'importmap' in content: continue

    if '<style>' in content:
        content = content.replace('<style>', importmap + '\n  <style>', 1)
    elif '</head>' in content:
        content = content.replace('</head>', importmap + '\n</head>', 1)
        
    content = re.sub(
        r'<!-- Firebase SDK \(Compat version\) -->\s*<script src="https://www\.gstatic\.com/firebasejs/.*?/firebase-app-compat\.js"></script>\s*<script src="https://www\.gstatic\.com/firebasejs/.*?/firebase-firestore-compat\.js"></script>\s*<script src="js/firebase-config\.js"></script>',
        '<!-- Firebase SDK (Modular & Compat) -->\n  <script type="module" src="js/firebase.js"></script>',
        content
    )
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
print('Updated HTML files successfully.')
