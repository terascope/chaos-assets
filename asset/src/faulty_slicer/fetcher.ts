import {
    Fetcher, Context, AnyObject,
    ExecutionConfig
} from '@terascope/job-components';
import { FaultySlice, FaultySlicer } from './interfaces.js';

export default class FaultySlicerFetcher extends Fetcher<FaultySlicer> {
    constructor(context: Context, opConfig: FaultySlicer, exConfig: ExecutionConfig) {
        super(context, opConfig, exConfig);
    }

    async fetch(slice?: FaultySlice): Promise<AnyObject[]> {
        if (slice) {
            const dataArray: AnyObject[] = [];
            let recordNumber: number;

            if (slice.slice_number === 1) {
                recordNumber = 1;
            } else {
                recordNumber = ((slice.slice_number - 1) * slice.size) + 1;
            }
            for (let i = 0; i < slice.size; i++) {
                dataArray.push({
                    recordNumber,
                    fromSliceNumber: slice.slice_number
                });
                recordNumber++;
            }
            return dataArray;
        } else {
            throw new Error(`No slice record found fetching data!`);
        }
    }
}
