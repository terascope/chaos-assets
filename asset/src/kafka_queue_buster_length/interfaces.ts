import { OpConfig } from '@terascope/types';
import { Server } from 'node:http';

export interface KafkaQueueBusterLengthConfig extends OpConfig {
    api_port: number;
    initial_replication_factor: number;
    unique_id_field: string | undefined;
}

export interface QueueBusterLengthServer {
    server: Server;
    getReplicationFactor(): number;
    setReplicationFactor(val: number): void;
}
