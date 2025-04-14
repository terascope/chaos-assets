import { ProcessorCore, DataEntity } from '@terascope/job-components';
import { FaultyProcessorConfig } from './interfaces.js';

export default class FaultyProcessor extends ProcessorCore<FaultyProcessorConfig> {
    slicesProcessed: number;
    errorStart: number;
    errorEnd: number;
    errorCode: number;
    crashType: 'exit' | 'throw' | 'kill';

    constructor(...args: ConstructorParameters<typeof ProcessorCore<FaultyProcessorConfig>>) {
        super(...args);

        this.slicesProcessed = -1;
        this.errorStart = this.opConfig.error_start;
        this.errorEnd = this.opConfig.error_end;
        this.errorCode = this.opConfig.error_code | 500;
        this.crashType = this.opConfig.crash_type;
    }

    async initialize(): Promise<void> {
        await super.initialize();
    }

    handle(input: DataEntity[]): Promise<DataEntity[]> {
        this.slicesProcessed++;

        if (this.slicesProcessed >= (this.errorStart - 1) && this.slicesProcessed < this.errorEnd) {
            if (this.crashType === 'throw') {
                throw new Error('Processor error');
            } else if (this.crashType === 'exit') {
                process.exit(this.errorCode);
            } else if (this.crashType === 'kill') {
                process.kill(this.errorCode, 'SIGKILL');
            }
        }

        return Promise.resolve(input);
    }
}
