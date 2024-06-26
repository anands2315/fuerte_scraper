const axios = require('axios');
const cheerio = require('cheerio');

const url = 'https://www.justdial.com/Delhi/search?q=rto%20consultant';

axios.get(url)
    .then(response => {
        const html = response.data;
        // console.log(html);
        const $ = cheerio.load(html);

        // Now you can use jQuery-like syntax to manipulate the HTML
        $('h2 > a > div.jsx-98ac5e1b53154d9c.resultbox_title_anchor.line_clamp_1').each((index, element) => {
            console.log($(element).text());
        });
    })
    .catch(error => {
        console.log(error);
    });
