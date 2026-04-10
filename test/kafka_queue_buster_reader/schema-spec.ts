import 'jest-extended';
import { JobConfigParams } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { KafkaQueueBusterConfig } from '../../asset/src/kafka_queue_buster_reader/interfaces.js';

describe('kafka_queue_buster_reader schema', () => {
    let harness: WorkerTestHarness;

    async function makeSchema(config: Record<string, any> = {}): Promise<KafkaQueueBusterConfig> {
        const name = 'kafka_queue_buster_reader';
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
            operations: [opConfig, { _op: 'noop' }],
        };
        harness = new WorkerTestHarness(job);
        await harness.initialize();

        const validConfig = harness.executionContext.config.operations.find(
            (c) => c._op === name
        );
        return validConfig as KafkaQueueBusterConfig;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should instantiate correctly and has defaults', async () => {
        const schema = await makeSchema();

        expect(schema).toBeDefined();
        expect(schema.initial_size_kb).toEqual(10);
        expect(schema.initial_length).toEqual(5000);
        expect(schema.api_port).toEqual(8888);
        expect(schema.initial_total_slices).toBeNull();
    });

    it('should throw with invalid initial_size_kb', async () => {
        await expect(makeSchema({ initial_size_kb: 0 })).toReject();
        await expect(makeSchema({ initial_size_kb: -1 })).toReject();
        await expect(makeSchema({ initial_size_kb: 1.5 })).toReject();
        await expect(makeSchema({ initial_size_kb: 'big' })).toReject();
    });

    it('should throw with invalid initial_length', async () => {
        await expect(makeSchema({ initial_length: 0 })).toReject();
        await expect(makeSchema({ initial_length: -1 })).toReject();
        await expect(makeSchema({ initial_length: 1.5 })).toReject();
        await expect(makeSchema({ initial_length: 'many' })).toReject();
    });

    it('should throw with invalid api_port', async () => {
        await expect(makeSchema({ api_port: 0 })).toReject();
        await expect(makeSchema({ api_port: -1 })).toReject();
        await expect(makeSchema({ api_port: 65536 })).toReject();
        await expect(makeSchema({ api_port: 1.5 })).toReject();
        await expect(makeSchema({ api_port: 'port' })).toReject();
    });

    it('should throw with invalid initial_total_slices', async () => {
        await expect(makeSchema({ initial_total_slices: -1 })).toReject();
        await expect(makeSchema({ initial_total_slices: 1.5 })).toReject();
        await expect(makeSchema({ initial_total_slices: 'many' })).toReject();
    });

    it('should resolve with valid values', async () => {
        await expect(makeSchema({ initial_size_kb: 1 })).toResolve();
        await expect(makeSchema({ initial_size_kb: 100 })).toResolve();
        await expect(makeSchema({ initial_length: 1 })).toResolve();
        await expect(makeSchema({ initial_length: 10000 })).toResolve();
        await expect(makeSchema({ api_port: 1 })).toResolve();
        await expect(makeSchema({ api_port: 65535 })).toResolve();
        await expect(makeSchema({ initial_total_slices: 0 })).toResolve();
        await expect(makeSchema({ initial_total_slices: 100 })).toResolve();
        await expect(makeSchema({ initial_total_slices: null })).toResolve();
    });
});
