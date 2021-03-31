### Code formatting

This repo uses [Prettier](https://prettier.io/) to automatically format code.
It works using [yorkie](https://www.npmjs.com/package/yorkie)
and [lint-staged](https://www.npmjs.com/package/lint-staged) to
automatically format code when it is staged for a commit.
This means that code that is pushed to the repo is always formatted to a consistent standard.

You can manually run the formatter with `npm run prettier` if you want.

Prettier is slightly configured in [package.json#prettier](/package.json)
and can ignores files using [.prettierignore](/.prettierignore).
