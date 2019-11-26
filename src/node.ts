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
import { addPrettier } from './utils/prettier'
import { addEslint } from './utils/eslint'

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

export default presetify({
  name: 'robb-j:node',
  version: '0.2.1',

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
    addEslint(root, npm)

    //
    // Setup prettier
    //
    await addPrettier(root, npm, 'js,json,css,md')

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
