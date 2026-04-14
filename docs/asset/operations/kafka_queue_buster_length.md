# kafka_queue_buster_length

This processor replicates each record of a slice `replication_factor` times. An express server on the worker can be used to get the current replication factor or set the replication factor for subsequent slices.

This processor is designed to trigger queue full errors related to queue length in a kafka producer. The job should use an `initial_replication_factor` that, when multiplied by the slice size of the reader operation is less than the librdkafka `queue.buffering.max.messages`. Once the job is running and processing slices effectively, the API can be used to increase the `replication_factor` of each record and trigger a queue full error (enough records are being produced in one slice to reach the `queue.buffering.max.messages` limit). If `unique_id_field` is specified, each copied record will have this field's value appended with `-n` , where n is the number of times it has been copied. If not specified a new field called `queue_buster_unique_id` will be added to each copy and contain a string made of `sliceNumber-indexNumber-replicaNumber`.

 **WARNING**: The wrong combination of settings may cause NodeJS `heap out of memory` errors. Setting `queue.buffering.max.messages` artificially low (default is 100,000) is recommended to allow the worker to reach the queue length limit sooner, using less memory to store records. You may still want to increase worker `resources_limits_memory`.

## Configuration

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `api_port` | Integer | `8888` | Host port of the API server. Must be an integer between 1 and 65535. |
| `initial_replication_factor` | Integer | `1` | The number of times each record is initially replicated, before `replication_factor` is modified by an API call. |
| `unique_id_field` | String | `undefined` | The name of a unique field on each record. The value in this field will be modified to keep it unique among replicated records. |

## Example job

```json
{
    "name": "test-queue-buster-length-processor",
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
            "topic": "queue-buster-length-processor",
            "size": 5000,
            "rdkafka_options": {
                "queue.buffering.max.messages": 6000
            },
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
            "_op": "kafka_queue_buster_length",
            "initial_replication_factor": 1
        },
        {
            "_op": "kafka_sender",
            "_api_name": "kafka_sender_api"
        }
    ]
}

```

## Get current replication factor

If running in docker or kubernetes you must first `exec` into the worker pod, then use netcat to make an API request.

```bash
echo -e "GET /factor HTTP/1.0\r\nHost: localhost\r\n\r\n" | nc localhost 8888
{"replication_factor":10}
```

## Update replication factor

If running in docker or kubernetes you must first `exec` into the worker pod, then use netcat to make an API request.

```bash
echo -e "POST /factor/3 HTTP/1.0\r\nHost: localhost\r\n\r\n" | nc localhost 8888
{"replication_factor":3}
```
