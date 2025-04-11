import { Slicer } from '@terascope/job-components';
import { FaultySlicer, FaultySlice } from './interfaces.js';

export default class FaultySliceSlicer extends Slicer<FaultySlicer> {
    sliceNumber: number;
    sliceSize: number;
    faultOnSlice: number;
    constructor(...args: ConstructorParameters<typeof Slicer<FaultySlicer>>) {
        super(...args);

        this.sliceNumber = 1;
        this.sliceSize = this.opConfig.size;
        this.faultOnSlice = this.opConfig.faultOnSlice;

    }
    async initialize(): Promise<void> {}

    isRecoverable(): boolean {
        return false;
    }
    async slice(): Promise<FaultySlice> {
        if (this.faultOnSlice >= this.sliceNumber) {
            throw new Error(`Fault on slice ${this.sliceNumber}..`);
        }
        const slice: FaultySlice = {
            size: this.sliceSize,
            slice_number: this.sliceNumber
        }
        this.sliceNumber++;
        return slice;
    }
}
