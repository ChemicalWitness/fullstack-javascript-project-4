import fsp from 'fs/promises'
import axios from 'axios'
import path from 'path'
import * as cheerio from 'cheerio';

const buildFileName = (url, ext = '.html') => {
  const urlWithoutProtocol = url.replace(/^https:\/\//, '')
  const urlWithoutSymbols = urlWithoutProtocol.replace(/[^a-zA-Z0-9]/g, '-')
  return `${urlWithoutSymbols}${ext}`
}

const buildResourceName = (resourceUrl) => {
  const urlObj = new URL(resourceUrl);
  const extension = path.extname(urlObj.pathname) || '.png';
  const pathWithoutExtension = urlObj.pathname.replace(/\.[^/.]+$/, '');
  const resourceName = `${urlObj.hostname}${pathWithoutExtension}`.replace(/[^a-zA-Z0-9]/g, '-');
  return `${resourceName}${extension}`;
}

let htmlContent
let $

const pageLoader = (url, output = process.cwd()) => {
  return fsp.mkdir(output, {recursive: true})
    .then(() => axios.get(url, { responseType: 'text' }))
    .then((data) => {
      htmlContent = data.data
      $ = cheerio.load(htmlContent)
      const filename = buildFileName(url)
      // const pathFile = path.join(output, filename)
      const resourceData = buildFileName(url, '_files')
      const resourcesPath = path.join(output, resourceData)
      return fsp.mkdir(resourcesPath, {recursive: true})
    .then(() => {
      const images = $('img')
      const downloadPromises = []

      images.each((i, elem) => {
        const src = $(elem).attr('src')
        if (!src) return;
        const absoluteUrl = new URL(src, url).href;
        const resourceFileName = buildResourceName(absoluteUrl)
        const localResourcePath = path.join(resourceData, resourceFileName);

        $(elem).attr('src', localResourcePath)

        const downloadPromise = axios.get(absoluteUrl, {responseType: 'arraybuffer'})
          .then((response) => fsp.writeFile(path.join(output, localResourcePath), response.data))
        downloadPromises.push(downloadPromise);
        console.log(absoluteUrl)
      })
      return Promise.all(downloadPromises);
    })
    .then(() => {
      const modifiedHtml = $.html();
      const htmlFilePath = path.join(output, filename);
      return fsp.writeFile(htmlFilePath, modifiedHtml);
    })
    .then(() => {
      const htmlFilePath = path.join(output, filename);
      return htmlFilePath;
    })
  })
    
}

export { pageLoader }