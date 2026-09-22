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
├── style.css    Visual design, light/dark themes, layout
├── script.js    Lab data, routing between home and lab pages, clock, theme toggle
└── README.md    This file
```

## Built with

HTML5 · CSS3 (custom properties, Grid, Flexbox) · Vanilla JavaScript (no frameworks or build tools)

## License

Personal academic coursework, shared for review by my instructor. Feel free to reference the structure for your own lab portfolio.