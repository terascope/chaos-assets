import express from 'express';
import { KafkaQueueBusterConfig } from './interfaces.js';
import { Logger } from '@terascope/types';

export function startServer(opConfig: KafkaQueueBusterConfig, logger: Logger) {
    const app = express();
    const port: number = opConfig.api_port ?? 8888;

    app.use(express.json());

    let currentLength = opConfig.initial_length;
    let currentSizeKb = opConfig.initial_size_kb;
    let currentTotalSlices = opConfig.initial_total_slices;

    app.get('/', (_req, res) => {
        res.json({
            length: currentLength,
            size_kb: currentSizeKb,
            total_slices: currentTotalSlices
        });
    });

    app.get('/length', (_req, res) => {
        res.json({ length: currentLength });
    });

    app.get('/size', (_req, res) => {
        res.json({ size_kb: currentSizeKb });
    });

    app.get('/total_slices', (_req, res) => {
        res.json({ total_slices: currentTotalSlices });
    });

    app.post('/length/:value', (req, res) => {
        const val = parseInt(req.params.value, 10);
        if (isNaN(val) || val <= 0) {
            res.status(400).json({ error: 'length must be a positive integer' });
            return;
        }
        currentLength = val;
        res.json({ length: currentLength });
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

    app.post('/total_slices/:value', (req, res) => {
        const val = parseInt(req.params.value, 10);
        if (isNaN(val) || val <= 0) {
            res.status(400).json({ error: 'total_slices must be a positive integer' });
            return;
        }
        currentTotalSlices = val;
        res.json({ total_slices: currentTotalSlices });
    });

    const server = app.listen(port, () => {
        logger.debug(`Queue buster app listening on port ${port}`);
    });

    server.on('error', (err) => {
        logger.error(`Queue buster server failed to start: ${err.message}`);
        throw err;
    });

    return {
        server,
        getLength() {
            logger.debug(`Queue buster getLength returning ${currentLength}`);
            return currentLength;
        },
        getSize() {
            logger.debug(`Queue buster getSize returning ${currentSizeKb}`);

            return currentSizeKb;
        },
        getTotalSlices() {
            logger.debug(`Queue buster getTotalSlices returning ${currentTotalSlices}`);

            return currentTotalSlices;
        },
        setLength(val: number) {
            currentLength = val;
        },
        setSize(val: number) {
            currentSizeKb = val;
        },
        setTotalSlices(val: number) {
            currentTotalSlices = val;
        }
    };
}
