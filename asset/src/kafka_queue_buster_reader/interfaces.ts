import { OpConfig } from '@terascope/types';
import { Server } from 'node:http';

export interface QueueBusterServer {
    server: Server;
    getLength(): number;
    getSize(): number;
    getTotalSlices(): number;
    setLength(val: number): void;
    setSize(val: number): void;
    setTotalSlices(val: number): void;
}

export interface KafkaQueueBusterConfig extends OpConfig {
    api_port: number;
    initial_length: number;
    initial_size_kb: number;
    initial_total_slices: number;
}

export interface QueueBusterSliceRequest {
    sliceLength: number;
    sliceNumber: number;
    sliceSizeKb: number;
}
