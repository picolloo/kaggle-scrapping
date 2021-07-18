const puppeteer = require('puppeteer');
const { element2selector } = require('puppeteer-element2selector');
const paramaterize = require('parameterize-string')
const {algo, problem: problem_type, target : target_type} = require('minimist')(process.argv.slice(2));

(async () => {
  const browser = await puppeteer.launch({
    headless: false
  })
  const [page] = await browser.pages()

  const encodedAlgo = paramaterize(algo, {separator: '+'})
  await page.goto(`https://www.kaggle.com/search?q=${encodedAlgo}+in%3Adatasets`)

  await page.waitForSelector('div.searchTarget')

  const results = await page.$x('//a[descendant::div[contains(@class,"searchTarget")]]')

  const parsedData = []
  for (let result of results) {
    await result.click({
      button: "middle"
    })

    const [,newPage] = await browser.pages()
    await newPage.bringToFront()

    try {
      const reference = await getDatasetTitle(newPage)
      const columnTypes = await getColTypes(newPage)
      const n_features = await getNcols(newPage)
      const n_rows = await getNrow(newPage)

      console.log({
       reference,
        n_rows,
        n_features,
        feature_types: [...columnTypes].join(","),
        target_type,
        type_of_learning: 'supervised',
        problem_type,
        algorithm: algo
      })

      parsedData.push({
       reference,
        n_rows,
        n_features,
        feature_types: [...columnTypes].join(","),
        target_type,
        type_of_learning: 'supervised',
        problem_type,
        algorithm: algo
      })
    }
    catch (e) {
      console.error(e)
    }

    await newPage.close()
  }

  await results[8].click()

  await page.waitForXPath('/html/body/main/div[1]/div/div[5]/div[3]/div[2]/div[3]/div[2]/div/div[2]/div/div[3]/div[6]/div/div')
  const columns = await page.$x('/html/body/main/div[1]/div/div[5]/div[3]/div[2]/div[3]/div[2]/div/div[2]/div/div[3]/div[6]/div/div')

  await browser.close()
})()


async function getNcols(page) {
  await page.waitForXPath('//*[@id="site-content"]/div[3]/div[2]/div[3]/div[2]/div/div[2]/div/div[2]/div/div[2]/div/p')
  const [nColsEl] = await page.$x('//*[@id="site-content"]/div[3]/div[2]/div[3]/div[2]/div/div[2]/div/div[2]/div/div[2]/div/p')
  const ncols = await page.evaluate(name => name.innerText.split(' ')[2], nColsEl)
  return ncols
}

async function getColTypes(page) {
  let colDiv = 6
  await page.waitForXPath(
    `//*[@id="site-content"]/div[3]/div[2]/div[3]/div[2]/div/div[2]/div/div[3]/div[${colDiv}]/div/div`, {
      timeout: 10000
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

async function getTargetType(page, columnTypes) {
  // if (columnTypes.has("continuous") && columnTypes.size === 1) return "continuous"
  // else if (!columnTypes.has("continuous")) return "discrete"
  // TODO: if has 3 types = add 2 rows
}

async function getNrow(page) {
  await page.waitForXPath("//button[contains(., 'Column')]")
  const [columnsTab] = await page.$x("//button[contains(., 'Column')]")
  await columnsTab.click()

  const [nrowsEl] = await page.$x('//*[@id="site-content"]/div[3]/div[2]/div[3]/div[2]/div/div[2]/div/div[3]/div/div[1]/div[2]/div[2]/div/div[2]/div[2]')
  const nrows = await page.evaluate(name => name.innerText, nrowsEl)
  return nrows
}

async function getDatasetTitle(page) {
  await page.waitForSelector('h1')
  const titleElement = await page.$('h1')
  const title = await page.evaluate(el => el.textContent, titleElement)
  return title
}
