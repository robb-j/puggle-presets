import { VPackageJson, PatchStrategy, VDir, VIgnoreFile } from 'puggle'

export async function addPrettier(
  root: VDir,
  npm: VPackageJson,
  extensions: string
) {
  const matcher = `*.${extensions}`

  await npm.addLatestDevDependencies({
    prettier: '^1.x',
    yorkie: '^2.x',
    'lint-staged': '^9.x'
  })

  npm.addPatch('prettier', PatchStrategy.persist, {
    semi: false,
    singleQuote: true
  })

  npm.addPatch('gitHooks', PatchStrategy.persist, {
    'pre-commit': 'lint-staged'
  })

  npm.addPatch('lint-staged', PatchStrategy.persist, {
    [matcher]: ['prettier --write', 'git add']
  })

  npm.addPatch('scripts', PatchStrategy.placeholder, {
    prettier: `prettier --write '**/${matcher}'`
  })

  root.addChild(
    new VIgnoreFile(
      '.prettierignore',
      'Files for prettier to ignore',
      ['coverage', 'node_modules', 'dist'],
      PatchStrategy.persist
    )
  )
}
