import puppeteer from 'puppeteer';
import {Shop} from './Shop.js';


async function main(){
    const headless = false; //'new'
    const browser = await puppeteer.launch({headless: headless});

    const shop = new Shop('Biedronka', 'https://www.biedronka.pl/pl/gazetki', browser);
    await shop.checkNewOffers();

    await browser.close();
}
main();