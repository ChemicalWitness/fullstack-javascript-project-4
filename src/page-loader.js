import fsp from 'fs/promises'
import axios from 'axios'
import path from 'path'
import * as cheerio from 'cheerio';
import axiosDebugLog from 'axios-debug-log';
import debug from 'debug';
import { buildFileName, buildResourceName, isLocalResource, getLocalAssets, transformingLinks, localAssetsInHtml, getAbsoluteLinks, downloadAssets } from './utils.js';
import Listr from 'listr';

axiosDebugLog(axios);
const log = debug('page-loader');

let htmlContent
let $

const pageLoader = (url, output = process.cwd()) => {

  const absoluteDirPath = path.resolve(process.cwd(), output);

  const filename = buildFileName(url)
  const resourceData = buildFileName(url, '_files')
  const resourcesPath = path.join(absoluteDirPath, resourceData)

  log(`URL: ${url}`);
  log(`Output directory: ${output}`);
  log(`Absolute dir path: ${absoluteDirPath}`);
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
      log(`get info of assets`)
      const localAssetsLinks = getLocalAssets($, url)
      const preparedLocalAssetslinks = transformingLinks(url, localAssetsLinks, resourceData)
      log(`prepared html with local links assets`)
      localAssetsInHtml($, localAssetsLinks, preparedLocalAssetslinks)

      log(`create directory for assets`)
      return fsp.mkdir(resourcesPath, {recursive:true})
    .then(() => {
      const absoluteLinksOfAssets = getAbsoluteLinks(url, localAssetsLinks);
      log(`Downloading assets`)

      const tasks = absoluteLinksOfAssets.map((link, i) => ({
        title: link,
        task: () => downloadAssets(link, path.join(output, preparedLocalAssetslinks[i])),
      }));
      const listrTasks = new Listr(tasks, { concurrent: true });

      return listrTasks.run().catch(() => {});

      // const promises = absoluteLinksOfAssets.map((link, i) => downloadAssets(link, path.join(output, preparedLocalAssetslinks[i]))
      // );
      // return Promise.all(promises);

    })
    .then(() => {
      const modifiedHtml = $.html();
      const htmlFilePath = path.join(output, filename);
      log(`rewrite html page with local assets`)
      return fsp.writeFile(htmlFilePath, modifiedHtml);
    })
    .then(() => {
      const htmlFilePath = path.join(output, filename);
      log(`return html path and finish`)
      return htmlFilePath;
    })
  })
  
}

export { pageLoader }