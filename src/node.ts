import {
  VDir,
  VFile,
  VPackageJson,
  trimInlineTemplate,
  npmPlugin,
  PatchStrategy,
  VIgnoreFile,
  VConfigFile,
  VConfigType,
  presetify
} from 'puggle'
import { addPrettier } from './utils/prettier'
import { addJest } from './utils/jest'
import { readResource } from './utils/vfile'

const indexJs = (name: string) => trimInlineTemplate`
  //
  // The app entrypoint
  //

  ;(async () => {
    console.log('Hello, ${name}!')
  })()
`

const indexSpecJs = () => trimInlineTemplate`
  //
  // An example unit test
  //

  describe('sample', () => {
    it('should pass', () => {
      expect(1 + 1).toBe(2)
    })
  })
`

const readme = (name: string) => trimInlineTemplate`
  # ${name}

  Coming soon...

  ---

  > This project was set up by [puggle](https://npm.im/puggle)
`

const eslintConf = {
  root: true,
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2018
  },
  env: {
    node: true,
    jest: true
  },
  extends: ['standard', 'prettier', 'prettier/standard']
}

export default presetify({
  name: 'robb-j:node',
  version: '0.2.2',

  plugins: [npmPlugin],

  async apply(root, { targetName }) {
    let npm = VPackageJson.getOrFail(root)

    //
    // Setup testing
    //
    await addJest(root, npm)

    //
    // Setup eslint
    //
    await npm.addLatestDevDependencies({
      eslint: '^6.x',
      'eslint-config-prettier': '^6.x',
      'eslint-config-standard': '^14.x',
      'eslint-plugin-import': '^2.x',
      'eslint-plugin-node': '^10.x',
      'eslint-plugin-promise': '^4.x',
      'eslint-plugin-standard': '^4.x'
    })

    npm.addPatch('scripts', PatchStrategy.placeholder, {
      lint: 'eslint src'
    })

    root.addChild(
      new VConfigFile('.eslintrc.yml', VConfigType.yaml, eslintConf, {
        comment: 'Configuration for eslint ~ https://eslint.org/',
        strategy: PatchStrategy.persist
      })
    )

    //
    // Setup prettier
    //
    await addPrettier(root, npm, 'js,json,css,md')

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
      dotenv: '^8.x'
    })

    await npm.addLatestDevDependencies({
      nodemon: '^1.x'
    })

    npm.addPatch('scripts', PatchStrategy.placeholder, {
      preversion: 'npm run test -s',
      start: 'node -r dotenv/config src/index.js',
      dev: "nodemon -x 'npm start' --watch src src/index.js"
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
        new VFile('index.js', indexJs(targetName))
      ])
    )
  }
})