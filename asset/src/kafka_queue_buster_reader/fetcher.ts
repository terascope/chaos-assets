import {
    Fetcher, Context,
    ExecutionConfig
} from '@terascope/job-components';
import { KafkaQueueBusterConfig, QueueBusterSliceRequest } from './interfaces';

export default class QueueBusterFetcher extends Fetcher<KafkaQueueBusterConfig> {
    constructor(context: Context, opConfig: KafkaQueueBusterConfig, exConfig: ExecutionConfig) {
        super(context, opConfig, exConfig);
    }

    async fetch(slice: QueueBusterSliceRequest): Promise<Record<string, any>[]> {
        const dataArray: Record<string, any>[] = [];

        for (let i = 0; i < slice.sliceLength; i++) {
            const id = `${slice.sliceNumber} ${i}`;
            const doc = {
                longString: id.padEnd(slice.sliceSizeKb * 1024, ' '),
                id
            };
            if (i === 0) {
                const byteSize = new TextEncoder().encode(JSON.stringify(doc)).byteLength;
                this.logger.debug(`QueueBusterFetcher creating records of ${byteSize} bytes for QueueBusterSliceRequest ${slice}.`);
            }
            dataArray.push(doc);
        }
        return dataArray;
    }
}
