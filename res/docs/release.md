<!-- WIP -->

### Releasing

This repo uses [GitHub Actions](https://docs.github.com/en/actions)
to build a container when you tag a commit.
This is designed to be used with [npm version](https://docs.npmjs.com/cli/version)
so all container images are [semantically versioned](https://semver.org/).
The `:latest` docker tag is not used.

This job is defined in [.github/workflows/container.yml](/.github/workflows/container.yml)
which builds a container according to the the [Dockerfile](/Dockerfile)
and **only** runs when you push a [tag](https://git-scm.com/book/en/v2/Git-Basics-Tagging).

```bash
# Deploy a new version of the CLI
npm version # major | minor | patch
git push --tags
```
