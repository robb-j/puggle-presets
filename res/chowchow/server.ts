import { ChowChow } from '@robb_j/chowchow'
import { LoggerModule } from '@robb_j/chowchow-logger'
import { JsonEnvelopeModule } from '@robb_j/chowchow-json-envelope'

import { checkVariables } from 'valid-env'
import * as express from 'express'
import * as cors from 'cors'

import { Context } from './types'
import * as general from './routes/general'

//
// Setup a generic ChowChow, extracted so that tests can also use this
//
export function setupServer<T extends ChowChow<Context>>(server: T): T {
  // Ensure environment variables are set
  checkVariables([])

  // Add modules to ChowChow
  server
    .use(new JsonEnvelopeModule({ handleErrors: true }))
    .use(new LoggerModule({ enableAccessLogs: true }))

  // Apply express middleware
  server.applyMiddleware((app) => {
    app.use(express.json())

    if (process.env.CORS_HOSTS) {
      const conf = {
        origin: process.env.CORS_HOSTS.split(','),
        credentials: true,
      }
      app.use(cors(conf))
    }
  })

  // Apply our routes
  server.applyRoutes((app, r) => {
    app.get('/', r(general.hello))
  })

  return server
}

interface RunArgs {
  verbose?: boolean
  port?: number
}

export async function runServer(args: RunArgs) {
  try {
    // Create our chowchow server
    const chow = ChowChow.create<Context>()

    // Setup our server
    setupServer(chow)

    // Start the chowchow server
    await chow.start(args)

    // Listen for SIGINT and close the server
    process.on('SIGINT', () => {
      process.exit()
      chow.stop()
    })

    console.log('Listening on :' + args.port)
  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}
