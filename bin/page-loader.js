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
  .action(async ( url, options) =>  {
    const result = await pageLoader(url, options.output)
    console.log(result)
  })

program.parse()