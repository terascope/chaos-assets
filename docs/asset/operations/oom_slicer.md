# oom_slicer

A processor that causes the slicer to fail with an out of memory (OOM) error. It does this by
filling an array with random bytes. Use the `bytes` configuration field to set how many bytes
are added each slice and the `delay` field to speed up or slow down slice creation.

## Usage

### Cause the slicer to OOM

Example of a job using the `oom_slicer` slicer

```json
{
    "name" : "exc_oom",
    "workers" : 1,
    "lifecycle" : "persistent",
    "assets" : [
        "chaos"
    ],
    "operations" : [
        {
            "_op": "oom_slicer",
            "bytes": "1000000",
            "delay": 0

        },
        {
            "_op": "noop"
        },
    ]
}
```

This example will cause the slicer to fail with an OOM error. Until then, it will produce slices that look like below:

```javascript
Slice : {
    id: '109156be-c4fb-41ea-b1b4-efe1671c5836,
    foo: 'bar',
}
```

The fetcher will then generate a batch of records based on the size specified in the job:

```javascript

DataEntity [{
    { id: 1, data: [Math.random(), Math.random(), Math.random()] },
    { id: 2, data: [Math.random(), Math.random(), Math.random()] },
    { id: 3, data: [Math.random(), Math.random(), Math.random()] }
}]

```

## Parameters

| Configuration | Description | Type |  Notes |
| ------------- | ----------- | ---- | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |
| bytes | The number of random bytes to add to an array each slice. This large array will eventually use all available memory. | Integer | default `524288` (0.5 mb) |
| delay | The number of milliseconds to delay on each slice. This can be used to adjust the time until the memory limit is reached. | Integer | default `50` |
