document.addEventListener('DOMContentLoaded', () => {
  const btnAddSlot = document.getElementById('btn-add-slot');
  const slotModal = document.getElementById('slot-modal');
  const btnCloseModal = document.getElementById('close-slot-modal');
  const slotForm = document.getElementById('slot-form');
  const btnPdf = document.getElementById('btn-pdf');

  // Modal logic
  if (btnAddSlot && slotModal) {
    btnAddSlot.addEventListener('click', () => slotModal.style.display = 'flex');
  }
  if (btnCloseModal && slotModal) {
    btnCloseModal.addEventListener('click', () => slotModal.style.display = 'none');
  }

  // Handle Form Submit
  if (slotForm) {
    slotForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const subject = document.getElementById('slot-subject').value;
      const type = document.getElementById('slot-type').value;
      const day = document.getElementById('slot-day').value;
      const time = document.getElementById('slot-time').value;
      const color = document.getElementById('slot-color').value;

      Store.addTimetableSlot({ subject, type, day, time, color });
      
      slotModal.style.display = 'none';
      slotForm.reset();
      if (window.showToast) window.showToast('Subject added to timetable! 📅', 'success');
      renderTimetable();
    });
  }

  // Render Timetable from Store
  function renderTimetable() {
    // Clear current slots
    const allSlots = document.querySelectorAll('.time-slot');
    allSlots.forEach(slot => {
      slot.innerHTML = '';
      // Also remove any existing event listeners for delete to avoid memory leaks
    });

    const slotsData = Store.getTimetable();

    slotsData.forEach(data => {
      // Find the correct slot div based on day and time
      const targetSlot = document.querySelector(`.time-slot[data-day="${data.day}"][data-time="${data.time}"]`);
      if (targetSlot) {
        const slotHTML = `
          <div class="subject-card ${data.color}" style="position:relative;">
            <button class="delete-slot" data-id="${data.id}" style="position:absolute; top:2px; right:2px; background:none; border:none; color:white; font-size:12px; cursor:pointer;">&times;</button>
            <strong>${data.subject}</strong><br>${data.type}
          </div>
        `;
        targetSlot.insertAdjacentHTML('beforeend', slotHTML);
      }
    });

    // Attach delete listeners
    const deleteBtns = document.querySelectorAll('.delete-slot');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        Store.deleteTimetableSlot(id);
        if (window.showToast) window.showToast('Slot removed from timetable.', 'success');
        renderTimetable();
      });
    });
  }

  // Handle PDF Export
  if (btnPdf) {
    btnPdf.addEventListener('click', () => {
      const element = document.getElementById('timetable-capture');
      const opt = {
        margin:       0.5,
        filename:     'FocusFlow-Timetable.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
      };

      // Ensure html2pdf is loaded
      if (typeof html2pdf !== 'undefined') {
        html2pdf().set(opt).from(element).save();
      } else {
        alert("PDF generator library not loaded.");
      }
    });
  }

  // Initial render
  renderTimetable();
});
