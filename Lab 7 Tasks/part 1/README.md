# Lab 07 — Part 1: Student Management System (In-Memory REST API)

**Course**: Full Stack Web Development  
**Student**: Haseeb Jalil  
**Roll No**: 241908 | **Class**: BSCS V-A  
**Instructor**: Hafiz Obaid Ullah  

---

## Overview

This module modifies and extends the uploaded in-memory REST API (`student-api/01-memory-api.js`) into a complete **Student Management System** using pure native Node.js (`node:http`) without external frameworks or dependencies.

### Implemented Modules:
1. **Student** (Full CRUD)
2. **Teacher** (Full CRUD)
3. **Attendance** (Full CRUD)
4. **Marks** (Full CRUD)

---

## Getting Started

### Start the Server:
```bash
node server.js
# Defaults to http://localhost:3004
```

Or run on a custom port:
```bash
PORT=4000 node server.js
```

### Run the Automated Test Suite:
```bash
node test.js
```
Runs 35 automated integration tests verifying each CRUD endpoint, query filters, grade computation, and HTTP error handling.

---

## API Endpoints Reference

### 1. Root & Health
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` or `/health` | System status, live record counts, and endpoint catalog |

---

### 2. Student Module (`/students`)
| Method | Endpoint | Description | Sample Payload |
|---|---|---|---|
| `GET` | `/students` | List all students (optional: `?department=...&name=...`) | N/A |
| `GET` | `/students/:id` | Get student details by ID | N/A |
| `POST` | `/students` | Create new student record | `{"name":"Ali Khan","rollNo":"241950","department":"Computer Science","semester":"5th","email":"ali@students.au.edu.pk"}` |
| `PUT` | `/students/:id` | Full update of existing student | `{"name":"Ali Khan","rollNo":"241950","department":"AI","semester":"6th","email":"ali.khan@students.au.edu.pk"}` |
| `PATCH` | `/students/:id` | Partial update of student | `{"semester":"6th"}` |
| `DELETE` | `/students/:id` | Delete student by ID | N/A |

---

### 3. Teacher Module (`/teachers`)
| Method | Endpoint | Description | Sample Payload |
|---|---|---|---|
| `GET` | `/teachers` | List all faculty members (optional: `?department=...`) | N/A |
| `GET` | `/teachers/:id` | Get teacher details by ID | N/A |
| `POST` | `/teachers` | Add a new teacher | `{"name":"Dr. Tariq","department":"Software Eng","designation":"Associate Prof","email":"tariq@au.edu.pk","phone":"051-9260000"}` |
| `PUT` | `/teachers/:id` | Full update of teacher | `{"name":"Dr. Tariq M.","department":"Software Eng","designation":"Professor","email":"tariq.m@au.edu.pk","phone":"051-9260000"}` |
| `PATCH` | `/teachers/:id` | Partial update of teacher | `{"designation":"Professor"}` |
| `DELETE` | `/teachers/:id` | Delete teacher by ID | N/A |

---

### 4. Attendance Module (`/attendance`)
| Method | Endpoint | Description | Sample Payload |
|---|---|---|---|
| `GET` | `/attendance` | List attendance records (optional: `?studentId=1&date=2026-10-20&status=Present`) | N/A |
| `GET` | `/attendance/:id` | Get attendance record by ID | N/A |
| `POST` | `/attendance` | Mark attendance | `{"studentId":1,"course":"Full Stack Web Dev","date":"2026-10-25","status":"Present","remarks":"On time"}` |
| `PUT` | `/attendance/:id` | Replace attendance record | `{"studentId":1,"course":"Full Stack Web Dev","date":"2026-10-25","status":"Late","remarks":"5 mins late"}` |
| `PATCH` | `/attendance/:id` | Update status or remarks | `{"status":"Late"}` |
| `DELETE` | `/attendance/:id` | Remove attendance record | N/A |

---

### 5. Marks Module (`/marks`)
| Method | Endpoint | Description | Sample Payload |
|---|---|---|---|
| `GET` | `/marks` | List student marks (optional: `?studentId=1&subject=...&examType=...`) | N/A |
| `GET` | `/marks/:id` | Get mark details by ID | N/A |
| `POST` | `/marks` | Record exam/quiz marks (auto-computes grade if omitted) | `{"studentId":1,"subject":"Full Stack Web Dev","examType":"Midterm","score":94,"totalMarks":100}` |
| `PUT` | `/marks/:id` | Full update of marks record | `{"studentId":1,"subject":"Full Stack Web Dev","examType":"Midterm","score":96,"totalMarks":100,"grade":"A+"}` |
| `PATCH` | `/marks/:id` | Partial update of score | `{"score":98}` |
| `DELETE` | `/marks/:id` | Delete marks record | N/A |

---

## Features
- **In-Memory Storage**: Fast, zero database configuration needed.
- **CORS Enabled**: Out of the box support for web clients and landing page explorers.
- **Input Validation**: Strict validation of required fields and data types.
- **Safety**: 64KB maximum payload constraint prevents buffer exhaustion attacks.
- **HTTP Status Codes**: REST compliant responses (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `405 Method Not Allowed`, `413 Payload Too Large`, `500 Internal Server Error`).
