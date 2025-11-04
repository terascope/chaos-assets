import { OpConfig } from '@terascope/types';

export interface OomSlicer extends OpConfig {
    bytes: number;
    delay: number;
}
