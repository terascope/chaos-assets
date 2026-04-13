import 'jest-extended';
import { JobConfigParams } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { QueueBusterSliceRequest } from '../../asset/src/kafka_queue_buster_generator/interfaces.js';

describe('kafka_queue_buster_generator fetcher', () => {
    let harness: WorkerTestHarness;

    async function makeTest(config: Record<string, any> = {}) {
        const opConfig = Object.assign({}, { _op: 'kafka_queue_buster_generator' }, config);
        const job: JobConfigParams = {
            name: 'test-job',
            active: true,
            analytics: false,
            autorecover: false,
            assets: [],
            lifecycle: 'once',
            max_retries: 0,
            probation_window: 30000,
            slicers: 1,
            workers: 1,
            env_vars: {},
            apis: [],
            operations: [opConfig, { _op: 'noop' }],
        };
        harness = new WorkerTestHarness(job);
        await harness.initialize();
        return harness;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should return the correct number of records for a given sliceLength', async () => {
        const test = await makeTest();
        const slice: QueueBusterSliceRequest = { sliceLength: 5, sliceNumber: 1, sliceSizeKb: 1 };
        const results = await test.runSlice(slice);

        expect(results).toHaveLength(5);
    });

    it('should return an empty array when sliceLength is 0', async () => {
        const test = await makeTest();
        const slice: QueueBusterSliceRequest = { sliceLength: 0, sliceNumber: 1, sliceSizeKb: 1 };
        const results = await test.runSlice(slice);

        expect(results).toHaveLength(0);
    });

    it('should populate longString padded to sliceSizeKb * 1024 characters', async () => {
        const test = await makeTest();
        const sizeKb = 2;
        const slice: QueueBusterSliceRequest = {
            sliceLength: 3, sliceNumber: 1, sliceSizeKb: sizeKb
        };
        const results = await test.runSlice(slice);

        for (const doc of results) {
            expect((doc as any).longString.length).toEqual(sizeKb * 1024);
        }
    });

    it('should set id to "sliceNumber index" for each record', async () => {
        const test = await makeTest();
        const slice: QueueBusterSliceRequest = { sliceLength: 3, sliceNumber: 7, sliceSizeKb: 1 };
        const results = await test.runSlice(slice);

        expect((results[0] as any).id).toEqual('7 0');
        expect((results[1] as any).id).toEqual('7 1');
        expect((results[2] as any).id).toEqual('7 2');
    });

    it('should prefix longString with the id value', async () => {
        const test = await makeTest();
        const slice: QueueBusterSliceRequest = { sliceLength: 1, sliceNumber: 3, sliceSizeKb: 1 };
        const [result] = await test.runSlice(slice);

        expect((result as any).longString).toMatch(/^3 0/);
    });

    it('should return records with longString and id fields only', async () => {
        const test = await makeTest();
        const slice: QueueBusterSliceRequest = { sliceLength: 1, sliceNumber: 1, sliceSizeKb: 1 };
        const [result] = await test.runSlice(slice);

        expect(result).toHaveProperty('longString');
        expect(result).toHaveProperty('id');
    });
});
