# Job Scoring Web App (V1)

This project deploys a **serverless web application on AWS** that allows a user to:

- authenticate with Cognito
- upload and manage resumes
- submit job URLs for scoring
- view submitted jobs in a dashboard

Version 1 **does not perform AI scoring**.  
Submitted jobs appear with status **Pending**.

Future versions will add:

- job extraction
- AI scoring
- asynchronous processing

---

# Architecture Overview

The application uses a fully serverless architecture.

```
Browser
   │
   ▼
S3 Static Web App
   │
   ▼
API Gateway
   │
   ▼
Lambda API
   │
   ├── DynamoDB (metadata)
   │
   └── S3 Backend Bucket (long-form data)
```

Authentication is handled by **Amazon Cognito**.

---

# AWS Services Used

| Service | Purpose |
|------|------|
| Cognito | User authentication |
| S3 | Frontend hosting and backend object storage |
| API Gateway | REST API endpoints |
| Lambda | Backend application logic |
| DynamoDB | Metadata storage |
| IAM | Service permissions |
| CloudWatch | Logging |

---

# Project Layout

The repository follows the same layout as other Quick Start projects.

```
.
├── 01-core
│   ├── backend.tf
│   ├── providers.tf
│   ├── variables.tf
│   ├── iam.tf
│   ├── cognito.tf
│   ├── dynamodb.tf
│   ├── lambda.tf
│   ├── api_gateway.tf
│   ├── s3_frontend.tf
│   ├── s3_backend.tf
│   └── outputs.tf
│
├── 02-scoring
│   ├── deploy.sh
│   ├── destroy.sh
│   └── package_lambda.sh
|
├── 03-lambdas
│   ├── deploy.sh
│   ├── destroy.sh
│   └── package_lambda.sh
│
├── 04-webapp
│   ├── index.html
│   ├── app.js
│   └── styles.css
│
├── validate.sh
└── README.md
```

---

# Infrastructure Components

## Cognito

Resources created:

- User Pool
- User Pool Client
- User Pool Domain

Purpose:

- authenticate users
- issue JWT tokens
- associate data with a user ID

---

## Public Frontend S3 Bucket

Hosts the static web application.

Resources:

- S3 bucket
- public read policy
- static website configuration

Contents:

```
index.html
app.js
styles.css
```

---

## Private Backend S3 Bucket

Stores long-form user data.

Public access must be **blocked**.

Resources:

- S3 bucket
- block public access
- server-side encryption

### Object Layout

```
/users/<user_id>/resumes/<resume_id>/resume.txt
/users/<user_id>/jobs/<job_id>/job.json
```

Example:

```
/users/user123/resumes/resume01/resume.txt
/users/user123/jobs/job42/job.json
```

---

## API Gateway

Provides the REST API interface.

Resources:

- HTTP API
- routes
- stage
- Cognito authorizer
- CORS configuration

Example routes:

```
GET /resumes
POST /resumes
PUT /resumes/{resume_id}
DELETE /resumes/{resume_id}

GET /jobs
POST /jobs
GET /jobs/{job_id}
DELETE /jobs/{job_id}
```

---

## Lambda

Implements backend application logic.

Resources:

- Lambda function
- IAM execution role
- CloudWatch log group

Responsibilities:

- resume CRUD operations
- job submission
- job listing for dashboard
- job detail retrieval
- deletion operations

V1 uses **one Lambda API function** for simplicity.

---

## DynamoDB

Stores application metadata.

### Resume Metadata

```
resume_id
user_id
resume_name
resume_s3_key
created_at
updated_at
```

### Job Metadata

```
job_id
user_id
resume_id
resume_name
job_title
company
job_url
status
score
job_s3_key
created_at
updated_at
```

Only metadata is stored in DynamoDB.

Full objects are stored in S3.

---

## IAM

IAM roles allow services to interact securely.

Resources:

- Lambda execution role
- DynamoDB access policy
- S3 backend bucket access policy
- CloudWatch logging policy
- API Gateway invoke permission

---

## CloudWatch

Used for application logging.

Resources:

- Lambda log groups

Purpose:

- debugging
- API monitoring
- operational visibility

---

# Deployment Order

Infrastructure should be deployed in the following order.

```
1 IAM roles
2 DynamoDB table
3 Backend S3 bucket
4 Lambda function
5 Cognito User Pool
6 API Gateway
7 Frontend S3 bucket
```

---

# V1 Behavior

Users can:

- log in
- manage resumes
- submit job URLs
- view submitted jobs
- open job details

Submitted jobs appear in the dashboard with status:

```
Pending
```

---

# Future Enhancements

Future versions will introduce:

```
SQS job queue
AI scoring with Bedrock
job description extraction
company extraction
asynchronous processing pipeline
```