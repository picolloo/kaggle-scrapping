const puppeteer = require('puppeteer');
const { element2selector } = require('puppeteer-element2selector');

(async () => {
  const browser = await puppeteer.launch({
    headless: false
  })
  const page = await browser.newPage()

  await page.goto('https://www.kaggle.com/search?q=linear+regression+in%3Adatasets')

  await page.waitForSelector('div.searchTarget')

  const results = await page.$$('div.searchTarget')

  await results[8].click()

  await page.waitForXPath('/html/body/main/div[1]/div/div[5]/div[3]/div[2]/div[3]/div[2]/div/div[2]/div/div[3]/div[6]/div/div')
  const columns = await page.$x('/html/body/main/div[1]/div/div[5]/div[3]/div[2]/div[3]/div[2]/div/div[2]/div/div[3]/div[6]/div/div')

  const columnTypes = []
  for (let col of columns) {
    const colSelector = await element2selector(col)

    const colDiscrete = !!(await page.$(colSelector + ' span'))

    if (colDiscrete) {
      const columnValues = (await page.$$(`${colSelector} > div`)).length
      columnTypes.push(columnValues > 2 ? "discrete" : "binary")
    }
    else columnTypes.push("continuous")
  }

  // ncolumns
  await page.waitForXPath('//*[@id="site-content"]/div[3]/div[2]/div[3]/div[2]/div/div[2]/div/div[2]/div/div[2]/div/p')
  const [nColsEl] = await page.$x('//*[@id="site-content"]/div[3]/div[2]/div[3]/div[2]/div/div[2]/div/div[2]/div/div[2]/div/p')
  const ncols = await page.evaluate(name => name.innerText.split(' ')[2], nColsEl)

  // nrows
  await page.waitForXPath("//button[contains(., 'Column')]")
  const [columnsTab] = await page.$x("//button[contains(., 'Column')]")
  await columnsTab.click()

  const [nrowsEl] = await page.$x('//*[@id="site-content"]/div[3]/div[2]/div[3]/div[2]/div/div[2]/div/div[3]/div/div[1]/div[2]/div[2]/div/div[2]/div[2]')
  const nrows = await page.evaluate(name => name.innerText, nrowsEl)


  console.log({
    nrows, ncols, columnTypes
  })

  await browser.close()
})()


