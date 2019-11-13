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
  VConfigType
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

module.exports = {
  name: 'robb-j:node',
  version: require('./package.json').version,

  plugins: [npmPlugin],

  async apply(root, { targetName }) {
    let npm = VPackageJson.getOrFail(root)

    await npm.addLatestDependencies({
      dotenv: '^8.0.0'
    })

    await npm.addLatestDevDependencies({
      eslint: '^6.2.1',
      'eslint-config-prettier': '^6.1.0',
      'eslint-config-standard': '^14.0.0',
      'eslint-plugin-import': '^2.18.2',
      'eslint-plugin-node': '^9.1.0',
      'eslint-plugin-promise': '^4.2.1',
      'eslint-plugin-standard': '^4.0.1',
      jest: '^24.9.0',
      'lint-staged': '^9.2.3',
      prettier: '^1.18.2',
      yorkie: '^2.0.0'
    })

    npm.addPatch('scripts', PatchStrategy.placeholder, {
      coverage: 'jest --coverage',
      lint: 'eslint src',
      postversion: 'node tools/buildAndPush.js',
      prettier: "prettier --write '**/*.{js,json,css,md}'",
      start: 'node -r dotenv/config src/index.js',
      test: 'jest',
      dev:
        "NODE_ENV=development nodemon -x 'node -r dotenv/config' --watch src src/index.js"
    })

    npm.addPatch('gitHooks', PatchStrategy.persist, {
      'pre-commit': 'lint-staged'
    })

    npm.addPatch('lint-staged', PatchStrategy.persist, {
      '*.{js,json,css,less,md}': ['prettier --write', 'git add'],
      '*.{js}': ['eslint', 'git add']
    })

    npm.addPatch('main', PatchStrategy.placeholder, 'src/index.js')

    //
    // Add docker files
    //
    root.addChild(
      new VFile('Dockerfile', dockerfile(), PatchStrategy.placeholder),
      new VIgnoreFile(
        '.dockerignore',
        'Files to ignore from the docker daemon',
        ['.git', 'node_modules', 'coverage', '.DS_Store', '*.env']
      )
    )

    //
    // Add eslint config
    //
    root.addChild(
      new VConfigFile('.eslintrc.yml', VConfigType.yaml, eslintConf, {
        comment: 'Configuration for eslint ~ https://eslint.org/'
      })
    )

    //
    // Add gitignore
    //
    root.addChild(
      new VIgnoreFile('.gitignore', 'Files to ignore from git', [
        '*.env',
        'node_modules',
        '.DS_Store',
        'coverage'
      ])
    )

    //
    // Add editorconfig
    //
    root.addChild(new VFile('.editorconfig', editorconfig()))

    //
    // Add placeholder files
    //
    root.addChild(
      new VFile('README.md', readme(targetName), PatchStrategy.placeholder),
      new VDir('src', [
        new VDir('__tests__', [
          new VFile('index.spec.js', indexSpecJs(), PatchStrategy.placeholder)
        ]),
        new VFile('index.js', indexJs(targetName), PatchStrategy.placeholder)
      ])
    )
  }
} as Preset
