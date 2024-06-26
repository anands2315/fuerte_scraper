const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = 3000;

app.get('/scrape', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send('URL is required');
  }

  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Function to auto-scroll the page
    async function autoScroll(page) {
      await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
          let totalHeight = 0;
          let distance = 100;
          const maxHeight = 10000;  // You can adjust this value based on your needs
          let scrollHeight = document.body.scrollHeight;

          const timer = setInterval(() => {
            window.scrollBy(0, distance);
            totalHeight += distance;

            // Log some debug information
            console.log(`Scrolled to: ${totalHeight}px`);

            if (totalHeight >= scrollHeight || totalHeight >= maxHeight) {
              clearInterval(timer);
              resolve();
            }

            scrollHeight = document.body.scrollHeight;
          }, 200);
        });
      });
    }

    await autoScroll(page);

    const content = await page.content();
    await browser.close();
    res.send(content);
  } catch (error) {
    console.error('Error during scraping:', error);
    res.status(500).send('An error occurred during scraping');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
