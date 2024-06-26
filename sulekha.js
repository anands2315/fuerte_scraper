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
  while (items.length < itemTargetCount) {
    const newItems = await page.evaluate(() => {
      const productElements = document.querySelectorAll('[id^="businessdiv"] > div.business > div.name');
      const productNames = Array.from(productElements).map(el => el.textContent.trim());
      return productNames;
    });

    items = items.concat(newItems);
    items = [...new Set(items)]; // Remove duplicates

    // Check if "View More" button is present and click it
    const viewMoreButton = await page.$('#sulekhaListingsWrapper > section > section.sk-card.more-list.content-visibility > div'); // Update with actual selector for "View More" button
    if (viewMoreButton) {
      await viewMoreButton.click();
      await page.waitForTimeout(3000); // Wait for new content to load
    } else {
      console.log('No more "View More" button found.');
      break;
    }
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
