import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { AnyObject } from '@terascope/job-components';
import { FaultySlicer } from '../../asset/src/faulty_slicer/interfaces.js';

describe('faulty_slicer schema', () => {
    let harness: WorkerTestHarness;

    async function makeSchema(config: AnyObject = {}): Promise<FaultySlicer> {
        const name = 'faulty_slicer';
        const opConfig = Object.assign({}, { _op: name }, config);
        harness = WorkerTestHarness.testFetcher(opConfig);

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
