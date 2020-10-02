import {
  VDir,
  VFile,
  VPackageJson,
  npmPlugin,
  PatchStrategy,
  VIgnoreFile,
  presetify,
} from 'puggle'
import dedent = require('dedent')

import { addPrettier } from './utils/prettier'
import { addJest } from './utils/jest'
import { readResource } from './utils/vfile'
import { addCommitOps } from './utils/commits-ops'
import { addEslint } from './utils/eslint'

const indexJs = (name: string) => dedent`
  //
  // The app entrypoint
  //

  ;(async () => {
    console.log('Hello, ${name}!')
  })()
`

const indexSpecJs = () => dedent`
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

export default presetify({
  name: 'robb-j:node',
  version: '0.2.2',

  plugins: [npmPlugin],

  async apply(root, { targetName, askQuestions }) {
    let npm = VPackageJson.getOrFail(root)

    //
    // Setup testing
    //
    await addJest(root, npm)

    //
    // Setup eslint
    //
    await addEslint(root, npm)

    //
    // Setup prettier
    //
    await addPrettier(root, npm, 'js,json,css,md')

    //
    // Ask whether to use commit-ops
    //
    const commitOps = await askQuestions('commit-ops', [
      {
        type: 'confirm',
        name: 'enabled',
        message: 'Use commit-ops (standard-version and commitlint)',
        initial: false,
      },
    ])

    if (commitOps.enabled) addCommitOps(root, npm)

    //
    // Setup docker
    //
    root.addChild(
      new VFile(
        'Dockerfile',
        await readResource('docker/js.Dockerfile'),
        PatchStrategy.placeholder
      ),
      new VIgnoreFile(
        '.dockerignore',
        'Files to ignore from the docker daemon',
        ['.git', 'node_modules', 'coverage', '.DS_Store', '*.env'],
        PatchStrategy.persist
      )
    )

    //
    // Setup git
    //
    root.addChild(
      new VIgnoreFile(
        '.gitignore',
        'Files to ignore from git',
        ['*.env', 'node_modules', '.DS_Store', 'coverage'],
        PatchStrategy.persist
      )
    )

    //
    // Add editorconfig
    //
    root.addChild(
      new VFile(
        '.editorconfig',
        await readResource('.editorconfig'),
        PatchStrategy.persist
      )
    )

    //
    // Setup template
    //
    await npm.addLatestDependencies({
      dotenv: '^8.x',
    })

    await npm.addLatestDevDependencies({
      nodemon: '^1.x',
    })

    npm.addPatch('scripts', PatchStrategy.placeholder, {
      preversion: 'npm run test -s',
      start: 'node -r dotenv/config src/index.js',
      dev: "nodemon -x 'npm start' --watch src src/index.js",
    })

    npm.addPatch('main', PatchStrategy.placeholder, 'src/index.js')

    //
    // Add placeholder files
    //
    root.addChild(
      new VFile('README.md', readme(targetName)),
      new VFile('.env', 'NODE_ENV=development'),
      new VDir('src', [
        new VDir('__tests__', [new VFile('index.spec.js', indexSpecJs())]),
        new VFile('index.js', indexJs(targetName)),
      ])
    )
  },
})
