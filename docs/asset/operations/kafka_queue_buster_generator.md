# kafka_queue_buster_generator

This operation will generate slices whose configuration can be updated while the job is processing.

Records will have the following fields:

- an `id` field consisting of slice number and record number: `205 3245`.
- a `longString` field which will be the `id` padded with the proper amount of whitespace to create a string of `size_kb`.

 The intended workflow is for a job spec to contain reasonable `initial_length` or `initial_size_kb` settings that will not cause queue full errors. When the job starts, each record on the slice will include a `longString` field of `initial_size_kb` and `initial_length` records will be added to each slice. An express server will be created on the execution controller. The server API allows for slices to be modified as the job progresses to have larger records, more records, or a specific amount of slices produced. Updating the `length` or `size_kb` will create new slices with more records or larger records. The execution controller slice queue is limited to 5 records, so there will be a small delay while the old slices are processed before new slices created with an updated configuration will be able to affect the producer queue. After a queue full error is triggered the configuration can be returned to something reasonable to allow the job to return to a normal state and continue processing records.

 Adjusting `total_slices` allows a persistent job to idle at a certain slice count while adjustments are made to `length` or `size_kb` before continuing a test. Reaching `total_slices` will cause a once job to complete.

 **WARNING**: The wrong combination of settings may cause NodeJS `heap out of memory` errors. You may want to increase worker `resources_limits_memory`.

## Get current length, size, total_slices, or all

If running in docker or kubernetes you will first `exec` into the execution controller pod, then use netcat to make an API request.

```bash
# teraslice v3.5.3 or greater
curl -XGET "localhost:8888/size"
{"size_kb":10}

curl -XGET "localhost:8888/length"
{"length":1000}

curl -XGET "localhost:8888/total_slices"
{"total_slices":5000}

curl -XGET "localhost:8888"
{"length":1000,"size_kb":10,"total_slices":5000}


# teraslice v 3.0.0 to v3.5.2
echo -e "GET /size HTTP/1.0\r\nHost: localhost\r\n\r\n" | nc localhost 8888
{"size_kb":10}

echo -e "GET /length HTTP/1.0\r\nHost: localhost\r\n\r\n" | nc localhost 8888
{"length":1000}

echo -e "GET /total_slices HTTP/1.0\r\nHost: localhost\r\n\r\n" | nc localhost 8888
{"total_slices":5000}

echo -e "GET / HTTP/1.0\r\nHost: localhost\r\n\r\n" | nc localhost 8888
{"length":1000,"size_kb":10,"total_slices":5000}
```

## Update length, size, or total_slices

If running in docker or kubernetes you will first `exec` into the execution controller pod, then use netcat to make an API request.

```bash
# teraslice v3.5.3 or greater
curl -XPOST "localhost:8888/length/5000"
curl -XPOST "localhost:8888/size/500"
curl -XPOST "localhost:8888/total_slices/10"

# teraslice v 3.0.0 to v3.5.2
echo -e "POST /length/5000 HTTP/1.0\r\nHost: localhost\r\n\r\n" | nc localhost 8888
echo -e "POST /size/500 HTTP/1.0\r\nHost: localhost\r\n\r\n" | nc localhost 8888
echo -e "POST /total_slices/10 HTTP/1.0\r\nHost: localhost\r\n\r\n" | nc localhost 8888
```

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
    "resources_requests_memory": 1073741824,
    "resources_limits_memory": 3221225472,
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
            "_op": "kafka_queue_buster_generator",
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
