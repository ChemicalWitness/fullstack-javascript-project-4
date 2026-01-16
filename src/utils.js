import fsp from 'fs/promises'
import axios from 'axios'
import path from 'path'
import * as cheerio from 'cheerio'

const ASSETS_ATTR = {
  img: 'src',
  link: 'href',
  script: 'src',
}

export const buildResourceName = (resourceUrl) => {
  const urlObj = new URL(resourceUrl)
  const extension = path.extname(urlObj.pathname) || '.html'
  const pathWithoutExtension = urlObj.pathname.replace(/\.[^/.]+$/, '')
  const resourceName = `${urlObj.hostname}${pathWithoutExtension}`
    .replace(/[^a-zA-Z0-9]/g, '-')
  return `${resourceName.trim()}${extension}`
}

export const downloadAssets = (link, filepath) => {
  return axios.get(link, { responseType: `arraybuffer` })
    .then(data => fsp.writeFile(filepath, data.data))
}

export const prepareAssets = (htmlContent, url, resourceDir) => {
  const { origin: baseOrigin, hostname: baseHostname } = new URL(url)
  const $ = cheerio.load(htmlContent)
  const localAssets = []
  Object.entries(ASSETS_ATTR).forEach(([tag, attr]) => {
    $(tag).each((_, elem) => {
      const urlAsset = $(elem).attr(attr)
      const {hostname: assetHostname} = new URL(urlAsset, url)
      if (!urlAsset || assetHostname !== baseHostname) {
        return
      }
      const absoluteUrl = new URL(urlAsset, baseOrigin).toString()
      const {ext, dir, name} = path.parse(absoluteUrl)
      const resourceName = `${dir.replace(/^https?:\/\//, '')} ${name}`
        .replace(/[^a-zA-Z0-9]/g, '-')
        .replace(/-+/g, '-')

    const filename = `${resourceName}${ext || '.html'}`
    const localPath = path.join(resourceDir, filename)

    $(elem).attr(ASSETS_ATTR[tag], localPath)

    localAssets.push(
      {
        absoluteUrl,
        localPath,
        originalUrl: urlAsset,
        tag,
        filename
      }
    )

    })
  })
  const modifiedHtml = $.html()
  return {localAssets, modifiedHtml}
}
