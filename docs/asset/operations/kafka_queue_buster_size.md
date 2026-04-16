# kafka_queue_buster_size

This processor allows an additional field of a certain size to be added to each record of a slice. The field will be a string that begins with the slice number and index from the DataEntity array followed by the appropriate amount of whitespace to reach the size requested. An express server on the worker can be used to get the current size of the field or set the size of the field for subsequent slices.

This processor is designed to trigger queue full errors related to queue size in a kafka producer. The job should use an `initial_size_kb` that is less than the librdkafka `message.max.bytes` and when multiplied by the slice size from the reader is less than librdkafka `queue.buffering.max.kbytes`. Once the job is running and processing slices effectively, the API can be used to increase the `size_kb` of each record and trigger a queue full error (each record is large enough that new records in the slice can be added to the queue faster than they can be written to the broker, causing `queue.buffering.max.kbytes` to be reached).

 **WARNING**: The wrong combination of settings may cause NodeJS `heap out of memory` errors. You may want to increase worker `resources_limits_memory`.

## Configuration

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `additional_field_name` | String | `"large_field"` | Name of field to add to each record that will contain a large string. |
| `initial_size_kb` | Integer | `10` | Approximate size in KB to make initial records. Must be greater than zero. |
| `api_port` | Integer | `8888` | Host port of the API server. Must be an integer between 1 and 65535. |

## Example job

```json
{
    "name": "test-queue-buster-size-processor",
    "lifecycle": "persistent",
    "workers": 1,
    "resources_requests_memory": 1073741824,
    "resources_limits_memory": 3221225472,
    "assets": [
        "chaos",
        "kafka"
    ],
    "log_level": "trace",
    "apis": [
        {
            "_name": "kafka_reader_api",
            "topic": "queue-buster-test-initial-data",
            "group": "group-v1",
            "size": 5000
        },
        {
            "_name": "kafka_sender_api",
            "_connection": "default",
            "topic": "queue-buster-size-processor",
            "size": 5000,
            "delivery_report": {
                "wait": false,
                "only_error": false,
                "on_error": "log"
            }
        }
    ],
    "operations": [
        {
            "_op": "kafka_reader",
            "_api_name": "kafka_reader_api"
        },
        {
            "_op": "kafka_queue_buster_size",
            "initial_size_kb": 1
        },
        {
            "_op": "kafka_sender",
            "_api_name": "kafka_sender_api"
        }
    ]
}

```

## Get current size

If running in docker or kubernetes you must first `exec` into the worker pod, then use netcat to make an API request.

```bash
# teraslice v3.5.3 or greater
curl -XGET "localhost:8888/size"
{"size_kb":10}

# teraslice v 3.0.0 to v3.5.2
echo -e "GET /size HTTP/1.0\r\nHost: localhost\r\n\r\n" | nc localhost 8888
{"size_kb":10}
```

## Update size

If running in docker or kubernetes you must first `exec` into the worker pod, then use netcat to make an API request.

```bash
# teraslice v3.5.3 or greater
curl -XPOST "localhost:8888/size/500"
{"size_kb":500}

# teraslice v 3.0.0 to v3.5.2
echo -e "POST /size/500 HTTP/1.0\r\nHost: localhost\r\n\r\n" | nc localhost 8888
{"size_kb":500}
```
