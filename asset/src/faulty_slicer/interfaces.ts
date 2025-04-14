import { OpConfig } from '@terascope/types';

export interface FaultySlicer extends OpConfig {
    size: number;
    fault_on_slice: number;
}

export interface FaultySlice {
    size: number;
    slice_number: number;
}
