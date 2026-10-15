// Student.js - default export: the Student class
import { calculateAverage, calculateGPA, calculateGrade } from './gradeUtils.js';

export default class Student {
  constructor(id, name, courses = []) {
    this.id = id;
    this.name = name;
    this.courses = courses;          // [{ code, marks }]
  }

  get average() {
    return calculateAverage(this.courses.map((course) => course.marks));
  }

  get gpa() {
    return calculateGPA(this.courses.map((course) => course.marks));
  }

  // A plain, JSON-friendly snapshot of the student
  toReport() {
    return {
      id: this.id,
      name: this.name,
      courses: this.courses.map((course) => ({ ...course, grade: calculateGrade(course.marks) })),
      average: this.average,
      gpa: this.gpa
    };
  }
}
