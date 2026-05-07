import { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword } from './firebase.js';

// Helper function for professional popups
function showNotification(msg, type) {
  if (window.showToast) {
    window.showToast(msg, type);
  } else {
    alert(msg);
  }
}

// Error Message Parser
function getErrorMessage(error) {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please log in.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect password or email. Please try again.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
}

// --- Student Login ---
const studentLoginForm = document.getElementById('student-login-form');
if (studentLoginForm) {
  studentLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('student-email').value.trim();
    const password = document.getElementById('student-password').value;

    if (!email || !password) {
      return showNotification('Please fill in all fields.', 'error');
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Verify role and store in localStorage for backwards compatibility with store.js
      const doc = await db.collection('students').doc(userCredential.user.uid).get();
      if (!doc.exists) {
        showNotification('No student account found. Are you a teacher?', 'error');
        auth.signOut();
        return;
      }
      
      const studentData = doc.data();
      if (!studentData.isApproved) {
        showNotification('Your account is pending teacher approval.', 'warning');
        return;
      }

      window.Store.setCurrentUser({ ...studentData, id: userCredential.user.uid });
      showNotification('Welcome back, ' + studentData.name + '!', 'success');
      setTimeout(() => window.location.href = 'dashboard.html', 1500);
      
    } catch (error) {
      showNotification(getErrorMessage(error), 'error');
    }
  });
}

// --- Teacher Login ---
const teacherLoginForm = document.getElementById('teacher-login-form');
if (teacherLoginForm) {
  teacherLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('teacher-email').value.trim();
    const password = document.getElementById('teacher-password').value;

    if (!email || !password) {
      return showNotification('Please fill in all fields.', 'error');
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      const doc = await db.collection('teachers').doc(userCredential.user.uid).get();
      if (!doc.exists) {
        showNotification('No teacher account found. Are you a student?', 'error');
        auth.signOut();
        return;
      }

      const teacherData = doc.data();
      window.Store.setCurrentUser({ ...teacherData, id: userCredential.user.uid });
      showNotification('Welcome back, ' + teacherData.name + '!', 'success');
      setTimeout(() => window.location.href = 'teacher-dashboard.html', 1500);
      
    } catch (error) {
      showNotification(getErrorMessage(error), 'error');
    }
  });
}

// --- Student Signup ---
const studentSignupForm = document.getElementById('student-signup-form');
if (studentSignupForm) {
  studentSignupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('student-name').value.trim();
    const email = document.getElementById('student-email').value.trim();
    const password = document.getElementById('student-password').value;
    const school = document.getElementById('student-school').value.trim();
    const className = document.getElementById('student-class').value.trim();

    if (!name || !email || !password || !school || !className) {
      return showNotification('Please fill in all fields.', 'error');
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      const newStudent = {
        id: uid,
        name,
        email,
        school,
        class: className,
        role: 'student',
        isApproved: false,
        approvedBy: null,
        createdAt: new Date().toISOString()
      };

      await db.collection('students').doc(uid).set(newStudent);
      window.Store.sendStudentApprovalRequests(newStudent);
      
      showNotification('Account created! Waiting for teacher approval.', 'success');
      setTimeout(() => window.location.href = 'login.html', 2000);
      
    } catch (error) {
      showNotification(getErrorMessage(error), 'error');
    }
  });
}

// --- Teacher Signup ---
const teacherSignupForm = document.getElementById('teacher-signup-form');
if (teacherSignupForm) {
  teacherSignupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('teacher-name').value.trim();
    const email = document.getElementById('teacher-email').value.trim();
    const password = document.getElementById('teacher-password').value;
    const school = document.getElementById('teacher-school').value.trim();
    const className = document.getElementById('teacher-class').value.trim();
    const subject = document.getElementById('teacher-subject').value.trim();

    if (!name || !email || !password || !school || !className || !subject) {
      return showNotification('Please fill in all fields.', 'error');
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      const newTeacher = {
        id: uid,
        name,
        email,
        school,
        class: className,
        subject,
        role: 'teacher',
        students: [],
        createdAt: new Date().toISOString()
      };

      await db.collection('teachers').doc(uid).set(newTeacher);
      
      window.Store.setCurrentUser(newTeacher);
      showNotification('Account created successfully!', 'success');
      setTimeout(() => window.location.href = 'teacher-dashboard.html', 1500);
      
    } catch (error) {
      showNotification(getErrorMessage(error), 'error');
    }
  });
}
