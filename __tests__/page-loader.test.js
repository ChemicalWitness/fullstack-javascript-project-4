import { expect, test, beforeAll, beforeEach, describe } from '@jest/globals'
import { fileURLToPath } from 'url'
import path, { dirname } from 'path'
import fsp from 'fs/promises'
import os from 'os'
import nock from 'nock'
import pageLoader from '../index.js'
import { AxiosError } from 'axios'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const getFixturePath = filename => path.join(__dirname, '..', '__fixtures__', filename)
nock.disableNetConnect()

const mockData = [
  {
    url: '/courses',
    filename: 'ru-hexlet-io-courses-before.html',
  },
  {
    url: '/assets/professions/nodejs.png',
    filename: 'ru-hexlet-io-assets-professions-nodejs.png',
  },
  {
    url: '/assets/application.css',
    filename: 'ru-hexlet-io-assets-application.css',
  },
  {
    url: '/packs/js/runtime.js',
    filename: 'ru-hexlet-io-packs-js-runtime.js',
  },
]

beforeAll(async () => {
  const nockObj = nock('https://ru.hexlet.io')
    .persist()
  mockData.forEach(({ url, filename }) => {
    nockObj.get(url)
      .replyWithFile(200, getFixturePath(filename))
  })
})

let tmp
const url = 'https://ru.hexlet.io/courses'
const htmlFile = 'ru-hexlet-io-courses.html'
const resourcesDir = 'ru-hexlet-io-courses_files'

beforeEach(async () => {
  tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'))
})

describe('page-loader tests', () => {
  let pagePath
  let actualPagePath

  beforeEach(async () => {
    pagePath = path.join(tmp, htmlFile)
  })

  test('page-loader specified directory', async () => {
    actualPagePath = await pageLoader(url, tmp)
    const pathToFileFixtures = getFixturePath('ru-hexlet-io-courses-after.html')

    await expect(pagePath).toEqual(actualPagePath)
    await expect(fsp.access(pagePath)).resolves.not.toThrow()

    const expectedRead = await fsp.readFile(pathToFileFixtures, 'utf-8')
    const actualRead = await fsp.readFile(pagePath, 'utf-8')

    expect(expectedRead).toBe(actualRead)
  })

  test('page-loader current dir', async () => {
    process.chdir(tmp)
    actualPagePath = await pageLoader(url)
    await expect(pagePath).toEqual(actualPagePath)
    const pathToFileFixtures = getFixturePath('ru-hexlet-io-courses-after.html')
    const resourcesDirPath = path.join(tmp, resourcesDir)

    const assetsPaths = mockData.slice(1).map(({ filename }) => path.join(resourcesDir, filename))

    await expect(fsp.access(pagePath)).resolves.not.toThrow()
    const expectedRead = await fsp.readFile(pathToFileFixtures, 'utf-8')
    const actualRead = await fsp.readFile(pagePath, 'utf-8')
    expect(expectedRead).toBe(actualRead)

    await expect(fsp.access(resourcesDirPath)).resolves.not.toThrow()
    for (const assetPath of assetsPaths) {
      await expect(fsp.access(assetPath)).resolves.not.toThrow()
    }

    const htmlContent = await fsp.readFile(pagePath, 'utf-8')
    mockData.slice(1).forEach(({ filename }) => expect(htmlContent).toContain(`${resourcesDir}/${filename}`))
  })
})

describe('failures', () => {
  test('not exist link', async () => {
    await expect(() => pageLoader('https://notexist.ru')).rejects.toBeInstanceOf(AxiosError)
  })
  test('not exist outpurDir', async () => {
    await expect(() => pageLoader(url, '/not/existdir')).rejects.toThrow(/ENOENT/)
  })
  test('not access outpurDir', async () => {
    await expect(() => pageLoader(url, '/home')).rejects.toThrow(/EACCES/)
  })
  test('already exist dir', async () => {
    await pageLoader(url, tmp)
    await expect(() => pageLoader(url, tmp)).rejects.toThrow(/EEXIST/)
  })
})
