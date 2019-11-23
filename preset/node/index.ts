import {
  Preset,
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

const editorconfig = () => trimInlineTemplate`
  #
  # Editor config, for sharing IDE preferences (https://editorconfig.org)
  #

  root = true

  [*]
  charset = utf-8
  indent_style = space
  indent_size = 2
  end_of_line = lf
  insert_final_newline = true
`

const readme = (name: string) => trimInlineTemplate`
  # ${name}

  Coming soon...

  ---

  > This project was set up by [puggle](https://npm.im/puggle)
`

const dockerfile = () => trimInlineTemplate`
  # Use a node alpine image install packages and run the start script
  FROM node:12-alpine
  WORKDIR /app
  EXPOSE 3000
  ENV NODE_ENV production
  COPY ["package*.json", "/app/"]
  RUN npm ci &> /dev/null
  COPY ["src", "/app/src"]
  CMD [ "npm", "start", "-s" ]
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

module.exports = presetify({
  name: 'robb-j:node',
  version: require('./package.json').version,

  plugins: [npmPlugin],

  async apply(root, { targetName }) {
    let npm = VPackageJson.getOrFail(root)

    //
    // Setup testing
    //
    await npm.addLatestDevDependencies({
      jest: '^24.x'
    })

    npm.addPatch('scripts', PatchStrategy.placeholder, {
      test: 'jest',
      coverage: 'jest --coverage'
    })

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
    const matcher = '*.{js,json,css,md}'

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
      [matcher]: ['prettier --write', 'git add'],
      '*.{js}': ['eslint', 'git add']
    })

    npm.addPatch('scripts', PatchStrategy.placeholder, {
      prettier: `prettier --write '**/${matcher}'`
    })

    root.addChild(
      new VIgnoreFile(
        '.prettierignore',
        'Files for prettier to ignore',
        ['node_modules', 'coverage'],
        PatchStrategy.persist
      )
    )

    //
    // Setup docker
    //
    root.addChild(
      new VFile('Dockerfile', dockerfile(), PatchStrategy.placeholder),
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
      new VFile('.editorconfig', editorconfig(), PatchStrategy.persist)
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
