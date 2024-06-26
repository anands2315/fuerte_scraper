const puppeteer = require('puppeteer-extra');
const fs = require('fs'); // Import the file system module

// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// Utility function to wait for a specific time in milliseconds
const waitForTimeout = (timeout) => {
    return new Promise(resolve => setTimeout(resolve, timeout));
};

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        protocolTimeout: 180000 // Increased to 180 seconds (3 minutes)
    });
    const page = await browser.newPage();

    try {
        await page.goto('https://www.sulekha.com/orthopedic-doctors/mumbai?tp=getquotes', { waitUntil: 'networkidle2', timeout: 60000 });

        // Wait for 60 seconds to allow manual clicks or any other activity
        console.log('Waiting for 60 seconds...');
        await waitForTimeout(60000); // Wait for 60 seconds

        console.log('Scraping data...');
        const data = await page.evaluate(() => {
            const elements = document.querySelectorAll('#MainContent_ulFList > li');

            return Array.from(elements).map(element => {
                const nameElement = element.querySelector('div.eachPopularLeft > div.eachPopularTitleBlock > div.popularTitleTextBlock > a');
                const numberElement = element.querySelector('div.eachPopularRight > a');
                const addressElement = element.querySelector('div.eachPopularRight > address');

                return {
                    name: nameElement ? nameElement.innerText.trim() : null,
                    number: numberElement ? numberElement.innerText.trim() : null,
                    address: addressElement ? addressElement.innerText.trim() : null
                };
            });
        });

        // Log the scraped data
        console.log('Scraped Data:', JSON.stringify(data, null, 2));

        // Save the scraped data to a JSON file
        fs.writeFileSync('scrapedData.json', JSON.stringify(data, null, 2), 'utf-8');
        console.log('Data has been saved to scrapedData.json');
    } catch (error) {
        console.error('Error occurred:', error);
    } finally {
        await browser.close();
    }
})();
