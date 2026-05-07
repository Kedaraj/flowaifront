document.addEventListener('DOMContentLoaded', () => {
  const inputName = document.getElementById('setting-name');
  const inputBrowserNotif = document.getElementById('setting-browser-notif');
  const inputDailyRemind = document.getElementById('setting-daily-remind');
  const inputHours = document.getElementById('setting-hours');
  const btnUpdate = document.getElementById('btn-update-profile');

  // Load settings
  const settings = Store.getSettings();
  
  if (inputName) inputName.value = settings.displayName || '';
  if (inputBrowserNotif) inputBrowserNotif.checked = settings.browserNotifs;
  if (inputDailyRemind) inputDailyRemind.checked = settings.dailyReminder;
  if (inputHours) inputHours.value = settings.dailyGoalHours || 6;

  // Save profile updates
  if (btnUpdate) {
    btnUpdate.addEventListener('click', () => {
      saveAllSettings();
      if (window.showToast) window.showToast('Profile updated successfully! ✨', 'success');
      
      // Update topbar welcome text if it exists (on dashboard)
      // (This script runs on Settings page so we don't have dashboard topbar, but good practice to sync)
    });
  }

  // Auto-save toggles and numbers on change
  [inputDailyRemind, inputHours].forEach(el => {
    if (el) {
      el.addEventListener('change', saveAllSettings);
    }
  });

  // Handle browser notification toggle specially
  if (inputBrowserNotif) {
    inputBrowserNotif.addEventListener('change', () => {
      if (inputBrowserNotif.checked) {
        // Request permission when enabling
        Store.requestNotificationPermission().then(permission => {
          if (permission === 'granted') {
            saveAllSettings();
            Store.showBrowserNotification({
              title: '🔔 Notifications Enabled',
              body: 'You will now receive updates from your teacher!'
            });
            if (window.showToast) window.showToast('Browser notifications enabled! 🔔', 'success');
          } else if (permission === 'denied') {
            inputBrowserNotif.checked = false;
            if (window.showToast) window.showToast('Please allow notifications in your browser settings', 'error');
          } else {
            inputBrowserNotif.checked = false;
            if (window.showToast) window.showToast('Notification permission was not granted.', 'warning');
          }
        });
      } else {
        // Just save the setting when disabling
        saveAllSettings();
      }
    });
  }

  function saveAllSettings() {
    const updated = {
      displayName: inputName ? inputName.value : 'Alex Student',
      browserNotifs: inputBrowserNotif ? inputBrowserNotif.checked : true,
      dailyReminder: inputDailyRemind ? inputDailyRemind.checked : true,
      dailyGoalHours: inputHours ? parseInt(inputHours.value) : 6
    };
    Store.saveSettings(updated);
  }
});
