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
  const extension = path.extname(urlObj.pathname) || '.html';
  const pathWithoutExtension = urlObj.pathname.replace(/\.[^/.]+$/, '');
  const resourceName = `${urlObj.hostname}${pathWithoutExtension}`.replace(/[^a-zA-Z0-9]/g, '-');
  return `${resourceName}${extension}`;
}

const isLocalResource = (resourceUrl, baseUrl) => {
  try {
    const resourceHost = new URL(resourceUrl, baseUrl).hostname;
    const baseHost = new URL(baseUrl).hostname;
    return resourceHost === baseHost;
  } catch {
    return false;
  }
}

let htmlContent
let $

const getFiles = (tags, attr, responseType, url, resourceData, output, downloadPromises) => {
  tags.each((i, elem) => {
    const src = $(elem).attr(attr)
    if (!src) return;
    
    const absoluteUrl = new URL(src, url).href;
    if (!isLocalResource(absoluteUrl, url)) return;
    const resourceFileName = buildResourceName(absoluteUrl)
    const localResourcePath = path.join(resourceData, resourceFileName);

    $(elem).attr(attr, localResourcePath)

    const downloadPromise = axios.get(absoluteUrl, {responseType: responseType})
      .then((response) => fsp.writeFile(path.join(output, localResourcePath), response.data))
    
    downloadPromises.push(downloadPromise);
  })
}

const pageLoader = (url, output = process.cwd()) => {
  return fsp.mkdir(output, {recursive: true})
    .then(() => axios.get(url, { responseType: 'text' }))
    .then((data) => {
      htmlContent = data.data
      $ = cheerio.load(htmlContent)
      const filename = buildFileName(url)
      const resourceData = buildFileName(url, '_files')
      const resourcesPath = path.join(output, resourceData)
      return fsp.mkdir(resourcesPath, {recursive: true})
    .then(() => {
      const images = $('img')
      const links = $('link')
      const scripts = $('script')
      const downloadPromises = []

      getFiles(images, 'src', 'arraybuffer', url, resourceData, output, downloadPromises);
      getFiles(links, 'href', 'text', url, resourceData, output, downloadPromises);
      getFiles(scripts, 'src', 'text', url, resourceData, output, downloadPromises);

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