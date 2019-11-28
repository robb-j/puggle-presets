# Puggle presets

A [monorepo](https://danluu.com/monorepo/)
of [puggle](https://www.npmjs.com/package/puggle) presets

> A work in progress

## Contents

- [robb-j:node](/preset/node)
- [robb-j:ts-node](/preset/ts-node)
- [robb-j:chowchow](/preset/chowchow)

## Future explorations

- Move back to plugins but in this repo?
- jsx-based syntax for VFile & VDir structures

```ts
root.addChild(
  <VFile name="README.md" contents={targetName} />,
  <VDir name="src">
    <VFile name=".env" contents="NODE_ENV=development" />
  </VDir>
)
```
