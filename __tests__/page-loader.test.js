import { expect, test, beforeAll, beforeEach, afterEach } from '@jest/globals'
import { fileURLToPath } from 'url'
import path, { dirname } from 'path'
import fsp from 'fs/promises'
import os from 'os'
import nock from 'nock'
import pageLoader from '../index.js'

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

let tmp;
const url = 'https://ru.hexlet.io/courses';
const expectedHtmlFile = 'ru-hexlet-io-courses.html';
const expectedResourcesDir = 'ru-hexlet-io-courses_files'
const expectedImageFile = 'ru-hexlet-io-assets-professions-nodejs.png'
const expectedCssFile = 'ru-hexlet-io-assets-application.css'
const expectedJsFile = 'ru-hexlet-io-packs-js-runtime.js'

beforeEach( async () => {
  tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'))
})


test('page-loader', async () => {
  const filepath = path.join(tmp, expectedHtmlFile)
  const pathToFileFixtures = getFixturePath('ru-hexlet-io-courses-after.html')
  const resourcesDirPath = path.join(tmp, expectedResourcesDir)
  const imageFilePath = path.join(resourcesDirPath, expectedImageFile)
  const cssFilePath = path.join(resourcesDirPath, expectedCssFile)
  const jsFilePath = path.join(resourcesDirPath, expectedJsFile)

  await pageLoader(url, tmp)

  await expect(fsp.access(filepath)).resolves.toBeUndefined()

  const expectedRead = await fsp.readFile(pathToFileFixtures, 'utf-8')
  const actualRead = await fsp.readFile(filepath, 'utf-8')

  expect(expectedRead).toBe(actualRead)

  process.chdir(tmp)
  await pageLoader(url)

  await expect(fsp.access(filepath)).resolves.toBeUndefined()

  const expectedRead2 = await fsp.readFile(pathToFileFixtures, 'utf-8')
  const actualRead2 = await fsp.readFile(filepath, 'utf-8')
  expect(expectedRead2).toBe(actualRead2)

  await expect(fsp.access(resourcesDirPath)).resolves.toBeUndefined()
  await expect(fsp.access(imageFilePath)).resolves.toBeUndefined()
  await expect(fsp.access(cssFilePath)).resolves.toBeUndefined()
  await expect(fsp.access(jsFilePath)).resolves.toBeUndefined()
  
  const htmlContent = await fsp.readFile(filepath, 'utf-8')
  expect(htmlContent).toContain(`${expectedResourcesDir}/${expectedImageFile}`)
})
