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
  nock('https://ru.hexlet.io')
    .persist()  
    .get('/courses')
    .reply(200, resultFile)
    .get('/assets/professions/nodejs.png')
    .reply(200, imageBuffer, { 'Content-Type': 'image/png' })
})

async function fileExists(filePath) {
  try {
    await fsp.access(filePath);
    return true;
  } catch {
    return false;
  }
}

let tmp;
const url = 'https://ru.hexlet.io/courses';
const expectedHtmlFile = 'ru-hexlet-io-courses.html';
const expectedResourcesDir = 'ru-hexlet-io-courses_files'
const expectedImageFile = 'ru-hexlet-io-assets-professions-nodejs.png'

beforeEach( async () => {
  tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'))
})

afterEach(async () => {
  await fsp.rm(tmp, { recursive: true, force: true })
})

test('page-loader get file', async () => {
  const filepath = path.join(tmp, expectedHtmlFile)
  const pathToFileFixtures = getFixturePath('ru-hexlet-io-courses-after.html')

  await pageLoader(url, tmp)

  const hadFile = await fileExists(filepath)

  expect(hadFile).toBeTruthy();

  const expectedRead = await fsp.readFile(pathToFileFixtures, 'utf-8')
  const actualRead = await fsp.readFile(filepath, 'utf-8')

  expect(expectedRead).toBe(actualRead)
})

test('page-loader output', async () => {
  const filepath = path.join(tmp, expectedHtmlFile)
  const pathToFileFixtures = getFixturePath('ru-hexlet-io-courses-after.html')

  process.chdir(tmp)

  await pageLoader(url)

  const hadFile = await fileExists(filepath)

  expect(hadFile).toBeTruthy();

  const expectedRead = await fsp.readFile(pathToFileFixtures, 'utf-8')
  const actualRead = await fsp.readFile(filepath, 'utf-8')
  
  expect(expectedRead).toBe(actualRead)
})

test('page-loader downloading images and create dir for this', async () => {
  await pageLoader(url, tmp)

  const htmlFilePath = path.join(tmp, expectedHtmlFile)
  expect(await fileExists(htmlFilePath)).toBeTruthy()

  const resourcesDirPath = path.join(tmp, expectedResourcesDir)
  expect(await fileExists(resourcesDirPath)).toBeTruthy()
  
  const imageFilePath = path.join(resourcesDirPath, expectedImageFile)
  expect(await fileExists(imageFilePath)).toBeTruthy()
  
  const htmlContent = await fsp.readFile(htmlFilePath, 'utf-8')
  expect(htmlContent).toContain(`${expectedResourcesDir}/${expectedImageFile}`)

})
