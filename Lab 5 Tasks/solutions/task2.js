// Task 2 - Academic Performance Intelligence Engine
// Array methods are used for the analytics. No traditional for / while loops.

const results = [
  { id: 1, name: 'Ali', department: 'CS', course: 'FSWD', marks: 82 },
  { id: 2, name: 'Sara', department: 'CS', course: 'FSWD', marks: 91 },
  { id: 3, name: 'Usman', department: 'SE', course: 'FSWD', marks: 47 },
  { id: 4, name: 'Hina', department: 'AI', course: 'FSWD', marks: 73 },
  { id: 5, name: 'Ahmed', department: 'SE', course: 'FSWD', marks: 64 },
  { id: 6, name: 'Zoya', department: 'AI', course: 'FSWD', marks: 91 }
];

const PASS_MARKS = 50;
const round2 = (value) => Math.round(value * 100) / 100;

// Grading policy, ordered from the highest band to the lowest.
const GRADE_POLICY = [
  { min: 85, grade: 'A', gradePoints: 4.0 },
  { min: 80, grade: 'A-', gradePoints: 3.67 },
  { min: 75, grade: 'B+', gradePoints: 3.33 },
  { min: 70, grade: 'B', gradePoints: 3.0 },
  { min: 65, grade: 'B-', gradePoints: 2.67 },
  { min: 60, grade: 'C+', gradePoints: 2.33 },
  { min: 50, grade: 'C', gradePoints: 2.0 },
  { min: 0, grade: 'F', gradePoints: 0.0 }
];

const line = (text) => console.log(text);
const heading = (text) => console.log(`\n=== ${text} ===`);

// ---------------------------------------------------------------------------
// A. Result processing - map() returns NEW objects, the source stays untouched
// ---------------------------------------------------------------------------
export function gradeFor(marks) {
  const band = GRADE_POLICY.find((entry) => marks >= entry.min);
  return { grade: band.grade, gradePoints: band.gradePoints };
}

export function processResults(list) {
  return list.map((student) => ({
    ...student,
    ...gradeFor(student.marks),
    status: student.marks >= PASS_MARKS ? 'PASS' : 'FAIL'
  }));
}

// ---------------------------------------------------------------------------
// B. Ranked merit list - sort() MUTATES, so it is applied to a copy
// ---------------------------------------------------------------------------
export function rankStudents(list) {
  return [...list].sort((a, b) => b.marks - a.marks || a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------------------
// C. Department statistics - reduce() builds an object keyed by department,
//    so a brand-new department such as "DS" works without any code change
// ---------------------------------------------------------------------------
export function departmentStats(list) {
  const totals = list.reduce((acc, student) => {
    const dept = acc[student.department] ?? { students: 0, totalMarks: 0, highest: -Infinity, passed: 0 };
    acc[student.department] = {
      students: dept.students + 1,
      totalMarks: dept.totalMarks + student.marks,
      highest: Math.max(dept.highest, student.marks),
      passed: dept.passed + (student.marks >= PASS_MARKS ? 1 : 0)
    };
    return acc;
  }, {});

  return Object.fromEntries(
    Object.entries(totals).map(([department, t]) => [
      department,
      { students: t.students, average: round2(t.totalMarks / t.students), highest: t.highest, passed: t.passed }
    ])
  );
}

// ---------------------------------------------------------------------------
// Demonstration
// ---------------------------------------------------------------------------
const originalSnapshot = JSON.stringify(results);

heading('A. RESULT PROCESSING (map)');
const processed = processResults(results);
line('ID  Name    Dept  Marks  Grade  GP    Status');
processed.forEach((s) =>
  line(`${String(s.id).padEnd(3)} ${s.name.padEnd(7)} ${s.department.padEnd(5)} ${String(s.marks).padEnd(6)} ${s.grade.padEnd(6)} ${s.gradePoints.toFixed(2)}  ${s.status}`)
);

heading('B. RANKED MERIT LIST (sorted copy)');
const ranked = rankStudents(processed);
ranked.forEach((s, index) => line(`#${index + 1}  ${s.name.padEnd(7)} ${s.marks}  ${s.grade}`));
line(`original order still: [${results.map((s) => s.name).join(', ')}]`);
line(`ranked === processed (same array?): ${ranked === processed}`);

heading('C. DEPARTMENT STATISTICS (reduce)');
console.log(departmentStats(processed));

line('\nA new department appears later (DS) - same function, no code change:');
const withNewDepartment = [...processed, { id: 7, name: 'Bilal', department: 'DS', course: 'FSWD', marks: 88, ...gradeFor(88), status: 'PASS' }];
console.log(departmentStats(withNewDepartment).DS);

heading('D. ACADEMIC QUERIES');
const overallAverage = round2(processed.reduce((sum, s) => sum + s.marks, 0) / processed.length);

const firstAbove85 = processed.find((s) => s.marks > 85);
const firstFailedIndex = processed.findIndex((s) => s.status === 'FAIL');
const anyFailed = processed.some((s) => s.status === 'FAIL');
const allMarksValid = processed.every((s) => Number.isFinite(s.marks) && s.marks >= 0 && s.marks <= 100);
const aboveAverage = processed.filter((s) => s.marks > overallAverage).map((s) => s.name);
const topThree = rankStudents(processed).slice(0, 3).map((s) => s.name);

line(`Overall average              : ${overallAverage}`);
line(`First student scoring > 85   : ${firstAbove85.name} (${firstAbove85.marks})`);
line(`Index of first failed student: ${firstFailedIndex} (${processed[firstFailedIndex].name})`);
line(`At least one student failed? : ${anyFailed}`);
line(`All marks within 0-100?      : ${allMarksValid}`);
line(`Scoring above the average    : ${aboveAverage.join(', ')}`);
line(`Top three students           : ${topThree.join(', ')}`);

heading('MUTATION CHECK');
line(`results unchanged after all operations: ${JSON.stringify(results) === originalSnapshot}`);
line(`results[0] has grade property?         : ${'grade' in results[0]}`);
