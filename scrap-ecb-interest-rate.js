/**
 * Scraping latest European Central Bank (ECB) interest rate using Request and
 * Cheerio.
 *
 * This example shows how we scrap a web page from its server-returned HTML.
 * Thus it will only works if the content we intend to scrap is returned in the
 * main HTTP request returning the initial HTML page.
 *
 * It is particurlarly unable to parse data that is loaded by javascript code loaded
 * and executed in the browser - after the initial HTML page load -. Cheerio
 * indeed is not a web-browser.
 * For that, check our other example: scrap-bcb-interest-rate.js.
 *
 * Scrap from https://www.ecb.europa.eu/stats/policy_and_exchange_rates/key_ecb_interest_rates/html/index.en.html
 *
 * This code is not intended to have any utility above its educational purposes.
 *
 * Author: Yoan Tournade <yoan@ytotech.com>
 * License: MIT
 */
const request = require('request');
const cheerio = require('cheerio');
const _ = require('lodash');
const moment = require('moment');

// The DOM elements which will be scrapped.
const ELEMENTS_MAPPING = {
    currentInterectRate: {
        selector: '.ecb-contentTable tr:nth-child(1) .number',
        parseElement: function ($,element) {
            // console.log(element.text());
            const year = $(element.get(0)).text();
            const day = $(element.get(1)).text();
            const rate = $(element.get(3)).text();
            return {
                date: moment(`${day} ${year}`, "DD MMM YYYY"),
                rate: Number.parseFloat(rate)
            };
        }
    }
};

request('https://www.ecb.europa.eu/stats/policy_and_exchange_rates/key_ecb_interest_rates/html/index.en.html', function (error, response, html) {
    if (!error) {
        // console.log(html);
        const $ = cheerio.load(html);
        const data = _.mapValues(ELEMENTS_MAPPING, function (element) {
            return element.parseElement($, $(element.selector));
        });
        console.log(data);
        console.log(`\nCurrent interest rate for ECB is ${data.currentInterectRate.rate.toFixed(2)}.`);
        console.log(`It was last changed ${data.currentInterectRate.date.fromNow()} (${data.currentInterectRate.date.format('ll')}).`);
    }
});
