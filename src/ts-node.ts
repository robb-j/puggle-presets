import {
  Preset,
  VDir,
  VFile,
  VIgnoreFile,
  VPackageJson,
  trimInlineTemplate,
  npmPlugin,
  PatchStrategy,
  VConfigFile,
  VConfigType,
  presetify
} from 'puggle'
import { addPrettier } from './utils/prettier'

const indexTs = (name: string) => trimInlineTemplate`
  // 
  // The app entrypoint
  // 
  
  ;(async () => {
    console.log('Hello, ${name}!')
  })()
`

const indexSpecTs = () => trimInlineTemplate`
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
  # [0] A common base for both stages
  FROM node:12-alpine as base
  WORKDIR /app
  COPY ["package*.json", "tsconfig.json", "/app/"]

  # [1] A builder to install modules and run a build
  FROM base as builder
  ENV NODE_ENV development
  RUN npm ci &> /dev/null
  COPY src /app/src
  RUN npm run build -s &> /dev/null

  # [2] From the base again, install production deps and copy compilled code
  FROM base as dist
  ENV NODE_ENV production
  RUN npm ci &> /dev/null
  COPY --from=builder /app/dist /app/dist
  EXPOSE 3000
  CMD [ "npm", "start", "-s" ]
`

const tsconfig = () => ({
  compilerOptions: {
    outDir: 'dist',
    target: 'es2018',
    module: 'commonjs',
    moduleResolution: 'node',
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    sourceMap: true,
    declaration: true,
    pretty: true,
    newLine: 'lf',
    stripInternal: true,
    strict: true,
    noImplicitReturns: true,
    noUnusedLocals: false,
    noUnusedParameters: false,
    noFallthroughCasesInSwitch: true,
    noEmitOnError: true,
    forceConsistentCasingInFileNames: true,
    skipLibCheck: true
  },
  include: ['src'],
  exclude: ['node_modules']
})

export default presetify({
  name: 'robb-j:ts-node',
  version: '0.2.1',

  plugins: [npmPlugin],

  async apply(root, { targetName }) {
    let npm = VPackageJson.getOrFail(root)

    //
    // Setup testing
    //
    await npm.addLatestDevDependencies({
      jest: '^24.x',
      'ts-jest': '^24.x',
      '@types/jest': '^24.x'
    })

    npm.addPatch('jest', PatchStrategy.persist, {
      preset: 'ts-jest',
      testEnvironment: 'node',
      testPathIgnorePatterns: ['/node_modules/', '/dist/']
    })

    npm.addPatch('scripts', PatchStrategy.placeholder, {
      test: 'jest',
      coverage: 'jest --coverage'
    })

    //
    // Setup typescript
    //
    await npm.addLatestDevDependencies({
      typescript: '^3.x',
      'ts-node': '^8.x',
      '@types/node': '^11.x'
    })

    root.addChild(
      new VConfigFile('tsconfig.json', VConfigType.json, tsconfig(), {
        strategy: PatchStrategy.persist
      })
    )

    npm.addPatch('scripts', PatchStrategy.placeholder, {
      build: 'tsc',
      lint: 'tsc --noEmit'
    })

    //
    //  Setup prettier
    //
    await addPrettier(root, npm, 'js,json,css,md,ts,tsx')

    //
    // Setup docker
    //
    root.addChild(
      new VFile('Dockerfile', dockerfile(), PatchStrategy.placeholder),
      new VIgnoreFile(
        '.dockerignore',
        'Files to ignore from the docker daemon',
        ['*.env', '.DS_Store', 'node_modules', 'coverage', 'dist'],
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
        ['*.env', '.DS_Store', 'node_modules', 'coverage', 'dist'],
        PatchStrategy.persist
      )
    )

    //
    // Setup editorconfig
    //
    root.addChild(
      new VFile('.editorconfig', editorconfig(), PatchStrategy.persist)
    )

    //
    // Setup template
    //
    await npm.addLatestDependencies({
      dotenv: '^8.0.0'
    })

    await npm.addLatestDevDependencies({
      nodemon: '^1.x'
    })

    npm.addPatch('main', PatchStrategy.placeholder, 'dist/index.js')
    npm.addPatch('types', PatchStrategy.placeholder, 'dist/index.d.js')

    npm.addPatch('scripts', PatchStrategy.placeholder, {
      preversion: 'npm run test -s && npm run build',
      start: 'node -r dotenv/config dist/index.js',
      dev: "nodemon -w src -e ts -x 'npx ts-node -r dotenv/config' src/index.ts"
    })

    root.addChild(
      new VFile('README.md', readme(targetName)),
      new VFile('.env', 'NODE_ENV=development'),
      new VDir('src', [
        new VFile('index.ts', indexTs(targetName)),
        new VDir('__test__', [new VFile('index.spec.ts', indexSpecTs())])
      ])
    )
  }
})
