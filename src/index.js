const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false
  })
  const page = await browser.newPage()

  await page.goto('https://www.kaggle.com/search?q=linear+regression+in%3Adatasets')

  await page.waitForSelector('div.searchTarget:nth-child(1)')
  await page.click('div.searchTarget:nth-child(1)')


  // columns types
  await page.waitForXPath('//*[@id="site-content"]/div[3]/div[2]/div[3]/div[2]/div/div[2]/div/div[3]/div[6]/div/div')
  const columns = await page.$x('//*[@id="site-content"]/div[3]/div[2]/div[3]/div[2]/div/div[2]/div/div[3]/div[6]/div/div')


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


  // await page.waitForSelector('#numeric-chart-A9SwWhOc837ASvDS35vd\/versions\/6cTY6g1shQFXgt6Bpwwj\/files\/test\.csv\/columns\/hIQuwOLiZ5EqV8Z8mH4g > div > div > div > svg > g:nth-child(3)')
  // await page.click('#numeric-chart-A9SwWhOc837ASvDS35vd\/versions\/6cTY6g1shQFXgt6Bpwwj\/files\/test\.csv\/columns\/hIQuwOLiZ5EqV8Z8mH4g > div > div > div > svg > g:nth-child(3)')

  // await page.waitForSelector('.sc-jLZncB > .sc-oTqIG > .sc-pbOaj:nth-child(3) > .sc-psFCR > .sc-fznxKY')
  // await page.click('.sc-jLZncB > .sc-oTqIG > .sc-pbOaj:nth-child(3) > .sc-psFCR > .sc-fznxKY')

  // await page.waitForSelector('.sc-jxBcmK:nth-child(1) > .sc-jCDcrb > div > .sc-kbKRms > .sc-khBxaG:nth-child(2) > .sc-kIpGSl')
  // await page.click('.sc-jxBcmK:nth-child(1) > .sc-jCDcrb > div > .sc-kbKRms > .sc-khBxaG:nth-child(2) > .sc-kIpGSl')

  // await page.waitForSelector('.sc-jxBcmK:nth-child(1) > .sc-jCDcrb > div > .sc-kbKRms > .sc-khBxaG:nth-child(2) > .sc-kIpGSl')
  // await page.click('.sc-jxBcmK:nth-child(1) > .sc-jCDcrb > div > .sc-kbKRms > .sc-khBxaG:nth-child(2) > .sc-kIpGSl')

  await browser.close()
})()
