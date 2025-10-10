import { expect, test, beforeAll, beforeEach } from '@jest/globals'
import { fileURLToPath } from 'url'
import path, { dirname } from 'path'
import fsp from 'fs/promises'
import fs from 'fs'
import os from 'os'
import nock from 'nock'
import pageLoader from '../index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const getFixturePath = filename => path.join(__dirname, '..', '__fixtures__', filename)
nock.disableNetConnect()

beforeEach(async () => {
  const resultFile = await fsp.readFile(getFixturePath('ru-hexlet-io-courses.html'), 'utf-8')
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, resultFile);
})

let tmp;

beforeEach( async () => {
  tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'))
})


test('page-loader get file', async () => {
  const url = 'https://ru.hexlet.io/courses';
  const pathToFile = 'ru-hexlet-io-courses.html';
  const filepath = path.join(tmp, pathToFile)
  const pathToFileFixtures = getFixturePath('ru-hexlet-io-courses.html')
  await pageLoader(url, tmp)
  const hadFile = fs.existsSync(filepath)
  const expectedRead = await fsp.readFile(pathToFileFixtures, 'utf-8')
  const actualRead = await fsp.readFile(filepath, 'utf-8')
  expect(hadFile).toBeTruthy();
  expect(expectedRead).toBe(actualRead)
})

test('page-loader check file', async () => {
  const url = 'https://ru.hexlet.io/courses';
  const pathToFile = 'ru-hexlet-io-courses.html';
  const filepath = path.join(tmp, pathToFile)
  const pathToFileFixtures = getFixturePath('ru-hexlet-io-courses.html')
  await pageLoader(url, tmp)
  const expectedRead = await fsp.readFile(pathToFileFixtures, 'utf-8')
  const actualRead = await fsp.readFile(filepath, 'utf-8')
  expect(expectedRead).toEqual(actualRead)
})