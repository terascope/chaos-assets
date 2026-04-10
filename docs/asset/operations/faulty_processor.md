# faulty_processor

A processor that causes several different types of failures for the teraslice worker instance.

## Usage

### Cause the worker to fail slices 10 through 20

Example of a job using the `faulty_processor` processor

```json
{
    "name" : "testing",
    "workers" : 1,
    "lifecycle" : "once",
    "assets" : [
        "chaos"
    ],
    "operations" : [
        {
            "_op": "test-reader"
        },
        {
            "_op": "faulty_processor",
            "error_start": 10,
            "error_end": 20,
            "crash_type": "throw"
        }
    ]
}
```

The output from the example job will cause slices 10-20 to become failed slices.

## Parameters

| Configuration | Description | Type |  Notes |
| ------------- | ----------- | ---- | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |
| error_start | The beginning range to start erroring slices on | Integer | default `100` |
| error_end | The end range to stop erroring slices on | Integer | default `200` |
| error_code | The exit code to use when crash_type is set to exit | Integer | default `500` |
| crash_type | The type of fault that will occur. Options are "exit", "throw", or "kill" | String options['throw', 'exit', 'kill'] | defualt `"throw"` |
