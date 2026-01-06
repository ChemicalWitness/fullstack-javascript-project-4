#!/usr/bin/env node
import { Command } from 'commander'
import pageLoader from '../index.js'

const program = new Command()

program
  .name('page-loader')
  .description('Page loader utility')
  .version('1.0.0', '-V, --version', 'output the version number')
  .option('-o, --output [dir]', 'output dir (default: "/home/user/current-dir")', process.cwd())
  .argument('<url>')
  .helpOption('-h, --help', 'display help for command')
  .action((url) => {
    pageLoader(url, program.opts().output)
      .then((result) => {
        console.log(`Success!`)
        console.log(`Downloaded to: ${result}`)
        process.exit(0)
      })
      .catch((error) => {
        console.error(error)
        process.exit(1)
      })
  })

program.parse()
