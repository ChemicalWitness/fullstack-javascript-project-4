import { expect, test } from '@jest/globals'
import { fileURLToPath } from 'url'
import path, { dirname } from 'path'
import fs from 'fs'
import nock from 'nock'
import pageLoader from 'index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const getFixturePath = filename => path.join(__dirname, '..', '__fixtures__', filename)

test('page-loader', async () => {
  const url = 'https://ru.hexlet.io/courses';
  const pathToFile = 'ru-hexlet-io-courses.html';
  const pathToDir = getFixturePath('page-loader')
  await pageLoader(pathToDir, url)
  const expected = fs.access(path.join(pathToDir, pathToFile))
  expect(expected).toBeTruthy()

})