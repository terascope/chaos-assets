# duplicate_key_counter

A pass-through processor that tracks how often each unique value of a configured field appears across all records in the pipeline. Records are never filtered or modified — every record is returned unchanged.

Two output modes are available via `report_target`:

- **`console`** (default): logs a truncated duplicate summary to the Teraslice logger after every slice. No S3 connection is required.
- **`s3`**: writes a full JSON report to a configured S3 key, overwriting it on each flush so the object always holds the latest cumulative snapshot. A final flush always occurs on job shutdown.

## Usage

### Log duplicate summaries to the console every slice

```json
{
    "name": "dedup-check",
    "workers": 1,
    "lifecycle": "once",
    "assets": [
        "chaos"
    ],
    "operations": [
        {
            "_op": "test-reader"
        },
        {
            "_op": "duplicate_key_counter",
            "track_field": "user_id"
        }
    ]
}
```

The logger will emit a line like the following after each slice:

```
duplicate_key_counter [slice 1] unique=4200 duplicates=37: [{"value":"abc123","count":5},...]
```

### Write a full JSON dedup report to S3 every 50 slices

```json
{
    "name": "dedup-s3-report",
    "workers": 1,
    "lifecycle": "once",
    "assets": [
        "chaos"
    ],
    "operations": [
        {
            "_op": "test-reader"
        },
        {
            "_op": "duplicate_key_counter",
            "track_field": "user_id",
            "report_target": "s3",
            "s3_bucket": "my-reports-bucket",
            "report_path": "reports/dedup-user_id.json",
            "report_interval": 50,
            "record_fields": "email,account_type"
        }
    ]
}
```

The S3 object is overwritten on each flush. Its structure looks like:

```json
{
    "generated_at": "2026-04-15T00:00:00.000Z",
    "slices_processed": 50,
    "unique_count": 4200,
    "duplicate_count": 37,
    "duplicates": [
        {
            "value": "abc123",
            "count": 5,
            "record_sample": { "email": "abc@example.com", "account_type": "free" }
        }
    ]
}
```

`record_sample` is only present when `record_fields` is configured. Values are captured from the **first** occurrence of each tracked value.

## Parameters

| Configuration | Description | Type | Notes |
| ------------- | ----------- | ---- | ------ |
| _op | Name of operation, must match the file name exactly | String | required |
| track_field | Field on each record whose value is tracked for uniqueness | String | required |
| report_target | Where to send the duplicate report | String options `["console", "s3"]` | default `"console"` |
| s3_bucket | S3 bucket where the dedup report will be written | String | required when `report_target` is `"s3"` |
| report_path | S3 key for the report file (e.g. `"reports/dedup.json"`). Overwritten on each flush. | String | required when `report_target` is `"s3"` |
| report_interval | Write the S3 report every N slices. Set to `0` to disable count-based flushing. | Integer | default `100` |
| report_interval_ms | Write the S3 report if this many milliseconds have elapsed since the last flush. Set to `0` to disable. | Integer | default `0` |
| record_fields | Comma-separated list of fields to capture as a sample from the first occurrence of each tracked value (e.g. `"email,account_type"`). Omitted from report when empty. | String | optional |
| console_max_entries | Maximum number of duplicate entries shown per console log line when `report_target` is `"console"` | Integer | default `10` |
| _connection | Terafoundation S3 connection name to use | String | default `"default"` |
