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

import { addPrettier } from './utils/prettier'
import { addTypescript } from './utils/typescript'
import { readVFile, readResource } from './utils/vfile'
import { addJestWithTypescript } from './utils/jest'

const indexTs = (name: string) => dedent`
  // 
  // The app entrypoint
  // 
  
  ;(async () => {
    console.log('Hello, ${name}!')
  })()
`

const cliTs = (name: string) => dedent`
  #!/usr/bin/env node

  //
  // The cli entrypoint
  //

  import yargs = require('yargs')
  
  yargs.help().alias('h', 'help').demandCommand().recommendCommands()

  yargs.command(
    'example',
    'A placeholder command',
    (yargs) => yargs,
    async (args) => {
      console.log(args)
    }
  )

  yargs.command(
    '*',
    false,
    (yargs) => yargs,
    () => {
      console.error('Unknown command entered, try --help')
      process.exit(1)
    }
  )

  yargs.parse()
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

const readme = (name: string) => dedent`
  # ${name}
  
  Coming soon...
  
  ---
  
  > This project was set up by [puggle](https://npm.im/puggle)
`

const toIgnore = ['*.env', '.DS_Store', 'node_modules', 'coverage', 'dist']

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
    //  Setup prettier
    //
    await addPrettier(root, npm, 'js,json,css,md,ts,tsx')

    //
    // Setup docker
    //
    root.addChild(
      await readVFile('Dockerfile', 'docker/ts.Dockerfile'),
      new VIgnoreFile(
        '.dockerignore',
        'Files to ignore from the docker daemon',
        toIgnore,
        PatchStrategy.persist
      )
    )

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
      new VFile(
        '.editorconfig',
        await readResource('.editorconfig'),
        PatchStrategy.persist
      )
    )

    //
    // Ask whether to add a cli
    //
    const cli = await askQuestions('cli', [
      {
        type: 'confirm',
        name: 'enabled',
        message: 'Create a CLI app?',
        initial: false,
      },
    ])

    //
    // Setup template
    //
    await npm.addLatestDependencies({
      dotenv: '8.x',
    })

    await npm.addLatestDevDependencies({
      nodemon: '2.x',
    })

    npm.addPatch('main', PatchStrategy.placeholder, 'dist/index.js')
    npm.addPatch('types', PatchStrategy.placeholder, 'dist/index.d.js')

    npm.addPatch('scripts', PatchStrategy.placeholder, {
      preversion: 'npm run test -s && npm run build',
      start: 'node -r ts-node/register -r dotenv/config src/index.js',
    })

    root.addChild(
      new VFile('README.md', readme(targetName)),
      new VFile('.env', 'NODE_ENV=development'),
      new VDir('src', [
        new VFile('index.ts', indexTs(targetName)),
        new VDir('__test__', [new VFile('index.spec.ts', indexSpecTs())]),
      ])
    )

    if (cli.enabled) {
      await npm.addLatestDependencies({
        yargs: '16.x',
      })

      await npm.addLatestDevDependencies({
        '@types/yargs': '15.x',
      })

      npm.addPatch('scripts', PatchStrategy.placeholder, {
        start: 'node -r ts-node/register -r dotenv/config src/cli.ts',
      })

      const src = root.find('src') as VDir
      src.addChild(new VFile('cli.ts', cliTs(targetName)))

      const dockerfile = root.find('Dockerfile') as VFile
      dockerfile.contents = dockerfile.contents.replace(
        'dist/index.js',
        'dist/cli.js'
      )
    }
  },
})
