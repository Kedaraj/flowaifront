document.addEventListener('DOMContentLoaded', () => {
  // Grab the form regardless of whether the ID is present (fixes browser caching issues)
  const authForm = document.querySelector('form');

  if (authForm) {
    authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const emailEl = document.getElementById('email');
      const passwordEl = document.getElementById('password');
      const nameEl = document.getElementById('name'); // Only exists on Signup page
      
      if (!emailEl || !passwordEl) return;
      
      const email = emailEl.value.trim();
      const password = passwordEl.value;

      // If 'name' exists, this is the Sign Up form
      if (nameEl) {
        const name = nameEl.value.trim();
        
        if (password.length < 6) {
          if (window.showToast) window.showToast('Password must be at least 6 characters long.', 'error');
          else alert('Password must be at least 6 characters long.');
          return;
        }

        const result = Store.registerUser(name, email, password);
        
        if (result.success) {
          Store.setCurrentUser({ name: result.user.name, email: result.user.email });
          if (window.showToast) window.showToast('Account created successfully!', 'success');
          else alert('Account created successfully!');
          
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 1000);
        } else {
          if (window.showToast) window.showToast(result.message, 'error');
          else alert(result.message);
        }
      } 
      // Otherwise, it's the Log In form
      else {
        const result = Store.loginUser(email, password);
        
        if (result.success) {
          Store.setCurrentUser(result.user);
          if (window.showToast) window.showToast('Welcome back, ' + result.user.name + '!', 'success');
          else alert('Welcome back, ' + result.user.name + '!');
          
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 1000);
        } else {
          if (window.showToast) window.showToast(result.message, 'error');
          else alert(result.message);
        }
      }
    });
  }
});
