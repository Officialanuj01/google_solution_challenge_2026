"""
Predelix — Pub/Sub → Dataflow Router Pipeline (Streaming)
Listens to Pub/Sub topic for data upload events and triggers
the appropriate Dataflow batch pipeline.

This is a lightweight streaming pipeline that acts as an event router:
  Pub/Sub (sales-data-uploaded) → Parse message → Trigger Dataflow job

Run with DataflowRunner for production.
"""
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions, StandardOptions
import json
import logging
import argparse
import os
import requests
from google.auth import default as google_auth_default
from google.auth.transport.requests import Request


def get_access_token():
    """Get a Google Cloud access token for Dataflow API calls."""
    credentials, project = google_auth_default(
        scopes=['https://www.googleapis.com/auth/cloud-platform']
    )
    credentials.refresh(Request())
    return credentials.token


def submit_dataflow_job(project_id, region, bucket, pipeline_type, input_path=None, dataset='predelix'):
    """Submit a Dataflow Flex Template job via REST API."""
    token = get_access_token()
    template_base = f'gs://{bucket}/templates'
    temp_location = f'gs://{bucket}/dataflow-temp'
    staging_location = f'gs://{bucket}/dataflow-staging'

    import time
    job_name = f'predelix-{pipeline_type.replace("_", "-")}-{int(time.time())}'

    url = (
        f'https://dataflow.googleapis.com/v1b3/projects/{project_id}'
        f'/locations/{region}/flexTemplates:launch'
    )

    template_paths = {
        'sales_ingestion': f'{template_base}/sales_ingestion',
        'feature_engineering': f'{template_base}/feature_engineering',
        'delivery_processing': f'{template_base}/delivery_processing',
    }

    params = {
        'temp_location': temp_location,
        'output_table': f'{project_id}:{dataset}.{pipeline_type.split("_")[0]}_data'
    }
    if input_path:
        params['input'] = input_path
    if pipeline_type == 'feature_engineering':
        params['input_table'] = f'{project_id}:{dataset}.sales_data'
        params['output_table'] = f'{project_id}:{dataset}.ml_features'

    payload = {
        'launchParameter': {
            'jobName': job_name,
            'containerSpecGcsPath': template_paths.get(pipeline_type),
            'parameters': params,
            'environment': {
                'tempLocation': temp_location,
                'stagingLocation': staging_location,
                'machineType': 'n1-standard-2',
                'maxWorkers': 5
            }
        }
    }

    resp = requests.post(
        url,
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
        json=payload,
        timeout=30
    )

    if resp.ok:
        job = resp.json().get('job', {})
        logging.info(f'✅ Dataflow job submitted: {job.get("id")} ({job.get("currentState")})')
        return job
    else:
        logging.error(f'Dataflow submit failed: {resp.status_code} {resp.text}')
        return None


class RouteToDataflow(beam.DoFn):
    """Parse Pub/Sub message and trigger the appropriate Dataflow pipeline."""

    def __init__(self, project_id, region, bucket, dataset):
        self.project_id = project_id
        self.region = region
        self.bucket = bucket
        self.dataset = dataset

    def process(self, element):
        try:
            data = json.loads(element.decode('utf-8'))
            event_type = data.get('eventType') or data.get('type', '')
            gcs_path = data.get('gcsPath') or data.get('fileName', '')

            logging.info(f'Routing event: {event_type}, path: {gcs_path}')

            if 'sales' in event_type.lower():
                submit_dataflow_job(
                    self.project_id, self.region, self.bucket,
                    'sales_ingestion', gcs_path, self.dataset
                )
                yield {'routed_to': 'sales_ingestion', 'input': gcs_path}

            elif 'delivery' in event_type.lower():
                submit_dataflow_job(
                    self.project_id, self.region, self.bucket,
                    'delivery_processing', gcs_path, self.dataset
                )
                yield {'routed_to': 'delivery_processing', 'input': gcs_path}

            elif 'feature' in event_type.lower() or 'prediction' in event_type.lower():
                submit_dataflow_job(
                    self.project_id, self.region, self.bucket,
                    'feature_engineering', None, self.dataset
                )
                yield {'routed_to': 'feature_engineering'}

            else:
                logging.warning(f'Unknown event type, skipping: {event_type}')

        except Exception as e:
            logging.error(f'Error routing message: {e}')


def run(argv=None):
    parser = argparse.ArgumentParser(description='Predelix Pub/Sub → Dataflow Router')
    parser.add_argument('--project_id', required=True, help='GCP Project ID')
    parser.add_argument('--region', default='us-central1', help='GCP region')
    parser.add_argument('--bucket', required=True, help='GCS bucket name (without gs://)')
    parser.add_argument('--dataset', default='predelix', help='BigQuery dataset')
    parser.add_argument('--subscription', required=True,
                        help='Pub/Sub subscription (projects/{proj}/subscriptions/{name})')
    parser.add_argument('--temp_location', required=True)

    known_args, pipeline_args = parser.parse_known_args(argv)

    pipeline_options = PipelineOptions(
        pipeline_args,
        project=known_args.project_id,
        region=known_args.region,
        temp_location=known_args.temp_location
    )
    pipeline_options.view_as(StandardOptions).streaming = True

    with beam.Pipeline(options=pipeline_options) as p:
        (
            p
            | 'ReadPubSub' >> beam.io.ReadFromPubSub(subscription=known_args.subscription)
            | 'RouteToDataflow' >> beam.ParDo(RouteToDataflow(
                known_args.project_id,
                known_args.region,
                known_args.bucket,
                known_args.dataset
            ))
            | 'LogRouting' >> beam.Map(lambda r: logging.info(f'Routed: {r}'))
        )


if __name__ == '__main__':
    logging.getLogger().setLevel(logging.INFO)
    run()
