import {
    ConvictSchema, AnyObject, ValidatedJobConfig,
    getOpConfig
} from '@terascope/job-components';
import { FaultySlicer } from './interfaces.js';

export default class Schema extends ConvictSchema<FaultySlicer> {
    validateJob(job: ValidatedJobConfig): void {
        const opConfig = getOpConfig(job, 'faulty_slicer');
        if (!opConfig) {
            throw new Error('No opConfig was found for operation faulty_slicer on the job');
        }

    }

    build(): AnyObject {
        return {
            size: {
                doc: 'The amount of records to be generated per slice',
                default: 1,
                format(val: any) {
                    if (isNaN(val)) {
                        throw new Error('Invalid size parameter for faulty_slicer, must be a number');
                    } else if (val <= 0) {
                        throw new Error('Invalid size parameter for faulty_slicer, must be greater than zero');
                    }
                }
            },
            faultOnSlice: {
                doc: 'The amount of slices to be produced before faulting',
                default: 100,
                format(val: any) {
                    if (isNaN(val)) {
                        throw new Error('Invalid faultOnSlice parameter for faulty_slicer, must be a number');
                    } else if (val <= 0) {
                        throw new Error('Invalid faultOnSlice parameter for faulty_slicer, must be greater than zero');
                    }
                }
            }
        };
    }
}
