const puppeteer = require('puppeteer')
//const banzukeUrl = 'https://www.dice.com/jobs?q=backend&countryCode=US&radius=30&radiusUnit=mi&page=1&pageSize=20&filters.postedDate=ONE&filters.isRemote=true&language=en'
const banzukeUrl = 'http://sumodb.sumogames.de/Banzuke.aspx'
let page
let browser
let cardArr = []
class Banzuke {

  // Initializes and create puppeteer instance
  static async init() {
    browser = await puppeteer.launch({
      // headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process', // <- this one doesn't works in Windows
        '--disable-gpu',
      ],
    })

    page = await browser.newPage()
    await Promise.race([
      await page.goto(banzukeUrl, { waitUntil: 'load' }).catch(() => {}),
      await page.waitForSelector('.banzuke').catch(() => {}),
    ])
  }

  // Visits the page, retrieves the banzuke
  static async resolver() {
    await this.init()
    const banzukeURLs = await page.evaluate(() => {
      const cards = document.querySelectorAll('.banzuke')
      cardArr = Array.from(cards)
      const cardLinks = []
      cardArr.map((card) => {
        const cardTitle = card.querySelector('caption')
        const { text } = cardTitle
        cardLinks.push({
          titleText: text,
        })
      })
      return cardLinks
    })
    return banzukeURLs
  }

  // Converts the banzuke to array
  static async getBanzuke() {
    const banzuke = await this.resolver()
    await browser.close()
    const data = {}
    data.banzuke = this.resolveBanzuke(banzuke)
    data.total_banzuke = banzuke.length
    return data
  }

  static resolveBanzuke(banzuke) {
    const resolvedBanzuke = banzuke.map((ban) => {
      const resolvedBanzuke = {}
      resolvedBanzuke.title = ban.titleText
      return resolvedBanzuke
    })
    return resolvedBanzuke
  }
}
export default Banzuke