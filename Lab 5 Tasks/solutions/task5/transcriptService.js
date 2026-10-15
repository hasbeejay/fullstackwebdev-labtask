// transcriptService.js - parsing, validation and report generation
import Student from './Student.js';                                   // default import
import { calculateAverage as averageOf } from './gradeUtils.js';      // named import with an alias

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// 1. Parse JSON safely: SyntaxError is converted into a clearer, domain-level Error
export function parseTranscript(jsonText) {
  if (typeof jsonText !== 'string') {
    throw new TypeError(`Transcript data must be a JSON string, received ${typeof jsonText}`);
  }
  try {
    return JSON.parse(jsonText);
  } catch (error) {
    throw new Error(`Malformed JSON: ${error.message}`, { cause: error });
  }
}

// 2. Validate the parsed data and build Student objects
export function buildStudents(data) {
  if (!Array.isArray(data)) {
    throw new TypeError('Transcript root must be an array of students');
  }

  const seenIds = new Set();

  return data.map((entry, index) => {
    const where = `student at index ${index}`;

    if (!isObject(entry)) throw new TypeError(`${where} must be an object`);

    const { id, name, courses } = entry;

    if (id === undefined || id === null || id === '') {
      throw new TypeError(`${where} has a missing id`);
    }
    if (seenIds.has(id)) {
      throw new Error(`Duplicate student id: ${id}`);
    }
    seenIds.add(id);

    if (typeof name !== 'string' || name.trim() === '') {
      throw new TypeError(`student ${id} has a missing name`);
    }
    if (!Array.isArray(courses)) {
      throw new TypeError(`student ${id} must have a courses array`);
    }

    courses.forEach((course, courseIndex) => {
      const courseWhere = `student ${id}, course at index ${courseIndex}`;

      if (!isObject(course)) throw new TypeError(`${courseWhere} must be an object`);
      if (typeof course.code !== 'string' || course.code.trim() === '') {
        throw new TypeError(`${courseWhere} has a missing course code`);
      }
      if (typeof course.marks !== 'number' || Number.isNaN(course.marks)) {
        throw new TypeError(`${courseWhere} (${course.code}) marks must be a number`);
      }
      if (course.marks < 0 || course.marks > 100) {
        throw new RangeError(`${courseWhere} (${course.code}) marks ${course.marks} are outside 0-100`);
      }
    });

    return new Student(id, name.trim(), courses);
  });
}

// 3. Generate a plain JavaScript report object
export function buildReport(students) {
  const reports = students.map((student) => student.toReport());
  return {
    totalStudents: reports.length,
    classAverage: averageOf(reports.map((report) => report.average)),
    students: reports
  };
}

// 4. Convert the final report back to JSON
export function reportToJSON(report) {
  return JSON.stringify(report, null, 2);
}

// Convenience pipeline: JSON text in -> report object out
export function processTranscript(jsonText) {
  return buildReport(buildStudents(parseTranscript(jsonText)));
}
