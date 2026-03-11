import json


def create_job(event):

    return {
        "statusCode": 200,
        "body": json.dumps({"message": "job created"})
    }


def list_jobs():

    return {
        "statusCode": 200,
        "body": json.dumps({"jobs": []})
    }