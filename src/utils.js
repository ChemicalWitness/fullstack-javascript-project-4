import fsp from 'fs/promises'
import axios from 'axios'
import path from 'path'

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

export const isLocalResource = (resourceUrl, baseUrl) => {
  const resourceHost = new URL(resourceUrl, baseUrl).hostname
  const baseHost = new URL(baseUrl).hostname
  return resourceHost === baseHost ? true : false
}

export const downloadAssets = (link, filepath) => {
  return axios.get(link, { responseType: `arraybuffer` })
    .then(data => fsp.writeFile(filepath, data.data))
}

export const prepareAssets = (cherrioHtmlFile, url, resourceDir) => {
  const { origin: baseOrigin } = new URL(url)
  const localAssets = []
  Object.entries(ASSETS_ATTR).forEach(([tag, attr]) => {
    cherrioHtmlFile(tag).each((_, elem) => {
      const urlAsset = cherrioHtmlFile(elem).attr(attr)
      if (!urlAsset || !isLocalResource(urlAsset, url)) {
        return
      }
      const absoluteUrl = new URL(urlAsset, baseOrigin).toString()
      const assetsUrl = new URL(absoluteUrl)
      const extension = path.extname(assetsUrl.pathname) || '.html'
      const pathWithoutExtension = assetsUrl.pathname.replace(/\.[^/.]+$/, '')
      const resourceName = `${assetsUrl.hostname}${pathWithoutExtension}`
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')

    const filename = `${resourceName}${extension}`
    const localPath = path.join(resourceDir, filename)

    cherrioHtmlFile(elem).attr(ASSETS_ATTR[tag], localPath)

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
  return localAssets
}
