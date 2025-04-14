import { OpConfig } from '@terascope/types';

export interface FaultyProcessorConfig extends OpConfig {
    error_start: number;
    error_end: number;
    error_code: number;
    crash_type: 'exit' | 'throw' | 'kill';
}
