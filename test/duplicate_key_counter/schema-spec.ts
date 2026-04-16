import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { OpConfig } from '@terascope/job-components';
import { DuplicateKeyCounterConfig } from '../../asset/src/duplicate_key_counter/interfaces.js';

describe('duplicate_key_counter schema', () => {
    let harness: WorkerTestHarness;

    async function makeSchema(config: Partial<OpConfig> = {}): Promise<DuplicateKeyCounterConfig> {
        const name = 'duplicate_key_counter';
        const opConfig = Object.assign({}, { _op: name, track_field: 'id' }, config);
        harness = WorkerTestHarness.testProcessor(opConfig);
        await harness.initialize();
        return harness.executionContext.config.operations.find(
            (c) => c._op === name
        ) as DuplicateKeyCounterConfig;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should have correct defaults', async () => {
        const schema = await makeSchema();
        expect(schema.report_target).toBe('console');
        expect(schema.report_interval).toBe(100);
        expect(schema.report_interval_ms).toBe(0);
        expect(schema.record_fields).toBe('');
        expect(schema.console_max_entries).toBe(10);
        expect(schema._connection).toBe('default');
        expect(schema.s3_bucket).toBe('');
        expect(schema.report_path).toBe('');
    });

    it('should throw when track_field is missing', async () => {
        await expect(makeSchema({ track_field: undefined as any })).toReject();
    });

    it('should throw with an invalid report_target', async () => {
        await expect(makeSchema({ report_target: 'kafka' as any })).toReject();
        await expect(makeSchema({ report_target: 123 as any })).toReject();
    });

    it('should throw with invalid report_interval values', async () => {
        await expect(makeSchema({ report_interval: -1 })).toReject();
        await expect(makeSchema({ report_interval: 1.5 })).toReject();
        await expect(makeSchema({ report_interval: 'foo' as any })).toReject();
    });

    it('should throw with invalid report_interval_ms values', async () => {
        await expect(makeSchema({ report_interval_ms: -1 })).toReject();
        await expect(makeSchema({ report_interval_ms: 0.5 })).toReject();
        await expect(makeSchema({ report_interval_ms: 'bad' as any })).toReject();
    });

    it('should throw with invalid console_max_entries values', async () => {
        await expect(makeSchema({ console_max_entries: 0 })).toReject();
        await expect(makeSchema({ console_max_entries: -5 })).toReject();
        await expect(makeSchema({ console_max_entries: 1.5 })).toReject();
    });

    it('should throw when report_target is s3 but s3_bucket is missing', async () => {
        await expect(makeSchema({
            report_target: 's3',
            report_path: 'reports/out.json'
        })).rejects.toThrow('s3_bucket is required');
    });

    it('should throw when report_target is s3 but report_path is missing', async () => {
        await expect(makeSchema({
            report_target: 's3',
            s3_bucket: 'my-bucket'
        })).rejects.toThrow('report_path is required');
    });

    it('should accept valid optional values', async () => {
        await expect(makeSchema({ report_interval: 0 })).toResolve();
        await expect(makeSchema({ report_interval: 1 })).toResolve();
        await expect(makeSchema({ report_interval_ms: 0 })).toResolve();
        await expect(makeSchema({ report_interval_ms: 5000 })).toResolve();
        await expect(makeSchema({ console_max_entries: 1 })).toResolve();
        await expect(makeSchema({ console_max_entries: 100 })).toResolve();
        await expect(makeSchema({ record_fields: 'email,account_type' })).toResolve();
        await expect(makeSchema({ report_target: 'console' })).toResolve();
    });
});
