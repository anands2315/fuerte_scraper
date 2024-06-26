const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

const scrapeProductNames = async (url, itemTargetCount) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  let items = [];
  let previousHeight;

  while (items.length < itemTargetCount) {
    const newItems = await page.evaluate(() => {
      const productElements = document.querySelectorAll('.widget-product-card-details');
      const productNames = Array.from(productElements).map(el => el.textContent.trim());
      return productNames;
    });

    items = items.concat(newItems);
    items = [...new Set(items)]; // Remove duplicates

    previousHeight = await page.evaluate('document.body.scrollHeight');
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');

    try {
      await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`, { timeout: 10000 });
    } catch (e) {
      console.log('Timeout reached or no more content to load.');
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  await browser.close();
  return items.slice(0, itemTargetCount);
};

app.post('/scrape', async (req, res) => {
  const { url, itemTargetCount } = req.body;
  if (!url || !itemTargetCount) {
    return res.status(400).send('URL and itemTargetCount are required');
  }

  try {
    const productNames = await scrapeProductNames(url, itemTargetCount);
    res.json(productNames);
  } catch (error) {
    res.status(500).send('Error scraping data');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
