import {
    BaseSchema, ValidatedJobConfig,
    getOpConfig
} from '@terascope/job-components';
import { Terafoundation } from '@terascope/types';
import { KafkaQueueBusterLengthConfig } from './interfaces.js';

export default class Schema extends BaseSchema<KafkaQueueBusterLengthConfig> {
    validateJob(job: ValidatedJobConfig): void {
        const opConfig = getOpConfig(job, 'kafka_queue_buster_length');
        if (!opConfig) {
            throw new Error('No opConfig was found for operation kafka_queue_buster_length on the job');
        }
    }

    build(): Terafoundation.Schema<Omit<KafkaQueueBusterLengthConfig, '_op'>> {
        return {
            api_port: {
                doc: 'Host port of the API server',
                default: 8888,
                format(val: any) {
                    if (!Number.isInteger(val) || val < 1 || val > 65535) {
                        throw new Error('Invalid api_port parameter for kafka_queue_buster_length, must be an integer between 1 and 65535');
                    }
                }
            },
            initial_replication_factor: {
                doc: 'The number of times each record is initially replicated, before `replication_factor` is modified by an API call.',
                default: 1,
                format(val: any) {
                    if (!Number.isInteger(val)) {
                        throw new Error('Invalid initial_replication_factor parameter for kafka_queue_buster_length, must be a number');
                    } else if (val <= 0) {
                        throw new Error('Invalid initial_replication_factor parameter for kafka_queue_buster_length, must be greater than zero');
                    }
                }
            },
            unique_id_field: {
                doc: 'The name of a unique field on each record. The value in this field will be modified to keep it unique among replicated records.',
                default: undefined,
                format: String
            }
        };
    }
}
