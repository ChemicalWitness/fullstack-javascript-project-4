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
  const localAssets = []
  Object.entries(ASSETS_ATTR).forEach(([tag, attr]) => {
    cherrioHtmlFile(tag).each((_, elem) => {
      const urlAsset = cherrioHtmlFile(elem).attr(attr)
      if (urlAsset && isLocalResource(urlAsset, url)) {
        localAssets.push({ elem, tag, urlAsset })
      }
    })
  })

  const localAssetsLinks = []
  const absoluteLinksFromAssets = []
  const { origin: baseOrigin } = new URL(url)

  localAssets.forEach(({ elem, tag, urlAsset }) => {
    const assetsUrl = new URL(urlAsset, baseOrigin)
    const absoluteUrl = assetsUrl.toString()
    absoluteLinksFromAssets.push(absoluteUrl)

    const extension = path.extname(assetsUrl.pathname) || '.html'
    const pathWithoutExtension = assetsUrl.pathname.replace(/\.[^/.]+$/, '')
    const resourceName = `${assetsUrl.hostname}${pathWithoutExtension}`
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')

    const cleanResourceName = resourceName.replace(/^-+|-+$/g, '')
    const transformedLink = `${cleanResourceName}${extension}`
    const localPath = path.join(resourceDir, transformedLink)

    localAssetsLinks.push(localPath)

    cherrioHtmlFile(elem).attr(ASSETS_ATTR[tag], localPath)
  })
  return [localAssetsLinks, absoluteLinksFromAssets]
}
