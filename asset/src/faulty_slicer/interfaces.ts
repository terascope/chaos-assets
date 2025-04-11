import { OpConfig } from '@terascope/types';

export interface FaultySlicer extends OpConfig {
    size: number;
    faultOnSlice: number;
}

export interface FaultySlice {
    size: number;
    slice_number: number;
}
