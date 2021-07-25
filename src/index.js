const puppeteer = require('puppeteer');
const { element2selector } = require('puppeteer-element2selector');
const paramaterize = require('parameterize-string')
const { convertArrayToCSV } = require('convert-array-to-csv');
const fs = require('fs');

const {algo, problem: problem_type, target : target_type} = require('minimist')(process.argv.slice(2));

let errors = {};

(async () => {
  const browser = await puppeteer.launch({
    headless: false
  })
  const [page] = await browser.pages()

  const encodedAlgo = paramaterize(algo, {separator: '+'})
  await page.goto(`https://www.kaggle.com/search?q=${encodedAlgo}+in%3Adatasets+datasetFileTypes%3Acsv`)

  await page.waitForXPath('//*[@id="root"]/div/div[1]/div[2]/div/div/div[2]/div[2]/div[3]/div/span/span')
  const searchPages = await page.$x('//*[@id="root"]/div/div[1]/div[2]/div/div/div[2]/div[2]/div[3]/div/span/span')

  let modelData = []
  for (let searchPage of searchPages) {
    try {
      await searchPage.click()
      const data = await handleResultPage(browser, page)
      modelData = [...modelData, ...data]
    } catch (e) {
      console.error(e)
    }
  }

  console.log({errors, modelData})
  const csv = convertArrayToCSV(modelData)
  fs.writeFileSync(`data/${algo}.csv`, csv)

  await browser.close()
})()

async function handleResultPage(browser, page) {
  await sleep(page, 2500)
  await page.waitForXPath('//a[descendant::div[contains(@class,"searchTarget")]]')
  const results = await page.$x('//a[descendant::div[contains(@class,"searchTarget")]]')

  const parsedData = []
  for (let result of results) {
    await result.click({
      button: "middle"
    })

    const [,newPage] = await browser.pages()

    await newPage.bringToFront()
    await sleep(page, 1500)

    const url =  await newPage.url()
    try {
      let itemData = await handleResultItem(newPage)
      itemData = {...itemData, url}
      if (itemData) parsedData.push(itemData)

      console.log(itemData)
    }
    catch (e) {
      errors[e.message] = errors[e.message] ?  [...errors[e.message], url] : [url]
      console.error(e.message)
    }
    finally {
      await newPage.close()
    }
  }
  return parsedData
}

async function handleResultItem(page) {
  const reference = await getDatasetTitle(page)
  const columnTypes = await getColTypes(page)
  const n_features = await getNcols(page)
  const n_rows = await getNrow(page)

  const result ={
    reference,
    problem_type,
    n_rows,
    n_features,
    target_type,
    feature_types: [...columnTypes].join(","),
    type_of_learning: 'supervised',
    algorithm: algo
  }
  return result
}


async function sleep(page, time) {
  await page.waitForSelector('aaaaaaaaaa', { timeout: time }).catch(()=> {})
}

async function getNcols(page) {
  await page.waitForXPath('//*[@id="site-content"]/div[3]/div[2]/div[3]/div[2]/div/div[2]/div/div[2]/div/div[2]/div/p')
  const [nColsEl] = await page.$x('//*[@id="site-content"]/div[3]/div[2]/div[3]/div[2]/div/div[2]/div/div[2]/div/div[2]/div/p')
  const ncols = await page.evaluate(name => name.innerText.split(' ')[2], nColsEl)
  return ncols
}

async function getColTypes(page) {
  page.evaluate(_ => window.scrollBy(0, document.body.scrollHeight))

  let colDiv = 6
  await page.waitForXPath(
    `//*[@id="site-content"]/div[3]/div[2]/div[3]/div[2]/div/div[2]/div/div[3]/div[${colDiv}]/div/div`, {
      timeout: 5000
    }
  ).catch(() => (colDiv = 5))
  const columns = await page.$x(`//*[@id="site-content"]/div[3]/div[2]/div[3]/div[2]/div/div[2]/div/div[3]/div[${colDiv}]/div/div`)

  if (columns.length == 0) throw new Error("Unable to read columns")
  const columnTypes = new Set()
  for (let col of columns) {
    const colSelector = await element2selector(col)

    const colDiscrete = !!(await page.$(colSelector + ' span'))

    if (colDiscrete) {
      const columnValues = (await page.$$(`${colSelector} > div`)).length
      columnTypes.add(columnValues > 2 ? "discrete" : "binary")
    }
    else columnTypes.add("continuous")
  }
  return columnTypes
}

// async function getTargetType(page, columnTypes) {
  // if (columnTypes.has("continuous") && columnTypes.size === 1) return "continuous"
  // else if (!columnTypes.has("continuous")) return "discrete"
  // TODO: if has 3 types = add 2 rows
  // }

async function getNrow(page) {
  await page.waitForXPath("//button[contains(., 'Column')]")
  const [columnsTab] = await page.$x("//button[contains(., 'Column')]")
  await columnsTab.click()

  const [nrowsEl] = await page.$x('//*[@id="site-content"]/div[3]/div[2]/div[3]/div[2]/div/div[2]/div/div[3]/div/div[1]/div[2]/div[2]/div/div[2]/div[2]')
  const nrows = await page.evaluate(name => name.innerText, nrowsEl)
  return nrows.replace(/\./,"").replace(/k/, 000).replace(/m/, 000000)
}

async function getDatasetTitle(page) {
  await page.waitForSelector('h1')
  const titleElement = await page.$('h1')
  const title = await page.evaluate(el => el.textContent, titleElement)
  return title
}


