"""
Predelix — Delivery Data Processing Pipeline
Cloud Dataflow pipeline for processing customer delivery CSV data
Reads from Cloud Storage → Validates → Normalizes → Writes to BigQuery
"""
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions, SetupOptions
from apache_beam.io.gcp.bigquery import WriteToBigQuery
import argparse
import logging
import re
import uuid
from datetime import datetime


class ParseDeliveryCSV(beam.DoFn):
    """Parse and validate delivery customer CSV rows."""

    def process(self, line):
        try:
            if line.startswith('name') or line.startswith('Name'):
                return

            parts = line.strip().split(',')
            if len(parts) < 2:
                logging.warning(f'Skipping malformed row: {line}')
                return

            name = parts[0].strip()
            mobile_number = parts[1].strip()
            address = parts[2].strip() if len(parts) > 2 else None

            # Validate phone number
            if not self._validate_phone(mobile_number):
                logging.warning(f'Invalid phone number for {name}: {mobile_number}')

            row = {
                'id': str(uuid.uuid4()),
                'name': name,
                'mobile_number': mobile_number,
                'address': address,
                'status': 'pending',
                'preferred_time': None,
                'delivery_instructions': None,
                'uploaded_at': datetime.utcnow().isoformat()
            }

            yield row

        except Exception as e:
            logging.error(f'Error parsing row: {line}, Error: {e}')

    def _validate_phone(self, phone):
        """Check if phone number is in E.164 format."""
        return bool(re.match(r'^\+?[1-9]\d{1,14}$', phone.replace(' ', '').replace('-', '')))


class EnrichWithBatchId(beam.DoFn):
    """Add batch ID to each row."""

    def __init__(self, batch_id):
        self.batch_id = batch_id

    def process(self, row):
        row['batch_id'] = self.batch_id
        yield row


def run(argv=None):
    parser = argparse.ArgumentParser(description='Predelix Delivery Processing Pipeline')
    parser.add_argument('--input', required=True, help='GCS path to input CSV')
    parser.add_argument('--output_table', required=True, help='BigQuery output table')
    parser.add_argument('--batch_id', required=True, help='Batch identifier')
    parser.add_argument('--temp_location', required=True, help='GCS temp location')

    known_args, pipeline_args = parser.parse_known_args(argv)

    pipeline_options = PipelineOptions(pipeline_args)
    pipeline_options.view_as(SetupOptions).save_main_session = True

    table_schema = {
        'fields': [
            {'name': 'id', 'type': 'STRING', 'mode': 'REQUIRED'},
            {'name': 'name', 'type': 'STRING', 'mode': 'REQUIRED'},
            {'name': 'mobile_number', 'type': 'STRING', 'mode': 'REQUIRED'},
            {'name': 'address', 'type': 'STRING'},
            {'name': 'status', 'type': 'STRING'},
            {'name': 'preferred_time', 'type': 'STRING'},
            {'name': 'delivery_instructions', 'type': 'STRING'},
            {'name': 'uploaded_at', 'type': 'TIMESTAMP'},
            {'name': 'batch_id', 'type': 'STRING'},
        ]
    }

    with beam.Pipeline(options=pipeline_options) as p:
        (
            p
            | 'ReadCSV' >> beam.io.ReadFromText(known_args.input, skip_header_lines=1)
            | 'ParseCSV' >> beam.ParDo(ParseDeliveryCSV())
            | 'AddBatchId' >> beam.ParDo(EnrichWithBatchId(known_args.batch_id))
            | 'WriteToBigQuery' >> WriteToBigQuery(
                known_args.output_table,
                schema=table_schema,
                write_disposition=beam.io.BigQueryDisposition.WRITE_APPEND,
                create_disposition=beam.io.BigQueryDisposition.CREATE_IF_NEEDED
            )
        )

    logging.info('Delivery processing pipeline completed.')


if __name__ == '__main__':
    logging.getLogger().setLevel(logging.INFO)
    run()
