import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { AnyObject } from '@terascope/job-components';
import { FaultyProcessorConfig } from '../../asset/src/faulty_processor/interfaces.js';

describe('faulty_processor schema', () => {
    let harness: WorkerTestHarness;

    async function makeSchema(config: AnyObject = {}): Promise<FaultyProcessorConfig> {
        const name = 'faulty_processor';
        const opConfig = Object.assign({}, { _op: name }, config);

        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        const validConfig = harness.executionContext.config.operations.find(
            (testConfig) => testConfig._op === name
        );

        return validConfig as FaultyProcessorConfig;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should instantiate correctly and has defaults', async () => {
        const schema = await makeSchema();

        expect(schema).toBeDefined();
        expect(schema.error_start).toEqual(100);
        expect(schema.error_end).toEqual(200);
        expect(schema.error_code).toEqual(500);
        expect(schema.crash_type).toEqual('throw');
    });

    it('should throw with bad values', async () => {
        await expect(makeSchema({ error_start: -234234 })).toReject();
        await expect(makeSchema({ error_start: 'hello' })).toReject();
        await expect(makeSchema({ error_start: {} })).toReject();

        await expect(makeSchema({ error_end: { hello: 0 } })).toReject();
        await expect(makeSchema({ error_end: [10] })).toReject();
        await expect(makeSchema({ error_end: -1 })).toReject();

        await expect(makeSchema({ error_code: -1 })).toReject();
        await expect(makeSchema({ error_code: 'foo' })).toReject();
        await expect(makeSchema({ error_code: {} })).toReject();

        await expect(makeSchema({ crash_type: 'throww' })).toReject();
        await expect(makeSchema({ crash_type: 10 })).toReject();
        await expect(makeSchema({ crash_type: ['throw'] })).toReject();
    });

    it('should resolve with valid values', async () => {
        await expect(makeSchema({ error_start: 105, errorEnd: 106 })).toResolve();
        await expect(makeSchema({ error_start: 1 })).toResolve();

        await expect(makeSchema({ error_code: 0 })).toResolve();
        await expect(makeSchema({ error_code: 1 })).toResolve();
        await expect(makeSchema({ error_code: 100 })).toResolve();

        await expect(makeSchema({ crash_type: 'throw' })).toResolve();
        await expect(makeSchema({ crash_type: 'exit' })).toResolve();
        await expect(makeSchema({ crash_type: 'kill' })).toResolve();
    });

    it('should throw with conflicting config', async () => {
        await expect(makeSchema({ error_start: 10, error_end: 5 }))
            .rejects.toThrow('"error_start" must be less than "error_end" in faulty_processor config');

        await expect(makeSchema({ error_start: 105, error_end: 105 })).toReject();
    });
});
