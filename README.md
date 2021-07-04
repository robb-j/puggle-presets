# Puggle presets

My personal presets for
[puggle](https://www.npmjs.com/package/puggle).

## Presets

- [robb-j:ts-node](/src/ts-node.ts)

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
