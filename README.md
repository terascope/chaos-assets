# chaos-assets

> Teraslice chaos asset bundle

## Getting Started

This asset bundle requires a running Teraslice cluster, you can find the documentation [here](https://github.com/terascope/teraslice/blob/master/README.md).

```bash
# Step 1: enable corepack (ships with Node.js) and install pnpm
corepack enable
corepack prepare pnpm@latest --activate

# Step 2: make sure you have teraslice-cli installed
pnpm add -g teraslice-cli

# Step 3:
teraslice-cli assets deploy <cluster-alias> --build

```

## Operations

- [faulty_processor](./asset/docs/operations/faulty_processor.md)

- [faulty_slicer](./asset/docs/operations/faulty_slicer.md)

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](./LICENSE) licensed.
