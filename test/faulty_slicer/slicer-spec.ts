import { SlicerRecoveryData, LifeCycle } from '@terascope/job-components';
import { SlicerTestHarness, newTestJobConfig } from 'teraslice-test-harness';

interface SlicerTestArgs {
    opConfig: any;
    numOfSlicers?: number;
    recoveryData?: SlicerRecoveryData[];
    lifecycle?: LifeCycle;
    size: number;
}

describe('faulty_slicer slicer', () => {
    let harness: SlicerTestHarness;
    let clients: any;

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    async function makeSlicerTest({
        opConfig,
        numOfSlicers = 1,
        recoveryData,
        lifecycle = 'once',
        size
    }: SlicerTestArgs) {
        const job = newTestJobConfig({
            analytics: true,
            slicers: numOfSlicers,
            lifecycle,
            operations: [
                opConfig,
                {
                    _op: 'noop',
                    size
                }
            ],
        });
        harness = new SlicerTestHarness(job, { clients });
        await harness.initialize(recoveryData);
        return harness;
    }

    it('Will generate slices and not fail', async () => {
        const opConfig = { _op: 'faulty_slicer', size: 10, fault_on_slice: 5 };
        const config: SlicerTestArgs = {
            opConfig,
            numOfSlicers: 1,
            size: 5
        };

        const test = await makeSlicerTest(config);

        const [slice1] = await test.createSlices();
        expect(slice1).toEqual({ size: 10, slice_number: 1 });

        const [slice2] = await test.createSlices();
        expect(slice2).toEqual({ size: 10, slice_number: 2 });

        const [slice3] = await test.createSlices();
        expect(slice3).toEqual({ size: 10, slice_number: 3 });

        const [slice4] = await test.createSlices();
        expect(slice4).toEqual({ size: 10, slice_number: 4 });
    });

    it('Will fail on slice 3', async () => {
        const opConfig = { _op: 'faulty_slicer', size: 10, fault_on_slice: 3 };
        const config: SlicerTestArgs = {
            opConfig,
            numOfSlicers: 1,
            size: 5
        };

        const test = await makeSlicerTest(config);

        const [slice1] = await test.createSlices();
        expect(slice1).toEqual({ size: 10, slice_number: 1 });

        const [slice2] = await test.createSlices();
        expect(slice2).toEqual({ size: 10, slice_number: 2 });

        expect(test.createSlices()).rejects.toThrow('Fault on slice 3..');
    });
});
