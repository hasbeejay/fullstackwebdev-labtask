// Step 28: Configure a server and start listening.
const path = require('node:path');
const { createApp } = require('./app.js');
const port = Number(process.env.PORT || 3005);
const file = process.env.STUDENT_DATA_FILE || path.join(__dirname, 'data', 'students.json');
const server = createApp(file);
server.listen(port, () => {
  console.log(`Student API: http://localhost:${port}/students`);
  console.log(`JSON data file: ${file}`);
});
