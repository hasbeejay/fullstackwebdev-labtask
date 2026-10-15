// gradeUtils.js - named exports only

const GRADE_POLICY = [
  { min: 85, grade: 'A', points: 4.0 },
  { min: 80, grade: 'A-', points: 3.67 },
  { min: 75, grade: 'B+', points: 3.33 },
  { min: 70, grade: 'B', points: 3.0 },
  { min: 65, grade: 'B-', points: 2.67 },
  { min: 60, grade: 'C+', points: 2.33 },
  { min: 50, grade: 'C', points: 2.0 },
  { min: 0, grade: 'F', points: 0.0 }
];

const round2 = (value) => Math.round(value * 100) / 100;

function findBand(marks) {
  if (typeof marks !== 'number' || Number.isNaN(marks)) {
    throw new TypeError(`marks must be a number, received ${typeof marks}`);
  }
  if (marks < 0 || marks > 100) {
    throw new RangeError(`marks must be between 0 and 100, received ${marks}`);
  }
  return GRADE_POLICY.find((band) => marks >= band.min);
}

export function calculateGrade(marks) {
  return findBand(marks).grade;
}

export function calculateGradePoints(marks) {
  return findBand(marks).points;
}

export function calculateAverage(values) {
  if (!Array.isArray(values)) throw new TypeError('calculateAverage expects an array');
  if (values.length === 0) return 0;
  return round2(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function calculateGPA(marksList) {
  return calculateAverage(marksList.map((marks) => calculateGradePoints(marks)));
}
