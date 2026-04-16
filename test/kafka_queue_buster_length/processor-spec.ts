import { DataEntity } from '@terascope/core-utils';
import { WorkerTestHarness } from 'teraslice-test-harness';

// Use ports in a range unlikely to conflict with other tests
let portCounter = 19400;

describe('kafka_queue_buster_length Processor', () => {
    let harness: WorkerTestHarness;
    let data: DataEntity[];

    async function makeTest(config?: any) {
        const _op = { _op: 'kafka_queue_buster_length', api_port: portCounter++ };
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

    it('should return data unchanged when replication_factor is 1', async () => {
        harness = await makeTest({ initial_replication_factor: 1 });
        const results = await harness.runSlice(data);

        expect(results).toHaveLength(3);
    });

    it('should replicate each record by the replication factor', async () => {
        harness = await makeTest({ initial_replication_factor: 3 });
        const results = await harness.runSlice(data);

        expect(results).toHaveLength(9);
    });

    it('should set default unique_id_field using slice/index/rep when no field value exists', async () => {
        harness = await makeTest({ initial_replication_factor: 2 });

        const results = await harness.runSlice([DataEntity.make({ value: 'test' })]);

        expect(results).toHaveLength(2);
        expect((results[0] as any).queue_buster_unique_id).toEqual('1-0-1');
        expect((results[1] as any).queue_buster_unique_id).toEqual('1-0-2');
    });

    it('should append rep suffix to existing unique_id_field value', async () => {
        harness = await makeTest({ initial_replication_factor: 2 });

        const doc = DataEntity.make({ queue_buster_unique_id: 'abc123' });
        const results = await harness.runSlice([doc]);

        expect(results).toHaveLength(2);
        expect((results[0] as any).queue_buster_unique_id).toEqual('abc123-1');
        expect((results[1] as any).queue_buster_unique_id).toEqual('abc123-2');
    });

    it('should use a custom unique_id_field when configured', async () => {
        harness = await makeTest({ initial_replication_factor: 2, unique_id_field: 'my_id' });

        const doc = DataEntity.make({ my_id: 'original' });
        const results = await harness.runSlice([doc]);

        expect(results).toHaveLength(2);
        expect((results[0] as any).my_id).toEqual('original-1');
        expect((results[1] as any).my_id).toEqual('original-2');
    });

    it('should generate unique_id_field with slice/index/rep when custom field has no value', async () => {
        harness = await makeTest({ initial_replication_factor: 2, unique_id_field: 'my_id' });

        const results = await harness.runSlice([DataEntity.make({ value: 'test' })]);

        expect((results[0] as any).my_id).toEqual('1-0-1');
        expect((results[1] as any).my_id).toEqual('1-0-2');
    });

    it('should increment slice number across multiple slices', async () => {
        harness = await makeTest({ initial_replication_factor: 2 });

        await harness.runSlice([DataEntity.make({ value: 'first' })]);
        const slice2Results = await harness.runSlice([DataEntity.make({ value: 'second' })]);

        expect((slice2Results[0] as any).queue_buster_unique_id).toEqual('2-0-1');
        expect((slice2Results[1] as any).queue_buster_unique_id).toEqual('2-0-2');
    });

    it('should preserve original fields on replicated records', async () => {
        harness = await makeTest({ initial_replication_factor: 2 });
        const results = await harness.runSlice([data[0]]);

        for (const doc of results) {
            expect((doc as any).id).toEqual(1);
            expect((doc as any).value).toEqual('alpha');
        }
    });

    it('should update replication_factor dynamically via the API', async () => {
        const port = portCounter++;
        harness = WorkerTestHarness.testProcessor({
            _op: 'kafka_queue_buster_length',
            api_port: port,
            initial_replication_factor: 1,
        });
        await harness.initialize();

        const initialResults = await harness.runSlice(data);
        expect(initialResults).toHaveLength(3);

        // Set replication factor to 2 via API
        const response = await fetch(`http://localhost:${port}/factor/2`, { method: 'POST' });
        expect(response.ok).toBe(true);

        const updatedResults = await harness.runSlice(data);
        expect(updatedResults).toHaveLength(6);
    });

    it('should return current replication_factor from GET /factor', async () => {
        const port = portCounter++;
        harness = WorkerTestHarness.testProcessor({
            _op: 'kafka_queue_buster_length',
            api_port: port,
            initial_replication_factor: 3,
        });
        await harness.initialize();

        const response = await fetch(`http://localhost:${port}/factor`);
        const body = await response.json() as { replication_factor: number };

        expect(body.replication_factor).toEqual(3);
    });

    it('should reject invalid factor values via the API', async () => {
        const port = portCounter++;
        harness = WorkerTestHarness.testProcessor({
            _op: 'kafka_queue_buster_length',
            api_port: port,
            initial_replication_factor: 1,
        });
        await harness.initialize();

        const badResponse = await fetch(`http://localhost:${port}/factor/0`, { method: 'POST' });
        expect(badResponse.status).toEqual(400);

        const negResponse = await fetch(`http://localhost:${port}/factor/-5`, { method: 'POST' });
        expect(negResponse.status).toEqual(400);
    });
});
