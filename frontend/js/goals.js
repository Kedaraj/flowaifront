document.addEventListener('DOMContentLoaded', () => {
  const btnNewGoal = document.querySelector('.btn-primary'); // Using the first primary button for + New Goal
  const goalModal = document.getElementById('goal-modal');
  const btnCloseGoal = document.getElementById('close-goal-modal');
  const goalForm = document.getElementById('goal-form');
  const goalsList = document.getElementById('goals-list');

  // Ensure button opens modal
  if (btnNewGoal && goalModal) {
    btnNewGoal.addEventListener('click', () => {
      if (btnNewGoal.textContent.includes('New Goal')) {
        goalModal.style.display = 'flex';
      }
    });
  }

  if (btnCloseGoal && goalModal) {
    btnCloseGoal.addEventListener('click', () => goalModal.style.display = 'none');
  }

  if (goalForm) {
    goalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('goal-title').value;
      const target = document.getElementById('goal-target').value;
      const msString = document.getElementById('goal-milestones').value;

      const milestones = msString.split(',').map((m, idx) => ({
        id: 'm_' + Date.now() + '_' + idx,
        text: m.trim(),
        done: false
      })).filter(m => m.text !== '');

      Store.addGoal({ title, target, milestones });
      goalModal.style.display = 'none';
      goalForm.reset();
      if (window.showToast) window.showToast('Goal added successfully! 🎯', 'success');
      renderGoals();
    });
  }

  function renderGoals() {
    if (!goalsList) return;
    goalsList.innerHTML = '';
    const goals = Store.getGoals();

    goals.forEach(goal => {
      const total = goal.milestones.length;
      const completed = goal.milestones.filter(m => m.done).length;
      const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
      
      let milestonesHTML = '';
      goal.milestones.forEach(m => {
        const doneClass = m.done ? 'done' : '';
        milestonesHTML += `
          <li class="milestone-item ${doneClass}" data-gid="${goal.id}" data-mid="${m.id}" style="cursor:pointer;">
            <div class="milestone-checkbox"></div>
            <span>${m.text}</span>
          </li>
        `;
      });

      const goalHTML = `
        <div class="glass-card goal-card animate-up">
          <div class="goal-header">
            <div>
              <div class="goal-title">${goal.title}</div>
              <div class="goal-desc">Target: ${goal.target}</div>
            </div>
            <span class="tag" style="background: var(--glass-border); padding: 4px 8px; border-radius: 4px;">${percentage}%</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${percentage}%;"></div>
          </div>
          <ul class="milestones">
            ${milestonesHTML}
          </ul>
        </div>
      `;
      goalsList.insertAdjacentHTML('beforeend', goalHTML);
    });

    attachMilestoneListeners();
  }

  function attachMilestoneListeners() {
    const items = document.querySelectorAll('.milestone-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        const gid = item.getAttribute('data-gid');
        const mid = item.getAttribute('data-mid');
        Store.toggleMilestone(gid, mid);
        if (window.showToast) window.showToast('Progress updated!', 'success');
        renderGoals();
      });
    });
  }

  // Initial render
  renderGoals();
});
