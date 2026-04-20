import crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import { Slicer } from '@terascope/job-components';
import { pDelay } from '@terascope/core-utils';
import { OomSlicerConfig } from './interfaces.js';

export default class OOMSlicer extends Slicer {
    oomArray: Array<Buffer>;
    bytes: number;
    delay: number;

    constructor(...args: ConstructorParameters<typeof Slicer<OomSlicerConfig>>) {
        super(...args);
        this.oomArray = [];
        this.bytes = this.opConfig.bytes;
        this.delay = this.opConfig.delay;
    }

    async slice() {
        this.oomArray.push(crypto.randomBytes(this.bytes)); // 0.5 mb = 524288

        await pDelay(this.delay);

        return {
            id: uuid(),
            foo: 'bar',
        };
    }
}
