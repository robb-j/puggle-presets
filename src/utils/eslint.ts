import {
  VDir,
  VPackageJson,
  PatchStrategy,
  VConfigType,
  VConfigFile,
} from 'puggle'

const eslintConf = {
  root: true,
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2018,
  },
  env: {
    node: true,
    jest: true,
  },
  extends: ['standard', 'prettier', 'prettier/standard'],
}

export async function addEslint(root: VDir, npm: VPackageJson) {
  await npm.addLatestDevDependencies({
    eslint: '^7.x',
    'eslint-config-prettier': '^6.x',
    'eslint-config-standard': '^14.x',
    'eslint-plugin-import': '^2.x',
    'eslint-plugin-node': '^11.x',
    'eslint-plugin-promise': '^4.x',
    'eslint-plugin-standard': '^4.x',
  })

  npm.addPatch('scripts', PatchStrategy.placeholder, {
    lint: 'eslint src',
  })

  root.addChild(
    new VConfigFile('.eslintrc.yml', VConfigType.yaml, eslintConf, {
      comment: 'Configuration for eslint ~ https://eslint.org/',
      strategy: PatchStrategy.persist,
    })
  )
}
