import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { JobConfigParams, OpConfig } from '@terascope/job-components';
import { FaultySlicer } from '../../asset/src/faulty_slicer/interfaces.js';

describe('faulty_slicer schema', () => {
    let harness: WorkerTestHarness;

    async function makeSchema(config: Partial<OpConfig> = {}): Promise<FaultySlicer> {
        const name = 'faulty_slicer';
        const opConfig = Object.assign({}, { _op: name }, config);
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
                {
                    _op: 'noop',
                },
            ],
        };
        harness = new WorkerTestHarness(job);

        await harness.initialize();

        const validConfig = harness.executionContext.config.operations.find(
            (testConfig) => testConfig._op === name
        );

        return validConfig as FaultySlicer;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should instantiate correctly and has defaults', async () => {
        const schema = await makeSchema();

        expect(schema).toBeDefined();
        expect(schema.fault_on_slice).toEqual(100);
    });

    it('should throw with bad values', async () => {
        await expect(makeSchema({ size: -234234 })).toReject();
        await expect(makeSchema({ size: 'hello' })).toReject();
        await expect(makeSchema({ size: {} })).toReject();

        await expect(makeSchema({ size: 100, fault_on_slice: '509.2' })).toReject();
        await expect(makeSchema({ fault_on_slice: ['44'] })).toReject();
        await expect(makeSchema({ fault_on_slice: [5] })).toReject();
        await expect(makeSchema({ fault_on_slice: {} })).toReject();
        await expect(makeSchema({ fault_on_slice: -10 })).toReject();
    });
});
