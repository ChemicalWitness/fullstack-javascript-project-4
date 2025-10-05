#!/usr/bin/env node
import { Command } from 'commander'

const program = new Command()


program
  .name('page-loader')
  .description('Page loader utility')
  .version('1.0.0', '-V, --version', 'output the version number')
  .option('-o, --output [dir]', 'output dir (default: "/home/user/current-dir")')
  .argument('<url>')
  .helpOption('-h, --help', 'display help for command')

program.parse()