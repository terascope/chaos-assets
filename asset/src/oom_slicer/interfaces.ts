import { OpConfig } from '@terascope/types';

export interface OomSlicerConfig extends OpConfig {
    bytes: number;
    delay: number;
}
