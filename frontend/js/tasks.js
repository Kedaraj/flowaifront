// Tasks Page - Displays teacher-assigned tasks for students

let currentStudent = null;
let studentTasks = [];

document.addEventListener('DOMContentLoaded', () => {
  // Check authentication
  currentStudent = Store.getCurrentUser();
  if (!currentStudent || currentStudent.role !== 'student') {
    window.location.href = 'login.html';
    return;
  }

  if (!currentStudent.isApproved) {
    alert('Your account is pending teacher approval.');
    Store.setCurrentUser(null);
    window.location.href = 'login.html';
    return;
  }

  const addTaskBtn = document.getElementById('add-task-btn');
  const taskModal = document.getElementById('task-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const taskForm = document.getElementById('task-form');
  const taskList = document.getElementById('task-list');
  const filterBtns = document.querySelectorAll('.filter-btn');
  
  let currentFilter = 'All';

  // Hide add task button for students (only teachers can assign tasks)
  if (addTaskBtn) addTaskBtn.style.display = 'none';
  if (taskModal) taskModal.style.display = 'none';

  // Add info banner for students
  const pageHeader = document.querySelector('.page-header');
  if (pageHeader) {
    const infoBanner = document.createElement('div');
    infoBanner.className = 'glass-card';
    infoBanner.style.cssText = 'padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px;';
    infoBanner.innerHTML = `
      <span style="font-size: 1.2rem;">👨‍🏫</span>
      <span style="font-size: 0.9rem; color: var(--text-secondary);">
        Tasks shown here are assigned by your teacher. Complete them by the due date!
      </span>
    `;
    pageHeader.parentNode.insertBefore(infoBanner, pageHeader.nextSibling);
  }

  // Filters
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.textContent;
      renderTasks();
    });
  });

  // Render tasks from teacher assignments
  function renderTasks() {
    if (!taskList) return;
    taskList.innerHTML = '';

    studentTasks = Store.getStudentTasks(currentStudent.id);
    
    let tasks = [...studentTasks];
    if (currentFilter === 'Pending') tasks = tasks.filter(t => !t.completed);
    if (currentFilter === 'Completed') tasks = tasks.filter(t => t.completed);

    if (tasks.length === 0) {
      taskList.innerHTML = `
        <div class="glass-card" style="padding: 40px; text-align: center;">
          <p style="color: var(--text-secondary);">No tasks assigned yet.</p>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 8px;">
            Your teacher will assign tasks for you to complete.
          </p>
        </div>
      `;
      return;
    }

    tasks.forEach(task => {
      const priorityClass = task.priority === 'high' ? 'high' : task.priority === 'medium' ? 'medium' : 'low';
      const priorityText = task.priority.charAt(0).toUpperCase() + task.priority.slice(1) + ' Priority';
      const completedClass = task.completed ? 'completed' : '';
      const daysLeft = Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
      const dueStatus = daysLeft < 0 ? 'Overdue' : daysLeft === 0 ? 'Due Today' : daysLeft === 1 ? 'Due Tomorrow' : `${daysLeft} days left`;
      const dueColor = daysLeft < 0 ? 'var(--danger)' : daysLeft <= 1 ? '#f59e0b' : 'var(--text-secondary)';

      const taskHTML = `
        <div class="glass-card task-item ${completedClass} animate-up" data-id="${task.id}">
          <div class="task-info">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}"></div>
            <div>
              <div class="task-title" style="${task.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${task.title}</div>
              <div style="font-size: 0.85rem; color: ${dueColor};">${dueStatus} • Due: ${new Date(task.dueDate).toLocaleDateString()}</div>
              ${task.assignedAt ? `<div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">Assigned on ${new Date(task.assignedAt).toLocaleDateString()}</div>` : ''}
            </div>
          </div>
          <div class="task-meta">
            <span class="tag ${priorityClass}">${priorityText}</span>
            ${task.completed ? '<span class="tag" style="background: var(--success); color: white;">✓ Completed</span>' : ''}
          </div>
        </div>
      `;
      taskList.insertAdjacentHTML('beforeend', taskHTML);
    });

    attachTaskListeners();
  }

  function attachTaskListeners() {
    const checkboxes = document.querySelectorAll('.task-checkbox');
    checkboxes.forEach(cb => {
      cb.addEventListener('click', (e) => {
        const item = e.target.closest('.task-item');
        const id = item.getAttribute('data-id');
        Store.toggleStudentTask(currentStudent.id, id);
        
        const task = studentTasks.find(t => t.id === id);
        if (window.showToast) {
          window.showToast(task?.completed ? 'Task completed! 🎉' : 'Task marked incomplete', 'success');
        }
        
        renderTasks();
      });
    });
  }

  // Initial render
  renderTasks();
});
