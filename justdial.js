const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs'); // Import the file system module

puppeteer.use(StealthPlugin());

// Utility function to wait for a specific time in milliseconds
const waitForTimeout = (timeout) => {
    return new Promise(resolve => setTimeout(resolve, timeout));
};

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        protocolTimeout: 200000 // Increased to 200 seconds
    });
    const page = await browser.newPage();

    try {
        await page.goto('https://www.justdial.com/Bhuj/search?q=hospitals', { waitUntil: 'networkidle2', timeout: 60000 });

        // Wait for 10 seconds to allow manual clicks or any other activity
        console.log('Waiting for 10 seconds...');
        await waitForTimeout(10000); // Wait for 10 seconds

        console.log('Scraping data...');
        const data = await page.evaluate(async () => {
            const scrollPage = async () => {
                let totalHeight = 0;
                const distance = 1000;
                while (document.querySelectorAll('h2 > a > div.jsx-98ac5e1b53154d9c.resultbox_title_anchor.line_clamp_1').length < 100) {
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    await new Promise(resolve => setTimeout(resolve, 300)); // Reduced the wait time to 300ms
                }
            };

            await scrollPage();

            const productElements1 = document.querySelectorAll('h2 > a > div.jsx-98ac5e1b53154d9c.resultbox_title_anchor.line_clamp_1');
            const productElements2 = document.querySelectorAll('div.jsx-98ac5e1b53154d9c.font15.fw400.color111');
            const productElements3 = document.querySelectorAll('div.resultbox_btnbox.mt-10');

            const names = Array.from(productElements1).map(el => el.textContent.trim());
            const addresses = Array.from(productElements2).map(el => el.textContent.trim());

            const numbers = [];
            let clickCount = 0;
            for (const element of productElements3) {
                let number = 'N/A';
                const showNumberButton = element.querySelector('div.jsx-98ac5e1b53154d9c.greenfill_animate.callbutton.font15.fw500.colorFFF.mr-15 > span');

                if (showNumberButton && clickCount < 40) {
                    showNumberButton.click();
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for the number to load
                    clickCount++;
                }

                const newNumber = element.textContent.trim().match(/\d+/);
                if (newNumber) {
                    number = newNumber[0];
                }

                numbers.push(number);

                // Break the loop if 40 numbers are obtained
                if (clickCount >= 40) {
                    break;
                }
            }

            const combinedData = names.map((name, index) => ({
                name,
                address: addresses[index] || 'N/A',
                number: numbers[index] || 'N/A'
            }));

            return combinedData.slice(0, 100); // Ensure only 100 entries are returned
        });

        // Log the count of scraped data
        console.log(`Number of entries fetched: ${data.length}`);

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
