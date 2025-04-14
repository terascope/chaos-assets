import { DataEntity } from '@terascope/utils';
import { WorkerTestHarness } from 'teraslice-test-harness';

describe('faulty_processor Processor', () => {
    let harness: WorkerTestHarness;
    let data: DataEntity[];

    async function makeTest(config?: any) {
        const _op = { _op: 'faulty_processor' };
        const opConfig = config ? Object.assign({}, _op, config) : _op;

        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        return harness;
    }

    beforeEach(async () => {
        data = [
            DataEntity.make({ test: 1, name: 'foo'}),
            DataEntity.make({ test: 2, name: 'bar'}),
            DataEntity.make({ test: 3, name: 'Dan'}),
            DataEntity.make({ test: 4, name: 'Bob'})
        ];
    });

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should not throw before stated error_start', async () => {
        harness = await makeTest({
            error_start: 5,
            error_end: 10
        });
        const [slice1, slice2, slice3, slice4] = await harness.runSlice(data);
        expect(slice1).toEqual({ test: 1, name: 'foo'});
        expect(slice2).toEqual({ test: 2, name: 'bar'});
        expect(slice3).toEqual({ test: 3, name: 'Dan'});
        expect(slice4).toEqual({ test: 4, name: 'Bob'});

    });

    it('should throw slices 2 and 3', async () => {
        harness = await makeTest({
            error_start: 2,
            error_end: 3,

        });
        const [slice1] = await harness.runSlice([data[0]]);
        expect(slice1).toEqual({ test: 1, name: 'foo'});

        expect(harness.runSlice([data[1]])).toReject();
        expect(harness.runSlice([data[2]])).toReject();

        const [slice4] = await harness.runSlice([data[3]]);
        expect(slice4).toEqual({ test: 4, name: 'Bob'});

    });
});
