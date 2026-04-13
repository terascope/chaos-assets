import { SlicerTestHarness, newTestJobConfig } from 'teraslice-test-harness';
import { QueueBusterSliceRequest } from '../../asset/src/kafka_queue_buster_generator/interfaces.js';

// Use ports in a range unlikely to conflict with other tests
let portCounter = 19300;

describe('kafka_queue_buster_generator slicer', () => {
    let harness: SlicerTestHarness;

    async function makeTest(config: Record<string, any> = {}) {
        const opConfig = Object.assign(
            {},
            { _op: 'kafka_queue_buster_generator', api_port: portCounter++ },
            config
        );
        const job = newTestJobConfig({
            lifecycle: 'once',
            slicers: 1,
            operations: [opConfig, { _op: 'noop' }],
        });
        harness = new SlicerTestHarness(job, {});
        await harness.initialize();
        return harness;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should produce a slice with initial config values', async () => {
        const test = await makeTest({
            initial_length: 100,
            initial_size_kb: 5,
            initial_total_slices: 3,
        });

        const [slice] = await test.createSlices() as QueueBusterSliceRequest[];

        expect(slice.sliceLength).toEqual(100);
        expect(slice.sliceSizeKb).toEqual(5);
        expect(slice.sliceNumber).toEqual(1);
    });

    it('should increment sliceNumber on each call', async () => {
        const test = await makeTest({ initial_total_slices: 5 });

        const [slice1] = await test.createSlices() as QueueBusterSliceRequest[];
        const [slice2] = await test.createSlices() as QueueBusterSliceRequest[];
        const [slice3] = await test.createSlices() as QueueBusterSliceRequest[];

        expect(slice1.sliceNumber).toEqual(1);
        expect(slice2.sliceNumber).toEqual(2);
        expect(slice3.sliceNumber).toEqual(3);
    });

    it('should return null when totalSlices is reached', async () => {
        const test = await makeTest({ initial_total_slices: 2 });

        await test.createSlices(); // slice 1
        await test.createSlices(); // slice 2
        const result = await test.createSlices(); // should be null

        expect(result).toEqual([null]);
    });

    it('should keep producing slices when initial_total_slices is null', async () => {
        const test = await makeTest({ initial_total_slices: null });

        for (let i = 1; i <= 5; i++) {
            const [slice] = await test.createSlices() as QueueBusterSliceRequest[];
            expect(slice).not.toBeNull();
            expect(slice.sliceNumber).toEqual(i);
        }
    });

    it('should use default initial values from config', async () => {
        const test = await makeTest({
            initial_length: 50,
            initial_size_kb: 3,
            initial_total_slices: 1,
        });

        const [slice] = await test.createSlices() as QueueBusterSliceRequest[];

        expect(slice.sliceLength).toEqual(50);
        expect(slice.sliceSizeKb).toEqual(3);
    });
});
