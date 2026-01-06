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

beforeAll(async () => {
  const resultFile = await fsp.readFile(getFixturePath('ru-hexlet-io-courses-before.html'), 'utf-8')
  const imageBuffer = await fsp.readFile(getFixturePath('ru-hexlet-io-assets-professions-nodejs.png'))
  const cssBuffer = await fsp.readFile(getFixturePath('ru-hexlet-io-assets-application.css'))
  const jsBuffer = await fsp.readFile(getFixturePath('ru-hexlet-io-packs-js-runtime.js'))
  nock('https://ru.hexlet.io')
    .persist()
    .get('/courses')
    .reply(200, resultFile)
    .get('/assets/professions/nodejs.png')
    .reply(200, imageBuffer, { 'Content-Type': 'image/png' })
    .get('/assets/application.css')
    .reply(200, cssBuffer)
    .get('/packs/js/runtime.js')
    .reply(200, jsBuffer)
})

let tmp

const url = 'https://ru.hexlet.io/courses'
const expectedHtmlFile = 'ru-hexlet-io-courses.html'
const expectedResourcesDir = 'ru-hexlet-io-courses_files'
const expectedImageFile = 'ru-hexlet-io-assets-professions-nodejs.png'
const expectedCssFile = 'ru-hexlet-io-assets-application.css'
const expectedJsFile = 'ru-hexlet-io-packs-js-runtime.js'


beforeEach(async () => {
  tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'))
})

describe('page-loader tests', () => {
  let pagePath
  let actualPagePath

  beforeEach(async () => {
    pagePath = path.join(tmp, expectedHtmlFile)
    actualPagePath = await pageLoader(url, tmp)
  })

  test('page-loader specified directory', async () => {
    const pathToFileFixtures = getFixturePath('ru-hexlet-io-courses-after.html')
    const resourcesDirPath = path.join(tmp, expectedResourcesDir)

    await expect(pagePath).toEqual(actualPagePath)
    await expect(fsp.access(pagePath)).resolves.not.toThrow()

    const expectedRead = await fsp.readFile(pathToFileFixtures, 'utf-8')
    const actualRead = await fsp.readFile(pagePath, 'utf-8')

    expect(expectedRead).toBe(actualRead)
  })

  test('page-loader current dir', async () => {
    process.chdir(tmp)
    const pathToFileFixtures = getFixturePath('ru-hexlet-io-courses-after.html')
    const resourcesDirPath = path.join(tmp, expectedResourcesDir)
    const imageFilePath = path.join(resourcesDirPath, expectedImageFile)
    const cssFilePath = path.join(resourcesDirPath, expectedCssFile)
    const jsFilePath = path.join(resourcesDirPath, expectedJsFile)

    await expect(fsp.access(pagePath)).resolves.not.toThrow()
    const expectedRead = await fsp.readFile(pathToFileFixtures, 'utf-8')
    const actualRead = await fsp.readFile(pagePath, 'utf-8')
    expect(expectedRead).toBe(actualRead)

    await expect(fsp.access(resourcesDirPath)).resolves.toBeUndefined()
    await expect(fsp.access(imageFilePath)).resolves.toBeUndefined()
    await expect(fsp.access(cssFilePath)).resolves.toBeUndefined()
    await expect(fsp.access(jsFilePath)).resolves.toBeUndefined()

    const htmlContent = await fsp.readFile(pagePath, 'utf-8')
    expect(htmlContent).toContain(`${expectedResourcesDir}/${expectedImageFile}`)
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
    await expect(() => pageLoader(url, tmp)).rejects.toThrow(`/EEXIST/`)
  })
})
