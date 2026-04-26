"""
Predelix — Vertex AI Demand Prediction Model Training
Migrated from: server_side/predictor/app.py (RandomForestRegressor)
Reads training data from BigQuery → Trains model → Saves artifact for Vertex AI serving
"""
import os
import logging
import joblib
import pandas as pd
import numpy as np
from datetime import datetime

from google.cloud import bigquery
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_training_data():
    """Load training data from BigQuery ml_features table."""
    client = bigquery.Client()
    
    project_id = os.environ.get('GCP_PROJECT_ID', 'predelix-prod')
    dataset = os.environ.get('BIGQUERY_DATASET', 'predelix')
    
    query = f"""
        SELECT 
            store_id,
            product_id,
            date,
            store_id_encoded,
            product_id_encoded,
            date_ordinal,
            sales,
            stock,
            day_of_week,
            month,
            rolling_avg_7d,
            lag_1d,
            lag_7d
        FROM `{project_id}.{dataset}.ml_features`
        WHERE sales IS NOT NULL AND stock IS NOT NULL
        ORDER BY date
    """
    
    logger.info('Loading training data from BigQuery...')
    df = client.query(query).to_dataframe()
    logger.info(f'Loaded {len(df)} training rows')
    
    return df


def load_training_data_from_csv(csv_path):
    """Fallback: Load training data from a CSV file."""
    logger.info(f'Loading training data from CSV: {csv_path}')
    df = pd.read_csv(csv_path)
    
    # Feature engineering (same as original predictor/app.py)
    df['date'] = pd.to_datetime(df['date'])
    df['date_ordinal'] = df['date'].map(pd.Timestamp.toordinal)
    df['day_of_week'] = df['date'].dt.dayofweek
    df['month'] = df['date'].dt.month
    
    # Encode categoricals
    df['store_id'] = df['store_id'].astype('category')
    df['product_id'] = df['product_id'].astype('category')
    
    # Save mappings
    store_mapping = dict(enumerate(df['store_id'].cat.categories))
    product_mapping = dict(enumerate(df['product_id'].cat.categories))
    
    df['store_id_encoded'] = df['store_id'].cat.codes
    df['product_id_encoded'] = df['product_id'].cat.codes
    
    # Rolling averages and lags
    for (store, product), group in df.groupby(['store_id_encoded', 'product_id_encoded']):
        idx = group.index
        df.loc[idx, 'rolling_avg_7d'] = group['sales'].rolling(7, min_periods=1).mean()
        df.loc[idx, 'lag_1d'] = group['sales'].shift(1).fillna(group['sales'].iloc[0])
        df.loc[idx, 'lag_7d'] = group['sales'].shift(7).fillna(group['sales'].iloc[0])
    
    return df, {'store': store_mapping, 'product': product_mapping}


def train_model(df):
    """Train a RandomForestRegressor model."""
    
    feature_columns = [
        'store_id_encoded', 'product_id_encoded', 'date_ordinal',
        'sales', 'day_of_week', 'month', 'rolling_avg_7d', 'lag_1d'
    ]
    
    # Handle missing features gracefully
    available_features = [col for col in feature_columns if col in df.columns]
    
    X = df[available_features].fillna(0)
    y = df['stock']
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    logger.info(f'Training RandomForestRegressor with {len(X_train)} samples...')
    logger.info(f'Features: {available_features}')
    
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    logger.info(f'Model Performance:')
    logger.info(f'  MSE:  {mse:.4f}')
    logger.info(f'  MAE:  {mae:.4f}')
    logger.info(f'  R²:   {r2:.4f}')
    
    # Feature importance
    importances = dict(zip(available_features, model.feature_importances_))
    logger.info(f'Feature importances: {importances}')
    
    return model, {
        'mse': mse,
        'mae': mae,
        'r2': r2,
        'feature_importances': importances,
        'features_used': available_features,
        'training_samples': len(X_train),
        'test_samples': len(X_test),
        'trained_at': datetime.utcnow().isoformat()
    }


def save_model(model, metrics, mappings=None):
    """Save model artifact to Vertex AI model directory."""
    
    # Vertex AI sets AIP_MODEL_DIR for the output location
    model_dir = os.environ.get('AIP_MODEL_DIR', './model_output')
    os.makedirs(model_dir, exist_ok=True)
    
    model_path = os.path.join(model_dir, 'model.pkl')
    metrics_path = os.path.join(model_dir, 'metrics.json')
    
    joblib.dump(model, model_path)
    logger.info(f'Model saved to {model_path}')
    
    import json
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    logger.info(f'Metrics saved to {metrics_path}')
    
    if mappings:
        mappings_path = os.path.join(model_dir, 'id_mappings.pkl')
        joblib.dump(mappings, mappings_path)
        logger.info(f'ID mappings saved to {mappings_path}')


def main():
    logger.info('=' * 60)
    logger.info('Predelix — Vertex AI Model Training')
    logger.info('=' * 60)
    
    csv_path = os.environ.get('TRAINING_CSV_PATH')
    mappings = None
    
    if csv_path and os.path.exists(csv_path):
        # Fallback: train from CSV
        df, mappings = load_training_data_from_csv(csv_path)
    else:
        # Primary: train from BigQuery
        try:
            df = load_training_data()
        except Exception as e:
            logger.error(f'BigQuery load failed: {e}')
            logger.info('Attempting CSV fallback...')
            
            # Look for any CSV in current directory
            import glob
            csvs = glob.glob('*.csv')
            if csvs:
                df, mappings = load_training_data_from_csv(csvs[0])
            else:
                raise RuntimeError('No training data available')
    
    model, metrics = train_model(df)
    save_model(model, metrics, mappings)
    
    logger.info('✅ Training complete!')
    logger.info(f'Metrics: MSE={metrics["mse"]:.4f}, R²={metrics["r2"]:.4f}')


if __name__ == '__main__':
    main()
