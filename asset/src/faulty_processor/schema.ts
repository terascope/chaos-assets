import {
    ConvictSchema, AnyObject, ValidatedJobConfig,
    getOpConfig
} from '@terascope/job-components';
import { FaultyProcessorConfig } from './interfaces.js';

export default class Schema extends ConvictSchema<FaultyProcessorConfig> {
    validateJob(job: ValidatedJobConfig): void {
        const opConfig = getOpConfig(job, 'faulty_processor');
        if (!opConfig) {
            throw new Error('No opConfig was found for operation faulty_processor on the job');
        }
        if (opConfig.error_start >= opConfig.error_end) {
            throw new Error('"error_start" must be less than "error_end" in faulty_processor config');
        }
    }

    build(): AnyObject {
        return {
            error_start: {
                doc: 'The beginning range to start erroring slices on.',
                default: 100,
                format(val: any) {
                    if (!Number.isInteger(val)) {
                        throw new Error('Invalid error_start parameter for faulty_processor, must be a number');
                    } else if (val <= 0) {
                        throw new Error('Invalid error_start parameter for faulty_processor, must be greater than zero');
                    }
                }
            },
            error_end: {
                doc: 'The end range to stop erroring slices on.',
                default: 200,
                format(val: any) {
                    if (!Number.isInteger(val)) {
                        throw new Error('Invalid error_end parameter for faulty_processor, must be a number');
                    } else if (val <= 0) {
                        throw new Error('Invalid error_end parameter for faulty_processor, must be greater than zero');
                    }
                }
            },
            error_code: {
                doc: 'The exit code to use when crash_type is set to exit.',
                default: 500,
                format(val: any) {
                    if (!Number.isInteger(val)) {
                        throw new Error('Invalid error_code parameter for faulty_processor, must be a number');
                    } else if (val < 0) {
                        throw new Error('Invalid error_code parameter for faulty_processor, must not be negative');
                    }
                }
            },
            crash_type: {
                doc: 'The type of fault that will occur. Options are "exit", "throw", or "kill"',
                default: 'throw',
                format(val: string) {
                    const validTypes: string[] = ['throw', 'exit', 'kill'];
                    if (typeof val !== 'string') {
                        throw new Error('Invalid crash_type parameter for faulty_processor, must be a string');
                    }
                    if (!validTypes.includes(val)) {
                        throw new Error('Invalid crash_type parameter for faulty_processor, only options are "exit", "throw", or "kill"');
                    }
                }
            }

        };
    }
}
