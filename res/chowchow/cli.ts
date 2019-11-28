#!/usr/bin/env node

import * as yargs from 'yargs'
import { runServer } from './server'

yargs
  .help()
  .alias('h', 'help')
  .demandCommand()

yargs.command(
  'server [port]',
  'Run the server',
  yargs =>
    yargs
      .positional('port', {
        type: 'number',
        describe: 'the port to run the server on',
        default: 3000
      })
      .option('verbose', {
        type: 'boolean',
        describe: '',
        default: false
      }),
  args => runServer(args)
)

yargs.command(
  '$0',
  false,
  yargs => yargs,
  args => {
    const cmd = args._.join(' ').trim()

    if (cmd) console.log(`Unknown command '${cmd}'`)
    else console.log('No command entered')

    yargs.showHelp()
    process.exit(1)
  }
)

yargs.parse()
