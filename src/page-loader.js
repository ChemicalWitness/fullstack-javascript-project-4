import fsp from 'fs/promises'
import axios from 'axios'
import path from 'path'

const buildFileName = (url) => {
  const urlWithoutProtocol = url.replace(/^https:\/\//, '')
  const urlWithoutSymbols = urlWithoutProtocol.replace(/[^a-zA-Z0-9]/g, '-')
  return `${urlWithoutSymbols}.html`
}

const pageLoader = ( url, output = process.cwd()) => {
  axios.get(url, { responseType: 'text' })
    .then((data) => {
      const filename = buildFileName(url)
      const pathFile = path.join(output, filename)
      fsp.writeFile(pathFile, data.data)
    })
}

export {pageLoader}