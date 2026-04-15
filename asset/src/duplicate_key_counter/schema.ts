import { BaseSchema, ValidatedJobConfig, getOpConfig } from '@terascope/job-components';
import { DuplicateKeyCounterConfig } from './interfaces.js';

export default class Schema extends BaseSchema<DuplicateKeyCounterConfig> {
    validateJob(job: ValidatedJobConfig): void {
        const opConfig = getOpConfig(job, 'duplicate_key_counter') as DuplicateKeyCounterConfig | undefined;
        if (!opConfig) {
            throw new Error('No opConfig was found for operation duplicate_key_counter on the job');
        }

        if (opConfig.report_target === 's3') {
            if (!opConfig.s3_bucket) {
                throw new Error('duplicate_key_counter: s3_bucket is required when report_target is "s3"');
            }
            if (!opConfig.report_path) {
                throw new Error('duplicate_key_counter: report_path is required when report_target is "s3"');
            }
        }
    }

    build(): Record<string, any> {
        return {
            track_field: {
                doc: 'The field on each incoming record whose value is tracked for uniqueness',
                default: null,
                format: 'required_string'
            },
            report_target: {
                doc: 'Where to send the duplicate report. "console" logs a truncated summary every slice; "s3" writes a full JSON report to S3 on the configured flush interval.',
                default: 'console',
                format: (val: unknown): void => {
                    if (val !== 'console' && val !== 's3') {
                        throw new Error('report_target must be "console" or "s3"');
                    }
                }
            },
            s3_bucket: {
                doc: 'S3 bucket where the dedup report will be written. Required when report_target is "s3".',
                default: '',
                format: 'optional_string'
            },
            report_path: {
                doc: 'S3 key for the report file (e.g. "reports/dedup-report.json"). The same key is overwritten on each flush. Required when report_target is "s3".',
                default: '',
                format: 'optional_string'
            },
            report_interval: {
                doc: 'Write the report every N slices. Set to 0 to disable count-based flushing (report is still written on job shutdown).',
                default: 100,
                format: (val: unknown): void => {
                    if (typeof val !== 'number' || !Number.isInteger(val) || val < 0) {
                        throw new Error('report_interval must be a non-negative integer');
                    }
                }
            },
            report_interval_ms: {
                doc: 'Write the report if this many milliseconds have elapsed since the last flush. The timer resets whenever a count-based flush occurs. Set to 0 to disable.',
                default: 0,
                format: (val: unknown): void => {
                    if (typeof val !== 'number' || !Number.isInteger(val) || val < 0) {
                        throw new Error('report_interval_ms must be a non-negative integer');
                    }
                }
            },
            record_fields: {
                doc: 'Comma-separated list of record fields to capture as a sample alongside each duplicate entry (e.g. "foo,unique_field"). The values are taken from the first occurrence of each tracked value. Omitted from report when empty.',
                default: '',
                format: 'optional_string'
            },
            console_max_entries: {
                doc: 'Maximum number of duplicate entries shown in a single console log line when report_target is "console". Defaults to 10.',
                default: 10,
                format: (val: unknown): void => {
                    if (typeof val !== 'number' || !Number.isInteger(val) || val < 1) {
                        throw new Error('console_max_entries must be a positive integer');
                    }
                }
            },
            _connection: {
                doc: 'The Terafoundation S3 connection to use',
                default: 'default',
                format: 'optional_string'
            }
        };
    }
}
