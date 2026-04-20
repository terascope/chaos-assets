import { BaseSchema } from '@terascope/job-components';
import { Terafoundation } from '@terascope/types';
import { OomSlicerConfig } from './interfaces.js';

export default class OomSchema extends BaseSchema<OomSlicerConfig> {
    build(): Terafoundation.Schema<Omit<OomSlicerConfig, '_op'>> {
        return {
            bytes: {
                doc: 'The number of random bytes to add to an array each slice. This large array will eventually use all available memory. Defaults to 524288 (0.5 mb)',
                default: 524288,
                format(val: any) {
                    if (!Number.isInteger(val)) {
                        throw new Error('Invalid bytes parameter for oom_slicer, must be a number');
                    } else if (val <= 0) {
                        throw new Error('Invalid bytes parameter for oom_slicer, must be greater than zero');
                    }
                }
            },
            fault_on_slice: {
                doc: 'The number of milliseconds to delay on each slice. This can be used to adjust the time until the memory limit is reached. Defaults to 50',
                default: 50,
                format(val: any) {
                    if (!Number.isInteger(val)) {
                        throw new Error('Invalid delay parameter for oom_slicer, must be a number');
                    } else if (val < 0) {
                        throw new Error('Invalid delay parameter for oom_slicer, must be greater than or equal to zero');
                    }
                }
            }
        };
    }
}
