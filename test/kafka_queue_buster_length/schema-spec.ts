import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { OpConfig } from '@terascope/job-components';
import { KafkaQueueBusterLengthConfig } from '../../asset/src/kafka_queue_buster_length/interfaces.js';

// Use ports in a range unlikely to conflict with other tests
// (19300 is used by kafka_queue_buster_generator/slicer-spec)
let portCounter = 19500;

describe('kafka_queue_buster_length schema', () => {
    let harness: WorkerTestHarness;

    async function makeSchema(
        config: Partial<OpConfig> = {}
    ): Promise<KafkaQueueBusterLengthConfig> {
        const name = 'kafka_queue_buster_length';
        const opConfig = Object.assign({}, { _op: name, api_port: portCounter++ }, config);

        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        const validConfig = harness.executionContext.config.operations.find(
            (testConfig) => testConfig._op === name
        );

        return validConfig as KafkaQueueBusterLengthConfig;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should instantiate correctly and has defaults', async () => {
        const schema = await makeSchema();

        expect(schema).toBeDefined();
        expect(schema.api_port).toBeGreaterThan(0);
        expect(schema.initial_replication_factor).toEqual(1);
        expect(schema.unique_id_field).toBeUndefined();
    });

    it('should throw with invalid api_port values', async () => {
        await expect(makeSchema({ api_port: 0 })).toReject();
        await expect(makeSchema({ api_port: -1 })).toReject();
        await expect(makeSchema({ api_port: 65536 })).toReject();
        await expect(makeSchema({ api_port: 1.5 })).toReject();
        await expect(makeSchema({ api_port: 'not-a-port' })).toReject();
    });

    it('should throw with invalid initial_replication_factor values', async () => {
        await expect(makeSchema({ initial_replication_factor: 0 })).toReject();
        await expect(makeSchema({ initial_replication_factor: -1 })).toReject();
        await expect(makeSchema({ initial_replication_factor: 1.5 })).toReject();
        await expect(makeSchema({ initial_replication_factor: 'two' })).toReject();
    });

    it('should resolve with valid values', async () => {
        await expect(makeSchema({ initial_replication_factor: 1 })).toResolve();
        await expect(makeSchema({ initial_replication_factor: 5 })).toResolve();
        await expect(makeSchema({})).toResolve();
        await expect(makeSchema({ unique_id_field: 'my_id' })).toResolve();
    });
});
