/* ------------------------------------------------------------------
   Lab 6 - Task 2
   Promise.all: run two async operations together, then accept or reject
   the combined promise depending on whether BOTH fetched results are valid.
   Student: Haseeb Jalil | Reg No: 241908
------------------------------------------------------------------- */

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- async operation #1: fetch user details ---------- */
function fetchUserDetails(id) {
  return delay(500).then(() => {
    const users = {
      1: { id: 1, name: "Haseeb Jalil", email: "241908@students.au.edu.pk" },
      2: { id: 2, name: "", email: "broken@example.com" }, // invalid: empty name
    };
    if (!(id in users)) throw new Error(`User ${id} not found`);
    return users[id];
  });
}

/* ---------- async operation #2: fetch that user's posts ---------- */
function fetchUserPosts(id) {
  return delay(800).then(() => {
    const posts = {
      1: [
        { id: 101, userId: 1, title: "Learning Promises", body: "Promise.all waits for everything." },
        { id: 102, userId: 1, title: "Async / Await", body: "Cleaner than .then chains." },
      ],
      2: [], // invalid: no posts
    };
    if (!(id in posts)) throw new Error(`Posts for user ${id} not found`);
    return posts[id];
  });
}

/* ---------- validators ---------- */
const validDetails = (u) =>
  !!u && Number.isInteger(u.id) && typeof u.name === "string" && u.name.trim() !== "" &&
  typeof u.email === "string" && /^\S+@\S+\.\S+$/.test(u.email);

const validPosts = (p) =>
  Array.isArray(p) && p.length > 0 &&
  p.every((x) => x && typeof x.title === "string" && x.title.trim() !== "");

/* ---------- main promise built on Promise.all ---------- */
function loadUserDashboard(id) {
  return Promise.all([fetchUserDetails(id), fetchUserPosts(id)]).then(
    ([details, posts]) => {
      if (!validDetails(details)) throw new Error("Invalid user details received");
      if (!validPosts(posts))     throw new Error("Invalid posts received");
      return { details, posts }; // ACCEPT: both are valid
    }
  ); // REJECT: either operation failed OR a validation above threw
}

/* ---------- demo ---------- */
async function main(log = console.log) {
  const cases = [
    { label: "User 1 -> both valid", id: 1 },
    { label: "User 2 -> empty name & no posts (invalid)", id: 2 },
    { label: "User 7 -> does not exist (operations fail)", id: 7 },
  ];

  for (const c of cases) {
    log(`> ${c.label}`);
    const t0 = Date.now();
    try {
      const result = await loadUserDashboard(c.id);
      log(`  ACCEPTED (${Date.now() - t0}ms): ${result.details.name} with ${result.posts.length} posts`);
      result.posts.forEach((p) => log(`     - [${p.id}] ${p.title}`));
    } catch (err) {
      log(`  REJECTED (${Date.now() - t0}ms): ${err.message}`);
    }
    log("");
  }
}

if (typeof module !== "undefined") module.exports = { loadUserDashboard, main };
if (typeof window !== "undefined") window.Task2 = { loadUserDashboard, main };
if (typeof require !== "undefined" && require.main === module) main();
