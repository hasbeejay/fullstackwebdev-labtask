// main.js - the caller: demonstrates try / catch / finally with the transcript service
import Student from './Student.js';                                    // default import
import { processTranscript, reportToJSON } from './transcriptService.js';   // named imports
import { calculateGrade as gradeOf } from './gradeUtils.js';           // aliased named import

const rawData = `
[
  {
    "id": 101,
    "name": "Ali",
    "courses": [
      { "code": "CS301", "marks": 81 },
      { "code": "CS302", "marks": 74 }
    ]
  },
  {
    "id": 102,
    "name": "Sara",
    "courses": [
      { "code": "CS301", "marks": 93 },
      { "code": "CS302", "marks": 88 },
      { "code": "CS303", "marks": 49 }
    ]
  }
]`;

const testCases = [
  { label: 'VALID transcript', input: rawData },
  { label: 'MALFORMED JSON (missing closing bracket)', input: '[{ "id": 1, "name": "Ali", "courses": [] }' },
  { label: 'MISSING student id', input: '[{ "name": "Ali", "courses": [] }]' },
  {
    label: 'DUPLICATE student id',
    input: '[{ "id": 7, "name": "A", "courses": [] }, { "id": 7, "name": "B", "courses": [] }]'
  },
  {
    label: 'MARKS above 100',
    input: '[{ "id": 1, "name": "Ali", "courses": [{ "code": "CS301", "marks": 101 }] }]'
  },
  {
    label: 'MARKS below 0',
    input: '[{ "id": 1, "name": "Ali", "courses": [{ "code": "CS301", "marks": -4 }] }]'
  },
  {
    label: 'MISSING course code',
    input: '[{ "id": 1, "name": "Ali", "courses": [{ "marks": 70 }] }]'
  },
  { label: 'WRONG input type (not a string)', input: 42 }
];

for (const testCase of testCases) {
  console.log(`\n--- ${testCase.label} ---`);
  try {
    const report = processTranscript(testCase.input);
    const json = reportToJSON(report);

    console.log(`Processed ${report.totalStudents} student(s), class average ${report.classAverage}`);
    report.students.forEach((s) => console.log(`  ${s.name}: average ${s.average}, GPA ${s.gpa}`));

    // prove the JSON survives a round trip
    console.log('JSON round-trip equal:', JSON.stringify(JSON.parse(json)) === JSON.stringify(report));
    if (testCase.label === 'VALID transcript') console.log(json);
  } catch (error) {
    // a different error type tells the caller what kind of problem happened
    console.log(`${error.name}: ${error.message}`);
  } finally {
    console.log('[finally] case finished, resources released');
  }
}

console.log('\n--- MODULE FEATURES ---');
const demoStudent = new Student(900, 'Demo', [{ code: 'CS100', marks: 86 }]);
console.log('default import Student ->', demoStudent instanceof Student, '| average:', demoStudent.average);
console.log('aliased import gradeOf(86) ->', gradeOf(86));
