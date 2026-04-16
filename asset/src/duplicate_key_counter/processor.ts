import { DataEntity } from '@terascope/core-utils';
import { BatchProcessor } from '@terascope/job-components';
import { putS3Object, S3Client, doesBucketExist, createS3Bucket } from '@terascope/file-asset-apis';
import { DuplicateKeyCounterConfig } from './interfaces.js';

/**
 * DuplicateKeyCounter is a pass-through BatchProcessor that counts how often each
 * unique value of a configured field (`track_field`) appears across all records
 * it processes. It does NOT filter or modify the data stream — every record is
 * returned unchanged.
 *
 * Two output modes are supported via `report_target`:
 *   - "console" (default): logs a truncated duplicate summary to the logger after
 *     every slice. No S3 connection is required.
 *   - "s3": writes a full JSON report to a configured S3 key, overwriting it on
 *     each flush so the object always holds the latest cumulative snapshot.
 *
 * Flushing (s3 mode only) is triggered by either:
 *   - count-based: every `report_interval` slices (if > 0)
 *   - time-based:  whenever `report_interval_ms` ms have elapsed since the last
 *                  flush (if > 0)
 * A final flush always occurs on job shutdown to capture any remaining data.
 */
export default class DuplicateKeyCounter extends BatchProcessor<DuplicateKeyCounterConfig> {
    // Cumulative frequency map: field value → count and optional first-seen sample fields
    private counts = new Map<string, { count: number; sample?: Record<string, unknown> }>();
    // Parsed list of extra field names to capture per tracked value (empty = disabled)
    private recordFields: string[] = [];
    // Total number of slices received since the job started
    private slicesProcessed = 0;
    private s3Client!: S3Client;
    // Wall-clock timestamp of the last report write, used for time-based flushing
    private lastFlushTime = 0;

    async initialize(): Promise<void> {
        await super.initialize();

        if (this.opConfig.report_target === 's3') {
            // Obtain a cached S3 client from the Terafoundation connection registry
            const { client: s3Client } = await this.context.apis.foundation.createClient({
                endpoint: this.opConfig._connection,
                type: 's3',
                cached: true
            });
            this.s3Client = s3Client;

            const bucket = this.opConfig.s3_bucket;
            const exists = await doesBucketExist(this.s3Client, { Bucket: bucket });
            if (!exists) {
                this.logger.info(`duplicate_key_counter: bucket "${bucket}" not found, attempting to create it`);
                await createS3Bucket(this.s3Client, { Bucket: bucket });
                this.logger.info(`duplicate_key_counter: bucket "${bucket}" created`);
            }
        }

        // Parse the comma-separated record_fields config once at init time
        if (this.opConfig.record_fields) {
            this.recordFields = this.opConfig.record_fields.split(',').map((f) => f.trim())
                .filter(Boolean);
        }
    }

    async onBatch(slice: DataEntity[]): Promise<DataEntity[]> {
        const field = this.opConfig.track_field;

        // Start the timer on the first slice so the interval counts from when
        // data starts flowing, not from when the job was set up
        if (this.lastFlushTime === 0) {
            this.lastFlushTime = Date.now();
        }

        // Accumulate value frequencies from this slice into the running totals
        for (const record of slice) {
            const val = record[field];
            if (val != null) {
                const key = String(val);
                const entry = this.counts.get(key);
                if (entry == null) {
                    // First occurrence — capture sample fields if configured
                    const sample = this.recordFields.length > 0
                        ? Object.fromEntries(
                            this.recordFields
                                .filter((f) => record[f] != null)
                                .map((f) => [f, record[f]] as [string, unknown])
                        )
                        : undefined;
                    this.counts.set(
                        key, {
                            count: 1,
                            sample: Object.keys(sample ?? {}).length > 0 ? sample : undefined
                        }
                    );
                } else {
                    entry.count++;
                }
            }
        }

        this.slicesProcessed++;

        if (this.opConfig.report_target === 'console') {
            this.logConsoleSummary();
        } else {
            // Count-based flush: trigger after every N slices when report_interval is set
            const countFlush = this.opConfig.report_interval > 0
                && this.slicesProcessed % this.opConfig.report_interval === 0;

            // Time-based flush: trigger if enough wall-clock time has passed since the last write
            const timeoutFlush = this.opConfig.report_interval_ms > 0
                && (Date.now() - this.lastFlushTime) >= this.opConfig.report_interval_ms;

            if (countFlush || timeoutFlush) {
                await this.writeReport();
                // reset the timer whether flush was triggered by count or timeout
                this.lastFlushTime = Date.now();
            }
        }

        // Pass the slice through unmodified — this processor is observation-only
        return slice;
    }

    async shutdown(): Promise<void> {
        if (this.opConfig.report_target === 's3') {
            // Always write a final report on shutdown to capture any un-flushed counts
            await this.writeReport();
        }
        await super.shutdown();
    }

    /**
     * Logs a concise duplicate summary to the Teraslice logger.
     * Only the top CONSOLE_MAX_ENTRIES duplicates (by count) are included to
     * keep the log line readable. A trailing note is appended when entries are
     * omitted.
     */
    private logConsoleSummary(): void {
        const duplicates: Array<{ value: string; count: number }> = [];
        for (const [value, { count }] of this.counts) {
            if (count > 1) duplicates.push({ value, count });
        }
        duplicates.sort((a, b) => b.count - a.count);

        const shown = duplicates.slice(0, this.opConfig.console_max_entries);
        const omitted = duplicates.length - shown.length;
        const suffix = omitted > 0 ? ` ... and ${omitted} more` : '';

        this.logger.info(
            `duplicate_key_counter [slice ${this.slicesProcessed}] `
            + `unique=${this.counts.size} duplicates=${duplicates.length}${suffix}: `
            + JSON.stringify(shown)
        );
    }

    /**
     * Builds and uploads the dedup report to S3.
     *
     * The report lists every field value that appeared more than once, sorted
     * from highest to lowest count. It also includes summary statistics:
     * the total number of unique values seen and the total number of those
     * that were duplicated.
     *
     * The S3 key is always overwritten, so the object at `report_path` always
     * holds the most recent cumulative snapshot.
     */
    private async writeReport(): Promise<void> {
        type DuplicateEntry = {
            value: string; record_sample?: Record<string, unknown>; count: number;
        };
        const duplicates: DuplicateEntry[] = [];

        // Collect only values that appeared more than once
        for (const [value, { count, sample }] of this.counts) {
            if (count > 1) {
                const entry: DuplicateEntry = { value, count };
                if (sample != null) entry.record_sample = sample;
                duplicates.push(entry);
            }
        }

        // Sort descending by count so the most-duplicated values appear first
        duplicates.sort((a, b) => b.count - a.count);

        const report = {
            generated_at: new Date().toISOString(),
            slices_processed: this.slicesProcessed,
            unique_count: this.counts.size,
            duplicate_count: duplicates.length,
            duplicates
        };

        await putS3Object(this.s3Client, {
            Bucket: this.opConfig.s3_bucket,
            Key: this.opConfig.report_path,

            Body: Buffer.from(JSON.stringify(report, null, 2)) as any,
            ContentType: 'application/json'
        });
    }
}
