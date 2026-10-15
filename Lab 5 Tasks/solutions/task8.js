// Task 8 - Concurrent Academic API Aggregator with async/await

// ---------------------------------------------------------------------------
// Fake data behind the fake network
// ---------------------------------------------------------------------------
const USERS = [
  { id: 1, name: 'Ali', department: 'CS' },
  { id: 2, name: 'Sara', department: 'CS' },
  { id: 3, name: 'Usman', department: 'SE' },
  { id: 4, name: 'Hina', department: 'AI' },
  { id: 5, name: 'Ahmed', department: 'SE' },
  { id: 6, name: 'Zoya', department: 'AI' }
];

const COURSES = [
  { code: 'FSWD', title: 'Full Stack Web Development' },
  { code: 'DSA', title: 'Data Structures and Algorithms' },
  { code: 'DB', title: 'Database Systems' }
];

const RESULTS = [
  { studentId: 1, courseCode: 'FSWD', marks: 82 }, { studentId: 1, courseCode: 'DSA', marks: 76 },
  { studentId: 2, courseCode: 'FSWD', marks: 91 }, { studentId: 2, courseCode: 'DSA', marks: 88 },
  { studentId: 3, courseCode: 'FSWD', marks: 47 }, { studentId: 3, courseCode: 'DSA', marks: 52 },
  { studentId: 4, courseCode: 'FSWD', marks: 73 }, { studentId: 4, courseCode: 'DSA', marks: 69 },
  { studentId: 5, courseCode: 'FSWD', marks: 64 }, { studentId: 5, courseCode: 'DSA', marks: 58 },
  { studentId: 6, courseCode: 'FSWD', marks: 91 }, { studentId: 6, courseCode: 'DSA', marks: 94 }
];

// url -> behaviour of the fake server
const ROUTES = {
  '/users': { kind: 'ok', body: USERS, delay: 60 },
  '/courses': { kind: 'ok', body: COURSES, delay: 90 },
  '/results': { kind: 'ok', body: RESULTS, delay: 120 },
  '/not-found': { kind: 'status', status: 404, statusText: 'Not Found' },
  '/server-error': { kind: 'status', status: 500, statusText: 'Internal Server Error' },
  '/network-failure': { kind: 'network' },
  '/invalid-json': { kind: 'invalid-json' },
  '/slow': { kind: 'ok', body: { message: 'slow but successful' }, delay: 400 }
};

// ---------------------------------------------------------------------------
// Error types so the caller can tell the failure kinds apart
// ---------------------------------------------------------------------------
export class HttpError extends Error {
  constructor(status, statusText, url) {
    super(`HTTP ${status} ${statusText} for ${url}`);
    this.name = 'HttpError';
    this.status = status;
  }
}

function createAbortError() {
  const error = new Error('The operation was aborted');
  error.name = 'AbortError';           // same name the real fetch() uses
  return error;
}

// ---------------------------------------------------------------------------
// fakeFetch(): behaves like fetch(), returns response-shaped objects
// ---------------------------------------------------------------------------
class FakeResponse {
  constructor(status, statusText, bodyText) {
    this.status = status;
    this.statusText = statusText;
    this.bodyText = bodyText;
  }

  get ok() {
    return this.status >= 200 && this.status <= 299;
  }

  async json() {
    return JSON.parse(this.bodyText);   // throws SyntaxError for invalid JSON
  }
}

// Resolves after `ms`, or rejects immediately if the signal is aborted
function abortableDelay(ms, signal) {
  return new Promise(function (resolve, reject) {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }
    signal?.addEventListener('abort', () => reject(createAbortError()), { once: true });
    setTimeout(resolve, ms);
  });
}

export async function fakeFetch(url, options = {}) {
  const route = ROUTES[url];
  if (route === undefined) {
    return new FakeResponse(404, 'Not Found', JSON.stringify({ error: 'unknown route' }));
  }

  await abortableDelay(route.delay ?? 10, options.signal);

  switch (route.kind) {
    case 'ok':
      return new FakeResponse(200, 'OK', JSON.stringify(route.body));
    case 'status':
      return new FakeResponse(route.status, route.statusText, JSON.stringify({ error: route.statusText }));
    case 'invalid-json':
      return new FakeResponse(200, 'OK', '{ "broken": [1, 2, ');
    case 'network':
      throw new TypeError('fetch failed: network unreachable');   // real fetch rejects with TypeError
    default:
      throw new Error(`Unhandled route kind: ${route.kind}`);
  }
}

// ---------------------------------------------------------------------------
// getJSON(url, fetchImplementation)
// ---------------------------------------------------------------------------
export async function getJSON(url, fetchImplementation, options = {}) {
  const response = await fetchImplementation(url, options);   // network failures reject here

  if (!response.ok) {
    throw new HttpError(response.status, response.statusText, url);
  }

  return await response.json();                                // parse failures reject here
}

// ---------------------------------------------------------------------------
// fetchWithTimeout(url, milliseconds)
// ---------------------------------------------------------------------------
export const timerState = { active: 0 };     // used to PROVE that timers are always cleaned up

export async function fetchWithTimeout(url, milliseconds, fetchImplementation = fakeFetch) {
  const controller = new AbortController();
  const timer = setTimeout(controller.abort.bind(controller), milliseconds);
  timerState.active += 1;

  try {
    return await getJSON(url, fetchImplementation, { signal: controller.signal });
  } finally {
    clearTimeout(timer);                     // runs on success AND on every kind of failure
    timerState.active -= 1;
  }
}

export function classifyError(error) {
  if (error.name === 'AbortError') return 'TIMEOUT / ABORT';
  if (error instanceof HttpError) return 'HTTP FAILURE';
  if (error instanceof SyntaxError) return 'INVALID JSON';
  if (error instanceof TypeError) return 'NETWORK FAILURE';
  return 'UNKNOWN';
}

// ---------------------------------------------------------------------------
// Dashboard analytics (pure function - easy to test)
// ---------------------------------------------------------------------------
const round2 = (value) => Math.round(value * 100) / 100;

export function buildDashboard(users, courses, results) {
  const overallAverage = round2(results.reduce((sum, r) => sum + r.marks, 0) / results.length);

  const perStudent = users.map((user) => {
    const marks = results.filter((r) => r.studentId === user.id).map((r) => r.marks);
    const average = marks.length === 0 ? 0 : marks.reduce((sum, m) => sum + m, 0) / marks.length;
    return { ...user, average: round2(average) };
  });

  const topStudent = perStudent.reduce((best, current) => (current.average > best.average ? current : best));
  const failed = perStudent.filter((student) => student.average < 50);

  const departments = perStudent.reduce((acc, student) => {
    const dept = acc[student.department] ?? { students: 0, totalAverage: 0 };
    acc[student.department] = { students: dept.students + 1, totalAverage: dept.totalAverage + student.average };
    return acc;
  }, {});

  return {
    totalStudents: users.length,
    totalCourses: courses.length,
    overallAverage,
    highestPerformer: { name: topStudent.name, average: topStudent.average },
    failedStudents: { count: failed.length, names: failed.map((s) => s.name) },
    departmentStats: Object.fromEntries(
      Object.entries(departments).map(([name, d]) => [name, { students: d.students, average: round2(d.totalAverage / d.students) }])
    )
  };
}

// Concurrent loading: all three requests START before any is awaited
export async function loadDashboard(fetchImplementation = fakeFetch) {
  const [users, courses, results] = await Promise.all([
    getJSON('/users', fetchImplementation),
    getJSON('/courses', fetchImplementation),
    getJSON('/results', fetchImplementation)
  ]);
  return buildDashboard(users, courses, results);
}

// Sequential version, only used to compare timing
async function loadDashboardSequentially(fetchImplementation = fakeFetch) {
  const users = await getJSON('/users', fetchImplementation);
  const courses = await getJSON('/courses', fetchImplementation);
  const results = await getJSON('/results', fetchImplementation);
  return buildDashboard(users, courses, results);
}

// ---------------------------------------------------------------------------
// Demonstration
// ---------------------------------------------------------------------------
async function main() {
  console.log('=== 1. getJSON() WITH fakeFetch() ===');
  const okUsers = await getJSON('/users', fakeFetch);
  console.log(`200 OK -> received ${okUsers.length} users`);

  const failureUrls = ['/not-found', '/server-error', '/network-failure', '/invalid-json'];
  for (const url of failureUrls) {
    try {
      await getJSON(url, fakeFetch);
    } catch (error) {
      console.log(`${url.padEnd(18)} -> [${classifyError(error)}] ${error.name}: ${error.message}`);
    }
  }

  console.log('\n=== 2. CONCURRENT vs SEQUENTIAL LOADING ===');
  let started = performance.now();
  const dashboard = await loadDashboard();
  const concurrentMs = Math.round(performance.now() - started);

  started = performance.now();
  await loadDashboardSequentially();
  const sequentialMs = Math.round(performance.now() - started);

  console.log(`Promise.all (concurrent): ~${concurrentMs} ms   (slowest request is 120 ms)`);
  console.log(`sequential awaits       : ~${sequentialMs} ms   (60 + 90 + 120 ms added up)`);
  console.log('Concurrent is faster    :', concurrentMs < sequentialMs);

  console.log('\n=== 3. DASHBOARD ===');
  console.log(dashboard);

  console.log('\n=== 4. fetchWithTimeout() ===');
  const timeoutCases = [
    { url: '/users', ms: 500 },
    { url: '/not-found', ms: 500 },
    { url: '/server-error', ms: 500 },
    { url: '/network-failure', ms: 500 },
    { url: '/invalid-json', ms: 500 },
    { url: '/slow', ms: 100 },     // slow (400 ms) with a 100 ms limit -> abort
    { url: '/slow', ms: 1000 }     // slow but within a 1000 ms limit -> success
  ];

  for (const { url, ms } of timeoutCases) {
    try {
      const data = await fetchWithTimeout(url, ms);
      console.log(`${url.padEnd(18)} limit ${String(ms).padStart(4)}ms -> SUCCESS ${JSON.stringify(data).slice(0, 40)}   | active timers: ${timerState.active}`);
    } catch (error) {
      console.log(`${url.padEnd(18)} limit ${String(ms).padStart(4)}ms -> [${classifyError(error)}] ${error.message}   | active timers: ${timerState.active}`);
    } finally {
      // every call, successful or not, must leave zero timers behind
    }
  }
}

main();
