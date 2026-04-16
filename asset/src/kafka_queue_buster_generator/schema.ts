import {
    BaseSchema, ValidatedJobConfig,
    getOpConfig
} from '@terascope/job-components';
import { Terafoundation } from '@terascope/types';
import { KafkaQueueBusterConfig } from './interfaces.js';

export default class Schema extends BaseSchema<KafkaQueueBusterConfig> {
    validateJob(job: ValidatedJobConfig): void {
        const opConfig = getOpConfig(job, 'kafka_queue_buster_generator');
        if (!opConfig) {
            throw new Error('No opConfig was found for operation kafka_queue_buster_generator on the job');
        }
    }

    build(): Terafoundation.Schema<Omit<KafkaQueueBusterConfig, '_op'>> {
        return {
            initial_size_kb: {
                doc: 'Approximate size in KB to make initial records',
                default: 10,
                format(val: any) {
                    if (!Number.isInteger(val)) {
                        throw new Error('Invalid initial_size_kb parameter for queue_buster_generator, must be a number');
                    } else if (val <= 0) {
                        throw new Error('Invalid initial_size_kb parameter for queue_buster_generator, must be greater than zero');
                    }
                }
            },
            initial_length: {
                doc: 'Slice length - the amount of records to be generated per initial slices',
                default: 5000,
                format(val: any) {
                    if (!Number.isInteger(val)) {
                        throw new Error('Invalid initial_length parameter for queue_buster_generator, must be a number');
                    } else if (val <= 0) {
                        throw new Error('Invalid initial_length parameter for queue_buster_generator, must be greater than zero');
                    }
                }
            },
            api_port: {
                doc: 'Host port of the API server',
                default: 8888,
                format(val: any) {
                    if (!Number.isInteger(val) || val < 1 || val > 65535) {
                        throw new Error('Invalid api_port parameter for queue_buster_generator, must be an integer between 1 and 65535');
                    }
                }
            },
            initial_total_slices: {
                doc: 'The initial total number of slices to produce. Useful to end a teraslice `once` job. For a `persistent` job '
                    + 'this can be left as null, or if set the job will idle and not process any more slices once reached. If '
                    + 'updated the job will continue until it reaches the new total.',
                default: null,
                format(val: any) {
                    if (val === null || val === undefined) return;
                    if (!Number.isInteger(val) || val < 0) {
                        throw new Error('Invalid initial_total_slices parameter for queue_buster_generator, must be an integer 0 or greater, null, or undefined');
                    }
                }
            }
        };
    }
}
