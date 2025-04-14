import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as processors from '../asset/dist/index.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const assetDir = path.join(dirname, '..', 'asset', 'src');

describe('index', () => {
    it('should export every processor', () => {
        const processorDirs = fs.readdirSync(assetDir, { withFileTypes: true })
            .filter((i) => isProcessor(i.name))
            .map((i) => i.name);

        for (const p of processorDirs) {
            expect(p in processors.ASSETS).toBe(true);
        }
    });
});

function isProcessor(dirName: string) {
    try {
        return fs.readdirSync(path.join(assetDir, dirName)).includes('processor.ts');
    } catch (e) {
        return false;
    }
}
