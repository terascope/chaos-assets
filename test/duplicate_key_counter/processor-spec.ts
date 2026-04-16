import 'jest-extended';
import { DataEntity, debugLogger } from '@terascope/core-utils';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { TestClientConfig } from '@terascope/job-components';
import {
    createS3Client,
    getS3Object,
    deleteAllS3Objects,
    deleteS3Bucket,
    doesBucketExist,
    S3ClientConfig,
    S3Client
} from '@terascope/file-asset-apis';
import type { Terafoundation } from '@terascope/types';

const logger = debugLogger('test-logger');

const TEST_S3_CONFIG: S3ClientConfig = {
    endpoint: process.env.MINIO_HOST ?? 'http://localhost:9000',
    accessKeyId: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
    forcePathStyle: true,
    sslEnabled: false,
    region: 'us-east-1',
};

const TEST_BUCKET = `duplicate-key-counter-${crypto.randomUUID()}`;

const S3_DEFAULTS = {
    report_target: 's3',
    s3_bucket: TEST_BUCKET,
    report_path: 'reports/test.json',
    report_interval: 0,
    report_interval_ms: 0,
    _connection: 'default'
};

const createClient: Terafoundation.CreateClientFactoryFn = async (config, clientLogger) => {
    const client = await createS3Client(config as S3ClientConfig, clientLogger);
    return { client, logger: clientLogger };
};

const defaultClients: TestClientConfig[] = [
    {
        type: 's3',
        endpoint: 'default',
        config: TEST_S3_CONFIG,
        createClient
    }
];

describe('duplicate_key_counter processor', () => {
    let harness: WorkerTestHarness;
    let s3Client: S3Client;

    function makeRecords(values: (string | null | undefined)[], field = 'id'): DataEntity[] {
        return values.map((v) => DataEntity.make(v != null ? { [field]: v } : {}));
    }

    async function makeConsoleTest(config: Record<string, unknown> = {}): Promise<WorkerTestHarness> {
        const opConfig = {
            _op: 'duplicate_key_counter',
            track_field: 'id',
            report_target: 'console',
            ...config
        };
        harness = WorkerTestHarness.testProcessor(opConfig);
        await harness.initialize();
        return harness;
    }

    async function makeS3Test(config: Record<string, unknown> = {}): Promise<WorkerTestHarness> {
        const opConfig = {
            _op: 'duplicate_key_counter',
            track_field: 'id',
            ...S3_DEFAULTS,
            ...config
        };
        harness = WorkerTestHarness.testProcessor(opConfig, { clients: defaultClients });
        await harness.initialize();
        return harness;
    }

    beforeAll(async () => {
        s3Client = await createS3Client(TEST_S3_CONFIG, logger);
    });

    // Fetches the report from MinIO and returns it as a parsed object.
    // Throws NoSuchKey if the processor hasn't written it yet, which lets
    // tests use toReject() to confirm no flush happened.
    async function readReport(key = S3_DEFAULTS.report_path): Promise<any> {
        const result = await getS3Object(s3Client, { Bucket: TEST_BUCKET, Key: key });
        const body = await result.Body?.transformToString();
        return JSON.parse(body!);
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
        if (await doesBucketExist(s3Client, { Bucket: TEST_BUCKET })) {
            await deleteAllS3Objects(s3Client, { Bucket: TEST_BUCKET });
        }
    });

    describe('console mode (pass-through behaviour)', () => {
        it('should return all records unchanged', async () => {
            await makeConsoleTest();
            const input = makeRecords(['a', 'b', 'c']);
            const output = await harness.runSlice(input);

            expect(output).toHaveLength(3);
            expect(output[0]).toMatchObject({ id: 'a' });
            expect(output[1]).toMatchObject({ id: 'b' });
            expect(output[2]).toMatchObject({ id: 'c' });
        });

        it('should pass through records even when all values are duplicates', async () => {
            await makeConsoleTest();
            const output = await harness.runSlice(makeRecords(['dup', 'dup', 'dup']));
            expect(output).toHaveLength(3);
        });

        it('should ignore records where track_field is null or missing', async () => {
            await makeConsoleTest();
            const input = [
                DataEntity.make({ id: 'a' }),
                DataEntity.make({ other: 'no-id' }),
                DataEntity.make({ id: null }),
            ];
            const output = await harness.runSlice(input);
            expect(output).toHaveLength(3);
        });

        it('should accumulate counts across multiple slices', async () => {
            await makeConsoleTest();
            await harness.runSlice(makeRecords(['a', 'b']));
            await harness.runSlice(makeRecords(['a', 'c']));
            const output = await harness.runSlice(makeRecords(['a']));
            expect(output).toHaveLength(1);
            expect(output[0]).toMatchObject({ id: 'a' });
        });
    });

    describe('console mode — record_fields sampling', () => {
        it('should not throw when record_fields are configured', async () => {
            await makeConsoleTest({ record_fields: 'name,email' });
            const input = [
                DataEntity.make({ id: 'x1', name: 'Alice', email: 'a@example.com' }),
                DataEntity.make({ id: 'x1', name: 'Alice', email: 'a@example.com' }),
            ];
            const output = await harness.runSlice(input);
            expect(output).toHaveLength(2);
        });
    });

    describe('s3 mode — flush triggers', () => {
        it('should write the report every report_interval slices', async () => {
            await makeS3Test({ report_interval: 2, report_path: 'reports/interval.json' });

            await harness.runSlice(makeRecords(['a', 'b']));
            // slice 1 — no flush yet
            await expect(readReport('reports/interval.json')).toReject();

            await harness.runSlice(makeRecords(['a', 'c']));
            // slice 2 — flush
            const report2 = await readReport('reports/interval.json');
            expect(report2.slices_processed).toBe(2);

            await harness.runSlice(makeRecords(['b']));
            // slice 3 — no flush
            const report3 = await readReport('reports/interval.json');
            expect(report3.slices_processed).toBe(2); // unchanged

            await harness.runSlice(makeRecords(['b']));
            // slice 4 — flush
            const report4 = await readReport('reports/interval.json');
            expect(report4.slices_processed).toBe(4);
        });

        it('should write a final report on shutdown regardless of interval', async () => {
            await makeS3Test({ report_interval: 100, report_path: 'reports/shutdown.json' });
            await harness.runSlice(makeRecords(['a']));
            await expect(readReport('reports/shutdown.json')).toReject();

            await harness.shutdown();
            const report = await readReport('reports/shutdown.json');
            expect(report.slices_processed).toBe(1);
            (harness as any) = null;
        });

        it('should write the report after report_interval_ms elapses', async () => {
            await makeS3Test({ report_interval_ms: 50, report_path: 'reports/ms.json' });
            await harness.runSlice(makeRecords(['a'])); // starts the timer
            await new Promise((r) => setTimeout(r, 50));
            await harness.runSlice(makeRecords(['b'])); // 50ms elapsed — triggers flush
            const report = await readReport('reports/ms.json');
            expect(report.slices_processed).toBe(2);
        });

        it('should not write if neither interval is reached', async () => {
            await makeS3Test({ report_interval: 50, report_interval_ms: 0, report_path: 'reports/none.json' });
            await harness.runSlice(makeRecords(['a']));
            await expect(readReport('reports/none.json')).toReject();
        });
    });

    describe('s3 mode — report content', () => {
        it('should write a JSON report with the correct structure', async () => {
            await makeS3Test({ report_interval: 1 });
            await harness.runSlice(makeRecords(['a', 'b', 'a']));

            const report = await readReport();
            expect(report).toMatchObject({
                slices_processed: 1,
                unique_count: 2,
                duplicate_count: 1
            });
            expect(report.generated_at).toBeDefined();
            expect(report.duplicates).toHaveLength(1);
            expect(report.duplicates[0]).toMatchObject({ value: 'a', count: 2 });
        });

        it('should sort duplicates by count descending', async () => {
            await makeS3Test({ report_interval: 1 });
            await harness.runSlice(makeRecords(['a', 'a', 'c', 'c', 'c']));

            const { duplicates } = await readReport();
            expect(duplicates[0].value).toBe('c');
            expect(duplicates[0].count).toBe(3);
            expect(duplicates[1].value).toBe('a');
            expect(duplicates[1].count).toBe(2);
        });

        it('should include record_sample when record_fields is configured', async () => {
            await makeS3Test({ report_interval: 1, record_fields: 'name' });
            await harness.runSlice([
                DataEntity.make({ id: 'dup', name: 'Alice' }),
                DataEntity.make({ id: 'dup', name: 'Alice' }),
            ]);

            const { duplicates } = await readReport();
            expect(duplicates[0].record_sample).toEqual({ name: 'Alice' });
        });

        it('should not include record_sample when record_fields is empty', async () => {
            await makeS3Test({ report_interval: 1, record_fields: '' });
            await harness.runSlice(makeRecords(['dup', 'dup']));

            const { duplicates } = await readReport();
            expect(duplicates[0].record_sample).toBeUndefined();
        });
    });

    describe('s3 mode — bucket initialisation', () => {
        const NEW_BUCKET = 'duplicate-key-counter-new-bucket';

        afterEach(async () => {
            if (await doesBucketExist(s3Client, { Bucket: NEW_BUCKET })) {
                await deleteAllS3Objects(s3Client, { Bucket: NEW_BUCKET });
                await deleteS3Bucket(s3Client, { Bucket: NEW_BUCKET });
            }
        });

        it('should create the bucket if it does not exist', async () => {
            await makeS3Test({ s3_bucket: NEW_BUCKET });
            // Shut down before afterEach cleans up the bucket, otherwise
            // shutdown's final writeReport fires against the already-deleted bucket
            await harness.shutdown();
            (harness as any) = null;
            expect(await doesBucketExist(s3Client, { Bucket: NEW_BUCKET })).toBeTrue();
        });

        it('should not fail if the bucket already exists', async () => {
            await expect(makeS3Test()).toResolve();
            expect(await doesBucketExist(s3Client, { Bucket: TEST_BUCKET })).toBeTrue();
        });
    });
});
