# kafka_queue_buster_reader

This reader will generate slices whose configuration can be updated while the job is processing. Records will have the following fields:

- an `id` field consisting of slice number and record number: `205 3245`.
- a `longString` field which will be the `id` padded with the proper amount of whitespace to create a string of `size_kb`.

When the job starts an express server will be created on the execution controller.
The server API allows for slices to be modified as the job progresses to have larger records, more records, or a specific amount of slices produced. Adjusting `total_slices` allows a persistent job to idle at a certain slice count while adjustments are made to `length` or `size_kb` before continuing a test. Reaching `total_slices` will cause a once job to complete.

 **WARNING**: The wrong combination of settings may cause NodeJS `heap out of memory` errors. You may want to increase NodeJS `max-old-space-size`.

## Configuration

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `initial_size_kb` | Integer | `10` | Approximate size in KB to make initial records. Must be greater than zero. |
| `initial_length` | Integer | `5000` | Slice length - the amount of records to be generated per initial slice. Must be greater than zero. |
| `api_port` | Integer | `8888` | Host port of the API server. Must be an integer between 1 and 65535. |
| `initial_total_slices` | Integer \| null | `null` | The initial total number of slices to produce. Useful to end a `once` job. For a `persistent` job this can be left as `null`, or if set the job will idle once reached. If updated, the job will continue until the new total is reached. Must be an integer >= 0 or `null`. |

## Example job

```json
{
    "name": "test-queue-buster-size-kb",
    "lifecycle": "once",
    "workers": 1,
    "env_vars": {
        "NODE_OPTIONS": "--max-old-space-size=8192"
    },
    "assets": [
        "chaos",
        "kafka"
    ],
    "log_level": "debug",
    "apis": [
        {
            "_name": "kafka_sender_api",
            "_connection": "default",
            "topic": "queue-size-kb-test",
            "size": 5000
        }
    ],
    "operations": [
        {
            "_op": "kafka_queue_buster_reader",
            "initial_size_kb": 10,
            "initial_length": 5000,
            "total_slices": 1000
        },
        {
            "_op": "kafka_sender",
            "_api_name": "kafka_sender_api"
        }
    ]
}
```

## Get current length, size, or total_slices

If running in docker or kubernetes you will first `exec` into the execution controller pod.

```bash
apk add curl # teraslice exc does not include curl by default
curl localhost:8888/size
{"size_kb":10}

curl localhost:8888/length
{"length":1000}

curl localhost:8888/total_slices
{"total_slices":5000}

curl localhost:8888
{"length":1000,"size_kb":10,"total_slices":5000}
```

## Update length, size, or total_slices

If running in docker or kubernetes you will first `exec` into the execution controller pod.

```bash
apk add curl # teraslice exc does not include curl by default
curl -X POST http://localhost:8888/length/5000
curl -X POST http://localhost:8888/size/500
curl -X POST http://localhost:8888/total_slices/10
```
