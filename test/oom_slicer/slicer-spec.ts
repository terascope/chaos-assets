import { SlicerTestHarness, newTestJobConfig } from 'teraslice-test-harness';

describe('oom_slicer slicer', () => {
    let harness: SlicerTestHarness;

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    async function makeSlicerTest(opConfig: Record<string, any> = {}) {
        const job = newTestJobConfig({
            analytics: true,
            slicers: 1,
            lifecycle: 'persistent',
            operations: [
                Object.assign({ _op: 'oom_slicer', delay: 0 }, opConfig),
                { _op: 'noop' },
            ],
        });
        harness = new SlicerTestHarness(job, {});
        await harness.initialize();
        return harness;
    }

    it('should return a slice with id and foo fields', async () => {
        const test = await makeSlicerTest();
        const [slice] = await test.createSlices();

        expect(slice).toBeDefined();
        expect(slice).toHaveProperty('id');
        expect(slice).toHaveProperty('foo', 'bar');
    });

    it('should return a UUID as the slice id', async () => {
        const test = await makeSlicerTest();
        const [slice] = await test.createSlices();

        expect(typeof slice.id).toEqual('string');
        expect(slice.id).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        );
    });

    it('should return unique ids on each slice', async () => {
        const test = await makeSlicerTest();
        const [slice1] = await test.createSlices();
        const [slice2] = await test.createSlices();
        const [slice3] = await test.createSlices();

        expect(slice1.id).not.toEqual(slice2.id);
        expect(slice2.id).not.toEqual(slice3.id);
    });

    it('should accumulate memory in oomArray with each slice', async () => {
        const test = await makeSlicerTest({ bytes: 1024 });
        const slicer = (test as any).executionContext._slicer as any;

        expect(slicer.oomArray).toHaveLength(0);

        await test.createSlices();
        expect(slicer.oomArray).toHaveLength(1);
        expect(slicer.oomArray[0]).toBeInstanceOf(Buffer);
        expect(slicer.oomArray[0].length).toEqual(1024);

        await test.createSlices();
        expect(slicer.oomArray).toHaveLength(2);
    });

    it('should allocate buffers of configured byte size', async () => {
        const bytes = 2048;
        const test = await makeSlicerTest({ bytes });
        const slicer = (test as any).executionContext._slicer as any;

        await test.createSlices();

        expect(slicer.oomArray[0].length).toEqual(bytes);
    });
});
