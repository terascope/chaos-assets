import { OpConfig } from '@terascope/types';

export interface FaultyProcessorConfig extends OpConfig {
    errorStart: number;
    errorEnd: number;
    errorCode: number;
    crashType: 'exit' | 'throw' | 'kill';
}
