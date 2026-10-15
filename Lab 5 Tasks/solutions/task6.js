// Task 6 - Legacy Course Registration Service Using Callbacks
// Error-first callbacks: callback(error, value). No Promises, no async/await.

// ---------- the "legacy database" ----------
const students = {
  101: { id: 101, name: 'Ali', completed: ['CS301', 'CS302'] },
  102: { id: 102, name: 'Sara', completed: ['CS101'] },
  103: { id: 103, name: 'Hina', completed: ['CS301', 'CS302'] }
};

const courses = {
  CS401: { code: 'CS401', prerequisites: ['CS301', 'CS302'], seatsLeft: 2 },
  CS402: { code: 'CS402', prerequisites: ['CS301'], seatsLeft: 0 }
};

const registrations = [{ studentId: 103, course: 'CS401' }];

const DELAY_MS = 15;

// ---------------------------------------------------------------------------
// The four asynchronous operations.
// Each one schedules a named function with setTimeout and passes data as extra
// arguments, so the timer function needs nothing but its own parameters.
// Each finish function calls its callback EXACTLY ONCE and then returns.
// ---------------------------------------------------------------------------

function finishLoadStudent(studentId, callback) {
  const student = students[studentId];
  if (student === undefined) {
    callback(new Error(`Student ${studentId} does not exist`));
    return;
  }
  callback(null, student);
}

export function loadStudent(studentId, callback) {
  console.log(`  [1] loadStudent(${studentId})`);
  setTimeout(finishLoadStudent, DELAY_MS, studentId, callback);
}

function finishCheckPrerequisites(student, courseCode, callback) {
  const course = courses[courseCode];
  if (course === undefined) {
    callback(new Error(`Course ${courseCode} does not exist`));
    return;
  }
  const missing = course.prerequisites.filter((code) => !student.completed.includes(code));
  if (missing.length > 0) {
    callback(new Error(`Prerequisite not completed: ${missing.join(', ')}`));
    return;
  }
  callback(null, course);
}

export function checkPrerequisites(student, courseCode, callback) {
  console.log(`  [2] checkPrerequisites(${student.name}, ${courseCode})`);
  setTimeout(finishCheckPrerequisites, DELAY_MS, student, courseCode, callback);
}

function finishCheckSeats(course, callback) {
  if (course.seatsLeft <= 0) {
    callback(new Error(`Course ${course.code} is full`));
    return;
  }
  callback(null, course);
}

export function checkSeats(course, callback) {
  console.log(`  [3] checkSeats(${course.code}) -> ${course.seatsLeft} seat(s) left`);
  setTimeout(finishCheckSeats, DELAY_MS, course, callback);
}

function finishRegisterCourse(student, course, callback) {
  const alreadyRegistered = registrations.some(
    (entry) => entry.studentId === student.id && entry.course === course.code
  );
  if (alreadyRegistered) {
    callback(new Error(`Student ${student.id} is already registered for ${course.code}`));
    return;
  }
  registrations.push({ studentId: student.id, course: course.code });
  course.seatsLeft -= 1;
  callback(null, { studentId: student.id, course: course.code, status: 'REGISTERED' });
}

export function registerCourse(student, course, callback) {
  console.log(`  [4] registerCourse(${student.name}, ${course.code})`);
  setTimeout(finishRegisterCourse, DELAY_MS, student, course, callback);
}

// ---------------------------------------------------------------------------
// The dependent workflow. Every stage is nested inside the previous callback,
// and every error is returned immediately with `return done(error)` so the
// remaining stages never run.
// ---------------------------------------------------------------------------
export function registerForCourse(studentId, courseCode, done) {
  loadStudent(studentId, function (loadError, student) {
    if (loadError) return done(loadError);

    checkPrerequisites(student, courseCode, function (prereqError, course) {
      if (prereqError) return done(prereqError);

      checkSeats(course, function (seatError, openCourse) {
        if (seatError) return done(seatError);

        registerCourse(student, openCourse, function (registerError, confirmation) {
          if (registerError) return done(registerError);

          done(null, confirmation);          // the only success path
        });
      });
    });
  });
}

// ---------------------------------------------------------------------------
// Demonstration: scenarios run one after another through named functions that
// read a shared queue (module-level state, no function factories).
// ---------------------------------------------------------------------------
const scenarios = [
  { label: 'SUCCESS            ', studentId: 101, course: 'CS401' },
  { label: 'UNKNOWN STUDENT    ', studentId: 999, course: 'CS401' },
  { label: 'PREREQUISITE MISSING', studentId: 102, course: 'CS401' },
  { label: 'COURSE FULL        ', studentId: 101, course: 'CS402' },
  { label: 'ALREADY REGISTERED ', studentId: 103, course: 'CS401' },
  { label: 'DUPLICATE REQUEST  ', studentId: 101, course: 'CS401' },
  { label: 'UNKNOWN COURSE     ', studentId: 101, course: 'CS999' }
];

let currentScenario = null;

function runNextScenario() {
  currentScenario = scenarios.shift();
  if (currentScenario === undefined) {
    console.log('\nAll scenarios finished. CS401 seats left:', courses.CS401.seatsLeft);
    console.log('Registrations on file:', registrations);
    return;
  }
  console.log(`\n>>> ${currentScenario.label.trim()}: student ${currentScenario.studentId} -> ${currentScenario.course}`);
  registerForCourse(currentScenario.studentId, currentScenario.course, onScenarioDone);
}

function onScenarioDone(error, confirmation) {
  if (error) {
    console.log(`  FAILED: ${error.message}  (workflow stopped)`);
  } else {
    console.log('  OK:', confirmation);
  }
  runNextScenario();
}

runNextScenario();
