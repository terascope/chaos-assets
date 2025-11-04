import { v4 as uuid } from 'uuid';
import { Slicer, pDelay } from '@terascope/job-components';
import crypto from 'crypto';
import { OomSlicer } from './interfaces';

export default class OOMSlicer extends Slicer {
    oomArray: Array<Buffer>;
    bytes: number;
    delay: number;

    constructor(...args: ConstructorParameters<typeof Slicer<OomSlicer>>) {
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
