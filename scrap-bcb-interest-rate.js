/**
 * Scraping latest Brazilian Central Bank (BCB) interest rate using PhantomJS.
 *
 * This example is interesting as it let appear how we can scrap a web page content
 * that is being populated by browser-side javascript - that is not present in the
 * initially returned HTML page.
 *
 * We could also have used JSDOM for the same purpose, or other headless-browsers
 * (Puppeteer).
 *
 * For parsing only server-side served HTML pages, checkout scrap-ecb-interest-rate.js.,
 * which uses Cheerio.
 *
 * Scrap from https://www3.bcb.gov.br/selic/portal-selic-servicos/pesquisa-taxa-apurada.jsp
 *
 * This code is not intended to have any utility above its educational purposes.
 *
 * Author: Yoan Tournade <yoan@ytotech.com>
 * License: MIT
 */
const phantom = require('phantom');
const _ = require('lodash');
const moment = require('moment');

function scraping () {
    // The DOM elements which will be scrapped.
    const ELEMENTS_MAPPING = {
        currentInterectRate: {
            selector: '.ui-grid-row .ui-grid-cell .ui-grid-cell-contents',
            parseElement: function ($,element) {
                // console.log(element.text());
                return {
                    date: $(element.get(0)).text(),
                    rate: $(element.get(1)).text()
                };
            }
        }
    };

    const data = _.mapValues(ELEMENTS_MAPPING, function (element) {
        return element.parseElement($, $(element.selector));
    });
    return data;
}

function parseScrapped (data) {
    console.log(data);
    const parseValues = {
        currentInterectRate: function (elementData) {
            return {
                date: moment(elementData.date, "DD/MM/YYYY"),
                rate: Number.parseFloat(elementData.rate)
            };
        }
    };
    return _.mapValues(data, function (element, key) {
        return parseValues[key](element);
    });
}

function waitTime(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

(async function() {
    const instance = await phantom.create();
    const page = await instance.createPage();
    page.on('onConsoleMessage', function(msg) {
        console.log(msg);
    });
    console.log('Opening page...');
    const status = await page.open('https://www3.bcb.gov.br/selic/portal-selic-servicos/pesquisa-taxa-apurada.jsp');
    console.log(status);
    if (status !== "success") {
        console.log(status);
        await instance.exit();
    }
    console.log('Waiting javascript to load...');
    // TODO Use a waitState https://gist.github.com/juanbrujo/dee3070a30fa8cdd6fe082a54afe1c7d#file-react-app-scrapping-js-L43
    await waitTime(1000);
    console.log('Scraping content...');
    const data = parseScrapped(await page.evaluate(scraping));
    console.log(data);
    console.log(`\nCurrent interest rate for ECB is ${data.currentInterectRate.rate.toFixed(2)}.`);
    console.log(`Data was last updated ${data.currentInterectRate.date.fromNow()} (${data.currentInterectRate.date.format('ll')}).`);

    await instance.exit();
})();
