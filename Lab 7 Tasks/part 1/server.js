// Lab Task #07 - Part 1: Student Management System (In-Memory API)
// Modified and extended from the uploaded in-memory API code.
// Modules: Student (CRUD), Teacher (CRUD), Attendance (CRUD), Marks (CRUD)
// Pure Node.js using native node:http module without external frameworks.

const http = require('node:http');

// ============================================================================
// In-Memory Data Stores & ID Sequences
// ============================================================================

let nextStudentId = 1;
let students = [
  { id: nextStudentId++, name: 'Haseeb Jalil', rollNo: '241908', department: 'Computer Science', semester: '5th', email: '241908@students.au.edu.pk' },
  { id: nextStudentId++, name: 'Ayesha Khan', rollNo: '241912', department: 'Computer Science', semester: '5th', email: 'ayesha.khan@students.au.edu.pk' },
  { id: nextStudentId++, name: 'Bilal Ahmed', rollNo: '241855', department: 'Software Engineering', semester: '6th', email: 'bilal.ahmed@students.au.edu.pk' },
  { id: nextStudentId++, name: 'Fatima Noor', rollNo: '241930', department: 'Computer Science', semester: '5th', email: 'fatima.noor@students.au.edu.pk' },
];

let nextTeacherId = 1;
let teachers = [
  { id: nextTeacherId++, name: 'Hafiz Obaid Ullah', department: 'Computer Science', designation: 'Assistant Professor', email: 'obaidullah@au.edu.pk', phone: '051-9260001' },
  { id: nextTeacherId++, name: 'Dr. Farhan Tariq', department: 'Software Engineering', designation: 'Associate Professor', email: 'farhan.tariq@au.edu.pk', phone: '051-9260002' },
  { id: nextTeacherId++, name: 'Prof. Sadia Rehman', department: 'Computer Science', designation: 'Lecturer', email: 'sadia.rehman@au.edu.pk', phone: '051-9260003' },
];

let nextAttendanceId = 1;
let attendance = [
  { id: nextAttendanceId++, studentId: 1, course: 'Full Stack Web Development', date: '2026-10-20', status: 'Present', remarks: 'On time' },
  { id: nextAttendanceId++, studentId: 2, course: 'Full Stack Web Development', date: '2026-10-20', status: 'Present', remarks: 'On time' },
  { id: nextAttendanceId++, studentId: 3, course: 'Database Systems', date: '2026-10-20', status: 'Late', remarks: '10 mins late' },
  { id: nextAttendanceId++, studentId: 1, course: 'Full Stack Web Development', date: '2026-10-22', status: 'Present', remarks: 'Active participation' },
  { id: nextAttendanceId++, studentId: 4, course: 'Full Stack Web Development', date: '2026-10-22', status: 'Absent', remarks: 'Medical leave' },
];

let nextMarksId = 1;
let marks = [
  { id: nextMarksId++, studentId: 1, subject: 'Full Stack Web Development', examType: 'Midterm', score: 92, totalMarks: 100, grade: 'A' },
  { id: nextMarksId++, studentId: 2, subject: 'Full Stack Web Development', examType: 'Midterm', score: 88, totalMarks: 100, grade: 'A-' },
  { id: nextMarksId++, studentId: 3, subject: 'Database Systems', examType: 'Midterm', score: 79, totalMarks: 100, grade: 'B+' },
  { id: nextMarksId++, studentId: 1, subject: 'Full Stack Web Development', examType: 'Lab Task 6', score: 10, totalMarks: 10, grade: 'A+' },
  { id: nextMarksId++, studentId: 4, subject: 'Full Stack Web Development', examType: 'Midterm', score: 85, totalMarks: 100, grade: 'A' },
];

// Helper to calculate grade from score / totalMarks
function computeGrade(score, totalMarks) {
  if (typeof score !== 'number' || typeof totalMarks !== 'number' || totalMarks <= 0) return 'N/A';
  const pct = (score / totalMarks) * 100;
  if (pct >= 90) return 'A+';
  if (pct >= 85) return 'A';
  if (pct >= 80) return 'A-';
  if (pct >= 75) return 'B+';
  if (pct >= 70) return 'B';
  if (pct >= 65) return 'C+';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
}

// ============================================================================
// Helper Utilities & Request Parser
// ============================================================================

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(body, null, 2));
}

async function parseJsonBody(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (Buffer.byteLength(raw) > 65536) {
      const err = new Error('Payload too large (max 64KB)');
      err.status = 413;
      throw err;
    }
  }
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    const err = new Error('Malformed JSON');
    err.status = 400;
    throw err;
  }
}

function parseId(value) {
  if (!/^[1-9]\d*$/.test(String(value))) return null;
  const num = Number(value);
  return Number.isSafeInteger(num) ? num : null;
}

// ============================================================================
// HTTP Server & Router
// ============================================================================

const server = http.createServer(async (req, res) => {
  // Handle CORS preflight options
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  try {
    const parsedUrl = new URL(req.url, 'http://localhost');
    const pathname = parsedUrl.pathname.replace(/\/+$/, '') || '/';
    const params = parsedUrl.searchParams;
    const method = req.method;

    // ------------------------------------------------------------------------
    // Root & Health Endpoints
    // ------------------------------------------------------------------------
    if (pathname === '/' || pathname === '/api' || pathname === '/health') {
      return send(res, 200, {
        system: 'Student Management System API',
        version: '1.0.0',
        author: 'Haseeb Jalil (241908)',
        lab: 'Lab 07 - Part 1 (In-Memory REST API)',
        status: 'healthy',
        uptime: process.uptime(),
        endpoints: {
          students: '/students',
          teachers: '/teachers',
          attendance: '/attendance',
          marks: '/marks',
        },
        counts: {
          students: students.length,
          teachers: teachers.length,
          attendance: attendance.length,
          marks: marks.length,
        },
      });
    }

    // ------------------------------------------------------------------------
    // MODULE 1: Student (CRUD)
    // ------------------------------------------------------------------------
    // GET /students - list all students with optional filters
    if (pathname === '/students' && method === 'GET') {
      let result = students;
      const deptFilter = params.get('department');
      const nameFilter = params.get('name');
      if (deptFilter) {
        result = result.filter(s => s.department.toLowerCase().includes(deptFilter.toLowerCase()));
      }
      if (nameFilter) {
        result = result.filter(s => s.name.toLowerCase().includes(nameFilter.toLowerCase()));
      }
      return send(res, 200, result);
    }

    // POST /students - create student
    if (pathname === '/students' && method === 'POST') {
      const data = await parseJsonBody(req);
      const name = typeof data.name === 'string' ? data.name.trim() : '';
      if (!name) return send(res, 400, { error: 'Validation failed: "name" is required' });

      const student = {
        id: nextStudentId++,
        name,
        rollNo: typeof data.rollNo === 'string' ? data.rollNo.trim() : `RN-${nextStudentId + 100}`,
        department: typeof data.department === 'string' ? data.department.trim() : 'Computer Science',
        semester: typeof data.semester === 'string' ? data.semester.trim() : '1st',
        email: typeof data.email === 'string' ? data.email.trim() : `${name.toLowerCase().replace(/\s+/g, '.')}@students.au.edu.pk`,
      };
      students.push(student);
      return send(res, 201, student);
    }

    // /students/:id
    const studentMatch = pathname.match(/^\/students\/([^/]+)$/);
    if (studentMatch) {
      const id = parseId(studentMatch[1]);
      if (id === null) return send(res, 400, { error: 'Invalid ID: must be a positive integer' });

      const index = students.findIndex(s => s.id === id);

      // GET /students/:id
      if (method === 'GET') {
        if (index < 0) return send(res, 404, { error: `Student with id ${id} not found` });
        return send(res, 200, students[index]);
      }

      // PUT /students/:id - full replacement
      if (method === 'PUT') {
        if (index < 0) return send(res, 404, { error: `Student with id ${id} not found` });
        const data = await parseJsonBody(req);
        if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
          return send(res, 400, { error: 'Validation failed: "name" is required for PUT' });
        }
        students[index] = {
          id,
          name: data.name.trim(),
          rollNo: (data.rollNo && String(data.rollNo).trim()) || students[index].rollNo,
          department: (data.department && String(data.department).trim()) || 'General',
          semester: (data.semester && String(data.semester).trim()) || '1st',
          email: (data.email && String(data.email).trim()) || students[index].email,
        };
        return send(res, 200, students[index]);
      }

      // PATCH /students/:id - partial update
      if (method === 'PATCH') {
        if (index < 0) return send(res, 404, { error: `Student with id ${id} not found` });
        const data = await parseJsonBody(req);
        if (Object.keys(data).length === 0) {
          return send(res, 400, { error: 'Provide at least one field to update' });
        }
        if (data.name !== undefined) students[index].name = String(data.name).trim();
        if (data.rollNo !== undefined) students[index].rollNo = String(data.rollNo).trim();
        if (data.department !== undefined) students[index].department = String(data.department).trim();
        if (data.semester !== undefined) students[index].semester = String(data.semester).trim();
        if (data.email !== undefined) students[index].email = String(data.email).trim();
        return send(res, 200, students[index]);
      }

      // DELETE /students/:id
      if (method === 'DELETE') {
        if (index < 0) return send(res, 404, { error: `Student with id ${id} not found` });
        const removed = students.splice(index, 1)[0];
        return send(res, 200, { message: 'Student successfully deleted', deleted: removed });
      }

      return send(res, 405, { error: `Method ${method} not allowed for /students/:id` });
    }

    // ------------------------------------------------------------------------
    // MODULE 2: Teacher (CRUD)
    // ------------------------------------------------------------------------
    // GET /teachers - list all teachers
    if (pathname === '/teachers' && method === 'GET') {
      let result = teachers;
      const deptFilter = params.get('department');
      const nameFilter = params.get('name');
      if (deptFilter) {
        result = result.filter(t => t.department.toLowerCase().includes(deptFilter.toLowerCase()));
      }
      if (nameFilter) {
        result = result.filter(t => t.name.toLowerCase().includes(nameFilter.toLowerCase()));
      }
      return send(res, 200, result);
    }

    // POST /teachers - create teacher
    if (pathname === '/teachers' && method === 'POST') {
      const data = await parseJsonBody(req);
      const name = typeof data.name === 'string' ? data.name.trim() : '';
      if (!name) return send(res, 400, { error: 'Validation failed: "name" is required' });

      const teacher = {
        id: nextTeacherId++,
        name,
        department: typeof data.department === 'string' ? data.department.trim() : 'Computer Science',
        designation: typeof data.designation === 'string' ? data.designation.trim() : 'Lecturer',
        email: typeof data.email === 'string' ? data.email.trim() : `${name.toLowerCase().replace(/\s+/g, '.')}@au.edu.pk`,
        phone: typeof data.phone === 'string' ? data.phone.trim() : '051-9260000',
      };
      teachers.push(teacher);
      return send(res, 201, teacher);
    }

    // /teachers/:id
    const teacherMatch = pathname.match(/^\/teachers\/([^/]+)$/);
    if (teacherMatch) {
      const id = parseId(teacherMatch[1]);
      if (id === null) return send(res, 400, { error: 'Invalid ID: must be a positive integer' });

      const index = teachers.findIndex(t => t.id === id);

      // GET /teachers/:id
      if (method === 'GET') {
        if (index < 0) return send(res, 404, { error: `Teacher with id ${id} not found` });
        return send(res, 200, teachers[index]);
      }

      // PUT /teachers/:id
      if (method === 'PUT') {
        if (index < 0) return send(res, 404, { error: `Teacher with id ${id} not found` });
        const data = await parseJsonBody(req);
        if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
          return send(res, 400, { error: 'Validation failed: "name" is required for PUT' });
        }
        teachers[index] = {
          id,
          name: data.name.trim(),
          department: (data.department && String(data.department).trim()) || 'Computer Science',
          designation: (data.designation && String(data.designation).trim()) || 'Lecturer',
          email: (data.email && String(data.email).trim()) || teachers[index].email,
          phone: (data.phone && String(data.phone).trim()) || teachers[index].phone,
        };
        return send(res, 200, teachers[index]);
      }

      // PATCH /teachers/:id
      if (method === 'PATCH') {
        if (index < 0) return send(res, 404, { error: `Teacher with id ${id} not found` });
        const data = await parseJsonBody(req);
        if (Object.keys(data).length === 0) {
          return send(res, 400, { error: 'Provide at least one field to update' });
        }
        if (data.name !== undefined) teachers[index].name = String(data.name).trim();
        if (data.department !== undefined) teachers[index].department = String(data.department).trim();
        if (data.designation !== undefined) teachers[index].designation = String(data.designation).trim();
        if (data.email !== undefined) teachers[index].email = String(data.email).trim();
        if (data.phone !== undefined) teachers[index].phone = String(data.phone).trim();
        return send(res, 200, teachers[index]);
      }

      // DELETE /teachers/:id
      if (method === 'DELETE') {
        if (index < 0) return send(res, 404, { error: `Teacher with id ${id} not found` });
        const removed = teachers.splice(index, 1)[0];
        return send(res, 200, { message: 'Teacher successfully deleted', deleted: removed });
      }

      return send(res, 405, { error: `Method ${method} not allowed for /teachers/:id` });
    }

    // ------------------------------------------------------------------------
    // MODULE 3: Attendance (CRUD)
    // ------------------------------------------------------------------------
    // GET /attendance - list all attendance with optional query params
    if (pathname === '/attendance' && method === 'GET') {
      let result = attendance;
      const sId = params.get('studentId');
      const dateFilter = params.get('date');
      const statusFilter = params.get('status');

      if (sId) result = result.filter(a => a.studentId === Number(sId));
      if (dateFilter) result = result.filter(a => a.date === dateFilter);
      if (statusFilter) result = result.filter(a => a.status.toLowerCase() === statusFilter.toLowerCase());

      return send(res, 200, result);
    }

    // POST /attendance - record attendance
    if (pathname === '/attendance' && method === 'POST') {
      const data = await parseJsonBody(req);
      const studentId = Number(data.studentId);
      if (!studentId || !students.some(s => s.id === studentId)) {
        return send(res, 400, { error: `Valid studentId is required (student #${studentId} not found)` });
      }
      const status = typeof data.status === 'string' && ['Present', 'Absent', 'Late', 'Excused'].includes(data.status.trim())
        ? data.status.trim()
        : 'Present';

      const entry = {
        id: nextAttendanceId++,
        studentId,
        course: typeof data.course === 'string' && data.course.trim() ? data.course.trim() : 'Full Stack Web Development',
        date: typeof data.date === 'string' && data.date.trim() ? data.date.trim() : new Date().toISOString().split('T')[0],
        status,
        remarks: typeof data.remarks === 'string' ? data.remarks.trim() : '',
      };
      attendance.push(entry);
      return send(res, 201, entry);
    }

    // /attendance/:id
    const attendanceMatch = pathname.match(/^\/attendance\/([^/]+)$/);
    if (attendanceMatch) {
      const id = parseId(attendanceMatch[1]);
      if (id === null) return send(res, 400, { error: 'Invalid ID: must be a positive integer' });

      const index = attendance.findIndex(a => a.id === id);

      // GET /attendance/:id
      if (method === 'GET') {
        if (index < 0) return send(res, 404, { error: `Attendance record #${id} not found` });
        return send(res, 200, attendance[index]);
      }

      // PUT /attendance/:id
      if (method === 'PUT') {
        if (index < 0) return send(res, 404, { error: `Attendance record #${id} not found` });
        const data = await parseJsonBody(req);
        const sId = Number(data.studentId || attendance[index].studentId);
        attendance[index] = {
          id,
          studentId: sId,
          course: (data.course && String(data.course).trim()) || attendance[index].course,
          date: (data.date && String(data.date).trim()) || attendance[index].date,
          status: (data.status && String(data.status).trim()) || attendance[index].status,
          remarks: data.remarks !== undefined ? String(data.remarks).trim() : attendance[index].remarks,
        };
        return send(res, 200, attendance[index]);
      }

      // PATCH /attendance/:id
      if (method === 'PATCH') {
        if (index < 0) return send(res, 404, { error: `Attendance record #${id} not found` });
        const data = await parseJsonBody(req);
        if (Object.keys(data).length === 0) return send(res, 400, { error: 'Provide at least one field to update' });
        if (data.studentId !== undefined) attendance[index].studentId = Number(data.studentId);
        if (data.course !== undefined) attendance[index].course = String(data.course).trim();
        if (data.date !== undefined) attendance[index].date = String(data.date).trim();
        if (data.status !== undefined) attendance[index].status = String(data.status).trim();
        if (data.remarks !== undefined) attendance[index].remarks = String(data.remarks).trim();
        return send(res, 200, attendance[index]);
      }

      // DELETE /attendance/:id
      if (method === 'DELETE') {
        if (index < 0) return send(res, 404, { error: `Attendance record #${id} not found` });
        const removed = attendance.splice(index, 1)[0];
        return send(res, 200, { message: 'Attendance record deleted', deleted: removed });
      }

      return send(res, 405, { error: `Method ${method} not allowed for /attendance/:id` });
    }

    // ------------------------------------------------------------------------
    // MODULE 4: Marks (CRUD)
    // ------------------------------------------------------------------------
    // GET /marks - list all marks with optional filters
    if (pathname === '/marks' && method === 'GET') {
      let result = marks;
      const sId = params.get('studentId');
      const subFilter = params.get('subject');
      const examFilter = params.get('examType');

      if (sId) result = result.filter(m => m.studentId === Number(sId));
      if (subFilter) result = result.filter(m => m.subject.toLowerCase().includes(subFilter.toLowerCase()));
      if (examFilter) result = result.filter(m => m.examType.toLowerCase() === examFilter.toLowerCase());

      return send(res, 200, result);
    }

    // POST /marks - record marks
    if (pathname === '/marks' && method === 'POST') {
      const data = await parseJsonBody(req);
      const studentId = Number(data.studentId);
      if (!studentId || !students.some(s => s.id === studentId)) {
        return send(res, 400, { error: `Valid studentId is required (student #${studentId} not found)` });
      }
      const score = Number(data.score);
      const totalMarks = Number(data.totalMarks || 100);
      if (Number.isNaN(score) || score < 0) {
        return send(res, 400, { error: 'Valid numeric score is required' });
      }
      const grade = typeof data.grade === 'string' && data.grade.trim()
        ? data.grade.trim().toUpperCase()
        : computeGrade(score, totalMarks);

      const mark = {
        id: nextMarksId++,
        studentId,
        subject: typeof data.subject === 'string' && data.subject.trim() ? data.subject.trim() : 'Full Stack Web Development',
        examType: typeof data.examType === 'string' && data.examType.trim() ? data.examType.trim() : 'Quiz',
        score,
        totalMarks,
        grade,
      };
      marks.push(mark);
      return send(res, 201, mark);
    }

    // /marks/:id
    const markMatch = pathname.match(/^\/marks\/([^/]+)$/);
    if (markMatch) {
      const id = parseId(markMatch[1]);
      if (id === null) return send(res, 400, { error: 'Invalid ID: must be a positive integer' });

      const index = marks.findIndex(m => m.id === id);

      // GET /marks/:id
      if (method === 'GET') {
        if (index < 0) return send(res, 404, { error: `Marks record #${id} not found` });
        return send(res, 200, marks[index]);
      }

      // PUT /marks/:id
      if (method === 'PUT') {
        if (index < 0) return send(res, 404, { error: `Marks record #${id} not found` });
        const data = await parseJsonBody(req);
        const score = data.score !== undefined ? Number(data.score) : marks[index].score;
        const totalMarks = data.totalMarks !== undefined ? Number(data.totalMarks) : marks[index].totalMarks;
        marks[index] = {
          id,
          studentId: data.studentId !== undefined ? Number(data.studentId) : marks[index].studentId,
          subject: (data.subject && String(data.subject).trim()) || marks[index].subject,
          examType: (data.examType && String(data.examType).trim()) || marks[index].examType,
          score,
          totalMarks,
          grade: (data.grade && String(data.grade).trim().toUpperCase()) || computeGrade(score, totalMarks),
        };
        return send(res, 200, marks[index]);
      }

      // PATCH /marks/:id
      if (method === 'PATCH') {
        if (index < 0) return send(res, 404, { error: `Marks record #${id} not found` });
        const data = await parseJsonBody(req);
        if (Object.keys(data).length === 0) return send(res, 400, { error: 'Provide at least one field to update' });
        if (data.studentId !== undefined) marks[index].studentId = Number(data.studentId);
        if (data.subject !== undefined) marks[index].subject = String(data.subject).trim();
        if (data.examType !== undefined) marks[index].examType = String(data.examType).trim();
        if (data.score !== undefined) marks[index].score = Number(data.score);
        if (data.totalMarks !== undefined) marks[index].totalMarks = Number(data.totalMarks);
        if (data.grade !== undefined) {
          marks[index].grade = String(data.grade).trim().toUpperCase();
        } else if (data.score !== undefined || data.totalMarks !== undefined) {
          marks[index].grade = computeGrade(marks[index].score, marks[index].totalMarks);
        }
        return send(res, 200, marks[index]);
      }

      // DELETE /marks/:id
      if (method === 'DELETE') {
        if (index < 0) return send(res, 404, { error: `Marks record #${id} not found` });
        const removed = marks.splice(index, 1)[0];
        return send(res, 200, { message: 'Marks record deleted', deleted: removed });
      }

      return send(res, 405, { error: `Method ${method} not allowed for /marks/:id` });
    }

    // ------------------------------------------------------------------------
    // 404 Route Not Found
    // ------------------------------------------------------------------------
    return send(res, 404, { error: `Cannot ${method} ${pathname} - route not found` });

  } catch (error) {
    if (res.headersSent) {
      res.destroy(error);
      return;
    }
    const status = error.status || 500;
    const message = error.message || 'Internal server error';
    return send(res, status, { error: message });
  }
});

// ============================================================================
// Server Initialization
// ============================================================================

const PORT = Number(process.env.PORT || 3004);

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`=================================================================`);
    console.log(` Student Management System (In-Memory API)`);
    console.log(` Student: Haseeb Jalil | Reg: 241908 | Lab 7 (Part 1)`);
    console.log(` Server running at: http://localhost:${PORT}/`);
    console.log(` - Students:   http://localhost:${PORT}/students`);
    console.log(` - Teachers:   http://localhost:${PORT}/teachers`);
    console.log(` - Attendance: http://localhost:${PORT}/attendance`);
    console.log(` - Marks:      http://localhost:${PORT}/marks`);
    console.log(`=================================================================`);
  });
}

module.exports = { server, students, teachers, attendance, marks };
