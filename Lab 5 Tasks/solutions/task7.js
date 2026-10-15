// Task 7 - Promise-Based Multi-Service Registration Engine
// Every service takes ONE context object and resolves with an enriched copy of it,
// so the chain can be written point-free: .then(getCourse).then(checkPrerequisites) ...

const STUDENTS = {
  101: { id: 101, name: 'Ali', completed: ['CS301', 'CS302'] },
  102: { id: 102, name: 'Sara', completed: ['CS101'] }
};

const COURSES = {
  CS401: { code: 'CS401', prerequisites: ['CS301', 'CS302'], seatsLeft: 5 },
  CS402: { code: 'CS402', prerequisites: ['CS301'], seatsLeft: 0 }
};

const DELAY_MS = 10;

// ---------------------------------------------------------------------------
// Services (Promise creation with resolve / reject).
// setTimeout receives a named function plus its arguments - nothing is captured.
// ---------------------------------------------------------------------------
function settleGetStudent(resolve, reject, context) {
  const student = STUDENTS[context.studentId];
  if (student === undefined) {
    reject(new Error(`Student ${context.studentId} does not exist`));
    return;
  }
  resolve({ ...context, student });
}

export function getStudent(context) {
  return new Promise(function (resolve, reject) {
    setTimeout(settleGetStudent, DELAY_MS, resolve, reject, context);
  });
}

function settleGetCourse(resolve, reject, context) {
  const course = COURSES[context.courseCode];
  if (course === undefined) {
    reject(new Error(`Course ${context.courseCode} does not exist`));
    return;
  }
  resolve({ ...context, course });
}

export function getCourse(context) {
  return new Promise(function (resolve, reject) {
    setTimeout(settleGetCourse, DELAY_MS, resolve, reject, context);
  });
}

function settleCheckPrerequisites(resolve, reject, context) {
  const missing = context.course.prerequisites.filter((code) => !context.student.completed.includes(code));
  if (missing.length > 0) {
    reject(new Error(`Prerequisite not completed: ${missing.join(', ')}`));
    return;
  }
  resolve(context);
}

export function checkPrerequisites(context) {
  // Guard: reject (instead of throwing inside a timer) when the previous stage passed on nothing
  if (context === undefined || context.course === undefined) {
    return Promise.reject(
      new TypeError('checkPrerequisites received no course data - did a previous .then() forget to return?')
    );
  }
  return new Promise(function (resolve, reject) {
    setTimeout(settleCheckPrerequisites, DELAY_MS, resolve, reject, context);
  });
}

function settleCheckSeats(resolve, reject, context) {
  if (context.course.seatsLeft <= 0) {
    reject(new Error(`Course ${context.course.code} is full`));
    return;
  }
  resolve(context);
}

export function checkSeats(context) {
  return new Promise(function (resolve, reject) {
    setTimeout(settleCheckSeats, DELAY_MS, resolve, reject, context);
  });
}

function settleRegisterStudent(resolve, context) {
  resolve({ studentId: context.student.id, course: context.course.code, status: 'REGISTERED' });
}

export function registerStudent(context) {
  return new Promise(function (resolve) {
    setTimeout(settleRegisterStudent, DELAY_MS, resolve, context);
  });
}

// Post-registration services: SMS is deliberately unreliable
function settleNotification(resolve, reject, serviceName, shouldFail, registration) {
  if (shouldFail) {
    reject(new Error(`${serviceName} gateway timeout`));
    return;
  }
  resolve(`${serviceName} sent for student ${registration.studentId}`);
}

export function sendEmail(registration) {
  return new Promise(function (resolve, reject) {
    setTimeout(settleNotification, DELAY_MS, resolve, reject, 'Email', false, registration);
  });
}

export function sendSMS(registration) {
  return new Promise(function (resolve, reject) {
    setTimeout(settleNotification, DELAY_MS * 2, resolve, reject, 'SMS', true, registration);
  });
}

export function writeAuditLog(registration) {
  return new Promise(function (resolve, reject) {
    setTimeout(settleNotification, DELAY_MS * 3, resolve, reject, 'Audit', false, registration);
  });
}

// ---------------------------------------------------------------------------
// Part A - the registration chain. Every .then() RETURNS the next promise.
// ---------------------------------------------------------------------------
export function registerFlow(studentId, courseCode) {
  return getStudent({ studentId, courseCode })
    .then(getCourse)
    .then(checkPrerequisites)
    .then(checkSeats)
    .then(registerStudent);
}

function runScenario(scenario) {
  console.log(`\n>>> ${scenario.label}`);
  return registerFlow(scenario.studentId, scenario.courseCode)
    .then((confirmation) => console.log('  OK:', confirmation))
    .catch((error) => console.log(`  FAILED: ${error.message}`))
    .finally(() => console.log('  [finally] attempt finished'));
}

function chainScenario(chain, scenario) {
  return chain.then(runScenario.bind(null, scenario));
}

const scenarios = [
  { label: 'SUCCESS (101 -> CS401)', studentId: 101, courseCode: 'CS401' },
  { label: 'UNKNOWN STUDENT (999 -> CS401)', studentId: 999, courseCode: 'CS401' },
  { label: 'PREREQUISITE MISSING (102 -> CS401)', studentId: 102, courseCode: 'CS401' },
  { label: 'COURSE FULL (101 -> CS402)', studentId: 101, courseCode: 'CS402' }
];

// What happens when a .then() forgets to return: the next stage receives undefined.
function brokenGetCourse(context) {
  getCourse(context);                // BUG: promise is created but NOT returned
}

function demoMissingReturn() {
  console.log('\n=== PART A (bug demo): .then() without return ===');
  return getStudent({ studentId: 101, courseCode: 'CS401' })
    .then(brokenGetCourse)
    .then(checkPrerequisites)        // receives undefined instead of the context
    .catch((error) => console.log(`  ${error.name}: ${error.message}`))
    .finally(() => console.log('  -> the data was lost at the missing return, so the next stage had nothing to work with'));
}

// ---------------------------------------------------------------------------
// Part B - Promise.allSettled: we want the status of ALL three services
// ---------------------------------------------------------------------------
const SERVICE_NAMES = ['Email', 'SMS', 'Audit'];

function toStatusEntry(outcome, index) {
  return { service: SERVICE_NAMES[index], status: outcome.status };
}

function demoPostRegistration(registration) {
  console.log('\n=== PART B: Promise.allSettled for post-registration services ===');
  return Promise.allSettled([sendEmail(registration), sendSMS(registration), writeAuditLog(registration)])
    .then((outcomes) => {
      console.log(outcomes.map(toStatusEntry));
      const failed = outcomes.filter((outcome) => outcome.status === 'rejected');
      failed.forEach((outcome) => console.log('  failure reason:', outcome.reason.message));
    });
}

// ---------------------------------------------------------------------------
// Part C - two independent course servers
// ---------------------------------------------------------------------------
function settleServer(resolve, reject, serverName, shouldFail, courseCode) {
  if (shouldFail) {
    reject(new Error(`${serverName} is down`));
    return;
  }
  resolve({ server: serverName, course: COURSES[courseCode] });
}

function fetchCourseFromServer(serverName, delay, shouldFail, courseCode) {
  return new Promise(function (resolve, reject) {
    setTimeout(settleServer, delay, resolve, reject, serverName, shouldFail, courseCode);
  });
}

function demoServerSelection() {
  console.log('\n=== PART C: first SUCCESSFUL result ===');
  // Server A fails fast (10ms), server B succeeds slower (40ms).

  const attemptRace = Promise.race([
    fetchCourseFromServer('Server A', 10, true, 'CS401'),
    fetchCourseFromServer('Server B', 40, false, 'CS401')
  ])
    .then((result) => console.log('  Promise.race ->', result.server))
    .catch((error) => console.log(`  Promise.race -> REJECTED (${error.message}) even though Server B was fine`));

  return attemptRace
    .then(() =>
      Promise.any([
        fetchCourseFromServer('Server A', 10, true, 'CS401'),
        fetchCourseFromServer('Server B', 40, false, 'CS401')
      ])
    )
    .then((result) => console.log(`  Promise.any  -> ${result.server} (course ${result.course.code}) - the failed server was ignored`))
    .then(() =>
      Promise.any([
        fetchCourseFromServer('Server A', 10, true, 'CS401'),
        fetchCourseFromServer('Server B', 20, true, 'CS401')
      ])
    )
    .catch((error) => {
      console.log(`  Promise.any when BOTH fail -> ${error.name}: ${error.message}`);
      error.errors.forEach((inner) => console.log('    -', inner.message));
    });
}

// ---------------------------------------------------------------------------
// Run everything in order
// ---------------------------------------------------------------------------
console.log('=== PART A: registration chain ===');
scenarios
  .reduce(chainScenario, Promise.resolve())
  .then(demoMissingReturn)
  .then(() => registerFlow(101, 'CS401'))
  .then(demoPostRegistration)
  .then(demoServerSelection)
  .finally(() => console.log('\nAll Promise demos completed.'));
