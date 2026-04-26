"""
Predelix — Feature Engineering Pipeline
Cloud Dataflow pipeline for computing ML features from sales data in BigQuery
Reads from BigQuery → Computes rolling averages, lag features → Writes to BigQuery ml_features table
"""
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions, SetupOptions
from apache_beam.io.gcp.bigquery import ReadFromBigQuery, WriteToBigQuery
import argparse
import logging
from datetime import datetime


class ComputeFeatures(beam.DoFn):
    """Compute ML features for each store-product group."""

    def process(self, element):
        """
        Input: (key, [rows]) where key = (store_id, product_id), rows sorted by date
        """
        key, rows = element
        store_id, product_id = key

        rows = sorted(rows, key=lambda x: x.get('date', ''))

        for i, row in enumerate(rows):
            try:
                # Encode categorical features (simple hash-based encoding)
                store_encoded = hash(store_id) % 10000
                product_encoded = hash(product_id) % 10000

                # Date ordinal
                date = datetime.strptime(str(row['date']), '%Y-%m-%d')
                date_ordinal = date.toordinal()

                # Rolling average (7-day)
                window = rows[max(0, i - 6):i + 1]
                rolling_avg = sum(r.get('sales', 0) for r in window) / len(window)

                # Lag features
                lag_1d = rows[i - 1].get('sales', 0) if i >= 1 else row.get('sales', 0)
                lag_7d = rows[i - 7].get('sales', 0) if i >= 7 else row.get('sales', 0)

                feature_row = {
                    'store_id': store_id,
                    'product_id': product_id,
                    'date': str(row['date']),
                    'store_id_encoded': store_encoded,
                    'product_id_encoded': product_encoded,
                    'date_ordinal': date_ordinal,
                    'sales': int(row.get('sales', 0)),
                    'stock': int(row.get('stock', 0)),
                    'day_of_week': date.weekday(),
                    'month': date.month,
                    'rolling_avg_7d': round(rolling_avg, 2),
                    'lag_1d': lag_1d,
                    'lag_7d': lag_7d,
                    'computed_at': datetime.utcnow().isoformat()
                }

                yield feature_row

            except Exception as e:
                logging.error(f'Error computing features for {store_id}/{product_id}: {e}')


def key_by_store_product(row):
    """Group rows by (store_id, product_id)."""
    return ((row['store_id'], row['product_id']), row)


def run(argv=None):
    parser = argparse.ArgumentParser(description='Predelix Feature Engineering Pipeline')
    parser.add_argument('--input_table', required=True, help='BigQuery input table (project:dataset.table)')
    parser.add_argument('--output_table', required=True, help='BigQuery output table')
    parser.add_argument('--temp_location', required=True, help='GCS temp location')

    known_args, pipeline_args = parser.parse_known_args(argv)

    pipeline_options = PipelineOptions(pipeline_args)
    pipeline_options.view_as(SetupOptions).save_main_session = True

    output_schema = {
        'fields': [
            {'name': 'store_id', 'type': 'STRING', 'mode': 'REQUIRED'},
            {'name': 'product_id', 'type': 'STRING', 'mode': 'REQUIRED'},
            {'name': 'date', 'type': 'DATE', 'mode': 'REQUIRED'},
            {'name': 'store_id_encoded', 'type': 'INT64'},
            {'name': 'product_id_encoded', 'type': 'INT64'},
            {'name': 'date_ordinal', 'type': 'INT64'},
            {'name': 'sales', 'type': 'INT64'},
            {'name': 'stock', 'type': 'INT64'},
            {'name': 'day_of_week', 'type': 'INT64'},
            {'name': 'month', 'type': 'INT64'},
            {'name': 'rolling_avg_7d', 'type': 'FLOAT64'},
            {'name': 'lag_1d', 'type': 'INT64'},
            {'name': 'lag_7d', 'type': 'INT64'},
            {'name': 'computed_at', 'type': 'TIMESTAMP'},
        ]
    }

    with beam.Pipeline(options=pipeline_options) as p:
        (
            p
            | 'ReadFromBigQuery' >> ReadFromBigQuery(table=known_args.input_table)
            | 'KeyByStoreProduct' >> beam.Map(key_by_store_product)
            | 'GroupByStoreProduct' >> beam.GroupByKey()
            | 'ComputeFeatures' >> beam.ParDo(ComputeFeatures())
            | 'WriteToBigQuery' >> WriteToBigQuery(
                known_args.output_table,
                schema=output_schema,
                write_disposition=beam.io.BigQueryDisposition.WRITE_TRUNCATE,
                create_disposition=beam.io.BigQueryDisposition.CREATE_IF_NEEDED
            )
        )

    logging.info('Feature engineering pipeline completed.')


if __name__ == '__main__':
    logging.getLogger().setLevel(logging.INFO)
    run()
