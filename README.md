# Full Stack Web Development — Lab Portfolio

A single-page portfolio of my Full Stack Web Development lab tasks, built for my instructor to open, browse and review each lab from one place. Every lab is a card with a short description and a link to its GitHub repository; clicking a card opens that lab's hosted page.

**Student:** Haseeb Jalil · **Roll no:** 241908 · **Class:** BSCS V-A
**Course:** Full Stack Web Development · **Instructor:** Hafiz Obaid Ullah
**University:** Air University, Islamabad

## Features

- **Welcome widget** — a time-of-day greeting for the instructor.
- **Live clock** — an analog clock plus digital time, date and time zone.
- **Student info card** — name, roll number, class, instructor and university.
- **Lab cards** — one card per completed lab, each with a numbered icon, title, description, GitHub link, and a link to that lab's hosted page.
- **Lab pages** — a details page per lab (student info, course, status, tech used) with previous/next navigation between labs.
- **Light and dark mode** — follows the system theme by default, with a manual toggle that's remembered on return visits.
- **Responsive layout** — works down to phone width with no horizontal scrolling.
- **Accessible** — semantic HTML, visible focus states, skip link, and reduced-motion support.
- **No build step** — plain HTML, CSS and JavaScript; no frameworks, no dependencies, no server required.

## Project structure

```
lab-portfolio/
├── index.html   Page structure and content
├── style.css    Apple-inspired visual design, light/dark themes, layout
├── script.js    Lab data, routing between home and lab pages, clock, theme toggle
└── README.md    This file
```

## Getting started

No installation or build tools are needed.

1. Download or clone the three files (`index.html`, `style.css`, `script.js`) into one folder.
2. Open `index.html` directly in a browser, or serve the folder with any static host (GitHub Pages, Netlify, Vercel, etc.).

## Adding or editing a lab

All editable content lives in one place, at the top of `script.js`:

```js
const CONFIG = {
  timezone: 'Asia/Karachi',
  github: { username: 'hasbeejay', url: 'https://github.com/hasbeejay' },
  student: 'Haseeb Jalil',
  rollNo: '241908',
  className: 'BSCS V-A',
  instructor: 'Hafiz Obaid Ullah',
  course: 'Full Stack Web Development',
};

const LABS = [
  {
    id: 1,
    title: 'Lab Task 1',
    description: '…',
    repo: '',        // full GitHub URL of this lab's repository
    liveUrl: '',      // hosted URL of this lab's page (opens from the card)
    objectives: [],   // optional
    outcome: '',      // optional
    tech: [],         // optional
    date: '',         // optional
    status: 'Completed',
    colors: ['#5ac8fa', '#0a84ff'],
  },
  // …
];
```

- **`repo`** — link to the lab's GitHub repository. While empty, the GitHub button falls back to the profile link so it never breaks.
- **`liveUrl`** — link to the lab's hosted page. While empty, the card opens the built-in task-details page instead.
- To add a new lab, copy one object and give it the next `id` — the card, its page, the "labs completed" count, and the previous/next links all update automatically.

## Built with

HTML5 · CSS3 (custom properties, Grid, Flexbox) · Vanilla JavaScript (no frameworks or build tools)

## License

Personal academic coursework, shared for review by my instructor. Feel free to reference the structure for your own lab portfolio.