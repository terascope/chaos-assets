# faulty_slicer

A processor that causes the slicer to fail on a specific slice.

## Usage

### Cause the slicer to fail on slice number 100

Example of a job using the `faulty_slicer` slicer

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
            "_op": "faulty_slicer",
            "size": 3,
            "fault_on_slice": 100

        },
        {
            "_op": "noop"
        },
    ]
}
```

The output from the example will cause the slicer to fail on slice number 100. Until then, it will produce slices that look like below:

```javascript
Slice : { size: 3, slice_number: 1 }
```

The fetcher will then generate a batch of records based on the size specified in the job:

```javascript

DataEntity [{
    { recordNumber: 1, fromSliceNumber: 1 },
    { recordNumber: 2, fromSliceNumber: 1 },
    { recordNumber: 3, fromSliceNumber: 1 }
}]

```

## Parameters

| Configuration | Description | Type |  Notes |
| ------------- | ----------- | ---- | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |
| size | The amount of records to be generated per slice | Integer | default `1` |
| fault_on_slice | The amount of slices to be produced before faulting | Integer | default `100` |
