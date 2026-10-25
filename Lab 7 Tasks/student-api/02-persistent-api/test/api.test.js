// Step 29: Integration tests using Node's built-in test runner.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createApp } = require('../app.js');
let server, base, folder, file;
before(async () => {
  folder = await fs.mkdtemp(path.join(os.tmpdir(), 'week7-students-'));
  file = path.join(folder, 'students.json');
  server = createApp(file);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await fs.rm(folder, { recursive: true, force: true });
});
const request = (pathName, method = 'GET', value) => fetch(base + pathName, {
  method,
  headers: value === undefined ? {} : { 'Content-Type': 'application/json' },
  body: value === undefined ? undefined : JSON.stringify(value)
});

test('GET /health works', async () => {
  const response = await request('/health');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});
test('GET /students starts empty', async () => {
  const response = await request('/students');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), []);
});
test('POST creates a student', async () => {
  const response = await request('/students', 'POST', { name: 'Ali', department: 'CS' });
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { id: 1, name: 'Ali', department: 'CS' });
});
test('GET /students/1 returns that student', async () => {
  const response = await request('/students/1');
  assert.equal(response.status, 200);
  assert.equal((await response.json()).name, 'Ali');
});
test('PUT replaces both student fields', async () => {
  const response = await request('/students/1', 'PUT', { name: 'Sara', department: 'SE' });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).name, 'Sara');
});
test('PATCH updates a single field', async () => {
  const response = await request('/students/1', 'PATCH', { name: 'Ayesha' });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { id: 1, name: 'Ayesha', department: 'SE' });
});
test('POST rejects missing department', async () => {
  const response = await request('/students', 'POST', { name: 'Ali' });
  assert.equal(response.status, 400);
});
test('PATCH rejects empty objects', async () => {
  const response = await request('/students/1', 'PATCH', {});
  assert.equal(response.status, 400);
});
test('GET unknown student returns 404', async () => {
  const response = await request('/students/999');
  assert.equal(response.status, 404);
});
test('GET invalid student ID returns 400', async () => {
  const response = await request('/students/abc');
  assert.equal(response.status, 400);
});
test('Malformed JSON returns 400', async () => {
  const response = await fetch(base + '/students', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad json'
  });
  assert.equal(response.status, 400);
});
test('Wrong content type returns 415', async () => {
  const response = await fetch(base + '/students', { method: 'POST', body: 'name=Ali' });
  assert.equal(response.status, 415);
});
test('Unknown route returns 404', async () => {
  const response = await request('/unknown');
  assert.equal(response.status, 404);
});
test('Disallowed method returns 405', async () => {
  const response = await request('/students', 'DELETE');
  assert.equal(response.status, 405);
});
test('Records really exist in JSON file', async () => {
  const saved = JSON.parse(await fs.readFile(file, 'utf8'));
  assert.equal(saved[0].name, 'Ayesha');
});
test('Concurrent POST requests get unique IDs', async () => {
  const responses = await Promise.all(Array.from({ length: 8 }, (_, i) =>
    request('/students', 'POST', { name: `Student${i}`, department: 'CS' })));
  assert.ok(responses.every((response) => response.status === 201));
  const ids = await Promise.all(responses.map(async (response) => (await response.json()).id));
  assert.equal(new Set(ids).size, 8);
});
test('DELETE returns 204 and removes student', async () => {
  const response = await request('/students/1', 'DELETE');
  assert.equal(response.status, 204);
  assert.equal(await response.text(), '');
  assert.equal((await request('/students/1')).status, 404);
});
test('State survives creating another server', async () => {
  const another = createApp(file);
  await new Promise((resolve) => another.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${another.address().port}/students`;
  try {
    const response = await fetch(url);
    assert.equal((await response.json()).length, 8);
  } finally {
    await new Promise((resolve) => another.close(resolve));
  }
});
