import express from 'express';
import { KafkaQueueBusterSizeConfig } from './interfaces.js';

export function startServer(opConfig: KafkaQueueBusterSizeConfig) {
    const app = express();
    const port: number = opConfig.api_port ?? 8888;

    app.use(express.json());

    let currentSizeKb = opConfig.initial_size_kb;

    app.get('/', (_req, res) => {
        res.send('Queue Buster Size server');
    });

    app.get('/size', (_req, res) => {
        res.json({ size_kb: currentSizeKb });
    });

    app.post('/size/:value', (req, res) => {
        const val = parseInt(req.params.value, 10);
        if (isNaN(val) || val <= 0) {
            res.status(400).json({ error: 'size_kb must be a positive integer' });
            return;
        }
        currentSizeKb = val;
        res.json({ size_kb: currentSizeKb });
    });

    const server = app.listen(port, () => {
        console.warn(`Queue Buster Size app listening on port ${port}`);
    });

    server.on('error', (err) => {
        console.error(`Queue Buster Size server failed to start: ${err.message}`);
        throw err;
    });

    return {
        server,
        getSize() {
            return currentSizeKb;
        },
        setSize(val: number) {
            currentSizeKb = val;
        }
    };
}
