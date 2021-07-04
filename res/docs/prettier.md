### Code formatting

This repo uses [Prettier](https://prettier.io/),
[yorkie](https://www.npmjs.com/package/yorkie)
and [lint-staged](https://www.npmjs.com/package/lint-staged) to
automatically format code when it is staged for a commit.
So all code pushed to the repository is formatted to a consistent standard.

You can manually run the formatter with `npm run prettier` if you want.

Prettier ignores files using [.prettierignore](/.prettierignore)
and skips lines after a `// prettier-ignore` comment.
