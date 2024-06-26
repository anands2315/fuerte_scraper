const puppeteer = require('puppeteer');

puppeteer
    .launch()
    .then(browser => browser.close())
    .catch(error => console.error('Error installing Chromium:', error));
