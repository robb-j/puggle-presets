### Testing

This repo uses automated tests to ensure that everything is working correctly,
avoid bad code and reduce defects.
[Jest](https://www.npmjs.com/package/jest) is used to run these tests.
Tests are any file in `src/` that end with `.spec.ts`,
by convention they are inline with the source code,
in a parallel folder called `__tests__`.

```bash
# cd to/this/folder

# Run the tests
npm test -s

# Generate code coverage
npm run coverage -s
```
