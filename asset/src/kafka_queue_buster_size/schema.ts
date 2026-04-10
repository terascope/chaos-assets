import {
    BaseSchema, ValidatedJobConfig,
    getOpConfig
} from '@terascope/job-components';
import { Terafoundation } from '@terascope/types';
import { KafkaQueueBusterSizeConfig } from './interfaces.js';

export default class Schema extends BaseSchema<KafkaQueueBusterSizeConfig> {
    validateJob(job: ValidatedJobConfig): void {
        const opConfig = getOpConfig(job, 'kafka_queue_buster_size');
        if (!opConfig) {
            throw new Error('No opConfig was found for operation kafka_queue_buster_size on the job');
        }
    }

    build(): Terafoundation.Schema<Omit<KafkaQueueBusterSizeConfig, '_op'>> {
        return {
            additional_field_name: {
                doc: 'name of field to add to record that will contain a large string',
                default: 'large_field',
                format: String
            },
            api_port: {
                doc: 'Host port of the API server',
                default: 8888,
                format(val: any) {
                    if (!Number.isInteger(val) || val < 1 || val > 65535) {
                        throw new Error('Invalid api_port parameter for queue_buster_reader, must be an integer between 1 and 65535');
                    }
                }
            },
            initial_size_kb: {
                doc: 'Approximate size in KB to make initial records',
                default: 10,
                format(val: any) {
                    if (!Number.isInteger(val)) {
                        throw new Error('Invalid initial_size_kb parameter for queue_buster_reader, must be a number');
                    } else if (val <= 0) {
                        throw new Error('Invalid initial_size_kb parameter for queue_buster_reader, must be greater than zero');
                    }
                }
            }
        };
    }
}
