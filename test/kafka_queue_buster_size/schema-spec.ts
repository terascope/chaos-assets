import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { OpConfig } from '@terascope/job-components';
import { KafkaQueueBusterSizeConfig } from '../../asset/src/kafka_queue_buster_size/interfaces.js';

// Use ports in a range unlikely to conflict with other tests
let portCounter = 19100;

describe('kafka_queue_buster_size schema', () => {
    let harness: WorkerTestHarness;

    async function makeSchema(config: Partial<OpConfig> = {}): Promise<KafkaQueueBusterSizeConfig> {
        const name = 'kafka_queue_buster_size';
        const opConfig = Object.assign({}, { _op: name, api_port: portCounter++ }, config);

        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        const validConfig = harness.executionContext.config.operations.find(
            (testConfig) => testConfig._op === name
        );

        return validConfig as KafkaQueueBusterSizeConfig;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should instantiate correctly and has defaults', async () => {
        const schema = await makeSchema();

        expect(schema).toBeDefined();
        expect(schema.additional_field_name).toEqual('large_field');
        expect(schema.api_port).toBeGreaterThan(0);
        expect(schema.initial_size_kb).toEqual(10);
    });

    it('should throw with invalid api_port values', async () => {
        await expect(makeSchema({ api_port: 0 })).toReject();
        await expect(makeSchema({ api_port: -1 })).toReject();
        await expect(makeSchema({ api_port: 65536 })).toReject();
        await expect(makeSchema({ api_port: 1.5 })).toReject();
        await expect(makeSchema({ api_port: 'not-a-port' })).toReject();
    });

    it('should throw with invalid initial_size_kb values', async () => {
        await expect(makeSchema({ initial_size_kb: 0 })).toReject();
        await expect(makeSchema({ initial_size_kb: -1 })).toReject();
        await expect(makeSchema({ initial_size_kb: 1.5 })).toReject();
        await expect(makeSchema({ initial_size_kb: 'big' })).toReject();
    });

    it('should resolve with valid values', async () => {
        await expect(makeSchema({ additional_field_name: 'my_field' })).toResolve();
        await expect(makeSchema({ api_port: 9000 })).toResolve();
        await expect(makeSchema({ api_port: 1 })).toResolve();
        await expect(makeSchema({ api_port: 65535 })).toResolve();
        await expect(makeSchema({ initial_size_kb: 1 })).toResolve();
        await expect(makeSchema({ initial_size_kb: 100 })).toResolve();
    });
});
