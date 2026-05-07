// Teacher Dashboard JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in as teacher
  const currentUser = Store.getCurrentUser();
  if (!currentUser || currentUser.role !== 'teacher') {
    window.location.href = 'login.html';
    return;
  }

  // Update teacher info
  document.getElementById('teacher-name').textContent = currentUser.name;
  document.getElementById('profile-avatar').textContent = currentUser.name.charAt(0).toUpperCase();

  // Load dashboard data
  loadDashboardData();
  loadStudents();
  loadRequests();
  loadAssignments();
  populateStudentSelects();
});

let currentTeacher = null;

function loadDashboardData() {
  currentTeacher = Store.getCurrentUser();
  if (!currentTeacher) return;

  const students = Store.getTeacherStudents(currentTeacher.id);
  const notifications = Store.getTeacherNotifications(currentTeacher.id);
  const assignments = Store.getTeacherAssignments(currentTeacher.id);
  const totalTasks = assignments.tasks ? assignments.tasks.length : 0;

  // Update stats
  document.getElementById('total-students').textContent = students.length;
  document.getElementById('pending-requests').textContent = notifications.length;
  document.getElementById('total-tasks').textContent = totalTasks;

  // Update badge
  const badge = document.getElementById('request-badge');
  if (notifications.length > 0) {
    badge.textContent = notifications.length;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }

  // Load recent students
  const recentStudentsList = document.getElementById('recent-students');
  if (students.length === 0) {
    recentStudentsList.innerHTML = '<li class="text-secondary">No students yet.</li>';
  } else {
    recentStudentsList.innerHTML = students.slice(0, 5).map(student => `
      <li class="student-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid var(--glass-border);">
        <div class="student-info">
          <h4 style="margin: 0;">${student.name}</h4>
          <p style="margin: 4px 0; font-size: 0.85rem; color: var(--text-secondary);">${student.email}</p>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <span class="text-success" style="font-size: 0.85rem;">Approved</span>
          <button class="btn-outline btn-sm" onclick="viewStudentProgress('${student.id}')">View Progress</button>
        </div>
      </li>
    `).join('');
  }

  // Load recent requests
  const recentRequestsDiv = document.getElementById('recent-requests');
  const pendingRequests = notifications.slice(0, 3);
  if (pendingRequests.length === 0) {
    recentRequestsDiv.innerHTML = '<p class="text-secondary">No pending requests.</p>';
  } else {
    recentRequestsDiv.innerHTML = pendingRequests.map(req => `
      <div class="request-card pending">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h4>${req.studentName}</h4>
            <p style="font-size: 0.85rem; color: var(--text-secondary);">${req.studentEmail}</p>
            <p style="font-size: 0.8rem;">${req.studentSchool} - ${req.studentClass}</p>
          </div>
          <div class="student-actions">
            <button class="btn-primary btn-sm" onclick="approveRequest('${req.id}')">Approve</button>
            <button class="btn-outline btn-sm text-danger" onclick="rejectRequest('${req.id}')">Reject</button>
          </div>
        </div>
      </div>
    `).join('');
  }
}

function loadStudents() {
  if (!currentTeacher) currentTeacher = Store.getCurrentUser();
  if (!currentTeacher) return;

  const students = Store.getTeacherStudents(currentTeacher.id);
  const allStudentsList = document.getElementById('all-students');

  if (students.length === 0) {
    allStudentsList.innerHTML = '<li class="text-secondary">No approved students yet. Students will appear here after you approve their requests.</li>';
  } else {
    allStudentsList.innerHTML = students.map(student => `
      <li class="student-item" style="display: flex; justify-content: space-between; align-items: center; padding: 16px; border: 1px solid var(--glass-border); border-radius: 12px; margin-bottom: 12px; background: var(--glass-bg);">
        <div class="student-info">
          <h4 style="margin: 0 0 4px 0;">${student.name}</h4>
          <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">${student.email}</p>
          <p style="margin: 4px 0 0 0; font-size: 0.8rem; color: var(--text-secondary);">${student.school} - ${student.class}</p>
        </div>
        <div class="student-actions" style="display: flex; gap: 8px;">
          <button class="btn-outline btn-sm" onclick="viewStudentProgress('${student.id}')" title="View student progress and tasks">View Progress</button>
          <button class="btn-primary btn-sm" onclick="assignToStudent('${student.id}')">Assign Task</button>
        </div>
      </li>
    `).join('');
  }
}

function loadRequests() {
  if (!currentTeacher) currentTeacher = Store.getCurrentUser();
  if (!currentTeacher) return;

  const notifications = Store.getTeacherNotifications(currentTeacher.id);
  const allRequestsDiv = document.getElementById('all-requests');

  if (notifications.length === 0) {
    allRequestsDiv.innerHTML = '<p class="text-secondary">No pending requests. New student signups matching your school and class will appear here.</p>';
  } else {
    allRequestsDiv.innerHTML = notifications.map(req => `
      <div class="request-card pending">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h4>${req.studentName}</h4>
            <p style="font-size: 0.85rem; color: var(--text-secondary);">${req.studentEmail}</p>
            <p style="font-size: 0.8rem;">${req.studentSchool} - ${req.studentClass}</p>
            <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 8px;">
              Requested ${new Date(req.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div class="student-actions">
            <button class="btn-primary btn-sm" onclick="approveRequest('${req.id}')">Approve</button>
            <button class="btn-outline btn-sm text-danger" onclick="rejectRequest('${req.id}')">Reject</button>
          </div>
        </div>
      </div>
    `).join('');
  }
}

function loadAssignments() {
  if (!currentTeacher) currentTeacher = Store.getCurrentUser();
  if (!currentTeacher) return;

  const assignments = Store.getTeacherAssignments(currentTeacher.id);
  const students = Store.getTeacherStudents(currentTeacher.id);

  // Load tasks
  const tasksList = document.getElementById('assigned-tasks-list');
  if (!assignments.tasks || assignments.tasks.length === 0) {
    tasksList.innerHTML = '<p class="text-secondary">No tasks assigned yet.</p>';
  } else {
    tasksList.innerHTML = assignments.tasks.map(task => {
      const student = students.find(s => s.id === task.assignedTo);
      return `
        <div class="request-card ${task.completed ? 'approved' : 'pending'}">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h4>${task.title}</h4>
              <p style="font-size: 0.85rem; color: var(--text-secondary);">
                Assigned to: ${student ? student.name : 'Unknown'} | Due: ${new Date(task.dueDate).toLocaleDateString()}
              </p>
              <span class="badge" style="font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; background: ${task.priority === 'high' ? 'var(--danger)' : task.priority === 'medium' ? '#f59e0b' : 'var(--success)'};">${task.priority}</span>
              ${task.completed ? '<span class="text-success" style="margin-left: 8px;">✓ Completed</span>' : '<span class="text-warning" style="margin-left: 8px;">⏳ Pending</span>'}
            </div>
            <button class="btn-outline btn-sm text-danger" onclick="deleteTask('${task.id}')">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Load timetable
  const timetableList = document.getElementById('assigned-timetable-list');
  if (!assignments.timetable || assignments.timetable.length === 0) {
    timetableList.innerHTML = '<p class="text-secondary">No timetable entries yet.</p>';
  } else {
    timetableList.innerHTML = assignments.timetable.map(slot => {
      const student = students.find(s => s.id === slot.assignedTo);
      return `
        <div class="request-card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h4>${slot.subject}</h4>
              <p style="font-size: 0.85rem; color: var(--text-secondary);">
                ${slot.day} at ${slot.time} | Student: ${student ? student.name : 'Unknown'}
              </p>
            </div>
            <button class="btn-outline btn-sm text-danger" onclick="deleteTimetable('${slot.id}')">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Load goals
  const goalsList = document.getElementById('assigned-goals-list');
  if (!assignments.goals || assignments.goals.length === 0) {
    goalsList.innerHTML = '<p class="text-secondary">No goals assigned yet.</p>';
  } else {
    goalsList.innerHTML = assignments.goals.map(goal => {
      const student = students.find(s => s.id === goal.assignedTo);
      return `
        <div class="request-card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h4>${goal.title}</h4>
              <p style="font-size: 0.85rem; color: var(--text-secondary);">
                Assigned to: ${student ? student.name : 'Unknown'} | Target: ${new Date(goal.targetDate).toLocaleDateString()}
              </p>
              ${goal.description ? `<p style="font-size: 0.8rem; margin-top: 4px;">${goal.description}</p>` : ''}
            </div>
            <button class="btn-outline btn-sm text-danger" onclick="deleteGoal('${goal.id}')">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  }
}

function populateStudentSelects() {
  if (!currentTeacher) currentTeacher = Store.getCurrentUser();
  if (!currentTeacher) return;

  const students = Store.getTeacherStudents(currentTeacher.id);
  const options = students.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

  ['task-student', 'tt-student', 'goal-student'].forEach(id => {
    const select = document.getElementById(id);
    if (select) {
      select.innerHTML = '<option value="">Choose a student...</option>' + options;
    }
  });
}

function approveRequest(requestId) {
  const result = Store.approveStudent(requestId);
  if (result.success) {
    if (window.showToast) window.showToast('Student approved successfully!', 'success');
    loadDashboardData();
    loadStudents();
    loadRequests();
    populateStudentSelects();
  } else {
    if (window.showToast) window.showToast(result.message, 'error');
  }
}

function rejectRequest(requestId) {
  const result = Store.rejectStudent(requestId);
  if (result.success) {
    if (window.showToast) window.showToast('Request rejected.', 'success');
    loadRequests();
  } else {
    if (window.showToast) window.showToast(result.message, 'error');
  }
}

function showTab(tabName) {
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  document.getElementById(`tab-${tabName}`).classList.add('active');
  event.target.classList.add('active');
}

function showAssignmentTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('#tab-assignments .tab-content').forEach(content => content.classList.remove('active'));
  
  document.getElementById(`assignment-${tabName}`).classList.add('active');
  event.target.classList.add('active');
}

function openAssignTaskModal() {
  document.getElementById('task-modal').classList.add('active');
  document.getElementById('task-due').valueAsDate = new Date();
}

function openTimetableModal() {
  document.getElementById('timetable-modal').classList.add('active');
}

function openGoalModal() {
  document.getElementById('goal-modal').classList.add('active');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 7);
  document.getElementById('goal-target').valueAsDate = tomorrow;
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

function assignToStudent(studentId) {
  openAssignTaskModal();
  document.getElementById('task-student').value = studentId;
}

function deleteTask(taskId) {
  if (!confirm('Are you sure you want to delete this task?')) return;
  Store.deleteStudentTask(currentTeacher.id, taskId);
  loadAssignments();
  loadDashboardData();
  if (window.showToast) window.showToast('Task deleted.', 'success');
}

function deleteTimetable(slotId) {
  if (!confirm('Are you sure you want to delete this timetable entry?')) return;
  Store.deleteStudentTimetable(currentTeacher.id, slotId);
  loadAssignments();
  if (window.showToast) window.showToast('Timetable entry deleted.', 'success');
}

function deleteGoal(goalId) {
  if (!confirm('Are you sure you want to delete this goal?')) return;
  Store.deleteStudentGoal(currentTeacher.id, goalId);
  loadAssignments();
  if (window.showToast) window.showToast('Goal deleted.', 'success');
}

function viewStudentProgress(studentId) {
  const student = Store.getStudents().find(s => s.id === studentId);
  if (!student) {
    if (window.showToast) window.showToast('Student not found', 'error');
    return;
  }

  // Get student data
  const tasks = Store.getStudentTasks(studentId) || [];
  const goals = Store.getStudentGoals(studentId) || [];
  const studyHours = Store.getStudentStudyHours(studentId) || { dailyGoal: 6 };
  const currentHours = localStorage.getItem(`study_hours_${studentId}`) || '0';

  // Calculate stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const activeTasks = totalTasks - completedTasks;

  // Populate modal
  document.getElementById('progress-student-name').textContent = `${student.name}'s Progress`;
  document.getElementById('progress-avatar').textContent = student.name.charAt(0).toUpperCase();
  document.getElementById('progress-name').textContent = student.name;
  document.getElementById('progress-email').textContent = student.email;
  document.getElementById('progress-school').textContent = `${student.school} - ${student.class}`;

  // Stats
  document.getElementById('progress-task-completion').textContent = `${completionRate}%`;
  document.getElementById('progress-study-hours').textContent = currentHours;
  document.getElementById('progress-tasks-count').textContent = activeTasks;

  // Tasks list
  const tasksList = document.getElementById('progress-tasks-list');
  if (tasks.length === 0) {
    tasksList.innerHTML = '<p class="text-secondary">No tasks assigned yet.</p>';
  } else {
    tasksList.innerHTML = tasks.map(task => {
      const isCompleted = task.completed;
      const daysLeft = Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
      const urgencyClass = daysLeft <= 1 ? 'text-danger' : daysLeft <= 3 ? 'text-warning' : 'text-success';
      const statusText = isCompleted ? '✓ Completed' : daysLeft < 0 ? '⚠ Overdue' : `${daysLeft} days left`;
      const statusClass = isCompleted ? 'text-success' : daysLeft < 0 ? 'text-danger' : urgencyClass;

      return `
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid var(--glass-border); border-radius: 8px; margin-bottom: 8px; ${isCompleted ? 'opacity: 0.6;' : ''}">
          <div style="width: 12px; height: 12px; border-radius: 50%; background: ${isCompleted ? 'var(--success)' : daysLeft < 0 ? 'var(--danger)' : 'var(--warning)'};"></div>
          <div style="flex: 1;">
            <strong style="${isCompleted ? 'text-decoration: line-through;' : ''}">${task.title}</strong>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 4px 0;">
              Due: ${new Date(task.dueDate).toLocaleDateString()} | Priority: ${task.priority}
            </p>
          </div>
          <span class="${statusClass}" style="font-size: 0.85rem; font-weight: 500;">${statusText}</span>
        </div>
      `;
    }).join('');
  }

  // Goals list
  const goalsList = document.getElementById('progress-goals-list');
  if (goals.length === 0) {
    goalsList.innerHTML = '<p class="text-secondary">No goals assigned yet.</p>';
  } else {
    goalsList.innerHTML = goals.map(goal => {
      const daysLeft = Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
      const isOverdue = daysLeft < 0;

      return `
        <div style="padding: 12px; border: 1px solid var(--glass-border); border-radius: 8px; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <strong>${goal.title}</strong>
            <span style="font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; background: ${isOverdue ? 'var(--danger)' : 'var(--accent-color)'}; color: white;">
              ${isOverdue ? 'Overdue' : daysLeft === 0 ? 'Due Today' : `${daysLeft} days left`}
            </span>
          </div>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 4px 0;">
            Target: ${new Date(goal.targetDate).toLocaleDateString()}
          </p>
          ${goal.description ? `<p style="font-size: 0.8rem; margin-top: 4px;">${goal.description}</p>` : ''}
        </div>
      `;
    }).join('');
  }

  // Show modal
  document.getElementById('progress-modal').classList.add('active');
}



// Form submissions
document.getElementById('assign-task-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const taskTitle = document.getElementById('task-title').value;
  const task = {
    title: taskTitle,
    dueDate: document.getElementById('task-due').value,
    priority: document.getElementById('task-priority').value
  };
  
  const studentId = document.getElementById('task-student').value;
  if (!studentId) {
    if (window.showToast) window.showToast('Please select a student.', 'error');
    return;
  }
  
  Store.assignTaskToStudent(currentTeacher.id, studentId, task);
  
  // Send notification to student
  const student = Store.getStudents().find(s => s.id === studentId);
  if (student) {
    Store.sendNotificationToStudent(studentId, {
      title: '📋 New Task Assigned',
      body: `Your teacher assigned: "${taskTitle}" (Due: ${new Date(task.dueDate).toLocaleDateString()})`,
      icon: 'https://cdn-icons-png.flaticon.com/512/3176/3176218.png',
      tag: 'task-assignment',
      data: { type: 'task', studentId, teacherId: currentTeacher.id }
    });
  }
  
  closeModal('task-modal');
  e.target.reset();
  loadAssignments();
  loadDashboardData();
  if (window.showToast) window.showToast('Task assigned successfully!', 'success');
});

document.getElementById('add-timetable-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const subject = document.getElementById('tt-subject').value;
  const day = document.getElementById('tt-day').value;
  const time = document.getElementById('tt-time').value;
  const slot = {
    subject: subject,
    day: day,
    time: time
  };
  
  const studentId = document.getElementById('tt-student').value;
  if (!studentId) {
    if (window.showToast) window.showToast('Please select a student.', 'error');
    return;
  }
  
  Store.assignTimetableToStudent(currentTeacher.id, studentId, slot);
  
  // Send notification to student
  const student = Store.getStudents().find(s => s.id === studentId);
  if (student) {
    Store.sendNotificationToStudent(studentId, {
      title: '📅 New Timetable Entry',
      body: `"${subject}" scheduled for ${day} at ${time}`,
      icon: 'https://cdn-icons-png.flaticon.com/512/3176/3176218.png',
      tag: 'timetable-assignment',
      data: { type: 'timetable', studentId, teacherId: currentTeacher.id }
    });
  }
  
  closeModal('timetable-modal');
  e.target.reset();
  loadAssignments();
  if (window.showToast) window.showToast('Timetable slot added!', 'success');
});

document.getElementById('add-goal-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const goalTitle = document.getElementById('goal-title').value;
  const targetDate = document.getElementById('goal-target').value;
  const description = document.getElementById('goal-description').value;
  const goal = {
    title: goalTitle,
    targetDate: targetDate,
    description: description
  };
  
  const studentId = document.getElementById('goal-student').value;
  if (!studentId) {
    if (window.showToast) window.showToast('Please select a student.', 'error');
    return;
  }
  
  Store.assignGoalToStudent(currentTeacher.id, studentId, goal);
  
  // Send notification to student
  const student = Store.getStudents().find(s => s.id === studentId);
  if (student) {
    Store.sendNotificationToStudent(studentId, {
      title: '🎯 New Goal Set',
      body: `"${goalTitle}" - Target: ${new Date(targetDate).toLocaleDateString()}${description ? ` | ${description}` : ''}`,
      icon: 'https://cdn-icons-png.flaticon.com/512/3176/3176218.png',
      tag: 'goal-assignment',
      data: { type: 'goal', studentId, teacherId: currentTeacher.id }
    });
  }
  
  closeModal('goal-modal');
  e.target.reset();
  loadAssignments();
  if (window.showToast) window.showToast('Goal assigned successfully!', 'success');
});

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });
});

// Close progress modal function
function closeProgressModal() {
  document.getElementById('progress-modal').classList.remove('active');
}
