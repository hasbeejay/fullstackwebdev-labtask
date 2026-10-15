// Task 4 - University User Hierarchy and Dynamic `this`

class Person {
  constructor(name, email) {
    this.name = name;
    this.email = email;
  }

  introduce() {
    return `Hi, I am ${this.name} (${this.email}).`;
  }
}

class Student extends Person {
  constructor(name, email, rollNo, marks) {
    super(name, email);                 // parent constructor must run before `this` is used
    this.rollNo = rollNo;
    this.marks = marks;
  }

  introduce() {
    // reuse the parent version, then extend it
    return `${super.introduce()} I am a student, roll no ${this.rollNo}.`;
  }

  getResult() {
    return this.marks >= 50
      ? { rollNo: this.rollNo, marks: this.marks, result: 'PASS' }
      : { rollNo: this.rollNo, marks: this.marks, result: 'FAIL' };
  }
}

class FacultyMember extends Person {
  constructor(name, email, employeeId, department) {
    super(name, email);
    this.employeeId = employeeId;
    this.department = department;
  }

  introduce() {
    return `${super.introduce()} I teach in the ${this.department} department (employee ${this.employeeId}).`;
  }
}

const heading = (text) => console.log(`\n=== ${text} ===`);

// ---------------------------------------------------------------------------
heading('1. RUNTIME POLYMORPHISM');
const users = [
  new Student('Ali', 'ali@au.edu.pk', '241901', 82),
  new FacultyMember('Dr. Sana', 'sana@au.edu.pk', 'EMP-17', 'CS'),
  new Person('Registrar Office', 'registrar@au.edu.pk'),
  new Student('Hina', 'hina@au.edu.pk', '241907', 44),
  new FacultyMember('Dr. Bilal', 'bilal@au.edu.pk', 'EMP-42', 'SE')
];

// The same call, a different introduce() runs depending on the real object.
users.forEach((user) => console.log(user.introduce()));

heading('2. instanceof AND THE PROTOTYPE CHAIN');
users.forEach((user) =>
  console.log(
    `${user.name.padEnd(17)} Person:${String(user instanceof Person).padEnd(6)} Student:${String(user instanceof Student).padEnd(6)} FacultyMember:${user instanceof FacultyMember}`
  )
);
console.log('Student.prototype overrides introduce():', Object.hasOwn(Student.prototype, 'introduce'));
console.log('Object.getPrototypeOf(Student) === Person:', Object.getPrototypeOf(Student) === Person);

heading('3. STUDENT-ONLY BEHAVIOUR');
users
  .filter((user) => user instanceof Student)
  .forEach((s) => console.log(s.name, s.getResult()));

// ---------------------------------------------------------------------------
heading('4. call(): BORROW A METHOD FOR ANOTHER OBJECT');
const guest = { name: 'Dr. Ahmed', email: 'ahmed@example.com' };
console.log(Person.prototype.introduce.call(guest));
console.log('guest instanceof Person:', guest instanceof Person, '(it only borrowed the method)');

// ---------------------------------------------------------------------------
heading('5. DETACHED METHOD LOSES this');
const student = users[0];
const fn = student.introduce;            // just a function now - nothing remembers `student`
try {
  console.log(fn());
} catch (error) {
  console.log(`${error.name}: ${error.message}`);
  console.log('Reason: fn() is a plain call, so `this` is undefined (class bodies and modules are strict mode).');
}

// ---------------------------------------------------------------------------
heading('6. bind(): PERMANENTLY ATTACH this');
const safeIntroduce = student.introduce.bind(student);
console.log(safeIntroduce());

const otherStudent = users[3];
console.log('bound version called "on" another object:', safeIntroduce.call(otherStudent));
console.log('  -> still introduces Ali: bind() fixes `this`, call() cannot override it.');

const detachedFromFaculty = users[1].introduce.bind(users[1]);
console.log(detachedFromFaculty());
