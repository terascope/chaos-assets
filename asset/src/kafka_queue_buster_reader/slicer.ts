import { Slicer } from '@terascope/job-components';
import { KafkaQueueBusterConfig, QueueBusterServer, QueueBusterSliceRequest } from './interfaces.js';
import { startServer } from './server.js';

export default class QueueBusterSlicer extends Slicer<KafkaQueueBusterConfig> {
    server!: QueueBusterServer;
    sliceLength: number;
    sliceNumber: number = 0;
    sliceSizeKb: number;
    totalSlices: number;

    constructor(...args: ConstructorParameters<typeof Slicer<KafkaQueueBusterConfig>>) {
        super(...args);

        this.sliceLength = this.opConfig.initial_length;
        this.sliceSizeKb = this.opConfig.initial_size_kb;
        this.totalSlices = this.opConfig.initial_total_slices;
    }

    async initialize(): Promise<void> {
        this.server = startServer(this.opConfig, this.logger);
    }

    isRecoverable(): boolean {
        return false;
    }

    async slice(): Promise<QueueBusterSliceRequest | null> {
        this.totalSlices = this.server.getTotalSlices();
        this.sliceSizeKb = this.server.getSize();
        this.sliceLength = this.server.getLength();

        if (this.sliceNumber === this.totalSlices) {
            return null;
        }

        this.sliceNumber++;

        const slice: QueueBusterSliceRequest = {
            sliceSizeKb: this.sliceSizeKb,
            sliceLength: this.sliceLength,
            sliceNumber: this.sliceNumber
        };

        return slice;
    }

    maxQueueLength(): number {
        return 5;
    }
}
