"""
Predelix — Sales Data Ingestion Pipeline
Cloud Dataflow (Apache Beam) pipeline for processing sales CSV data
Reads from Cloud Storage → Validates → Feature Engineers → Writes to BigQuery
"""
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions, SetupOptions
from apache_beam.io.gcp.bigquery import WriteToBigQuery
import argparse
import json
import logging
from datetime import datetime
import uuid


class ParseSalesCSV(beam.DoFn):
    """Parse and validate sales CSV rows."""

    def process(self, line):
        try:
            # Skip header
            if line.startswith('store_id') or line.startswith('Store'):
                return

            parts = line.strip().split(',')
            if len(parts) < 5:
                logging.warning(f'Skipping malformed row: {line}')
                return

            store_id, product_id, date_str, sales, stock = parts[:5]

            # Validate and parse
            row = {
                'id': str(uuid.uuid4()),
                'store_id': str(store_id).strip(),
                'product_id': str(product_id).strip(),
                'date': date_str.strip(),
                'sales': int(float(sales)),
                'stock': int(float(stock)),
                'ingested_at': datetime.utcnow().isoformat()
            }

            yield row

        except Exception as e:
            logging.error(f'Error parsing row: {line}, Error: {e}')


class AddFeatures(beam.DoFn):
    """Add date-based features for ML training."""

    def process(self, row):
        try:
            from datetime import datetime as dt

            date = dt.strptime(row['date'], '%Y-%m-%d')
            row['day_of_week'] = date.weekday()
            row['month'] = date.month

            # Note: Rolling averages and lag features require windowed processing
            # These are computed in the feature_engineering pipeline
            row['rolling_avg_7d'] = None
            row['lag_1d'] = None
            row['lag_7d'] = None

            yield row
        except Exception as e:
            logging.error(f'Error adding features: {e}')
            yield row


def run(argv=None):
    parser = argparse.ArgumentParser(description='Predelix Sales Ingestion Pipeline')
    parser.add_argument('--input', required=True, help='GCS path to input CSV (gs://bucket/path)')
    parser.add_argument('--output_table', required=True, help='BigQuery output table (project:dataset.table)')
    parser.add_argument('--temp_location', required=True, help='GCS temp location')

    known_args, pipeline_args = parser.parse_known_args(argv)

    pipeline_options = PipelineOptions(pipeline_args)
    pipeline_options.view_as(SetupOptions).save_main_session = True

    # BigQuery schema
    table_schema = {
        'fields': [
            {'name': 'id', 'type': 'STRING', 'mode': 'REQUIRED'},
            {'name': 'store_id', 'type': 'STRING', 'mode': 'REQUIRED'},
            {'name': 'product_id', 'type': 'STRING', 'mode': 'REQUIRED'},
            {'name': 'date', 'type': 'DATE', 'mode': 'REQUIRED'},
            {'name': 'sales', 'type': 'INT64', 'mode': 'REQUIRED'},
            {'name': 'stock', 'type': 'INT64', 'mode': 'REQUIRED'},
            {'name': 'day_of_week', 'type': 'INT64'},
            {'name': 'month', 'type': 'INT64'},
            {'name': 'rolling_avg_7d', 'type': 'FLOAT64'},
            {'name': 'lag_1d', 'type': 'INT64'},
            {'name': 'lag_7d', 'type': 'INT64'},
            {'name': 'ingested_at', 'type': 'TIMESTAMP'},
        ]
    }

    with beam.Pipeline(options=pipeline_options) as p:
        (
            p
            | 'ReadCSV' >> beam.io.ReadFromText(known_args.input, skip_header_lines=1)
            | 'ParseCSV' >> beam.ParDo(ParseSalesCSV())
            | 'AddFeatures' >> beam.ParDo(AddFeatures())
            | 'WriteToBigQuery' >> WriteToBigQuery(
                known_args.output_table,
                schema=table_schema,
                write_disposition=beam.io.BigQueryDisposition.WRITE_APPEND,
                create_disposition=beam.io.BigQueryDisposition.CREATE_IF_NEEDED
            )
        )

    logging.info('Sales ingestion pipeline completed.')


if __name__ == '__main__':
    logging.getLogger().setLevel(logging.INFO)
    run()
