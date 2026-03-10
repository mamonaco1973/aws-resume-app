# Job Scoring Web App — V1 Design Specification

## Purpose

This document defines the **Version 1 design** for a serverless web application that allows a user to:

- Manage resumes
- Submit job URLs for scoring
- View scored job results

**Important**

Version 1 does **not perform real scoring**. When a job is submitted, the system creates a record with status **Pending**.

Future versions will add asynchronous processing and AI scoring.

---

# System Overview

The application consists of five core capabilities:

1. Authentication
2. Resume management
3. Job submission
4. Dashboard displaying scored jobs
5. Job details view

The system is designed so the **entire workflow functions without the scoring engine**.

The only missing functionality in V1 is the scoring process.

---

# Core User Interface

## 1. Login Screen

Users authenticate before accessing the application.

After login, users land on the **Dashboard**.

---

# Main Application Screens

## 2. Dashboard (Primary Screen)

The dashboard displays a list of all job scoring requests created by the user.

### Dashboard Columns

| Column | Description |
|------|-------------|
| Job Title | Title of the job posting. May be user-supplied or `TBD` in V1 |
| Company | Company name extracted later by AI. `TBD` in V1 |
| Score | Numeric score (1–100). Empty in V1 |
| Status | Processing state. `Pending` in V1 |
| Resume Used | Resume used for scoring |
| Submitted | Date job was submitted |

### Example Dashboard

| Job Title | Company | Score | Status | Resume Used | Submitted |
|-----------|---------|-------|--------|-------------|-----------|
| Senior Cloud Architect | TBD | | Pending | Main Resume | Mar 10 |
| DevOps Engineer | TBD | | Pending | Consulting Resume | Mar 9 |

### Dashboard Actions

Users can:

- Click a job title to open job details
- Delete a job record
- Sort by score
- Sort by submission date
- Open **Score Job** dialog
- Open **Resume Manager**

### Status Values

In V1:

```text
Pending
```

Future versions may include:

```text
Fetching
Processing
Completed
Failed
```

---

# 3. Job Details Screen

The job details screen shows the full information for a specific job request.

### Fields Displayed

- Job Title
- Company
- Job URL
- Resume Used
- Score
- Extracted Job Description
- Explanation of Score
- Status
- Date Submitted

### V1 Behavior

These fields may not yet be populated in V1:

```text
company
score
job_description
explanation
```

Recommended placeholder behavior in V1:

```text
company = "TBD"
score = null
job_description = "TBD"
explanation = ""
```

Status remains:

```text
Pending
```

---

# 4. Resume Management Screen

The resume manager allows users to maintain a library of resumes.

### Resume Fields

- Resume Name
- Resume Text
- Created Date
- Updated Date

### Resume Actions

Users can:

- Upload new resume (text format)
- Rename resume
- Update resume text
- Delete resume
- View resume text

---

# 5. Score Job Dialog

This dialog allows a user to submit a job for scoring.

### Fields

```text
Resume (dropdown)
Job URL (text input)
Optional Job Title (text input)
```

### Behavior

1. User selects a resume
2. User enters job URL
3. User optionally enters a job title
4. User clicks Submit
5. System creates a job record
6. Status is set to **Pending**
7. Record appears immediately in the dashboard

### V1 Field Defaults at Submission

```text
job_title = optional user input or "TBD"
company = "TBD"
status = "Pending"
score = null
job_description = "TBD"
explanation = ""
```

---

# Resume Dependency Rule

Users **cannot score a job unless at least one resume exists**.

If no resumes exist:

- Score Job button is disabled
- Message shown:

```text
Upload a resume to start scoring jobs
```

---

# Data Model

Two core objects exist in the system.

---

# Resume Object

Fields:

```text
resume_id
user_id
resume_name
resume_text
created_at
updated_at
```

---

# Job Object

Fields:

```text
job_id
user_id
resume_id
resume_name
job_url
job_title
company
status
score
job_description
explanation
created_at
updated_at
```

### Default Values (V1)

When a job record is created:

```text
job_title = optional user input or "TBD"
company = "TBD"
status = "Pending"
score = null
job_description = "TBD"
explanation = ""
```

---

# User Workflows

## First-Time User

```text
Login
Dashboard shows no jobs
Prompt appears to upload resume
User opens Resume Manager
User uploads resume
Score Job button becomes enabled
```

---

## Normal Workflow

```text
Login
Dashboard shows previous jobs
User clicks Score Job
User selects resume and enters job URL
User optionally enters job title
Job record created with Pending status
Job appears in dashboard
User can open job details
```

---

# V1 Functional Scope

The following features are fully implemented:

```text
User login
Resume CRUD operations
Job submission
Dashboard job listing
Job details view
Sorting of job list
Deletion of job records
Deletion of resumes
```

---

# V1 Non-Implemented Features

The following features are intentionally excluded:

```text
AI scoring
Job description extraction
Company extraction
Async job processing
Queue processing
Retry logic
```

---

# Future Version Features

Future versions may introduce:

```text
SQS job processing
AI scoring using Bedrock
Automatic job title extraction
Automatic company extraction
Automatic job description extraction
Job processing lifecycle
Score explanation generation
```

---

# V1 Completion Criteria

The system is complete when:

```text
Users can log in
Users can manage resumes
Users cannot score jobs without a resume
Users can submit job URLs
A job record is created with status Pending
The job appears in the dashboard
The job opens in the details page
Users can delete jobs
Users can sort jobs
```

---

# Summary

Version 1 establishes the **entire application structure and workflow** while replacing the scoring engine with a placeholder.

The system behaves exactly like the final application except that:

```text
Job submissions create Pending records instead of running scoring logic
```

In V1, fields that will later be populated by AI are initialized with placeholders such as `TBD`, `null`, or empty text.

This allows scoring functionality to be added later without changing the user interface or data model.