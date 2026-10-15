// Task 1 - Admission Decision and Data Sanitization Engine
// Form values arrive as strings, so nothing is trusted until it is converted and validated.

const SUPPORTED_PROGRAMS = ['BSCS', 'BSSE', 'BSAI'];
const WEIGHTS = { matric: 0.2, intermediate: 0.3, entryTest: 0.5 };
const RULES = {
  minMerit: 70,          // eligibility
  minEntryTest: 60,      // eligibility
  minIntermediate: 60,   // eligibility
  selectedMerit: 75      // SELECTED needs merit >= 75 AND the fee paid, otherwise WAITING
};

const round2 = (value) => Math.round(value * 100) / 100;

// ---------- explicit conversion helpers ----------

// Converts a raw form value to a number. Problems are pushed onto `errors`.
function convertNumber(rawValue, label, errors) {
  // Guard clause: undefined, null, '' and '   ' all count as "missing"
  if (rawValue === undefined || rawValue === null || String(rawValue).trim() === '') {
    errors.push(`${label} is missing`);
    return null;
  }
  const converted = Number(String(rawValue).trim());
  if (!Number.isFinite(converted)) {            // catches NaN and Infinity
    errors.push(`${label} is not a valid number ("${rawValue}")`);
    return null;
  }
  return converted;
}

function checkRange(value, label, min, max, errors) {
  if (value === null) return;                   // already reported as missing / invalid
  if (value < min || value > max) {
    errors.push(`${label} must be between ${min} and ${max} (got ${value})`);
  }
}

// switch statement: only the literal strings 'true' / 'false' are accepted
function convertBoolean(rawValue, label, errors) {
  switch (String(rawValue).trim().toLowerCase()) {
    case 'true':
      return true;
    case 'false':
      return false;
    default:
      errors.push(`${label} must be "true" or "false"`);
      return null;
  }
}

function convertProgram(rawValue, errors) {
  const program = String(rawValue ?? '').trim().toUpperCase();
  if (program === '') {
    errors.push('program is missing');
    return null;
  }
  if (!SUPPORTED_PROGRAMS.includes(program)) {
    errors.push(`program "${program}" is not supported`);
    return null;
  }
  return program;
}

// ---------- business rules ----------

function calculateMerit(matric, intermediate, entryTest) {
  return round2(
    matric * WEIGHTS.matric + intermediate * WEIGHTS.intermediate + entryTest * WEIGHTS.entryTest
  );
}

function decideStatus(merit, intermediate, entryTest, feePaid) {
  const eligible =
    merit >= RULES.minMerit && entryTest >= RULES.minEntryTest && intermediate >= RULES.minIntermediate;

  if (!eligible) return 'REJECTED';
  // ternary: strong merit AND paid fee -> SELECTED, otherwise the applicant is held on the waiting list
  return merit >= RULES.selectedMerit && feePaid ? 'SELECTED' : 'WAITING';
}

// Validates one applicant and returns a NEW result object (the source is never touched).
export function processApplicant(applicant) {
  // Guard clause: the record itself might be null, a number, an array ...
  if (typeof applicant !== 'object' || applicant === null || Array.isArray(applicant)) {
    return {
      id: null, name: null, program: null, valid: false, merit: null,
      status: 'INVALID DATA', errors: ['record is not an object']
    };
  }

  const errors = [];

  // truthy / falsy: !value is true for undefined, null and ''
  if (!applicant.id) errors.push('id is missing');
  if (!applicant.name || String(applicant.name).trim() === '') errors.push('name is missing');

  const age = convertNumber(applicant.age, 'age', errors);
  const matric = convertNumber(applicant.matricMarks, 'matricMarks', errors);
  const intermediate = convertNumber(applicant.intermediateMarks, 'intermediateMarks', errors);
  const entryTest = convertNumber(applicant.entryTest, 'entryTest', errors);

  checkRange(age, 'age', 17, 30, errors);
  checkRange(matric, 'matricMarks', 0, 100, errors);
  checkRange(intermediate, 'intermediateMarks', 0, 100, errors);
  checkRange(entryTest, 'entryTest', 0, 100, errors);

  const program = convertProgram(applicant.program, errors);
  const feePaid = convertBoolean(applicant.feePaid, 'feePaid', errors);

  const result = {
    id: applicant.id ?? null,
    name: applicant.name ?? null,
    program: program ?? String(applicant.program ?? '').trim().toUpperCase(),
    valid: errors.length === 0,
    merit: null,
    status: 'INVALID DATA',
    errors
  };

  // Guard clause: merit is calculated only AFTER the record is known to be valid
  if (!result.valid) return result;

  result.merit = calculateMerit(matric, intermediate, entryTest);
  result.status = decideStatus(result.merit, intermediate, entryTest, feePaid);
  return result;
}

export function processApplicants(applicants) {
  const results = [];
  for (const applicant of applicants) {
    results.push(processApplicant(applicant));
  }
  return results;
}

export function summarize(results) {
  let valid = 0;
  let invalid = 0;
  let totalMerit = 0;
  let highest = null;
  let lowest = null;
  const programs = new Map();

  for (const result of results) {
    const key = result.program === '' ? 'MISSING' : result.program ?? 'MISSING';
    programs.set(key, (programs.get(key) ?? 0) + 1);

    if (!result.valid) {
      invalid++;
      continue;
    }
    valid++;
    totalMerit += result.merit;
    if (highest === null || result.merit > highest.merit) highest = result;
    if (lowest === null || result.merit < lowest.merit) lowest = result;
  }

  return {
    validApplicants: valid,
    invalidApplicants: invalid,
    highestMerit: highest === null ? null : { id: highest.id, name: highest.name, merit: highest.merit },
    lowestMerit: lowest === null ? null : { id: lowest.id, name: lowest.name, merit: lowest.merit },
    averageMerit: valid === 0 ? null : round2(totalMerit / valid),
    applicantsPerProgram: Object.fromEntries(programs)
  };
}

// ---------------------------------------------------------------------------
// Demonstration: normal, boundary and invalid test cases
// ---------------------------------------------------------------------------
const applicants = [
  // --- the three records from the case study ---
  { id: 'A101', name: 'Sara Khan', age: '19', matricMarks: '91', intermediateMarks: '87', entryTest: '78', program: 'BSCS', feePaid: 'true' },
  { id: 'A102', name: 'Ahmed Ali', age: 'twenty', matricMarks: '88', intermediateMarks: '', entryTest: '72', program: 'BSSE', feePaid: 'false' },
  { id: 'A103', name: 'Hassan', age: '18', matricMarks: '76', intermediateMarks: '83', entryTest: '91', program: 'BSAI', feePaid: 'true' },
  // --- boundary cases ---
  { id: 'B201', name: 'Merit Exactly 70', age: '17', matricMarks: '70', intermediateMarks: '70', entryTest: '70', program: 'BSCS', feePaid: 'true' },
  { id: 'B202', name: 'Entry Test 59', age: '30', matricMarks: '100', intermediateMarks: '100', entryTest: '59', program: 'BSSE', feePaid: 'true' },
  { id: 'B203', name: 'Intermediate 59', age: '20', matricMarks: '95', intermediateMarks: '59', entryTest: '95', program: 'BSAI', feePaid: 'true' },
  { id: 'B204', name: 'Strong But Unpaid', age: '21', matricMarks: '90', intermediateMarks: '90', entryTest: '90', program: 'BSCS', feePaid: 'false' },
  { id: 'B205', name: 'Perfect Scores', age: '22', matricMarks: '100', intermediateMarks: '100', entryTest: '100', program: 'bsse', feePaid: 'true' },
  // --- invalid cases ---
  { id: 'C301', name: 'Too Young', age: '16', matricMarks: '80', intermediateMarks: '80', entryTest: '80', program: 'BSCS', feePaid: 'true' },
  { id: 'C302', name: 'Marks Over 100', age: '19', matricMarks: '101', intermediateMarks: '80', entryTest: '80', program: 'BSCS', feePaid: 'true' },
  { id: 'C303', name: 'Wrong Program', age: '19', matricMarks: '80', intermediateMarks: '80', entryTest: '80', program: 'BBA', feePaid: 'true' },
  { id: 'C304', name: 'Bad Fee Flag', age: '19', matricMarks: '80', intermediateMarks: '80', entryTest: '80', program: 'BSCS', feePaid: 'maybe' },
  { id: '', name: '   ', age: null, matricMarks: undefined, intermediateMarks: 'abc', entryTest: '-5', program: '', feePaid: '' },
  null
];

// Freeze everything: if the engine tried to mutate the input it would throw in strict (module) mode.
const snapshotBefore = JSON.stringify(applicants);
for (const applicant of applicants) {
  if (applicant !== null) Object.freeze(applicant);
}
Object.freeze(applicants);

const results = processApplicants(applicants);

console.log('=== APPLICANT RESULTS ===');
for (const r of results) {
  const meritText = r.merit === null ? '  -  ' : r.merit.toFixed(2).padStart(6);
  console.log(`${String(r.id).padEnd(5)} ${String(r.name).trim().padEnd(18)} ${String(r.program).padEnd(6)} merit=${meritText}  ${r.status}`);
  if (r.errors.length > 0) {
    console.log(`        errors: ${r.errors.join('; ')}`);
  }
}

console.log('\n=== SUMMARY ===');
console.log(summarize(results));

console.log('\nSource data unchanged:', JSON.stringify(applicants) === snapshotBefore);
