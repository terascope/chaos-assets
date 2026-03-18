import {
    BaseSchema, ValidatedJobConfig,
    getOpConfig
} from '@terascope/job-components';
import { Terafoundation } from '@terascope/types';
import { FaultySlicer } from './interfaces.js';

export default class Schema extends BaseSchema<FaultySlicer> {
    validateJob(job: ValidatedJobConfig): void {
        const opConfig = getOpConfig(job, 'faulty_slicer');
        if (!opConfig) {
            throw new Error('No opConfig was found for operation faulty_slicer on the job');
        }
    }

    build(): Terafoundation.Schema<Omit<FaultySlicer, '_op'>> {
        return {
            size: {
                doc: 'The amount of records to be generated per slice',
                default: 1,
                format(val: any) {
                    if (!Number.isInteger(val)) {
                        throw new Error('Invalid size parameter for faulty_slicer, must be a number');
                    } else if (val <= 0) {
                        throw new Error('Invalid size parameter for faulty_slicer, must be greater than zero');
                    }
                }
            },
            fault_on_slice: {
                doc: 'The amount of slices to be produced before faulting',
                default: 100,
                format(val: any) {
                    if (!Number.isInteger(val)) {
                        throw new Error('Invalid fault_on_slice parameter for faulty_slicer, must be a number');
                    } else if (val <= 0) {
                        throw new Error('Invalid fault_on_slice parameter for faulty_slicer, must be greater than zero');
                    }
                }
            }
        };
    }
}
