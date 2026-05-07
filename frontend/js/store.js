// store.js - Centralized Data Manager with Firebase Firestore Sync

const Store = {
  // Firebase Firestore instance (set by firebase-config.js)
  db: null,
  useFirebase: false,
  initialized: false,

  // --- Initialization ---
  init() {
    // Check if Firebase is available
    if (typeof db !== 'undefined') {
      this.db = db;
      this.useFirebase = true;
      console.log('[Store] Firebase Firestore detected - will sync data');
      this.syncFromFirebase();
    } else {
      console.log('[Store] Using localStorage only');
    }
    this.initLocalStorage();
    this.initialized = true;
  },

  initLocalStorage() {
    // Initialize students array
    if (!localStorage.getItem('students')) {
      localStorage.setItem('students', JSON.stringify([]));
    }
    
    // Initialize teachers array
    if (!localStorage.getItem('teachers')) {
      localStorage.setItem('teachers', JSON.stringify([]));
    }

    // Initialize approval requests
    if (!localStorage.getItem('approvalRequests')) {
      localStorage.setItem('approvalRequests', JSON.stringify([]));
    }

    // Initialize teacher assignments (tasks, timetable, etc.)
    if (!localStorage.getItem('teacherAssignments')) {
      localStorage.setItem('teacherAssignments', JSON.stringify({}));
    }
    
    // Initialize student progress data
    if (!localStorage.getItem('studentProgress')) {
      localStorage.setItem('studentProgress', JSON.stringify({}));
    }

    // Legacy initialization for default data
    if (!localStorage.getItem('tasks')) {
      localStorage.setItem('tasks', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('timetable')) {
      localStorage.setItem('timetable', JSON.stringify([]));
    }

    if (!localStorage.getItem('goals')) {
      localStorage.setItem('goals', JSON.stringify([]));
    }
    
    // Add demo teacher for testing
    const teachers = this.getTeachers();
    if (teachers.length === 0) {
      teachers.push({
        id: 'teacher_1',
        name: 'Demo Teacher',
        email: 'teacher@example.com',
        password: 'teacher123',
        school: 'Demo School',
        class: '10th Grade',
        subject: 'Mathematics',
        role: 'teacher',
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('teachers', JSON.stringify(teachers));
    }
  },

  // Sync data from Firebase to localStorage on load
  async syncFromFirebase() {
    if (!this.useFirebase) return;
    try {
      // Sync students
      const studentsSnapshot = await this.db.collection('students').get();
      const students = studentsSnapshot.docs.map(doc => doc.data());
      if (students.length > 0) {
        localStorage.setItem('students', JSON.stringify(students));
      }

      // Sync teachers
      const teachersSnapshot = await this.db.collection('teachers').get();
      const teachers = teachersSnapshot.docs.map(doc => doc.data());
      if (teachers.length > 0) {
        localStorage.setItem('teachers', JSON.stringify(teachers));
      }

      console.log('[Store] Data synced from Firebase');
    } catch (error) {
      console.error('[Store] Error syncing from Firebase:', error);
    }
  },

  // Sync to Firebase (background, non-blocking)
  syncToFirebase(collection, data) {
    if (!this.useFirebase) return;
    
    // Sync in background without blocking
    data.forEach(async (item) => {
      try {
        await this.db.collection(collection).doc(item.id).set(item);
      } catch (error) {
        console.error(`[Store] Error syncing ${collection} to Firebase:`, error);
      }
    });
  },

  // --- Auth API ---
  getStudents() {
    return JSON.parse(localStorage.getItem('students')) || [];
  },

  addStudent(student) {
    const students = this.getStudents();
    students.push(student);
    localStorage.setItem('students', JSON.stringify(students));
    
    // Sync to Firebase
    if (this.useFirebase) {
      this.db.collection('students').doc(student.id).set(student).catch(err => 
        console.error('[Store] Firebase sync error:', err)
      );
    }
  },

  getStudentByEmail(email) {
    const students = this.getStudents();
    return students.find(s => s.email === email);
  },

  getTeachers() {
    return JSON.parse(localStorage.getItem('teachers')) || [];
  },

  addTeacher(teacher) {
    const teachers = this.getTeachers();
    teachers.push(teacher);
    localStorage.setItem('teachers', JSON.stringify(teachers));
    
    // Sync to Firebase
    if (this.useFirebase) {
      this.db.collection('teachers').doc(teacher.id).set(teacher).catch(err => 
        console.error('[Store] Firebase sync error:', err)
      );
    }
  },

  getTeacherByEmail(email) {
    const teachers = this.getTeachers();
    return teachers.find(t => t.email === email);
  },

  getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  },
  
  setCurrentUser(user) {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  },
  
  registerUser(userData) {
    const { name, email, password, school, class: className, subject, role } = userData;
    
    if (role === 'student') {
      const students = this.getStudents();
      const existing = students.find(u => u.email === email);
      if (existing) return { success: false, message: 'Email already in use.' };
      
      const newStudent = {
        id: 'student_' + Date.now(),
        name,
        email,
        password,
        school,
        class: className,
        role: 'student',
        isApproved: false,
        approvedBy: null,
        approvedAt: null,
        createdAt: new Date().toISOString()
      };
      students.push(newStudent);
      localStorage.setItem('students', JSON.stringify(students));
      
      // Sync to Firebase
      if (this.useFirebase) {
        this.db.collection('students').doc(newStudent.id).set(newStudent).catch(err => 
          console.error('[Store] Firebase sync error:', err)
        );
      }
      
      return { success: true, user: newStudent };
      
    } else if (role === 'teacher') {
      const teachers = this.getTeachers();
      const existing = teachers.find(u => u.email === email);
      if (existing) return { success: false, message: 'Email already in use.' };
      
      const newTeacher = {
        id: 'teacher_' + Date.now(),
        name,
        email,
        password,
        school,
        class: className,
        subject,
        role: 'teacher',
        students: [],
        createdAt: new Date().toISOString()
      };
      teachers.push(newTeacher);
      localStorage.setItem('teachers', JSON.stringify(teachers));
      
      // Sync to Firebase
      if (this.useFirebase) {
        this.db.collection('teachers').doc(newTeacher.id).set(newTeacher).catch(err => 
          console.error('[Store] Firebase sync error:', err)
        );
      }
      
      return { success: true, user: newTeacher };
    }
    
    return { success: false, message: 'Invalid role.' };
  },
  
  loginUser(email, password, role) {
    if (role === 'student') {
      const students = this.getStudents();
      const user = students.find(u => u.email === email && u.password === password);
      if (user) {
        return { success: true, user };
      }
      return { success: false, message: 'Invalid email or password.' };
      
    } else if (role === 'teacher') {
      const teachers = this.getTeachers();
      const user = teachers.find(u => u.email === email && u.password === password);
      if (user) {
        return { success: true, user };
      }
      return { success: false, message: 'Invalid email or password.' };
    }
    
    return { success: false, message: 'Invalid role specified.' };
  },
  
  // --- Approval Workflow ---
  getApprovalRequests() {
    return JSON.parse(localStorage.getItem('approvalRequests')) || [];
  },
  
  sendStudentApprovalRequests(student) {
    const teachers = this.getTeachers();
    const requests = this.getApprovalRequests();
    
    // Find teachers matching student's school and class
    const matchingTeachers = teachers.filter(t => 
      t.school.toLowerCase() === student.school.toLowerCase() &&
      t.class.toLowerCase() === student.class.toLowerCase()
    );
    
    matchingTeachers.forEach(teacher => {
      const request = {
        id: 'req_' + Date.now() + '_' + teacher.id,
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        studentSchool: student.school,
        studentClass: student.class,
        teacherId: teacher.id,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      requests.push(request);
    });
    
    localStorage.setItem('approvalRequests', JSON.stringify(requests));
    
    // Sync to Firebase
    if (this.useFirebase && matchingTeachers.length > 0) {
      matchingTeachers.forEach(teacher => {
        const request = requests.find(r => r.teacherId === teacher.id && r.studentId === student.id);
        if (request) {
          this.db.collection('approvalRequests').doc(request.id).set(request).catch(err => 
            console.error('[Store] Firebase sync error:', err)
          );
        }
      });
    }
    
    return matchingTeachers.length;
  },
  
  getTeacherNotifications(teacherId) {
    const requests = this.getApprovalRequests();
    return requests.filter(r => r.teacherId === teacherId && r.status === 'pending');
  },
  
  approveStudent(requestId) {
    const requests = this.getApprovalRequests();
    const request = requests.find(r => r.id === requestId);
    
    if (!request) return { success: false, message: 'Request not found.' };
    
    request.status = 'approved';
    request.approvedAt = new Date().toISOString();
    
    // Update student status
    const students = this.getStudents();
    const student = students.find(s => s.id === request.studentId);
    if (student) {
      student.isApproved = true;
      student.approvedBy = request.teacherId;
      student.approvedAt = new Date().toISOString();
    }
    
    // Add student to teacher's list
    const teachers = this.getTeachers();
    const teacher = teachers.find(t => t.id === request.teacherId);
    if (teacher && !teacher.students.includes(request.studentId)) {
      teacher.students.push(request.studentId);
    }
    
    localStorage.setItem('approvalRequests', JSON.stringify(requests));
    localStorage.setItem('students', JSON.stringify(students));
    localStorage.setItem('teachers', JSON.stringify(teachers));
    
    // Sync to Firebase
    if (this.useFirebase) {
      this.db.collection('approvalRequests').doc(requestId).set(request).catch(err => 
        console.error('[Store] Firebase sync error:', err)
      );
      if (student) {
        this.db.collection('students').doc(student.id).set(student).catch(err => 
          console.error('[Store] Firebase sync error:', err)
        );
      }
      if (teacher) {
        this.db.collection('teachers').doc(teacher.id).set(teacher).catch(err => 
          console.error('[Store] Firebase sync error:', err)
        );
      }
    }
    
    return { success: true };
  },
  
  rejectStudent(requestId) {
    const requests = this.getApprovalRequests();
    const request = requests.find(r => r.id === requestId);
    
    if (!request) return { success: false, message: 'Request not found.' };
    
    request.status = 'rejected';
    request.rejectedAt = new Date().toISOString();
    
    localStorage.setItem('approvalRequests', JSON.stringify(requests));
    
    // Sync to Firebase
    if (this.useFirebase) {
      this.db.collection('approvalRequests').doc(requestId).set(request).catch(err => 
        console.error('[Store] Firebase sync error:', err)
      );
    }
    
    return { success: true };
  },
  
  getTeacherStudents(teacherId) {
    const teachers = this.getTeachers();
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return [];
    
    const students = this.getStudents();
    return students.filter(s => teacher.students.includes(s.id));
  },

  // --- Tasks API ---
  getTasks() {
    return JSON.parse(localStorage.getItem('tasks')) || [];
  },
  saveTasks(tasks) {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  },
  addTask(task) {
    const tasks = this.getTasks();
    task.id = Date.now().toString();
    task.completed = false;
    tasks.push(task);
    this.saveTasks(tasks);
  },
  deleteTask(id) {
    const tasks = this.getTasks().filter(t => t.id !== id);
    this.saveTasks(tasks);
  },
  toggleTaskCompletion(id) {
    const tasks = this.getTasks();
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks(tasks);
    }
  },

  // --- Timetable API ---
  getTimetable() {
    return JSON.parse(localStorage.getItem('timetable')) || [];
  },
  addTimetableSlot(slot) {
    const slots = this.getTimetable();
    slot.id = 'ts_' + Date.now();
    slots.push(slot);
    localStorage.setItem('timetable', JSON.stringify(slots));
  },
  deleteTimetableSlot(id) {
    const slots = this.getTimetable().filter(s => s.id !== id);
    localStorage.setItem('timetable', JSON.stringify(slots));
  },

  // --- Goals API ---
  getGoals() {
    return JSON.parse(localStorage.getItem('goals')) || [];
  },
  saveGoals(goals) {
    localStorage.setItem('goals', JSON.stringify(goals));
  },
  addGoal(goal) {
    const goals = this.getGoals();
    goal.id = 'g_' + Date.now();
    goals.push(goal);
    this.saveGoals(goals);
  },
  toggleMilestone(goalId, milestoneId) {
    const goals = this.getGoals();
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      const ms = goal.milestones.find(m => m.id === milestoneId);
      if (ms) {
        ms.done = !ms.done;
        this.saveGoals(goals);
      }
    }
  },

  // --- Teacher Assignment API ---
  getTeacherAssignments(teacherId) {
    const assignments = JSON.parse(localStorage.getItem('teacherAssignments')) || {};
    return assignments[teacherId] || { tasks: [], timetable: [], goals: [], studyHours: {} };
  },
  
  saveTeacherAssignments(teacherId, assignments) {
    const allAssignments = JSON.parse(localStorage.getItem('teacherAssignments')) || {};
    allAssignments[teacherId] = assignments;
    localStorage.setItem('teacherAssignments', JSON.stringify(allAssignments));
    
    // Sync to Firebase
    if (this.useFirebase) {
      this.db.collection('teacherAssignments').doc(teacherId).set(assignments).catch(err => 
        console.error('[Store] Firebase sync error:', err)
      );
    }
  },
  
  // Assign task to specific student
  assignTaskToStudent(teacherId, studentId, task) {
    const assignments = this.getTeacherAssignments(teacherId);
    if (!assignments.tasks) assignments.tasks = [];
    
    task.id = 'task_' + Date.now();
    task.assignedTo = studentId;
    task.assignedBy = teacherId;
    task.assignedAt = new Date().toISOString();
    task.completed = false;
    
    assignments.tasks.push(task);
    this.saveTeacherAssignments(teacherId, assignments);
    return task;
  },
  
  // Get tasks assigned to a student by their teacher
  getStudentTasks(studentId) {
    const teachers = this.getTeachers();
    const student = this.getStudents().find(s => s.id === studentId);
    if (!student || !student.approvedBy) return [];
    
    const teacherAssignments = this.getTeacherAssignments(student.approvedBy);
    return (teacherAssignments.tasks || []).filter(t => t.assignedTo === studentId);
  },
  
  // Assign timetable slot to student
  assignTimetableToStudent(teacherId, studentId, slot) {
    const assignments = this.getTeacherAssignments(teacherId);
    if (!assignments.timetable) assignments.timetable = [];
    
    slot.id = 'tt_' + Date.now();
    slot.assignedTo = studentId;
    slot.assignedBy = teacherId;
    
    assignments.timetable.push(slot);
    this.saveTeacherAssignments(teacherId, assignments);
    return slot;
  },
  
  // Get timetable for student
  getStudentTimetable(studentId) {
    const student = this.getStudents().find(s => s.id === studentId);
    if (!student || !student.approvedBy) return [];
    
    const teacherAssignments = this.getTeacherAssignments(student.approvedBy);
    return (teacherAssignments.timetable || []).filter(t => t.assignedTo === studentId);
  },
  
  // Assign goal to student
  assignGoalToStudent(teacherId, studentId, goal) {
    const assignments = this.getTeacherAssignments(teacherId);
    if (!assignments.goals) assignments.goals = [];
    
    goal.id = 'goal_' + Date.now();
    goal.assignedTo = studentId;
    goal.assignedBy = teacherId;
    goal.createdAt = new Date().toISOString();
    
    assignments.goals.push(goal);
    this.saveTeacherAssignments(teacherId, assignments);
    return goal;
  },
  
  // Get goals for student
  getStudentGoals(studentId) {
    const student = this.getStudents().find(s => s.id === studentId);
    if (!student || !student.approvedBy) return [];
    
    const teacherAssignments = this.getTeacherAssignments(student.approvedBy);
    return (teacherAssignments.goals || []).filter(g => g.assignedTo === studentId);
  },
  
  // Set study hours goal for student
  setStudentStudyHours(teacherId, studentId, hours) {
    const assignments = this.getTeacherAssignments(teacherId);
    if (!assignments.studyHours) assignments.studyHours = {};
    
    assignments.studyHours[studentId] = {
      dailyGoal: hours,
      setBy: teacherId,
      setAt: new Date().toISOString()
    };
    
    this.saveTeacherAssignments(teacherId, assignments);
  },
  
  // Get student's study hours goal
  getStudentStudyHours(studentId) {
    const student = this.getStudents().find(s => s.id === studentId);
    if (!student || !student.approvedBy) return { dailyGoal: 6 };
    
    const teacherAssignments = this.getTeacherAssignments(student.approvedBy);
    return teacherAssignments.studyHours?.[studentId] || { dailyGoal: 6 };
  },
  
  // Mark student task as complete/incomplete
  toggleStudentTask(studentId, taskId) {
    const student = this.getStudents().find(s => s.id === studentId);
    if (!student || !student.approvedBy) return;
    
    const assignments = this.getTeacherAssignments(student.approvedBy);
    const task = (assignments.tasks || []).find(t => t.id === taskId && t.assignedTo === studentId);
    
    if (task) {
      task.completed = !task.completed;
      if (task.completed) {
        task.completedAt = new Date().toISOString();
      } else {
        delete task.completedAt;
      }
      this.saveTeacherAssignments(student.approvedBy, assignments);
    }
  },
  
  // Delete teacher-assigned task
  deleteStudentTask(teacherId, taskId) {
    const assignments = this.getTeacherAssignments(teacherId);
    if (assignments.tasks) {
      assignments.tasks = assignments.tasks.filter(t => t.id !== taskId);
      this.saveTeacherAssignments(teacherId, assignments);
    }
  },
  
  // Delete timetable slot
  deleteStudentTimetable(teacherId, slotId) {
    const assignments = this.getTeacherAssignments(teacherId);
    if (assignments.timetable) {
      assignments.timetable = assignments.timetable.filter(t => t.id !== slotId);
      this.saveTeacherAssignments(teacherId, assignments);
    }
  },
  
  // Delete goal
  deleteStudentGoal(teacherId, goalId) {
    const assignments = this.getTeacherAssignments(teacherId);
    if (assignments.goals) {
      assignments.goals = assignments.goals.filter(g => g.id !== goalId);
      this.saveTeacherAssignments(teacherId, assignments);
    }
  },

  // --- Settings API ---
  getSettings() {
    return JSON.parse(localStorage.getItem('settings')) || {
      displayName: 'Student',
      browserNotifs: true,
      dailyReminder: true,
      dailyGoalHours: 6
    };
  },
  saveSettings(settings) {
    localStorage.setItem('settings', JSON.stringify(settings));
    
    // Sync to Firebase (using a default settings key)
    if (this.useFirebase) {
      this.db.collection('settings').doc('default').set(settings).catch(err => 
        console.error('[Store] Firebase sync error:', err)
      );
    }
  },

  // --- Push Notification API ---
  getNotificationSubscriptions() {
    return JSON.parse(localStorage.getItem('notificationSubscriptions')) || {};
  },
  
  saveNotificationSubscription(studentId, subscription) {
    const subscriptions = this.getNotificationSubscriptions();
    subscriptions[studentId] = {
      ...subscription,
      timestamp: new Date().toISOString(),
      enabled: true
    };
    localStorage.setItem('notificationSubscriptions', JSON.stringify(subscriptions));
    
    // Sync to Firebase
    if (this.useFirebase) {
      this.db.collection('notificationSubscriptions').doc(studentId).set(subscriptions[studentId]).catch(err => 
        console.error('[Store] Firebase sync error:', err)
      );
    }
  },
  
  removeNotificationSubscription(studentId) {
    const subscriptions = this.getNotificationSubscriptions();
    delete subscriptions[studentId];
    localStorage.setItem('notificationSubscriptions', JSON.stringify(subscriptions));
    
    // Sync to Firebase
    if (this.useFirebase) {
      this.db.collection('notificationSubscriptions').doc(studentId).delete().catch(err => 
        console.error('[Store] Firebase sync error:', err)
      );
    }
  },
  
  isNotificationEnabled(studentId) {
    const subscriptions = this.getNotificationSubscriptions();
    return subscriptions[studentId]?.enabled || false;
  },
  
  // Send notification to a specific student (stored for retrieval)
  sendNotificationToStudent(studentId, notification) {
    const notifications = JSON.parse(localStorage.getItem(`notifications_${studentId}`)) || [];
    const newNotification = {
      id: crypto.randomUUID(),
      ...notification,
      timestamp: new Date().toISOString(),
      read: false
    };
    notifications.push(newNotification);
    // Keep only last 50 notifications
    if (notifications.length > 50) {
      notifications.shift();
    }
    localStorage.setItem(`notifications_${studentId}`, JSON.stringify(notifications));
    
    // Sync to Firebase
    if (this.useFirebase) {
      this.db.collection('notifications').doc(studentId).set(notifications).catch(err => 
        console.error('[Store] Firebase sync error:', err)
      );
    }
    
    // Try to trigger push notification if enabled
    this.triggerPushNotification(studentId, notification);
  },
  
  // Get notifications for a student
  getStudentNotifications(studentId) {
    return JSON.parse(localStorage.getItem(`notifications_${studentId}`)) || [];
  },
  
  // Mark notification as read
  markNotificationRead(studentId, notificationId) {
    const notifications = this.getStudentNotifications(studentId);
    const notif = notifications.find(n => n.id === notificationId);
    if (notif) {
      notif.read = true;
      localStorage.setItem(`notifications_${studentId}`, JSON.stringify(notifications));
      
      // Sync to Firebase
      if (this.useFirebase) {
        this.db.collection('notifications').doc(studentId).set(notifications).catch(err => 
          console.error('[Store] Firebase sync error:', err)
        );
      }
    }
  },
  
  // Clear all notifications for a student
  clearAllNotifications(studentId) {
    localStorage.removeItem(`notifications_${studentId}`);
    
    // Sync to Firebase
    if (this.useFirebase) {
      this.db.collection('notifications').doc(studentId).delete().catch(err => 
        console.error('[Store] Firebase sync error:', err)
      );
    }
  },
  
  // Trigger browser push notification
  triggerPushNotification(studentId, notification) {
    const settings = this.getSettings();
    if (!settings.browserNotifs) return;
    
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return;
    }
    
    // Check if permission is granted
    if (Notification.permission === 'granted') {
      this.showBrowserNotification(notification);
    } else if (Notification.permission !== 'denied') {
      // Request permission
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.showBrowserNotification(notification);
        }
      });
    }
  },
  
  // Show browser notification
  showBrowserNotification(notification) {
    if (!notification.title) return;
    
    try {
      new Notification(notification.title, {
        body: notification.body || 'New update from your teacher',
        icon: notification.icon || '/favicon.ico',
        badge: notification.badge || '/favicon.ico',
        tag: notification.tag || 'teacher-assignment',
        requireInteraction: false,
        data: notification.data || {}
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  },
  
  // Request notification permission
  requestNotificationPermission() {
    if (!('Notification' in window)) {
      return Promise.resolve('not-supported');
    }
    
    if (Notification.permission === 'granted') {
      return Promise.resolve('granted');
    }
    
    return Notification.requestPermission();
  }
};

// Initialize default data if empty
Store.init();

// Expose Store to the global window object for ES module access
window.Store = Store;
