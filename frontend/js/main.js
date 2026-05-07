// Create Toast Container on load
let toastContainer;
document.addEventListener('DOMContentLoaded', () => {
  if (!document.body) {
    console.error('document.body is null - script may be loading too early');
    return;
  }
  
  toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  document.body.appendChild(toastContainer);

  // Initialize Store
  Store.init();

  // --- Theme Toggle Logic ---
  const themeToggle = document.getElementById('theme-toggle');
  const rootElement = document.documentElement;

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    rootElement.setAttribute('data-theme', savedTheme);
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = rootElement.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      rootElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    });
  }

  // --- Route Protection ---
  const protectedRoutes = ['dashboard.html', 'tasks.html', 'timetable.html', 'analytics.html', 'goals.html', 'settings.html', 'teacher-dashboard.html'];
  const authRoutes = ['login.html', 'signup.html'];
  const currentPath = window.location.pathname;

  const currentUser = Store.getCurrentUser();
  const isProtectedPage = protectedRoutes.some(route => currentPath.includes(route));
  const isAuthPage = authRoutes.some(route => currentPath.includes(route));

  if (isProtectedPage && !currentUser) {
    // Not logged in, redirect to login
    window.location.href = 'login.html';
    return;
  }

  if (isAuthPage && currentUser) {
    // Already logged in, redirect to appropriate dashboard based on role
    if (currentUser.role === 'teacher') {
      window.location.href = 'teacher-dashboard.html';
    } else {
      window.location.href = 'dashboard.html';
    }
    return;
  }

  // --- Topbar & Sidebar UI Update ---
  if (currentUser) {
    // Update welcome message if present (Dashboard Topbar)
    const welcomeNames = document.querySelectorAll('.gradient-text');
    welcomeNames.forEach(el => {
      if (el.parentElement.textContent.includes('Welcome back')) {
        el.textContent = currentUser.name.split(' ')[0] + '!'; // Show first name
      }
    });

    // Update avatar text (Topbar and Sidebar)
    const avatars = document.querySelectorAll('.avatar');
    avatars.forEach(avatar => {
      avatar.textContent = currentUser.name.charAt(0).toUpperCase();
    });

    // Update Sidebar Full Name
    const sidebarNames = document.querySelectorAll('.sidebar-user strong');
    sidebarNames.forEach(el => {
      el.textContent = currentUser.name;
    });

    // Update index.html navbar buttons
    if (currentPath === '/' || currentPath.includes('index.html')) {
      const navLinks = document.querySelector('.nav-links');
      if (navLinks) {
        navLinks.innerHTML = `
          <a href="#features">Features</a>
          <a href="dashboard.html" class="btn-primary">Dashboard</a>
          <a href="#" id="logout-btn" class="btn-outline">Log Out</a>
          <button id="theme-toggle" class="btn-icon" aria-label="Toggle Theme">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
          </button>
        `;
        // Re-attach theme toggle listener since we overwrote innerHTML
        const newToggle = document.getElementById('theme-toggle');
        if (newToggle) {
          newToggle.addEventListener('click', () => {
            const cur = document.documentElement.getAttribute('data-theme') || 'dark';
            const nxt = cur === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', nxt);
            localStorage.setItem('theme', nxt);
          });
        }
      }
      
      const ctaButtons = document.querySelector('.cta-buttons');
      if (ctaButtons) {
        ctaButtons.innerHTML = `
          <a href="dashboard.html" class="btn-primary btn-large">Go to Dashboard</a>
          <a href="#features" class="btn-outline btn-large">Explore Features</a>
        `;
      }
    }
  }

  // --- Global Logout Logic ---
  const logoutButtons = document.querySelectorAll('#logout-btn, #dropdown-logout-btn, .logout-action');
  logoutButtons.forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (window.showToast) window.showToast('Signing out...', 'info');
      
      if (window.auth) {
        await window.auth.signOut();
      } else if (window.firebase && window.firebase.auth) {
        try {
          await window.firebase.auth().signOut();
        } catch(e) {}
      }
      
      Store.setCurrentUser(null);
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 500);
    });
  });

  // --- Mobile Sidebar Toggle Logic ---
  const layoutWrapper = document.querySelector('.layout-wrapper');
  if (layoutWrapper && !document.querySelector('.mobile-menu-btn')) {
    const topbar = document.querySelector('.topbar');
    if (topbar) {
      // Create Hamburger Button
      const menuBtn = document.createElement('button');
      menuBtn.className = 'mobile-menu-btn';
      menuBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
      
      // Insert at the start of the topbar
      topbar.insertBefore(menuBtn, topbar.firstChild);

      // Create Overlay
      const overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      document.body.appendChild(overlay);

      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        menuBtn.addEventListener('click', () => {
          sidebar.classList.add('active');
          overlay.classList.add('active');
        });

        overlay.addEventListener('click', () => {
          sidebar.classList.remove('active');
          overlay.classList.remove('active');
        });

        // Close sidebar when a nav item is clicked on mobile
        const navItems = sidebar.querySelectorAll('.nav-item, .sidebar-nav > div');
        navItems.forEach(item => {
          item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
              sidebar.classList.remove('active');
              overlay.classList.remove('active');
            }
          });
        });
      }
    }
  }
});

// --- Global Toast Function ---
window.showToast = function(message, type = 'success') {
  if (!toastContainer) {
    console.warn('Toast container not available, creating it');
    if (!document.body) {
      console.error('document.body is null, cannot create toast container');
      return;
    }
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  
  if (!toastContainer) {
    console.error('Still cannot create toast container');
    return;
  }
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // Icon based on type
  const icon = type === 'success' 
    ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>` 
    : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;

  toast.innerHTML = `
    <div style="display:flex; align-items:center; gap:12px;">
      ${icon}
      <span>${message}</span>
    </div>
  `;
  
  toastContainer.appendChild(toast);

  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 3000);
};
