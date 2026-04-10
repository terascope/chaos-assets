import { DataEntity } from '@terascope/core-utils';
import { WorkerTestHarness } from 'teraslice-test-harness';

// Use ports in a range unlikely to conflict with other tests
let portCounter = 19200;

describe('kafka_queue_buster_size Processor', () => {
    let harness: WorkerTestHarness;
    let data: DataEntity[];

    async function makeTest(config?: any) {
        const _op = { _op: 'kafka_queue_buster_size', api_port: portCounter++ };
        const opConfig = config ? Object.assign({}, _op, config) : _op;

        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        return harness;
    }

    beforeEach(async () => {
        data = [
            DataEntity.make({ id: 1, value: 'alpha' }),
            DataEntity.make({ id: 2, value: 'beta' }),
            DataEntity.make({ id: 3, value: 'gamma' }),
        ];
    });

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should add the additional field to each record', async () => {
        harness = await makeTest({ additional_field_name: 'padding', initial_size_kb: 1 });
        const results = await harness.runSlice(data);

        expect(results).toHaveLength(3);
        for (const doc of results) {
            expect(doc).toHaveProperty('padding');
        }
    });

    it('should use the default field name large_field', async () => {
        harness = await makeTest({ initial_size_kb: 1 });
        const results = await harness.runSlice(data);

        for (const doc of results) {
            expect(doc).toHaveProperty('large_field');
        }
    });

    it('should pad the field to approximately initial_size_kb * 1024 bytes', async () => {
        const sizeKb = 2;
        harness = await makeTest({ additional_field_name: 'padding', initial_size_kb: sizeKb });

        const [result] = await harness.runSlice([data[0]]);

        const paddingLength = (result as any).padding.length;
        expect(paddingLength).toEqual(sizeKb * 1024);
    });

    it('should include slice and index info in the padding field', async () => {
        harness = await makeTest({ additional_field_name: 'pad', initial_size_kb: 1 });

        const results = await harness.runSlice(data);

        // slice 1, index 0 => id starts with "1 0"
        expect((results[0] as any).pad).toMatch(/^1 0/);
        // slice 1, index 1 => id starts with "1 1"
        expect((results[1] as any).pad).toMatch(/^1 1/);
        // slice 1, index 2 => id starts with "1 2"
        expect((results[2] as any).pad).toMatch(/^1 2/);
    });

    it('should increment slice number across multiple slices', async () => {
        harness = await makeTest({ additional_field_name: 'pad', initial_size_kb: 1 });

        await harness.runSlice([data[0]]);
        const slice2Results = await harness.runSlice([data[1]]);

        expect((slice2Results[0] as any).pad).toMatch(/^2 0/);
    });

    it('should preserve original fields on the record', async () => {
        harness = await makeTest({ additional_field_name: 'padding', initial_size_kb: 1 });
        const results = await harness.runSlice([data[0]]);

        expect((results[0] as any).id).toEqual(1);
        expect((results[0] as any).value).toEqual('alpha');
    });
});
