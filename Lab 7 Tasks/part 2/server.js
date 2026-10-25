// Lab 7 - Part 2: Persistent API Server
// Starts the persistent e-commerce API server on port 3006 (configurable via PORT).

const path = require('node:path');
const { createApp } = require('./app.js');

const PORT = Number(process.env.PORT || 3006);
const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');

const { server } = createApp(dataDir);

server.listen(PORT, () => {
  console.log(`=================================================================`);
  console.log(` E-Commerce Persistent REST API (Lab 7 - Part 2)`);
  console.log(` Student: Haseeb Jalil | Reg: 241908 | Air University`);
  console.log(` Server running at: http://localhost:${PORT}/`);
  console.log(` Persistent Data Dir: ${dataDir}`);
  console.log(` - Products: http://localhost:${PORT}/products`);
  console.log(` - Cart:     http://localhost:${PORT}/cart`);
  console.log(` - Orders:   http://localhost:${PORT}/orders`);
  console.log(` - Users:    http://localhost:${PORT}/users`);
  console.log(` - Reviews:  http://localhost:${PORT}/reviews`);
  console.log(`=================================================================`);
});
