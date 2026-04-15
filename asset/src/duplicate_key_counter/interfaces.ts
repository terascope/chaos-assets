import { OpConfig } from '@terascope/job-components';

export interface DuplicateKeyCounterConfig extends OpConfig {
    track_field: string;
    report_target: 'console' | 's3';
    s3_bucket: string;
    report_path: string;
    report_interval: number;
    report_interval_ms: number;
    record_fields: string;
    console_max_entries: number;
    _connection: string;
}
