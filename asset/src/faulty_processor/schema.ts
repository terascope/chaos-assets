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
        if (opConfig.errorStart >= opConfig.errorEnd) {
            throw new Error('"errorStart" must be less than "errorEnd" in faulty_processor config');
        }

    }

    build(): AnyObject {
        return {
            errorStart: {
                doc: 'The beginning range to start erroring slices on.',
                default: 100,
                format(val: any) {
                    if (isNaN(val)) {
                        throw new Error('Invalid errorStart parameter for faulty_processor, must be a number');
                    } else if (val <= 0) {
                        throw new Error('Invalid errorStart parameter for faulty_processor, must be greater than zero');
                    }
                }
            },
            errorEnd: {
                doc: 'The end range to stop erroring slices on.',
                default: 200,
                format(val: any) {
                    if (isNaN(val)) {
                        throw new Error('Invalid errorEnd parameter for faulty_processor, must be a number');
                    } else if (val <= 0) {
                        throw new Error('Invalid errorEnd parameter for faulty_processor, must be greater than zero');
                    }
                }
            },
            errorCode: {
                doc: 'The exit code to use when crashType is set to exit.',
                default: 500,
                format(val: any) {
                    if (isNaN(val)) {
                        throw new Error('Invalid errorEnd parameter for faulty_processor, must be a number');
                    }
                }
            },
            crashType: {
                doc: 'The type of fault that will occur. Options are "exit", "throw", or "kill"',
                default: 'throw',
                format(val: string) {
                    const validTypes: string[] = ['throw', 'exit', 'kill'];
                    if (typeof val !== 'string') {
                        throw new Error('Invalid crashType parameter for faulty_processor, must be a string');
                    }
                    if (!validTypes.includes(val)) {
                        throw new Error('Invalid crashType parameter for faulty_processor, only options are "exit", "throw", or "kill"');
                    }
                }
            }

        };
    }
}
