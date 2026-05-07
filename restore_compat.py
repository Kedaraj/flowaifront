import os
import glob
import re

html_files = glob.glob('frontend/*.html')

for f in html_files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # We will replace the Modular & Compat line with explicit compat script tags + modular script
    new_scripts = """  <!-- Firebase SDK (Compat version) -->
  <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
  <!-- Firebase Modular Auth -->
  <script type="module" src="js/firebase.js"></script>"""
    
    content = re.sub(
        r'<!-- Firebase SDK \(Modular & Compat\) -->\s*<script type="module" src="js/firebase\.js"></script>',
        new_scripts,
        content
    )
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
print('Restored compat script tags.')
