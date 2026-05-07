// Student Dashboard - Displays teacher-assigned data

let currentStudent = null;
let studentTasks = [];

document.addEventListener('DOMContentLoaded', () => {
  console.log('[Dashboard] DOM loaded, initializing...');
  
  try {
    // Initialize Store first
    if (typeof Store !== 'undefined' && Store.init) {
      Store.init();
    }

    // Check authentication
    currentStudent = Store.getCurrentUser();
    if (!currentStudent || currentStudent.role !== 'student') {
      console.log('[Dashboard] No valid student session, redirecting to login');
      window.location.href = 'login.html';
      return;
    }

    if (!currentStudent.isApproved) {
      console.log('[Dashboard] Student account not approved');
      alert('Your account is pending teacher approval. Please wait for approval before accessing the dashboard.');
      Store.setCurrentUser(null);
      window.location.href = 'login.html';
      return;
    }

    console.log('[Dashboard] Student authenticated:', currentStudent.name);

    // Update student info
    updateStudentInfo();
    
    // Load teacher-assigned data
    loadStudentTasks();
    loadStudyHoursData();
    initChart();
    updateDeadlinesList();

    // Logout handlers
    const logoutBtn = document.getElementById('logout-btn');
    const dropdownLogoutBtn = document.getElementById('dropdown-logout-btn');
    
    

    // Study Hours Logic
    initStudyHoursLogic();

    // Task Completion Logic
    initTaskCompletionLogic();

    // Profile Dropdown Logic
    initProfileDropdown();
    
    // Notification Logic
    initNotifications();
    
    // Request notification permission on first load
    requestNotificationPermission();
    
    console.log('[Dashboard] Initialization complete');
  } catch (error) {
    console.error('[Dashboard] Initialization error:', error);
  }
});

function updateStudentInfo() {
  if (!currentStudent) {
    console.warn('[Dashboard] No current student in updateStudentInfo');
    return;
  }
  
  try {
    // Update welcome message
    const welcomeName = document.querySelector('.topbar h2 .gradient-text');
    if (welcomeName) welcomeName.textContent = currentStudent.name.split(' ')[0];
    
    // Update avatar
    const avatar = document.getElementById('profile-avatar');
    if (avatar) {
      avatar.textContent = currentStudent.name.charAt(0).toUpperCase();
    }
    
    // Update profile dropdown
    const profileName = document.querySelector('#profile-dropdown strong');
    const profileEmail = document.querySelector('#profile-dropdown span');
    if (profileName) profileName.textContent = currentStudent.name;
    if (profileEmail) profileEmail.textContent = currentStudent.email;
  } catch (error) {
    console.error('[Dashboard] Error updating student info:', error);
  }
}

function loadStudentTasks() {
  if (!currentStudent) {
    console.warn('[Dashboard] No current student in loadStudentTasks');
    return;
  }
  
  try {
    studentTasks = Store.getStudentTasks(currentStudent.id);
    console.log('[Dashboard] Loaded tasks:', studentTasks.length);
    updateTaskCompletionUI();
  } catch (error) {
    console.error('[Dashboard] Error loading student tasks:', error);
    studentTasks = [];
  }
}

function loadStudyHoursData() {
  if (!currentStudent) {
    console.warn('[Dashboard] No current student in loadStudyHoursData');
    return;
  }
  
  try {
    const studyHours = Store.getStudentStudyHours(currentStudent.id);
    const studyHoursVal = document.getElementById('study-hours-val');
    const studyGoalVal = document.getElementById('study-goal-val');
    
    // Load from local storage or use teacher-assigned goal
    let currentHours = localStorage.getItem(`study_hours_${currentStudent.id}`) || '0';
    let currentGoal = studyHours?.dailyGoal || 6;

    if (studyHoursVal) studyHoursVal.textContent = currentHours;
    if (studyGoalVal) studyGoalVal.textContent = `Goal: ${currentGoal} hours`;
  } catch (error) {
    console.error('[Dashboard] Error loading study hours data:', error);
  }
}

function updateDeadlinesList() {
  if (!currentStudent) {
    console.warn('[Dashboard] No current student in updateDeadlinesList');
    return;
  }
  
  const deadlinesList = document.getElementById('deadlines-list');
  if (!deadlinesList) {
    console.warn('[Dashboard] Deadlines list container not found');
    return;
  }
  
  try {
    // Get upcoming tasks sorted by due date
    const upcomingTasks = studentTasks
      .filter(t => !t.completed && new Date(t.dueDate) >= new Date())
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 3);
    
    if (upcomingTasks.length === 0) {
      deadlinesList.innerHTML = '<li class="text-secondary">No upcoming deadlines. Check with your teacher for new assignments!</li>';
    } else {
      deadlinesList.innerHTML = upcomingTasks.map(task => {
        const daysLeft = Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
        const urgencyClass = daysLeft <= 1 ? 'text-danger' : daysLeft <= 3 ? 'text-warning' : '';
        const timeText = daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days`;
        
        return `
          <li style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid var(--glass-border)">
            <div>
              <strong style="display:block">${task.title}</strong>
              <span style="font-size:0.85rem;color:var(--text-secondary)">Priority: ${task.priority}</span>
            </div>
            <span class="${urgencyClass}" style="font-size:0.85rem">${timeText}</span>
          </li>
        `;
      }).join('');
    }
  } catch (error) {
    console.error('[Dashboard] Error updating deadlines list:', error);
  }
}

function initChart() {
  try {
    const ctx = document.getElementById('productivityChart');
    if (!ctx) {
      console.warn('[Dashboard] Chart canvas not found');
      return;
    }

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    if (typeof Chart !== 'undefined') {
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Study Hours',
            data: [3, 4.5, 2, 5, 4, 6, 2],
            backgroundColor: '#3b82f6',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor } },
            x: { grid: { display: false }, ticks: { color: textColor } }
          }
        }
      });
    } else {
      console.warn('[Dashboard] Chart library not loaded');
    }
  } catch (error) {
    console.error('[Dashboard] Error initializing chart:', error);
  }
}

function initStudyHoursLogic() {
  try {
    const studyHoursWidget = document.getElementById('study-hours-widget');
    const studyModal = document.getElementById('study-modal');
    const closeStudyModalBtn = document.getElementById('close-study-modal');
    const studyForm = document.getElementById('study-form');
    const studyHoursInput = document.getElementById('study-hours-input');
    const studyGoalInput = document.getElementById('study-goal-input');
    const studyHoursVal = document.getElementById('study-hours-val');
    const studyGoalVal = document.getElementById('study-goal-val');

    if (!studyHoursWidget || !studyModal) {
      console.warn('[Dashboard] Study hours widget or modal not found');
      return;
    }

    const studyHours = Store.getStudentStudyHours(currentStudent?.id) || { dailyGoal: 6 };
    let currentHours = localStorage.getItem(`study_hours_${currentStudent?.id}`) || '0';
    let currentGoal = studyHours.dailyGoal || 6;

    if (studyHoursVal) studyHoursVal.textContent = currentHours;
    if (studyGoalVal) studyGoalVal.textContent = `Goal: ${currentGoal} hours`;

    studyHoursWidget.addEventListener('click', () => {
      studyHoursInput.value = currentHours;
      studyGoalInput.value = currentGoal;
      studyModal.style.display = 'flex';
    });

    if (closeStudyModalBtn) {
      closeStudyModalBtn.addEventListener('click', () => studyModal.style.display = 'none');
    }

    if (studyForm) {
      studyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        currentHours = studyHoursInput.value;
        localStorage.setItem(`study_hours_${currentStudent?.id}`, currentHours);
        if (studyHoursVal) studyHoursVal.textContent = currentHours;
        studyModal.style.display = 'none';
        if (window.showToast) window.showToast('Study hours updated!', 'success');
      });
    }
  } catch (error) {
    console.error('[Dashboard] Error initializing study hours logic:', error);
  }
}

function initTaskCompletionLogic() {
  try {
    const taskCompletionWidget = document.getElementById('task-completion-widget');
    const taskModal = document.getElementById('task-modal');
    const closeTaskModalBtn = document.getElementById('close-task-modal');
    
    if (taskCompletionWidget && taskModal) {
      taskCompletionWidget.addEventListener('click', () => {
        // Show student's tasks in modal with checkboxes
        showTaskListModal();
      });
    } else {
      console.warn('[Dashboard] Task completion widget or modal not found');
    }

    if (closeTaskModalBtn) {
      closeTaskModalBtn.addEventListener('click', () => {
        if (taskModal) taskModal.style.display = 'none';
      });
    }
  } catch (error) {
    console.error('[Dashboard] Error initializing task completion logic:', error);
  }
}

function updateTaskCompletionUI() {
  try {
    const taskRing = document.getElementById('task-ring');
    const taskRingText = document.getElementById('task-ring-text');
    const taskDoneVal = document.getElementById('task-done-val');
    const taskTotalVal = document.getElementById('task-total-val');
    const taskMsgVal = document.getElementById('task-msg-val');

    if (!studentTasks) {
      console.warn('[Dashboard] No student tasks available');
      return;
    }

    const totalTasks = studentTasks.length;
    const completedTasks = studentTasks.filter(t => t.completed).length;
    
    if (totalTasks === 0) {
      if (taskRing) taskRing.style.background = `conic-gradient(var(--success) 0%, rgba(255,255,255,0.1) 0)`;
      if (taskRingText) taskRingText.textContent = '0%';
      if (taskDoneVal) taskDoneVal.textContent = '0';
      if (taskTotalVal) taskTotalVal.textContent = '0';
      if (taskMsgVal) taskMsgVal.textContent = 'Waiting for assignments';
      return;
    }

    const percentage = Math.round((completedTasks / totalTasks) * 100);

    if (taskRing) taskRing.style.background = `conic-gradient(var(--success) ${percentage}%, rgba(255,255,255,0.1) 0)`;
    if (taskRingText) taskRingText.textContent = `${percentage}%`;
    if (taskDoneVal) taskDoneVal.textContent = completedTasks;
    if (taskTotalVal) taskTotalVal.textContent = totalTasks;
    
    if (taskMsgVal) {
      if (percentage === 100) taskMsgVal.textContent = "All done! Amazing job! 🎉";
      else if (percentage >= 75) taskMsgVal.textContent = "Almost there!";
      else if (percentage >= 50) taskMsgVal.textContent = "Keep it up!";
      else if (percentage >= 25) taskMsgVal.textContent = "Good progress!";
      else taskMsgVal.textContent = "You've got this! 💪";
    }
  } catch (error) {
    console.error('[Dashboard] Error updating task completion UI:', error);
  }
}

function showTaskListModal() {
  const taskModal = document.getElementById('task-modal');
  const taskForm = document.getElementById('task-form');
  
  if (!taskModal || !taskForm) {
    console.error('[Dashboard] Task modal or form not found');
    return;
  }
  
  try {
    // Clear and rebuild the form
    taskForm.innerHTML = `
      <h3 style="margin-bottom: 20px;">My Tasks</h3>
      <div style="max-height: 300px; overflow-y: auto; margin-bottom: 20px;">
        ${studentTasks.length === 0 
          ? '<p class="text-secondary">No tasks assigned yet. Check back later!</p>'
          : studentTasks.map(task => `
            <div style="display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid var(--glass-border); border-radius: 8px; margin-bottom: 8px;">
              <input type="checkbox" id="task-${task.id}" ${task.completed ? 'checked' : ''} 
                onchange="toggleTask('${task.id}')" style="width: 20px; height: 20px; cursor: pointer;">
              <div style="flex: 1;">
                <strong style="${task.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${task.title}</strong>
                <p style="font-size: 0.8rem; color: var(--text-secondary);">Due: ${new Date(task.dueDate).toLocaleDateString()} | Priority: ${task.priority}</p>
              </div>
            </div>
          `).join('')
        }
      </div>
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button type="button" id="close-task-modal" class="btn-outline" style="padding: 8px 16px;">Close</button>
      </div>
    `;
    
    // Re-attach close handler
    const closeBtn = document.getElementById('close-task-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        taskModal.style.display = 'none';
      });
    }
    
    taskModal.style.display = 'flex';
  } catch (error) {
    console.error('[Dashboard] Error showing task list modal:', error);
  }
}

function toggleTask(taskId) {
  if (!currentStudent) {
    console.error('[Dashboard] No current student in toggleTask');
    return;
  }
  
  try {
    Store.toggleStudentTask(currentStudent.id, taskId);
    loadStudentTasks();
    updateTaskCompletionUI();
    updateDeadlinesList();
    
    const task = studentTasks.find(t => t.id === taskId);
    if (window.showToast) {
      window.showToast(task?.completed ? 'Task completed! 🎉' : 'Task marked incomplete', 'success');
    }
  } catch (error) {
    console.error('[Dashboard] Error toggling task:', error);
  }
}

function initProfileDropdown() {
  try {
    const profileAvatar = document.getElementById('profile-avatar');
    const profileDropdown = document.getElementById('profile-dropdown');

    if (profileAvatar && profileDropdown) {
      profileAvatar.addEventListener('click', (e) => {
        e.stopPropagation();
        // Hide notifications dropdown if open
        const notifDropdown = document.getElementById('notifications-dropdown');
        if (notifDropdown) notifDropdown.style.display = 'none';
        
        const isVisible = profileDropdown.style.display === 'flex';
        profileDropdown.style.display = isVisible ? 'none' : 'flex';
        
        if (!isVisible) {
          profileDropdown.style.opacity = '0';
          profileDropdown.style.transform = 'translateY(-10px)';
          setTimeout(() => {
            profileDropdown.style.transition = 'all 0.2s ease';
            profileDropdown.style.opacity = '1';
            profileDropdown.style.transform = 'translateY(0)';
          }, 10);
        }
      });

      document.addEventListener('click', (e) => {
        if (!profileDropdown.contains(e.target) && e.target !== profileAvatar) {
          profileDropdown.style.display = 'none';
        }
      });
    } else {
      console.warn('[Dashboard] Profile dropdown elements not found');
    }
  } catch (error) {
    console.error('[Dashboard] Error initializing profile dropdown:', error);
  }
}

// --- Notification Functions ---

function requestNotificationPermission() {
  if (!currentStudent) return;
  
  // Check if already requested
  const settings = Store.getSettings();
  if (settings.notificationPromptShown) return;
  
  // Check if browser supports notifications
  if (!('Notification' in window)) {
    console.log('[Dashboard] Browser does not support notifications');
    return;
  }
  
  // Show permission prompt after a delay
  setTimeout(() => {
    if (Notification.permission === 'default') {
      // Show the enable button in the dropdown
      const promptEl = document.getElementById('notification-permission-prompt');
      if (promptEl) {
        promptEl.style.display = 'block';
      }
    }
  }, 3000);
}

function initNotifications() {
  try {
    const notificationBtn = document.getElementById('notification-btn');
    const notificationsDropdown = document.getElementById('notifications-dropdown');
    const clearBtn = document.getElementById('clear-notifications');
    const enableBtn = document.getElementById('enable-notifications');
    
    if (!notificationBtn || !notificationsDropdown) {
      console.warn('[Dashboard] Notification elements not found');
      return;
    }
    
    // Load notifications
    loadNotifications();
    
    // Toggle notifications dropdown
    notificationBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Hide profile dropdown if open
      const profileDropdown = document.getElementById('profile-dropdown');
      if (profileDropdown) profileDropdown.style.display = 'none';
      
      const isVisible = notificationsDropdown.style.display === 'flex';
      notificationsDropdown.style.display = isVisible ? 'none' : 'flex';
      
      if (!isVisible) {
        // Reload notifications when opening
        loadNotifications();
        
        notificationsDropdown.style.opacity = '0';
        notificationsDropdown.style.transform = 'translateY(-10px)';
        setTimeout(() => {
          notificationsDropdown.style.transition = 'all 0.2s ease';
          notificationsDropdown.style.opacity = '1';
          notificationsDropdown.style.transform = 'translateY(0)';
        }, 10);
      }
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!notificationsDropdown.contains(e.target) && e.target !== notificationBtn) {
        notificationsDropdown.style.display = 'none';
      }
    });
    
    // Clear all notifications
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (currentStudent) {
          Store.clearAllNotifications(currentStudent.id);
          loadNotifications();
          if (window.showToast) window.showToast('Notifications cleared', 'success');
        }
      });
    }
    
    // Enable notifications button
    if (enableBtn) {
      enableBtn.addEventListener('click', () => {
        Store.requestNotificationPermission().then(permission => {
          if (permission === 'granted') {
            if (window.showToast) window.showToast('Notifications enabled!', 'success');
            document.getElementById('notification-permission-prompt').style.display = 'none';
            
            // Save preference
            const settings = Store.getSettings();
            settings.browserNotifs = true;
            settings.notificationPromptShown = true;
            Store.saveSettings(settings);
            
            // Test notification
            Store.showBrowserNotification({
              title: '🔔 Notifications Enabled',
              body: 'You will now receive updates from your teacher!'
            });
          } else {
            if (window.showToast) window.showToast('Please allow notifications in browser settings', 'error');
          }
        });
      });
    }
    
    // Check periodically for new notifications (every 30 seconds)
    setInterval(() => {
      if (currentStudent && document.visibilityState === 'visible') {
        updateNotificationBadge();
      }
    }, 30000);
    
  } catch (error) {
    console.error('[Dashboard] Error initializing notifications:', error);
  }
}

function loadNotifications() {
  if (!currentStudent) return;
  
  try {
    const notifications = Store.getStudentNotifications(currentStudent.id);
    const listEl = document.getElementById('notifications-list');
    const badgeEl = document.getElementById('notification-badge');
    
    if (!listEl) return;
    
    // Update badge
    const unreadCount = notifications.filter(n => !n.read).length;
    if (badgeEl) {
      badgeEl.textContent = unreadCount;
      badgeEl.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
    
    // Render list
    if (notifications.length === 0) {
      listEl.innerHTML = '<p class="text-secondary" style="text-align: center; padding: 20px;">No notifications yet</p>';
    } else {
      listEl.innerHTML = notifications.slice().reverse().map(notif => {
        const timeAgo = getTimeAgo(new Date(notif.timestamp));
        const isUnread = !notif.read;
        
        return `
          <div class="notification-item ${isUnread ? 'unread' : ''}" data-id="${notif.id}" style="
            padding: 12px;
            border-radius: 8px;
            background: ${isUnread ? 'rgba(59, 130, 246, 0.1)' : 'transparent'};
            border-left: 3px solid ${isUnread ? 'var(--accent-color)' : 'transparent'};
            cursor: pointer;
            transition: all 0.2s;
          ">
            <div style="display: flex; align-items: start; gap: 10px;">
              <span style="font-size: 1.2rem;">${notif.icon ? `<img src="${notif.icon}" width="24" height="24" style="border-radius: 4px;">` : '🔔'}</span>
              <div style="flex: 1;">
                <strong style="font-size: 0.9rem; display: block; margin-bottom: 2px;">${notif.title}</strong>
                <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0; line-height: 1.3;">${notif.body}</p>
                <span style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 4px; display: block;">${timeAgo}</span>
              </div>
            </div>
          </div>
        `;
      }).join('');
      
      // Add click handlers to mark as read
      listEl.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', () => {
          const notifId = item.getAttribute('data-id');
          Store.markNotificationRead(currentStudent.id, notifId);
          item.style.background = 'transparent';
          item.style.borderLeftColor = 'transparent';
          updateNotificationBadge();
        });
      });
    }
  } catch (error) {
    console.error('[Dashboard] Error loading notifications:', error);
  }
}

function updateNotificationBadge() {
  if (!currentStudent) return;
  
  const notifications = Store.getStudentNotifications(currentStudent.id);
  const unreadCount = notifications.filter(n => !n.read).length;
  const badgeEl = document.getElementById('notification-badge');
  
  if (badgeEl) {
    badgeEl.textContent = unreadCount;
    badgeEl.style.display = unreadCount > 0 ? 'flex' : 'none';
  }
}

function getTimeAgo(date) {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
