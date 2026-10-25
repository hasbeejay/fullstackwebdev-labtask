// Step 24: A tiny API storing data in memory only.
// GET /students and POST /students with {"name":"Ali"}.
const http = require('node:http');
let students = [];
let nextId = 1;
const server = http.createServer(async (req, res) => {
  const send = (status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  };
  if (req.method === 'GET' && req.url === '/students') return send(200, students);
  if (req.method === 'POST' && req.url === '/students') {
    try {
      let raw = '';
      for await (const chunk of req) {
        raw += chunk;
        if (Buffer.byteLength(raw) > 65536) return send(413, { error: 'Too large' });
      }
      const { name } = JSON.parse(raw);
      if (typeof name !== 'string' || !name.trim()) return send(400, { error: 'name required' });
      const student = { id: nextId++, name: name.trim() };
      students.push(student);
      return send(201, student);
    } catch (error) {
      if (error instanceof SyntaxError) return send(400, { error: 'Invalid JSON' });
      console.error(error);
      return send(500, { error: 'Server error' });
    }
  }
  send(404, { error: 'Not found' });
});
server.listen(3004, () => console.log('Memory API: http://localhost:3004/students'));
