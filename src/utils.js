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

export const getLocalAssets = (cherrioHtmlFile, url) => {
  const localAssets = []
  Object.entries(ASSETS_ATTR).forEach(([tag, attr]) => {
    cherrioHtmlFile(tag).each((_, elem) => {
      const urlAsset = cherrioHtmlFile(elem).attr(attr)
      localAssets.push({ elem, tag, urlAsset })
    })
  })
  return localAssets.filter(({ urlAsset }) => urlAsset !== undefined && isLocalResource(urlAsset, url))
}

export const transformingLinks = (url, localAssets, assetsDirName) => {
  const localAssetsLinks = []
  const { origin: baseOrigin } = new URL(url)

  localAssets.forEach(({ urlAsset }) => {
    const assetsUrl = new URL(urlAsset, baseOrigin)

    const extension = path.extname(assetsUrl.pathname) || '.html'
    const pathWithoutExtension = assetsUrl.pathname.replace(/\.[^/.]+$/, '')
    const resourceName = `${assetsUrl.hostname}${pathWithoutExtension}`
      .replace(/[^a-zA-Z0-9]/g, '-')

    const transformedLink = `${resourceName}${extension}`
    localAssetsLinks.push(path.join(assetsDirName, transformedLink))
  })

  return localAssetsLinks
}

export const localAssetsInHtml = (cherrioHtml, localAssets, preparedLocalLinks) => {
  localAssets.forEach(({ elem, tag }, i) => {
    cherrioHtml(elem).attr(ASSETS_ATTR[tag], preparedLocalLinks[i])
  })
}

export const getAbsoluteLinks = (url, localAssets) => {
  const { origin: hostnameWithProtocol } = new URL(url)
  const absoluteLinksFromAssets = []
  localAssets.forEach(({ urlAsset }) => {
    absoluteLinksFromAssets.push(new URL(urlAsset, hostnameWithProtocol).toString())
  })
  return absoluteLinksFromAssets
}

export const downloadAssets = (link, filepath) => {
  return axios.get(link, { responseType: `arraybuffer` })
    .then(data => fsp.writeFile(filepath, data.data))
}

export const prepareAssets = (cherrioHtmlFile, url, resourceDir) => {
  const localAssets = getLocalAssets(cherrioHtmlFile, url)
  const preparedLocalAssetslinks = transformingLinks(url, localAssets, resourceDir)
  localAssetsInHtml(cherrioHtmlFile, localAssets, preparedLocalAssetslinks)
  const absoluteLinksOfAssets = getAbsoluteLinks(url, localAssets)
  return [preparedLocalAssetslinks, absoluteLinksOfAssets]
}
