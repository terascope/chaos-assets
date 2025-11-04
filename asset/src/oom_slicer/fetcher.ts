import { Fetcher } from '@terascope/job-components';

export default class OomFetcher extends Fetcher {
    async fetch() {
        const result = [];
        for (let i = 0; i < 10; i++) {
            result.push({
                id: i,
                data: [Math.random(), Math.random(), Math.random()],
            });
        }
        return result;
    }
}
