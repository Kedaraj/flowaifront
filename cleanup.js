const fs = require('fs');

// 1. Fix teacher-dashboard.html logout button
const tdHtml = 'frontend/teacher-dashboard.html';
let content = fs.readFileSync(tdHtml, 'utf-8');
content = content.replace('onclick="logout()"', 'id="logout-btn"');
fs.writeFileSync(tdHtml, content, 'utf-8');

// 2. Clean up duplicate logout listeners in JS files
const files = fs.readdirSync('frontend/js').filter(f => f.endsWith('.js') && !f.includes('main') && !f.includes('auth') && !f.includes('firebase') && !f.includes('store'));

for (const file of files) {
    const path = `frontend/js/${file}`;
    let js = fs.readFileSync(path, 'utf-8');
    
    // Remove function logout() { ... }
    js = js.replace(/function logout\(\)\s*\{[\s\S]*?\n\}/g, '');
    
    // Remove handleLogout logic
    js = js.replace(/const handleLogout = \(e\) => \{[\s\S]*?\};\s*(?:if \(logoutBtn\).*?;\s*)?(?:if \(dropdownLogoutBtn\).*?;)?/g, '');
    
    // Remove inline logout handler
    js = js.replace(/\/\/\s*Logout handler\s*const logoutBtn = document\.getElementById\('logout-btn'\);\s*if \(logoutBtn\) \{[\s\S]*?\}\s*\}/g, '');
    
    fs.writeFileSync(path, js, 'utf-8');
}
console.log('Cleanup complete');
