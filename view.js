const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const bodyParser = require('body-parser');

puppeteer.use(StealthPlugin());

const app = express();
const port = 3000;

app.use(bodyParser.json());

const waitForTimeout = (timeout) => {
    return new Promise(resolve => setTimeout(resolve, timeout));
};

app.post('/scrape', async (req, res) => {
    const { url } = req.body;
    console.log('Received URL:', url);

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const browser = await puppeteer.launch({
            executablePath: puppeteer.executablePath(),
            headless: true,
            defaultViewport: null,
            protocolTimeout: 200000
        });

        const page = await browser.newPage();
        let allData = [];
        let pageIndex = 0;

        while (pageIndex <= 15) { // Fetch up to page 15
            const pageUrl = `${url}&start=${pageIndex * 20}`;
            console.log('Fetching page URL:', pageUrl);

            await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 60000 });
            await waitForTimeout(1000);

            const results = await page.evaluate(() => {
                const data = [];
                const experienceRegex = /\d+\+ years in business · /;
                const resultContainers = document.querySelectorAll('div.uMdZh.tIxNaf');

                resultContainers.forEach(container => {
                    const nameElement = container.querySelector('div > div > a > div > div > div.dbg0pd > span');
                    const addressElement = container.querySelector('div > div > a > div > div > div:nth-child(3)');
                    const numberElement = container.querySelector('div > div > a > div > div > div:nth-child(4)');
                    const websiteElement = container.querySelector('div > a.yYlJEf.Q7PwXb.L48Cpd.brKmxb');

                    const name = nameElement ? nameElement.textContent.trim() : 'N/A';
                    let address = addressElement ? addressElement.textContent.trim() : 'N/A';
                    const numberMatch = numberElement ? numberElement.textContent.trim().match(/(\d{3,}[-\s.]?)*\d{3,}/) : null;
                    const number = numberMatch ? numberMatch[0].replace(/[-\s.]/g, '') : 'N/A';
                    const website = websiteElement ? websiteElement.href : 'N/A';

                    address = address.replace(experienceRegex, '');

                    data.push({ name, address, number, website });
                });
                return data;
            });

            if (results.length === 0) {
                break; // Break if no more results found
            }

            allData.push(...results);
            pageIndex++;
        }

        await browser.close();
        res.json(allData);

    } catch (error) {
        console.error('Error scraping data:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
