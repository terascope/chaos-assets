import { BatchProcessor } from '@terascope/job-components';
import { DataEntity } from '@terascope/core-utils';
import { KafkaQueueBusterLengthConfig, QueueBusterLengthServer } from './interfaces.js';
import { startServer } from './server.js';

export default class QueueBusterLengthProcessor extends BatchProcessor<
    KafkaQueueBusterLengthConfig
> {
    replicationFactor: number;
    sliceNumber = 0;
    unique_id_field: string;
    server!: QueueBusterLengthServer;

    constructor(
        ...args: ConstructorParameters<typeof BatchProcessor<KafkaQueueBusterLengthConfig>>
    ) {
        super(...args);
        this.replicationFactor = this.opConfig.initial_replication_factor;
        this.unique_id_field = this.opConfig.unique_id_field ?? 'queue_buster_unique_id';
    }

    async initialize(): Promise<void> {
        await super.initialize();
        this.server = startServer(this.opConfig);
    }

    async shutdown(): Promise<void> {
        await super.shutdown();
        if (this.server) {
            this.server.server.closeIdleConnections();
            this.server.server.closeAllConnections();
            await new Promise<void>((resolve) => {
                this.server.server.close(() => resolve());
            });
        }
    }

    handle(input: DataEntity[]): Promise<DataEntity[]> {
        this.sliceNumber++;
        return super.handle(input);
    }

    async onBatch(data: DataEntity[]): Promise<DataEntity[]> {
        this.replicationFactor = this.server.getReplicationFactor();
        if (this.replicationFactor === 1) return data;
        const replicatedData: DataEntity[] = [];
        data.forEach((doc: DataEntity, index: number) => {
            const originalId = doc[this.unique_id_field];
            for (let rep = 1; rep <= this.replicationFactor; rep++) {
                const clone = DataEntity.make({ ...doc });
                const newId = originalId == null ? `${this.sliceNumber}-${index}-${rep}` : `${originalId}-${rep}`;
                clone[this.unique_id_field] = newId;
                replicatedData.push(clone);
            }
        });

        return replicatedData;
    }
}
