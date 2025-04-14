import 'jest-extended';
import { AnyObject } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';

describe('faulty_slicer fetcher', () => {
    let harness: WorkerTestHarness;

    afterEach(async () => {
        if (harness) {
            await harness.shutdown();
        }
    });

    async function makeFetcherTest(config: AnyObject = {}) {
        const opConfig = Object.assign({}, { _op: 'faulty_slicer' }, config);
        harness = WorkerTestHarness.testFetcher(opConfig);
        await harness.initialize();
        return harness;
    }

    it('should produce 1 record', async () => {
        const test = await makeFetcherTest();
        const results = await test.runSlice({ size: 1, slice_number: 1 });

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ recordNumber: 1, fromSliceNumber: 1 });
    });

    it('should produce 5 records', async () => {
        const test = await makeFetcherTest();
        const results = await test.runSlice({ size: 5, slice_number: 3 });

        expect(results.length).toEqual(5);
        expect(results[0]).toEqual({ recordNumber: 11, fromSliceNumber: 3 });
        expect(results[1]).toEqual({ recordNumber: 12, fromSliceNumber: 3 });
        expect(results[2]).toEqual({ recordNumber: 13, fromSliceNumber: 3 });
        expect(results[3]).toEqual({ recordNumber: 14, fromSliceNumber: 3 });
        expect(results[4]).toEqual({ recordNumber: 15, fromSliceNumber: 3 });
    });

    it('should produce 50 records', async () => {
        const test = await makeFetcherTest();
        const results = await test.runSlice({ size: 50, slice_number: 12 });

        expect(results.length).toEqual(50);
    });
});
