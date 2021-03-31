import {
  VDir,
  VFile,
  VIgnoreFile,
  VPackageJson,
  npmPlugin,
  PatchStrategy,
  presetify,
} from 'puggle'
import dedent = require('dedent')

import {
  addDocker,
  addJestWithTypescript,
  addPrettier,
  addTypescript,
  readResource,
  readVFile,
  useCli,
} from './utils/'

const indexTs = (name: string) => dedent`
  // 
  // The app entrypoint
  // 
  
  ;(async () => {
    console.log('Hello, ${name}!')
  })()
`

const indexSpecTs = () => dedent`
  //
  // An example unit test
  //

  describe('sample', () => {
    it('should pass', () => {
      expect(1 + 1).toBe(2)
    })
  })
`

const toIgnore = ['*.env', '.DS_Store', 'node_modules', 'coverage', 'dist']

async function generateReadme(projectName: string) {
  const dev = await Promise.all([
    readResource('docs/setup.md'),
    readResource('docs/regular-use.md'),
    readResource('docs/testing.md'),
    readResource('docs/irregular-use.md'),
    readResource('docs/prettier.md'),
    readResource('docs/release.md'),
  ])

  return dedent`
    # ${projectName}

    ## Usage

    > Work in progress

    ## Development

    ${dev.join('\n')}

    ---
  
    > This project was set up by [puggle](https://npm.im/puggle)
  `
}

export default presetify({
  name: 'robb-j:ts-node',
  version: '0.2.2',

  plugins: [npmPlugin],

  async apply(root, { targetName, askQuestions }) {
    let npm = VPackageJson.getOrFail(root)

    //
    // Setup testing
    //
    await addJestWithTypescript(root, npm)

    //
    // Setup typescript
    //
    await addTypescript(root, npm)

    //
    // Setup prettier
    //
    await addPrettier(root, npm, 'js,json,css,md,ts,tsx')

    //
    // Setup git
    //
    root.addChild(
      new VIgnoreFile(
        '.gitignore',
        'Files to ignore from git source control',
        toIgnore,
        PatchStrategy.persist
      )
    )

    //
    // Setup editorconfig
    //
    root.addChild(
      await readVFile('.editorconfig', '.editorconfig', PatchStrategy.persist)
    )

    //
    // Setup template
    //
    await npm.addLatestDependencies({
      dotenv: '8.x',
      debug: '4.x',
    })

    await npm.addLatestDevDependencies({
      '@types/debug': '4.x',
    })

    npm.addPatch('main', PatchStrategy.placeholder, 'dist/index.js')
    npm.addPatch('types', PatchStrategy.placeholder, 'dist/index.d.js')

    npm.addPatch('scripts', PatchStrategy.placeholder, {
      preversion: 'npm run test && npm run build',
      postversion: 'git push --follow-tags',
    })

    root.addChild(
      new VFile('README.md', await generateReadme(targetName)),
      new VFile('.env', 'NODE_ENV=development'),
      new VDir('src', [
        new VFile('index.ts', indexTs(targetName)),
        new VDir('__test__', [new VFile('index.spec.ts', indexSpecTs())]),
      ])
    )

    //
    // Setup docker
    //
    const docker = await askQuestions('docker', [
      {
        type: 'confirm',
        name: 'enabled',
        message: 'Use Docker?',
        initial: false,
      },
    ])

    if (docker.enabled) {
      await addDocker(root, docker, toIgnore)
    }

    //
    // Setup CLI
    //
    const cli = await askQuestions('cli', [
      {
        type: 'confirm',
        name: 'enabled',
        message: 'Create a CLI app?',
        initial: false,
      },
    ])

    if (cli.enabled) {
      await useCli(root, npm, targetName, docker.enabled, true)
    }
  },
})
