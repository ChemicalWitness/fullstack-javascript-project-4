import fsp from 'fs/promises'
import axios, { AxiosError } from 'axios'
import path from 'path'

const ASSETS_ATTR = {
  img: 'src',
  link: 'href',
  script: 'src'
}

export const buildFileName = (url, ext = '.html') => {
  const urlWithoutProtocol = url.replace(/^https:\/\//, '')
  const urlWithoutSymbols = urlWithoutProtocol.replace(/[^a-zA-Z0-9]/g, '-')
  return `${urlWithoutSymbols}${ext}`
}

export const buildResourceName = (resourceUrl) => {
  const urlObj = new URL(resourceUrl);
  const extension = path.extname(urlObj.pathname) || '.html';
  const pathWithoutExtension = urlObj.pathname.replace(/\.[^/.]+$/, '');
  const resourceName = `${urlObj.hostname}${pathWithoutExtension}`
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${resourceName}${extension}`;
}

export const isLocalResource = (resourceUrl, baseUrl) => {
  const resourceHost = new URL(resourceUrl, baseUrl).hostname;
  const baseHost = new URL(baseUrl).hostname;
  return resourceHost === baseHost ? true : false;
}

export const getLocalAssets = (cherrioHtmlFile, url) => {
  const localAssets = [];
  Object.entries(ASSETS_ATTR).forEach(([tag, attr]) => {
    cherrioHtmlFile(tag).each((_, elem) => {
      const urlAsset = cherrioHtmlFile(elem).attr(attr)
      localAssets.push({elem, tag, urlAsset})
    })
  })
  return localAssets.filter(({urlAsset}) => urlAsset !== undefined && isLocalResource(urlAsset, url))
}

export const transformingLinks = (url, localAssets, assetsDirName) => {
  const localAssetsLinks = [];
  const { origin: baseOrigin } = new URL(url);

  localAssets.forEach(({ urlAsset }) => {
    const assetsUrl = new URL(urlAsset, baseOrigin);
    
    const extension = path.extname(assetsUrl.pathname) || '.html';
    const pathWithoutExtension = assetsUrl.pathname.replace(/\.[^/.]+$/, '');
    const resourceName = `${assetsUrl.hostname}${pathWithoutExtension}`
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const transformedLink = `${resourceName}${extension}`;
    localAssetsLinks.push(path.join(assetsDirName, transformedLink));
  });
  
  return localAssetsLinks;
}

export const localAssetsInHtml = (cherrioHtml, localAssets, preparedLocalLinks) => {
  localAssets.forEach(({elem, tag}, i) => {
    cherrioHtml(elem).attr(ASSETS_ATTR[tag], preparedLocalLinks[i])
  })
}

export const getAbsoluteLinks = (url, localAssets) => {
  const {origin: hostnameWithProtocol} = new URL(url)
  const absoluteLinksFromAssets = []
  localAssets.forEach(({urlAsset}) => {
    absoluteLinksFromAssets.push(new URL(urlAsset, hostnameWithProtocol).toString())
  })
  return absoluteLinksFromAssets
}

export const downloadAssets = (link, filepath) => {
  return axios.get(link, {responseType: `arraybuffer`})
  .then((data) => fsp.writeFile(filepath, data.data))
}

export const handlerError = (error) => {
  if (error.name === `Error`) {
    console.error(`Error ${error.message}`)
  } else if (error instanceof AxiosError) {
    if (error.response && error.response.status !== 200) {
      console.error(`Axios error. Server response with ${error.response.status}`)
    } else if (error.request) {
      console.error(`Axios error. Server no response`)
    } else {
      console.error(`Axios error`)
    }
  } else {
    console.error(`Unknown error ${error.message}`)
  }
}

// export const getFiles = (tags, attr, responseType, url, resourceData, output, downloadPromises) => {
//   tags.each((i, elem) => {
//     const src = $(elem).attr(attr)
//     if (!src) return;
    
//     const absoluteUrl = new URL(src, url).href;
//     if (!isLocalResource(absoluteUrl, url)) return;
//     const resourceFileName = buildResourceName(absoluteUrl)
//     const localResourcePath = path.join(resourceData, resourceFileName);

//     $(elem).attr(attr, localResourcePath)

//     const downloadPromise = axios.get(absoluteUrl, {responseType: responseType})
//       .then((response) => fsp.writeFile(path.join(output, localResourcePath), response.data))
    
//     downloadPromises.push(downloadPromise);
//   })
// }