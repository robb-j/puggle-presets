import { VDir, VPackageJson, PatchStrategy } from 'puggle'

export async function addJest(root: VDir, npm: VPackageJson) {
  await npm.addLatestDevDependencies({
    jest: '^24.x',
  })

  npm.addPatch('scripts', PatchStrategy.placeholder, {
    test: 'jest',
    coverage: 'jest --coverage',
  })
}

export async function addJestWithTypescript(root: VDir, npm: VPackageJson) {
  await npm.addLatestDevDependencies({
    jest: '^24.x',
    'ts-jest': '^24.x',
    '@types/jest': '^24.x',
  })

  npm.addPatch('jest', PatchStrategy.persist, {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  })

  npm.addPatch('scripts', PatchStrategy.placeholder, {
    test: 'jest',
    coverage: 'jest --coverage',
  })
}
