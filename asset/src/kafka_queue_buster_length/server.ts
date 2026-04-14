import express from 'express';
import { KafkaQueueBusterLengthConfig } from './interfaces.js';

export function startServer(opConfig: KafkaQueueBusterLengthConfig) {
    const app = express();
    const port: number = opConfig.api_port ?? 8888;

    app.use(express.json());

    let currentReplicationFactor = opConfig.initial_replication_factor;

    app.get('/', (_req, res) => {
        res.send('Queue Buster Length server');
    });

    app.get('/factor', (_req, res) => {
        res.json({ replication_factor: currentReplicationFactor });
    });

    app.post('/factor/:value', (req, res) => {
        const val = parseInt(req.params.value, 10);
        if (isNaN(val) || val <= 0) {
            res.status(400).json({ error: 'replication_factor must be a positive integer' });
            return;
        }
        currentReplicationFactor = val;
        res.json({ replication_factor: currentReplicationFactor });
    });

    const server = app.listen(port, () => {
        console.warn(`Queue Buster Length app listening on port ${port}`);
    });

    server.on('error', (err) => {
        console.error(`Queue Buster Length server failed to start: ${err.message}`);
        throw err;
    });

    return {
        server,
        getReplicationFactor() {
            return currentReplicationFactor;
        },
        setReplicationFactor(val: number) {
            currentReplicationFactor = val;
        }
    };
}
