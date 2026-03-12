# ================================================================================
# Jobs API
#
# Handles CRUD operations for job scoring objects.
#
# Design
# - Job metadata stored in DynamoDB
# - Resume snapshot stored in S3 at job creation
# - Job description stored in S3 when provided as raw text
# - Notes stored in S3 and are the only mutable field
#
# DynamoDB Keys
#   pk = USER#<user_id>
#   sk = JOB#<job_id>
#
# S3 Layout
#   users/USER#<user_id>/jobs/JOB#<job_id>/resume_snapshot.txt
#   users/USER#<user_id>/jobs/JOB#<job_id>/job_description.txt
#   users/USER#<user_id>/jobs/JOB#<job_id>/notes.txt
# ================================================================================

import json
import os
import uuid
from datetime import datetime, timezone

import boto3
from boto3.dynamodb.conditions import Key

# ------------------------------------------------------------------------------
# AWS clients
# ------------------------------------------------------------------------------

table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])
s3 = boto3.client("s3")

BACKEND_BUCKET = os.environ["BACKEND_BUCKET_NAME"]


# ------------------------------------------------------------------------------
# Common helpers
# ------------------------------------------------------------------------------

def utc_now():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def response(code, body):
    return {
        "statusCode": code,
        "body": json.dumps(body)
    }


def get_user_id(event):
    claims = (
        event.get("requestContext", {})
        .get("authorizer", {})
        .get("jwt", {})
        .get("claims", {})
    )

    return claims.get("cognito:username") or claims.get("sub") or "demo"


def get_job_id(event):
    path = event.get("pathParameters") or {}
    return path.get("job_id")


def build_job_paths(user_id, job_id):

    pk = f"USER#{user_id}"
    sk = f"JOB#{job_id}"

    base = f"users/{pk}/jobs/{sk}"

    resume_snapshot_key = f"{base}/resume_snapshot.txt"
    job_description_key = f"{base}/job_description.txt"
    notes_key = f"{base}/notes.txt"

    return pk, sk, resume_snapshot_key, job_description_key, notes_key


def get_resume_item(user_id, resume_id):

    pk = f"USER#{user_id}"
    sk = f"RESUME#{resume_id}"

    result = table.get_item(
        Key={
            "pk": pk,
            "sk": sk
        }
    )

    return result.get("Item")


def get_job_item(user_id, job_id):

    pk = f"USER#{user_id}"
    sk = f"JOB#{job_id}"

    result = table.get_item(
        Key={
            "pk": pk,
            "sk": sk
        }
    )

    return result.get("Item")


# ------------------------------------------------------------------------------
# POST /jobs
#
# Creates a job scoring record.
# ------------------------------------------------------------------------------

def create_job(event):

    user_id = get_user_id(event)

    body = json.loads(event["body"])

    resume_id = body.get("resume_id", "").strip()
    source_type = body.get("source_type", "").strip()
    job_url = body.get("job_url", "").strip()
    job_description = body.get("job_description", "").strip()
    notes = body.get("notes", "").strip()

    if not resume_id:
        return response(400, {"error": "resume_id is required"})

    if source_type not in ["url", "raw_text"]:
        return response(
            400,
            {"error": "source_type must be 'url' or 'raw_text'"}
        )

    if source_type == "url" and not job_url:
        return response(400, {"error": "job_url is required"})

    if source_type == "raw_text" and not job_description:
        return response(400, {"error": "job_description is required"})

    # --------------------------------------------------------------------------
    # Validate resume exists
    # --------------------------------------------------------------------------

    resume_item = get_resume_item(user_id, resume_id)

    if not resume_item:
        return response(404, {"error": "resume not found"})

    resume_s3_key = resume_item["s3_key"]

    # --------------------------------------------------------------------------
    # Create job identifiers and paths
    # --------------------------------------------------------------------------

    job_id = str(uuid.uuid4())

    pk, sk, resume_snapshot_key, job_description_key, notes_key = (
        build_job_paths(user_id, job_id)
    )

    now = utc_now()

    # --------------------------------------------------------------------------
    # Copy resume snapshot into job folder
    # --------------------------------------------------------------------------

    resume_object = s3.get_object(
        Bucket=BACKEND_BUCKET,
        Key=resume_s3_key
    )

    resume_text = resume_object["Body"].read()

    s3.put_object(
        Bucket=BACKEND_BUCKET,
        Key=resume_snapshot_key,
        Body=resume_text,
        ContentType="text/plain"
    )

    # --------------------------------------------------------------------------
    # Store job description when provided as raw text
    # --------------------------------------------------------------------------

    stored_job_description_key = None

    if source_type == "raw_text":
        s3.put_object(
            Bucket=BACKEND_BUCKET,
            Key=job_description_key,
            Body=job_description.encode("utf-8"),
            ContentType="text/plain"
        )
        stored_job_description_key = job_description_key

    # --------------------------------------------------------------------------
    # Store notes when provided
    # --------------------------------------------------------------------------

    stored_notes_key = None

    if notes:
        s3.put_object(
            Bucket=BACKEND_BUCKET,
            Key=notes_key,
            Body=notes.encode("utf-8"),
            ContentType="text/plain"
        )
        stored_notes_key = notes_key

    # --------------------------------------------------------------------------
    # Write metadata
    # --------------------------------------------------------------------------

    table.put_item(
        Item={
            "pk": pk,
            "sk": sk,
            "resume_id": resume_id,
            "resume_snapshot_s3_key": resume_snapshot_key,
            "source_type": source_type,
            "job_url": job_url if source_type == "url" else "",
            "job_description_s3_key": stored_job_description_key,
            "notes_s3_key": stored_notes_key,
            "status": "submitted",
            "job_title": "",
            "company": "",
            "score": None,
            "analysis_s3_key": None,
            "created_at": now,
            "updated_at": now
        }
    )

    return response(
        200,
        {
            "job_id": job_id,
            "status": "submitted"
        }
    )


# ------------------------------------------------------------------------------
# GET /jobs
#
# Returns job metadata for the current user.
# ------------------------------------------------------------------------------

def list_jobs(event=None):

    user_id = get_user_id(event or {})
    pk = f"USER#{user_id}"

    result = table.query(
        KeyConditionExpression=Key("pk").eq(pk)
    )

    jobs = [
        {
            "job_id": item["sk"].replace("JOB#", "", 1),
            "resume_id": item.get("resume_id"),
            "status": item.get("status"),
            "job_title": item.get("job_title"),
            "company": item.get("company"),
            "score": item.get("score"),
            "created_at": item.get("created_at"),
            "updated_at": item.get("updated_at")
        }
        for item in result.get("Items", [])
        if item["sk"].startswith("JOB#")
    ]

    return response(200, jobs)


# ------------------------------------------------------------------------------
# GET /jobs/{job_id}
#
# Returns job metadata and notes.
# ------------------------------------------------------------------------------

def get_job(event):

    user_id = get_user_id(event)
    job_id = get_job_id(event)

    if not job_id:
        return response(400, {"error": "job_id is required"})

    item = get_job_item(user_id, job_id)

    if not item:
        return response(404, {"error": "job not found"})

    notes_text = ""

    if item.get("notes_s3_key"):
        result = s3.get_object(
            Bucket=BACKEND_BUCKET,
            Key=item["notes_s3_key"]
        )
        notes_text = result["Body"].read().decode("utf-8")

    return response(
        200,
        {
            "job_id": job_id,
            "resume_id": item.get("resume_id"),
            "source_type": item.get("source_type"),
            "job_url": item.get("job_url"),
            "status": item.get("status"),
            "job_title": item.get("job_title", ""),
            "company": item.get("company", ""),
            "score": item.get("score"),
            "notes": notes_text,
            "created_at": item.get("created_at"),
            "updated_at": item.get("updated_at")
        }
    )


# ------------------------------------------------------------------------------
# PATCH /jobs/{job_id}/notes
#
# Updates notes only. All other job fields are immutable.
# ------------------------------------------------------------------------------

def update_job_notes(event):

    user_id = get_user_id(event)
    job_id = get_job_id(event)

    if not job_id:
        return response(400, {"error": "job_id is required"})

    body = json.loads(event["body"])
    notes = body.get("notes", "").strip()

    item = get_job_item(user_id, job_id)

    if not item:
        return response(404, {"error": "job not found"})

    pk, sk, _, _, notes_key = build_job_paths(user_id, job_id)

    notes_s3_key = None

    if notes:
        s3.put_object(
            Bucket=BACKEND_BUCKET,
            Key=notes_key,
            Body=notes.encode("utf-8"),
            ContentType="text/plain"
        )
        notes_s3_key = notes_key

    table.update_item(
        Key={
            "pk": pk,
            "sk": sk
        },
        UpdateExpression=(
            "SET notes_s3_key = :notes_s3_key, updated_at = :updated_at"
        ),
        ExpressionAttributeValues={
            ":notes_s3_key": notes_s3_key,
            ":updated_at": utc_now()
        }
    )

    return response(200, {"updated": True})