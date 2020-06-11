import { VDir, VPackageJson, PatchStrategy } from 'puggle'

function hasDevDependency(npm: VPackageJson, name: string) {
  if (npm.values.devDependencies[name]) return true

  return npm.patches.some((p) => p.path === 'devDependencies' && p.data[name])
}

export async function addCommitOps(root: VDir, npm: VPackageJson) {
  await npm.addLatestDevDependencies({
    'standard-version': '8.x',
    '@commitlint/cli': '8.x',
    '@commitlint/config-conventional': '8.x',
  })

  npm.addPatch('commitlint', PatchStrategy.persist, {
    extends: ['@commitlint/config-conventional'],
  })

  if (hasDevDependency(npm, 'yorkie')) {
    npm.addPatch(
      'gitHooks.commit-msg',
      PatchStrategy.persist,
      'commitlint -e $HUSKY_GIT_PARAMS'
    )
  }
}
