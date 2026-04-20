import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { JobConfigParams, OpConfig } from '@terascope/job-components';
import { OomSlicerConfig } from '../../asset/src/oom_slicer/interfaces.js';

describe('oom_slicer schema', () => {
    let harness: WorkerTestHarness;

    async function makeSchema(config: Partial<OpConfig> = {}): Promise<OomSlicerConfig> {
        const name = 'oom_slicer';
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
                { _op: 'noop' },
            ],
        };
        harness = new WorkerTestHarness(job);
        await harness.initialize();

        const validConfig = harness.executionContext.config.operations.find(
            (c) => c._op === name
        );
        return validConfig as OomSlicerConfig;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should instantiate with defaults', async () => {
        const schema = await makeSchema();

        expect(schema).toBeDefined();
        expect(schema.bytes).toEqual(524288);
        expect((schema as any).delay).toEqual(50);
    });

    it('should accept valid bytes values', async () => {
        const schema = await makeSchema({ bytes: 1024 });
        expect(schema.bytes).toEqual(1024);
    });

    it('should accept zero delay (delay)', async () => {
        const schema = await makeSchema({ delay: 0 } as any);
        expect((schema as any).delay).toEqual(0);
    });

    it('should reject invalid bytes values', async () => {
        await expect(makeSchema({ bytes: 0 })).toReject();
        await expect(makeSchema({ bytes: -1 })).toReject();
        await expect(makeSchema({ bytes: 1.5 })).toReject();
        await expect(makeSchema({ bytes: 'large' as any })).toReject();
        await expect(makeSchema({ bytes: {} as any })).toReject();
    });

    it('should reject invalid delay values', async () => {
        await expect(makeSchema({ delay: -1 } as any)).toReject();
        await expect(makeSchema({ delay: 1.5 } as any)).toReject();
        await expect(makeSchema({ delay: 'fast' } as any)).toReject();
        await expect(makeSchema({ delay: [] } as any)).toReject();
    });
});
