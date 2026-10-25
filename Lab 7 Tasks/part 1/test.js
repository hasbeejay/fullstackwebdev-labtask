// Lab 7 - Part 1: Automated Integration Test Suite
// Exercises all CRUD operations for Student, Teacher, Attendance, and Marks modules.

const http = require('node:http');
const { server } = require('./server.js');

const TEST_PORT = 3104;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// Simple helper to send HTTP requests using fetch (Node 18+)
async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  let data = null;
  const text = await response.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: response.status, data };
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  \x1b[32m✔\x1b[0m ${message}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log(`\n======================================================`);
  console.log(` Running Integration Tests: Lab 7 - Part 1 API`);
  console.log(`======================================================\n`);

  await new Promise((resolve) => server.listen(TEST_PORT, resolve));

  try {
    // 1. Health check
    console.log(`\x1b[36m[Module 0: Root & Health]\x1b[0m`);
    const health = await request('/health');
    assert(health.status === 200, 'GET /health returns 200');
    assert(health.data.status === 'healthy', 'Health check status is healthy');

    // 2. Student CRUD
    console.log(`\n\x1b[36m[Module 1: Student CRUD]\x1b[0m`);
    const listStudents = await request('/students');
    assert(listStudents.status === 200 && Array.isArray(listStudents.data), 'GET /students returns array');
    const initialCount = listStudents.data.length;

    // Create student
    const newStudent = await request('/students', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Zainab Bibi',
        rollNo: '241999',
        department: 'Artificial Intelligence',
        semester: '3rd',
        email: 'zainab@students.au.edu.pk',
      }),
    });
    assert(newStudent.status === 201, 'POST /students returns 201 Created');
    assert(newStudent.data.name === 'Zainab Bibi' && newStudent.data.id > 0, 'POST /students created valid student record');
    const studentId = newStudent.data.id;

    // Read by id
    const getStudent = await request(`/students/${studentId}`);
    assert(getStudent.status === 200, `GET /students/${studentId} returns 200`);
    assert(getStudent.data.rollNo === '241999', 'Retrieved student has expected roll number');

    // Filter query
    const filteredStudents = await request('/students?department=Artificial');
    assert(filteredStudents.status === 200 && filteredStudents.data.some(s => s.id === studentId), 'GET /students?department=... filters correctly');

    // PATCH student
    const patchStudent = await request(`/students/${studentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ semester: '4th' }),
    });
    assert(patchStudent.status === 200, `PATCH /students/${studentId} returns 200`);
    assert(patchStudent.data.semester === '4th', 'PATCH updated student semester');

    // PUT student
    const putStudent = await request(`/students/${studentId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Zainab Bibi Updated',
        department: 'Data Science',
        semester: '5th',
      }),
    });
    assert(putStudent.status === 200, `PUT /students/${studentId} returns 200`);
    assert(putStudent.data.name === 'Zainab Bibi Updated' && putStudent.data.department === 'Data Science', 'PUT updated student info');

    // DELETE student
    const deleteStudent = await request(`/students/${studentId}`, { method: 'DELETE' });
    assert(deleteStudent.status === 200, `DELETE /students/${studentId} returns 200`);
    const verifyDeleteStudent = await request(`/students/${studentId}`);
    assert(verifyDeleteStudent.status === 404, `GET /students/${studentId} after deletion returns 404`);

    // 3. Teacher CRUD
    console.log(`\n\x1b[36m[Module 2: Teacher CRUD]\x1b[0m`);
    const listTeachers = await request('/teachers');
    assert(listTeachers.status === 200 && Array.isArray(listTeachers.data), 'GET /teachers returns array');

    // Create teacher
    const newTeacher = await request('/teachers', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Dr. Usman Ali',
        department: 'Cyber Security',
        designation: 'Assistant Professor',
        email: 'usman.ali@au.edu.pk',
        phone: '051-9260010',
      }),
    });
    assert(newTeacher.status === 201, 'POST /teachers returns 201 Created');
    const teacherId = newTeacher.data.id;

    // Read by id
    const getTeacher = await request(`/teachers/${teacherId}`);
    assert(getTeacher.status === 200 && getTeacher.data.name === 'Dr. Usman Ali', `GET /teachers/${teacherId} returns teacher`);

    // PATCH teacher
    const patchTeacher = await request(`/teachers/${teacherId}`, {
      method: 'PATCH',
      body: JSON.stringify({ designation: 'Associate Professor' }),
    });
    assert(patchTeacher.status === 200 && patchTeacher.data.designation === 'Associate Professor', 'PATCH updated teacher designation');

    // DELETE teacher
    const deleteTeacher = await request(`/teachers/${teacherId}`, { method: 'DELETE' });
    assert(deleteTeacher.status === 200, `DELETE /teachers/${teacherId} returns 200`);

    // 4. Attendance CRUD
    console.log(`\n\x1b[36m[Module 3: Attendance CRUD]\x1b[0m`);
    const listAttendance = await request('/attendance');
    assert(listAttendance.status === 200 && Array.isArray(listAttendance.data), 'GET /attendance returns array');

    // Create attendance
    const newAttendance = await request('/attendance', {
      method: 'POST',
      body: JSON.stringify({
        studentId: 1,
        course: 'Cloud Computing',
        date: '2026-10-24',
        status: 'Present',
        remarks: 'Punctual',
      }),
    });
    assert(newAttendance.status === 201, 'POST /attendance returns 201 Created');
    const attId = newAttendance.data.id;

    // Read attendance by id
    const getAtt = await request(`/attendance/${attId}`);
    assert(getAtt.status === 200 && getAtt.data.status === 'Present', `GET /attendance/${attId} returns record`);

    // Query filter
    const studentAtt = await request('/attendance?studentId=1');
    assert(studentAtt.status === 200 && studentAtt.data.every(a => a.studentId === 1), 'GET /attendance?studentId=1 filters by student');

    // PATCH attendance
    const patchAtt = await request(`/attendance/${attId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Late', remarks: '5 mins delayed' }),
    });
    assert(patchAtt.status === 200 && patchAtt.data.status === 'Late', 'PATCH updated attendance status');

    // DELETE attendance
    const deleteAtt = await request(`/attendance/${attId}`, { method: 'DELETE' });
    assert(deleteAtt.status === 200, `DELETE /attendance/${attId} returns 200`);

    // 5. Marks CRUD
    console.log(`\n\x1b[36m[Module 4: Marks CRUD]\x1b[0m`);
    const listMarks = await request('/marks');
    assert(listMarks.status === 200 && Array.isArray(listMarks.data), 'GET /marks returns array');

    // Create marks
    const newMark = await request('/marks', {
      method: 'POST',
      body: JSON.stringify({
        studentId: 1,
        subject: 'Artificial Intelligence',
        examType: 'Final Exam',
        score: 95,
        totalMarks: 100,
      }),
    });
    assert(newMark.status === 201, 'POST /marks returns 201 Created');
    assert(newMark.data.grade === 'A+', 'POST /marks computed grade A+ automatically');
    const markId = newMark.data.id;

    // Read marks by id
    const getMark = await request(`/marks/${markId}`);
    assert(getMark.status === 200 && getMark.data.score === 95, `GET /marks/${markId} returns mark`);

    // Query filter
    const filteredMarks = await request('/marks?examType=Final%20Exam');
    assert(filteredMarks.status === 200 && filteredMarks.data.some(m => m.id === markId), 'GET /marks?examType=... filters correctly');

    // PATCH marks
    const patchMark = await request(`/marks/${markId}`, {
      method: 'PATCH',
      body: JSON.stringify({ score: 98 }),
    });
    assert(patchMark.status === 200 && patchMark.data.score === 98, 'PATCH updated score');

    // DELETE marks
    const deleteMark = await request(`/marks/${markId}`, { method: 'DELETE' });
    assert(deleteMark.status === 200, `DELETE /marks/${markId} returns 200`);

    // 6. Validation & Error Handling
    console.log(`\n\x1b[36m[Module 5: Edge Cases & Validation]\x1b[0m`);
    const invalidStudent = await request('/students', {
      method: 'POST',
      body: JSON.stringify({ name: '' }),
    });
    assert(invalidStudent.status === 400, 'POST /students with empty name returns 400 Bad Request');

    const notFound = await request('/students/99999');
    assert(notFound.status === 404, 'GET /students/99999 returns 404 Not Found');

    const invalidRoute = await request('/unknown-route');
    assert(invalidRoute.status === 404, 'Unknown route returns 404 Not Found');

    console.log(`\n------------------------------------------------------`);
    console.log(` Test Results: \x1b[32m${passed} passed\x1b[0m, \x1b[${failed ? '31' : '32'}m${failed} failed\x1b[0m`);
    console.log(`------------------------------------------------------\n`);

  } finally {
    server.close();
  }
}

if (require.main === module) {
  runTests().then(() => {
    if (failed > 0) process.exit(1);
  }).catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
}
