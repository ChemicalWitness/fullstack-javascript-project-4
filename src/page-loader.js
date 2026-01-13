import fsp from 'fs/promises'
import axios from 'axios'
import path from 'path'
import * as cheerio from 'cheerio'
import axiosDebugLog from 'axios-debug-log'
import debug from 'debug'
import { buildResourceName, downloadAssets, prepareAssets } from './utils.js'
import Listr from 'listr'

axiosDebugLog(axios)
const log = debug('page-loader')

let htmlContent
let $

const pageLoader = (url, output = process.cwd()) => {
  const absoluteDirPath = path.resolve(process.cwd(), output)

  const filename = buildResourceName(url)
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '')
  const resourceData = `${nameWithoutExt}_files`
  const resourcesPath = path.join(absoluteDirPath, resourceData)

  log(`URL: ${url}`)
  log(`Output directory: ${output}`)
  log(`Absolute dir path: ${absoluteDirPath}`)
  log(`Generated filename: ${filename}`)

  log('Starting...')

  log(`creating directory for page`)

  return fsp.access(absoluteDirPath)
    .then(() => {
      log(`request the main page on ${url}`)
      return axios.get(url, { responseType: 'text' })
    })
    .then((data) => {
      htmlContent = data.data
      log(`parse html and files`)
      $ = cheerio.load(htmlContent)
      log(`create directory for assets`)
      return fsp.mkdir(resourcesPath)
    })
    .then(() => {
      log(`prepared html with local links assets`)
      const localAssets = prepareAssets($, url, resourceData)
      log(`Downloading assets`)
      const tasks = localAssets.map(({absoluteUrl, localPath}) => ({
        title: absoluteUrl,
        task: () => downloadAssets(absoluteUrl, path.join(output, localPath)),
      }))
      const listrTasks = new Listr(tasks, { concurrent: true })

      return listrTasks.run().catch(() => {})
    })
    .then(() => {
      const modifiedHtml = $.html()
      const htmlFilePath = path.join(output, filename)
      log(`rewrite html page ${htmlFilePath} with local assets`)
      return fsp.writeFile(htmlFilePath, modifiedHtml)
    })
    .then(() => {
      const htmlFilePath = path.join(output, filename)
      log(`return html path and finish`)
      return htmlFilePath
    })
}

export { pageLoader }
