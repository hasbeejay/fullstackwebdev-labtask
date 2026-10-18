/* ------------------------------------------------------------------
   Lab 6 - Task 1
   Async / Await: fetch a user from an API.
   - Resolves with a VALID user object when the fetch succeeds.
   - Throws (rejects) with a meaningful error when it fails.
   Student: Haseeb Jalil | Reg No: 241908
------------------------------------------------------------------- */

const API_BASE = "https://jsonplaceholder.typicode.com";

// Set to true to hit the real API (needs internet). false = built-in mock API,
// which behaves the same way (delay, 200 / 404 / network failure) so the
// output is repeatable.
const USE_REAL_API = false;

/* ---------- tiny mock of an API (used when USE_REAL_API = false) ---------- */
const MOCK_USERS = {
  1: { id: 1, name: "Haseeb Jalil", username: "haseeb", email: "241908@students.au.edu.pk", phone: "0300-0000000" },
  2: { id: 2, name: "Ayesha Khan", username: "ayesha", email: "ayesha@example.com", phone: "0311-1111111" },
  3: { id: 3, name: "Bilal Ahmed", username: "bilal", email: "not-an-email", phone: "0322-2222222" }, // corrupt record
};

function mockFetch(url) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (url.includes("offline")) return reject(new TypeError("Network request failed"));
      const id = Number(url.split("/").pop());
      const user = MOCK_USERS[id];
      if (!user) return resolve({ ok: false, status: 404, json: async () => ({}) });
      resolve({ ok: true, status: 200, json: async () => user });
    }, 400);
  });
}

const request = (url) => (USE_REAL_API ? fetch(url) : mockFetch(url));

/* ---------- validation: is this a real, usable user object? ---------- */
function isValidUser(u) {
  return (
    u !== null &&
    typeof u === "object" &&
    Number.isInteger(u.id) && u.id > 0 &&
    typeof u.name === "string" && u.name.trim().length > 0 &&
    typeof u.email === "string" && /^\S+@\S+\.\S+$/.test(u.email)
  );
}

/* ---------- the async / await function ---------- */
async function fetchUser(id) {
  try {
    const response = await request(`${API_BASE}/users/${id}`);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const user = await response.json();

    if (!isValidUser(user)) {
      throw new Error("Received data is not a valid user object");
    }

    return user; // success -> valid user object
  } catch (err) {
    // failure -> propagate a clear error to the caller
    throw new Error(`fetchUser(${id}) failed: ${err.message}`);
  }
}

/* ---------- demo ---------- */
async function main(log = console.log) {
  const cases = [
    { label: "Valid user (id 1)", id: 1 },
    { label: "Missing user (id 99) -> 404", id: 99 },
    { label: "Corrupt record (id 3) -> invalid data", id: 3 },
    { label: "Network failure", id: "offline" },
  ];

  for (const c of cases) {
    log(`> ${c.label}`);
    try {
      const user = await fetchUser(c.id);
      log("  SUCCESS:", JSON.stringify(user));
    } catch (err) {
      log("  ERROR  :", err.message);
    }
    log("");
  }
}

if (typeof module !== "undefined") module.exports = { fetchUser, isValidUser, main };
if (typeof window !== "undefined") window.Task1 = { fetchUser, isValidUser, main };
if (typeof require !== "undefined" && require.main === module) main();
