// Step 27: Handle REST routes with Node's built-in http module.
const http = require('node:http');
const { EventEmitter } = require('node:events');
const { HttpError, fieldsOf, positiveId } = require('./validate.js');
const { createStore } = require('./store.js');

function createApp(file) {
  const store = createStore(file);
  const events = new EventEmitter();
  events.on('studentSaved', (student) => console.log('[event] saved student', student.id));
  function json(res, status, value) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(value));
  }
  async function body(req) {
    if (!String(req.headers['content-type'] || '').toLowerCase().includes('application/json')) {
      throw new HttpError(415, 'Content-Type must be application/json');
    }
    let raw = '';
    for await (const chunk of req) {
      raw += chunk.toString('utf8');
      if (Buffer.byteLength(raw) > 65536) throw new HttpError(413, 'Request body too large');
    }
    try { return JSON.parse(raw); }
    catch { throw new HttpError(400, 'Malformed JSON'); }
  }
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const collection = url.pathname === '/students';
      const match = /^\/students\/([^/]+)$/.exec(url.pathname);
      const id = match ? positiveId(match[1]) : null;
      if (req.method === 'GET' && url.pathname === '/health') {
        return json(res, 200, { status: 'ok' });
      }
      if (collection && req.method === 'GET') {
        return json(res, 200, await store.list());
      }
      if (collection && req.method === 'POST') {
        const fields = fieldsOf(await body(req));
        const created = await store.edit((students) => {
          const nextId = students.reduce((max, item) => Math.max(max, item.id), 0) + 1;
          const student = { id: nextId, ...fields };
          students.push(student);
          return { changed: true, value: student };
        });
        events.emit('studentSaved', created);
        return json(res, 201, created);
      }
      if (id !== null && req.method === 'GET') {
        const found = (await store.list()).find((student) => student.id === id);
        if (!found) throw new HttpError(404, 'Student not found');
        return json(res, 200, found);
      }
      if (id !== null && ['PUT', 'PATCH'].includes(req.method)) {
        const updates = fieldsOf(await body(req), req.method === 'PATCH');
        const saved = await store.edit((students) => {
          const found = students.find((student) => student.id === id);
          if (!found) throw new HttpError(404, 'Student not found');
          Object.assign(found, updates);
          return { changed: true, value: { ...found } };
        });
        events.emit('studentSaved', saved);
        return json(res, 200, saved);
      }
      if (id !== null && req.method === 'DELETE') {
        await store.edit((students) => {
          const index = students.findIndex((student) => student.id === id);
          if (index < 0) throw new HttpError(404, 'Student not found');
          students.splice(index, 1);
          return { changed: true, value: null };
        });
        res.writeHead(204); // No response body for 204.
        return res.end();
      }
      if (collection || id !== null) {
        throw new HttpError(405, 'HTTP method not allowed for this path');
      }
      throw new HttpError(404, 'Route not found');
    } catch (error) {
      if (res.headersSent) { res.destroy(error); return; }
      if (!(error instanceof HttpError)) console.error('[unexpected]', error);
      json(res, error instanceof HttpError ? error.status : 500,
        { error: error instanceof HttpError ? error.message : 'Internal server error' });
    }
  });
  return server;
}
module.exports = { createApp };
