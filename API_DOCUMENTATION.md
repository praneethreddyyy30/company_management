# KLASSYGO Internship HRM Platform - API Documentation

This document provides a comprehensive reference for all backend API endpoints of the KLASSYGO Insights Hub & HRM Engine.

## Base URL
All API requests are routed through:
```
http://localhost:5000/api
```

## Authentication & Authorization
Most endpoints require authentication. Authenticate by including the JWT token in your request headers:
```http
Authorization: Bearer <your_jwt_token>
```

### Role Authorization Matrix
* **Lead**: Full access to create, read, update, and delete all resources (interns, batches, tasks, leave approvals, evaluations, certificates, and offer letters).
* **Intern**: Restricted access. Can submit standups, clock-in attendance, apply for leave, read announcements, and view/download their own profile, tasks, evaluations, and certificates.

---

## 1. Authentication Module

### Register User
* **Endpoint:** `POST /api/auth/register`
* **Auth Required:** No
* **Request Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@klassygo.com",
    "password": "securepassword123",
    "role": "Intern",
    "department": "Technology",
    "avatar": "JD",
    "batchId": "60c72b2f9b1d8a2388888888", // Required if role is Intern
    "track": "Frontend",                   // Required if role is Intern
    "startDate": "2026-01-01",             // Required if role is Intern
    "endDate": "2026-06-30"                // Required if role is Intern
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "message": "User registered successfully.",
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "60c72b2f9b1d8a2388888889",
      "name": "Jane Doe",
      "email": "jane@klassygo.com",
      "role": "Intern",
      "department": "Technology",
      "avatar": "JD"
    }
  }
  ```

### Login
* **Endpoint:** `POST /api/auth/login`
* **Auth Required:** No
* **Request Body:**
  ```json
  {
    "email": "lead@klassygo.com",
    "password": "password123"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "message": "Login successful.",
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "60c72b2f9b1d8a2388888888",
      "name": "Vikram Iyer",
      "email": "lead@klassygo.com",
      "role": "Lead",
      "department": "Technology",
      "avatar": "VI",
      "joinedAt": "2024-01-15T00:00:00.000Z"
    }
  }
  ```

### Get Current User
* **Endpoint:** `GET /api/auth/me`
* **Auth Required:** Yes
* **Response (200 OK):**
  ```json
  {
    "user": {
      "id": "60c72b2f9b1d8a2388888888",
      "name": "Vikram Iyer",
      "email": "lead@klassygo.com",
      "role": "Lead",
      "department": "Technology",
      "avatar": "VI"
    }
  }
  ```

---

## 2. Intern Management Module

### List Interns
* **Endpoint:** `GET /api/interns`
* **Auth Required:** Yes
* **Query Parameters (Leads only):** `batchId`, `track`, `status`, `q` (search name/email filter).
* **Role Behavior:**
  * **Lead:** Returns all matching interns in the system.
  * **Intern:** Returns only their own populated intern card in a single-element list.
* **Response (200 OK):**
  ```json
  [
    {
      "_id": "60c72b2f9b1d8a2388888812",
      "userId": {
        "_id": "60c72b2f9b1d8a2388888801",
        "name": "Sneha Reddy",
        "email": "intern@klassygo.com",
        "role": "Intern",
        "department": "Technology",
        "avatar": "SR"
      },
      "batchId": {
        "_id": "60c72b2f9b1d8a2388888800",
        "name": "Winter 2026 Batch"
      },
      "track": "Frontend",
      "mentor": "Vikram Iyer",
      "status": "active",
      "avatar": "SR",
      "startDate": "2026-01-01T00:00:00.000Z",
      "endDate": "2026-06-30T00:00:00.000Z",
      "taskCompletionPercentage": 45,
      "attendancePercentage": 88,
      "performance": 82,
      "lmsProgress": 60,
      "tasksCompleted": 3,
      "onboarding": {
        "completed": false,
        "checklist": {
          "profileCompleted": false,
          "guideRead": false,
          "tasksReviewed": false,
          "standupSubmitted": false,
          "attendanceMarked": false
        }
      }
    }
  ]
  ```

### Create Intern (Lead Only)
* **Endpoint:** `POST /api/interns`
* **Auth Required:** Yes (Lead)
* **Request Body:** Same fields as User registration for Interns (name, email, track, batchId, startDate, endDate, mentor).
* **Response (201 Created):** Returns populated intern object.

### Update Intern (Lead Only)
* **Endpoint:** `PUT /api/interns/:id`
* **Auth Required:** Yes (Lead)
* **Request Body:** Partial update object (`name`, `track`, `status`, `lmsProgress`, etc.)
* **Response (200 OK):** Returns updated intern object.

### Delete Intern (Lead Only)
* **Endpoint:** `DELETE /api/interns/:id`
* **Auth Required:** Yes (Lead)
* **Response (200 OK):** `{"message": "Intern and associated user account deleted successfully."}`

### Get Onboarding Checklist (Intern Only)
* **Endpoint:** `GET /api/interns/me/onboarding`
* **Auth Required:** Yes (Intern)
* **Response (200 OK):**
  ```json
  {
    "completed": false,
    "checklist": {
      "profileCompleted": false,
      "guideRead": false,
      "tasksReviewed": false,
      "standupSubmitted": false,
      "attendanceMarked": false
    }
  }
  ```

### Complete Onboarding Step (Intern Only)
* **Endpoint:** `POST /api/interns/me/onboarding/complete-step`
* **Auth Required:** Yes (Intern)
* **Request Body:** `{"step": "guideRead"}` (Steps: `profileCompleted`, `guideRead`, `tasksReviewed`)
* **Response (200 OK):** Returns updated onboarding state.

---

## 3. Batch Management Module

### List Batches
* **Endpoint:** `GET /api/batches`
* **Auth Required:** Yes
* **Response (200 OK):** List of batch schema records.

### Create Batch (Lead Only)
* **Endpoint:** `POST /api/batches`
* **Auth Required:** Yes (Lead)
* **Request Body:** `{"name": "Spring 2026", "startDate": "2026-03-01", "endDate": "2026-08-31"}`
* **Response (201 Created):** Created batch object.

---

## 4. Task Management Module

### List Tasks
* **Endpoint:** `GET /api/tasks`
* **Auth Required:** Yes
* **Role Behavior:**
  * **Lead:** Returns all tasks in the system.
  * **Intern:** Returns only tasks assigned to the current intern.
* **Response (200 OK):** List of task records.

### Create Task (Lead Only)
* **Endpoint:** `POST /api/tasks`
* **Auth Required:** Yes (Lead)
* **Request Body:**
  ```json
  {
    "title": "Setup Helmet Headers",
    "assignedTo": "60c72b2f9b1d8a2388888801", // User ID
    "priority": "high",
    "dueDate": "2026-06-30T12:00:00.000Z",
    "module": "Engineering"
  }
  ```

---

## 5. Daily Standups Module

### Submit Daily Standup
* **Endpoint:** `POST /api/standups`
* **Auth Required:** Yes (Intern)
* **Request Body:**
  ```json
  {
    "yesterdayWork": "Finished backup implementation.",
    "todayPlan": "Test search routes.",
    "blockers": "None",
    "mood": "productive",
    "completionPercentage": 90
  }
  ```
* **Response (201 Created):** Populated standup object. Marks onboarding `standupSubmitted` checklist step.

### Fetch Standups
* **Endpoint:** `GET /api/standups` (Leads: list all standups)
* **Endpoint:** `GET /api/standups/:internId` (Fetch standups for a specific intern. Interns can only query their own ID).

---

## 6. Attendance Module

### Clock In Check-in
* **Endpoint:** `POST /api/attendance/check-in`
* **Auth Required:** Yes (Intern)
* **Response (201 Created):**
  ```json
  {
    "_id": "60c72b2f9b1d8a2388888999",
    "internId": "60c72b2f9b1d8a2388888801",
    "date": "2026-06-25T00:00:00.000Z",
    "checkIn": "2026-06-25T10:05:00.000Z",
    "status": "Late", // Late if checked in after WORK_START_TIME, else Present
    "totalHours": 0
  }
  ```
  *Also marks onboarding `attendanceMarked` checklist step.*

### Clock Out Check-out
* **Endpoint:** `POST /api/attendance/check-out`
* **Auth Required:** Yes (Intern)
* **Response (200 OK):** Updated attendance object with `checkOut` timestamp and calculated `totalHours`.

### Get Heatmap Matrix
* **Endpoint:** `GET /api/attendance/heatmap`
* **Auth Required:** Yes
* **Response (200 OK):** 5x7 matrix (Days of week by hours) aggregating check-ins and standups over the last 12 months for heatmap rendering.

---

## 7. Leave Requests Module

### Apply for Leave
* **Endpoint:** `POST /api/leaves`
* **Auth Required:** Yes (Intern)
* **Request Body:** `{"type": "sick", "fromDate": "2026-07-01", "toDate": "2026-07-02", "reason": "Resting"}`
* **Response (201 Created):** Created leave request record.

### Update Leave Status (Lead Only)
* **Endpoint:** `PUT /api/leaves/:id/status`
* **Auth Required:** Yes (Lead)
* **Request Body:** `{"status": "Approved"}` (Or `Rejected`)
* **Response (200 OK):** Returns updated leave request. If approved, automatically marks attendance status as "Leave" for those days.

---

## 8. AI Performance Module

### Get AI Performance Summary
* **Endpoint:** `GET /api/ai-performance/:internId`
* **Auth Required:** Yes (Interns can only request their own)
* **Response (200 OK):**
  ```json
  {
    "internId": "60c72b2f9b1d8a2388888801",
    "summaryDate": "2026-06-25T00:00:00.000Z",
    "progressMade": "Intern completed core middleware setup and task updates.",
    "patternsObserved": "Consistent productive mood with good task progress.",
    "recommendations": "Focus on refining error handling logic in controller streams."
  }
  ```

### Force Regeneration (Lead Only)
* **Endpoint:** `POST /api/ai-performance/:internId/regenerate`
* **Auth Required:** Yes (Lead)
* **Response (200 OK):** Re-runs AI summary generation against the last 7 standups and returns the updated summary document.

---

## 9. Documents Module (Certificates & Offer Letters)

### Get Certificate Eligibility (Intern Only)
* **Endpoint:** `GET /api/certificates/eligibility`
* **Auth Required:** Yes (Intern)
* **Response (200 OK):**
  ```json
  {
    "eligible": true,
    "metrics": {
      "status": "active",
      "taskCompletionPercentage": 90,
      "attendancePercentage": 95,
      "minCompletion": 85,
      "minAttendance": 80
    }
  }
  ```

### Request Certificate (Intern Only)
* **Endpoint:** `POST /api/certificates/request`
* **Response (201 Created):** Creates certificate request in `Pending` state.

### Process Certificate Request (Lead Only)
* **Endpoint:** `PUT /api/certificates/:id/approve` (Request Body: `{"grade": "A+"}`)
* **Endpoint:** `PUT /api/certificates/:id/reject` (Request Body: `{"reason": "Incomplete work"}`)

### Download Certificate PDF
* **Endpoint:** `GET /api/certificates/download/:id`
* **Auth Required: Yes** (Interns can only download their own)
* **Response:** Streams PDF file back to browser for download.

---

## 10. Global Search Module

### Search Database
* **Endpoint:** `GET /api/search?q=<query>`
* **Auth Required:** Yes
* **Role Behavior:**
  * **Lead:** Searches all Interns (User name/email or track), Tasks (title), Batches (name), and Announcements.
  * **Intern:** Restricts searches to their own profile, their batch, tasks assigned to them, and announcements.
* **Response (200 OK):** Grouped list of search results.

---

## 11. Health & Dashboard Modules

### Get System Health
* **Endpoint:** `GET /api/health`
* **Response (200 OK):** Status checks for MongoDB, Socket.io client connections, and AI provider configurations.

### Get Dashboard Aggregates
* **Endpoint:** `GET /api/dashboard`
* **Response (200 OK):** Quick statistics counts (active interns, pending tasks, unread notifications) and recent activity logs.

---

## 12. Policy & Evaluation & Candidate Modules

### Get Candidate Pipeline (Lead Only)
* **Endpoint:** `GET /api/candidates`
* **Response (200 OK):** Returns all candidates in the acquisition funnel.

### Update Candidate Pipeline Stage (Lead Only)
* **Endpoint:** `PUT /api/candidates/:id/stage`
* **Request Body:** `{"stage": "interview"}` (Stages: `applied`, `screening`, `interview`, `offer`, `onboarded`)

### Get Performance Evaluations
* **Endpoint:** `GET /api/evaluations`
* **Response (200 OK):** Returns list of performance reviews.

### Get Policy List
* **Endpoint:** `GET /api/policies`
* **Response (200 OK):** Returns catalog list of corporate compliance policy sheets.
