import json
import boto3
import os
import uuid
from datetime import datetime
from boto3.dynamodb.conditions import Key

table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])


def create_resume(event):

    body = json.loads(event["body"])
    resume_text = body["resume"]

    resume_id = str(uuid.uuid4())

    item = {
        "pk": "USER#demo",
        "sk": f"RESUME#{resume_id}",
        "resume_text": resume_text,
        "created_at": datetime.utcnow().isoformat()
    }

    table.put_item(Item=item)

    return {
        "statusCode": 200,
        "body": json.dumps({"resume_id": resume_id})
    }


def list_resumes(event=None):

    response = table.query(
        KeyConditionExpression=Key("pk").eq("USER#demo")
    )

    resumes = [
        i for i in response["Items"]
        if i["sk"].startswith("RESUME#")
    ]

    return {
        "statusCode": 200,
        "body": json.dumps(resumes)
    }