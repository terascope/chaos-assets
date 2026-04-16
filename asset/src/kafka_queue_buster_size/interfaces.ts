import { OpConfig } from '@terascope/types';
import { Server } from 'node:http';

export interface KafkaQueueBusterSizeConfig extends OpConfig {
    additional_field_name: string;
    initial_size_kb: number;
    api_port: number;
}

export interface QueueBusterSizeServer {
    server: Server;
    getSize(): number;
    setSize(val: number): void;
}
