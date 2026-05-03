# Video Script — Secure your Serverless API in AWS (Cognito + API Gateway)

---

## Introduction

[ Show LinkedIn scoring ]

Most AI resume tools score one job at a time.

[ Other Job Platforms ]

But real job searches don’t work like that — you’re tracking dozens across multiple sites.

[ Dashboard ]

In this project, we build an AI-powered dashboard to upload your resume, track applications, and score every job in one place.

[ B Roll ]

Follow along and build a complete serverless AI app on AWS using Bedrock, Lambda, and SQS.

---

## Architecture

[ Full diagram ]

"Let's walk through the architecture before we build."

[ Diagram then Congito ]

"First, the user signs into the web application using Cognito."

[ Choose File then Diagam ]

"When the user selects “Choose File”, the image is uploaded to an S3 bucket."

[  Cartoonify ]

When the user selects “Cartoonify”, the API does two things:

[ Highlight Dynamo DB]

It creates a job record in DynamoDB

[ Highlight SQS queue ]

Then it sends a message to the image processing SQS queue.

[ Highlight Lambda ]

"SQS triggers the worker Lambda."

[ Show bedrock ]

"The worker Lambda calls Bedrock to generate the cartoon."

[ Show S3 Media Bucket]

"The generated image is written back to S3".

[ Final Dynamo DB State]

When processing completes, the job status is updated in DynamoDB.

[ Show final result ]

The web application refreshes and displays the generated image.

---

## Build Results

[ Show Buckets ]

Three storage buckets are created for this project.

[ Web Bucket ]

The first bucket hosts the public web application.

[ Media Bucket]

The second bucket stores the uploaded source images and generated cartoons.

[ CLoud Functions Bucket ]

The third bucket stores the Cloud Functions source code.

[ Show Identity ]

Identity and access are handled by Google Identity Platform and API Gateway.

[Show Cloud Functions] 

The serverless API is implemented with Python Cloud Functions.

[ Pub/Sub]

The image generation pipeline is driven by a Pub Sub topic.

[ Fire Store ]

Firestore stores the status of each image generation job.

[ Show Worker Function ]

When a message is processed, the worker function calls Vertex AI to generate the cartoon image.

[ Show Media Bucket ]

The generated image is written back to the media bucket.

[ Show Firestore completion record]

The Firestore job record is updated to complete.

[ Show Web Application ]

When the application refreshes, the generated results are displayed.

---

## Demo

[ Time 0 ]

"Navigate to the web application URL"

[ Clicking Login — Cognito Hosted UI opens ]

"Sign in using Cognito."

[ Choose File ]

"Once signed in, select “Choose File” and upload a test image."

[ Pencil Sketch]

"Select the “Pencil Sketch” style, then click “Cartoonify” to start the image generation pipeline."

[ Show Life Cycle ]

"The application displays the image generation lifecycle."

[ Show Results ]

"When processing completes, the application refreshes and shows the result."

[ Show Styles ]

"Now try some different styles. 

[ Show Gallery ]
The application displays a gallery of your previous results."

---
