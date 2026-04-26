/**
 * Predelix — CSV Parser Utility
 * Handles CSV file parsing, validation, and transformation
 */
const Papa = require('papaparse');
const { logger } = require('./logger');

/**
 * Parse a CSV file buffer into an array of objects
 */
function parseCSV(buffer, options = {}) {
    return new Promise((resolve, reject) => {
        const csvString = buffer.toString('utf-8');
        Papa.parse(csvString, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            ...options,
            complete: (results) => {
                if (results.errors.length > 0) {
                    logger.warn('CSV parsing warnings:', { errors: results.errors });
                }
                resolve({
                    data: results.data,
                    fields: results.meta.fields,
                    errors: results.errors
                });
            },
            error: (error) => {
                reject(new Error(`CSV parsing failed: ${error.message}`));
            }
        });
    });
}

/**
 * Validate that required columns exist in parsed CSV data
 */
function validateColumns(fields, requiredColumns) {
    const missing = requiredColumns.filter(col => !fields.includes(col));
    if (missing.length > 0) {
        throw new Error(`Missing required columns: ${missing.join(', ')}`);
    }
    return true;
}

/**
 * Validate sales CSV format
 * Required: store_id, product_id, date, sales, stock
 */
function validateSalesCSV(fields) {
    return validateColumns(fields, ['store_id', 'product_id', 'date', 'sales', 'stock']);
}

/**
 * Validate delivery CSV format
 * Required: name, mobile_number
 */
function validateDeliveryCSV(fields) {
    return validateColumns(fields, ['name', 'mobile_number']);
}

/**
 * Convert parsed CSV data to BigQuery-compatible row format
 */
function toBigQueryRows(data, transformFn = null) {
    return data.map((row, index) => {
        const transformed = transformFn ? transformFn(row, index) : row;
        return { insertId: `row_${Date.now()}_${index}`, json: transformed };
    });
}

module.exports = {
    parseCSV,
    validateColumns,
    validateSalesCSV,
    validateDeliveryCSV,
    toBigQueryRows
};
