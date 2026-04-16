import { MapProcessor } from '@terascope/job-components';
import { DataEntity } from '@terascope/core-utils';
import { KafkaQueueBusterSizeConfig, QueueBusterSizeServer } from './interfaces.js';
import { startServer } from './server.js';

export default class QueueBusterSizeProcessor extends MapProcessor<KafkaQueueBusterSizeConfig> {
    sizeKb: number;
    sliceNumber: number = 0;
    server!: QueueBusterSizeServer;

    constructor(...args: ConstructorParameters<typeof MapProcessor<KafkaQueueBusterSizeConfig>>) {
        super(...args);
        this.sizeKb = this.opConfig.initial_size_kb;
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

    map(doc: DataEntity, index: number): DataEntity {
        const id = `${this.sliceNumber} ${index}`;
        this.sizeKb = this.server.getSize();

        doc[this.opConfig.additional_field_name] = id.padEnd(this.sizeKb * 1024, ' ');
        if (index === 0) {
            const byteSize = new TextEncoder().encode(JSON.stringify(doc)).byteLength;
            this.logger.info(`QueueBusterSizeProcessor adding field of ${byteSize} bytes to records for slice ${this.sliceNumber}.`);
        }

        return doc;
    }
}
