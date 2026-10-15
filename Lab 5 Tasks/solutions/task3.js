// Task 3 - Safe Student Profile Update Service

const student = {
  id: 101,
  name: 'Ali',
  marks: 0,
  scholarship: false,
  address: { city: 'Islamabad', sector: 'F-10' },
  contact: { email: 'ali@university.edu' }
};

const update = {
  name: 'Ali Khan',
  address: { city: 'Rawalpindi' },
  contact: { phone: '03001234567' }
};

const heading = (text) => console.log(`\n=== ${text} ===`);

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// ---------------------------------------------------------------------------
// Recursive merge: returns a brand-new object, never touches `target` or `source`.
// `undefined` means "not provided"; every other value (0, false, '', null) is a real value.
// ---------------------------------------------------------------------------
function mergeDeep(target, source) {
  const merged = { ...target };                              // spread: copy top-level properties
  for (const [key, value] of Object.entries(source)) {
    if (value === undefined) continue;                       // not provided -> keep the old value
    merged[key] = isPlainObject(value)
      ? mergeDeep(isPlainObject(target[key]) ? target[key] : {}, value)   // nested -> merge recursively
      : value;                                               // primitive -> replace
  }
  return merged;
}

// The service: deep-clone first so NO nested object is ever shared with the original.
export function updateStudent(currentStudent, changes = {}) {
  return mergeDeep(structuredClone(currentStudent), changes);
}

// ---------------------------------------------------------------------------
heading('1. THE UPDATE SERVICE');
const originalSnapshot = JSON.stringify(student);
const updated = updateStudent(student, update);
console.log('original:', student);
console.log('updated :', updated);
console.log('original unchanged:', JSON.stringify(student) === originalSnapshot);

// ---------------------------------------------------------------------------
heading('2. 0, false AND "" ARE VALID VALUES');
const scored = { ...student, marks: 85, scholarship: true };
const zeroUpdate = { marks: 0, scholarship: false, contact: { email: '' } };
const afterZero = updateStudent(scored, zeroUpdate);
console.log('marks      :', scored.marks, '->', afterZero.marks);
console.log('scholarship:', scored.scholarship, '->', afterZero.scholarship);
console.log('email      :', JSON.stringify(scored.contact.email), '->', JSON.stringify(afterZero.contact.email));

// || treats 0 / false / '' as "missing"; ?? only treats null and undefined as missing
console.log('with ||  :', zeroUpdate.marks || scored.marks, '(wrong, 0 was replaced)');
console.log('with ??  :', zeroUpdate.marks ?? scored.marks, '(correct, 0 kept)');

// ---------------------------------------------------------------------------
heading('3. DESTRUCTURING TOOLKIT');

// object destructuring + renaming + default value
const { name: studentName, marks = 100, nickname = 'no nickname' } = student;
console.log('rename + default:', studentName, marks, nickname);   // marks is 0, the default is NOT used

// nested destructuring
const { address: { city: oldCity, sector }, contact: { email } } = student;
console.log('nested:', oldCity, sector, email);

// object rest: everything except address and contact
const { address, contact, ...basicInfo } = student;
console.log('object rest:', basicInfo);

// array destructuring (skip an element, default value, swap)
const [firstKey, , thirdKey, missingKey = 'no fifth-plus key'] = Object.keys(student);
console.log('array destructuring:', firstKey, thirdKey, missingKey);
let left = 'city';
let right = 'sector';
[left, right] = [right, left];
console.log('swap:', left, right);

// rest parameters: collect any number of field names
function pickFields(source, ...fields) {
  return Object.fromEntries(fields.map((field) => [field, source[field]]));
}
console.log('rest parameters:', pickFields(student, 'id', 'name', 'scholarship'));

// property shorthand
const id = student.id;
const summary = { id, studentName, oldCity };     // same as { id: id, studentName: studentName, ... }
console.log('shorthand:', summary);

// optional chaining
console.log('optional chaining:', update?.contact?.phone, '|', student?.contact?.fax?.number, '|', student.guardian?.name);

// spread: copy an array and add to an object
const keys = [...Object.keys(student), 'extra'];
console.log('spread array:', keys.length, 'keys');

// ---------------------------------------------------------------------------
heading('4. REFERENCE CHALLENGE');
console.log('original  === updated         :', student === updated);
console.log('original.address === updated.address:', student.address === updated.address);
console.log('original.contact === updated.contact:', student.contact === updated.contact);
console.log('Why: objects are compared by reference. updateStudent() clones first, so every');
console.log('     object (outer, address, contact) in the result is a different object in memory.');

console.log('\nCompare with a SHALLOW copy made by spread only:');
const shallow = { ...student, name: 'Ali Khan' };
console.log('shallow === student                 :', shallow === student);
console.log('shallow.address === student.address :', shallow.address === student.address, '<- shared!');
shallow.address.city = 'Lahore';
console.log('after shallow.address.city = "Lahore", the ORIGINAL city is now:', student.address.city);
student.address.city = 'Islamabad';   // restore the demo data
