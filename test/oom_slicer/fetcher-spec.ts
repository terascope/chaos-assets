import 'jest-extended';
import { JobConfigParams, OpConfig } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';

describe('oom_slicer fetcher', () => {
    let harness: WorkerTestHarness;

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    async function makeFetcherTest(config: Partial<OpConfig> = {}) {
        const opConfig = Object.assign({}, { _op: 'oom_slicer' }, config);
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
            operations: [
                opConfig,
                { _op: 'noop' },
            ],
        };
        harness = new WorkerTestHarness(job);
        await harness.initialize();
        return harness;
    }

    it('should return 10 records', async () => {
        const test = await makeFetcherTest();
        const results = await test.runSlice({ id: 'test-slice', foo: 'bar' });

        expect(results.length).toEqual(10);
    });

    it('should return records with id and data fields', async () => {
        const test = await makeFetcherTest();
        const results = await test.runSlice({ id: 'test-slice', foo: 'bar' });

        for (let i = 0; i < 10; i++) {
            expect(results[i]).toMatchObject({
                id: i,
                data: expect.arrayContaining([expect.any(Number)]),
            });
            expect(results[i].data).toHaveLength(3);
        }
    });

    it('should return records with ids 0 through 9', async () => {
        const test = await makeFetcherTest();
        const results = await test.runSlice({ id: 'test-slice', foo: 'bar' });

        const ids = results.map((r: any) => r.id);
        expect(ids).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('should return data values that are numbers between 0 and 1', async () => {
        const test = await makeFetcherTest();
        const results = await test.runSlice({ id: 'test-slice', foo: 'bar' });

        for (const record of results) {
            for (const val of (record as any).data) {
                expect(val).toBeGreaterThanOrEqual(0);
                expect(val).toBeLessThan(1);
            }
        }
    });
});
