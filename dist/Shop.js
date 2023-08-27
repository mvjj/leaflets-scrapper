import fs from 'fs';
import { downloadFile } from './utils.js';
export class Shop {
    constructor(url, browser) {
        this.url = url;
        this.browser = browser;
    }
    showUrl() {
        return this.url;
    }
    async checkNewOffers() {
        const links = await this.getOffersLinks();
        const link = links[0];
        const folderName = this.getOfferFolderName(link);
        const offerPath = 'G:/biedronka/shops/biedronka/' + folderName;
        if (!fs.existsSync(offerPath)) {
            console.log('Create dir: ', folderName);
            fs.mkdirSync(offerPath);
            let offerPages = await this.getOfferPages(link);
            offerPages = this.modifyOfferPages(offerPages);
            offerPages = this.sortOfferPages(offerPages);
            console.log(offerPages);
            return;
            for (let of = 0; of < offerPages.length; of++) {
                const offerPage = offerPages[of];
                console.log('Saving page: ', (of + 1));
                downloadFile(offerPage.url, offerPath + '/page-' + (of + 1) + '.' + offerPage.type);
            }
        }
        else {
            console.log('Dir exists: ', folderName);
        }
    }
    async getOffersLinks() {
        const page = await this.browser.newPage();
        // Navigate the page to a URL
        await page.goto(this.url);
        // Set screen size
        await page.setViewport({ width: 1080, height: 1024 });
        // Wait for the results page to load and display the results.
        const resultsSelector = 'a.page-slot-columns[href]';
        await page.waitForNetworkIdle();
        // Extract the results from the page.
        const links = await page.evaluate(resultsSelector => {
            const anchors = Array.from(document.querySelectorAll(resultsSelector));
            return anchors.map(anchor => {
                if (anchor instanceof HTMLAnchorElement && anchor.href.includes('press')) {
                    return anchor.href;
                }
            });
        }, resultsSelector);
        await page.close();
        return links;
    }
    async getOfferPages(offerLink) {
        const page = await this.browser.newPage();
        const imageTypes = ['image/jpg', 'image/jpeg', 'image/png'];
        const imageTypesToExt = {
            'image/jpg': 'jpg',
            'image/jpeg': 'jpg',
            'image/png': 'png'
        };
        const imagesUrl = [];
        page.on('response', response => {
            if (response.ok() && imageTypes.includes(response.headers()['content-type']) && Number(response.headers()['content-length']) > 100000) {
                if (this.isValidPageUrl(response.url()))
                    imagesUrl.push({ 'url': response.url(), 'type': imageTypesToExt[response.headers()['content-type']] });
            }
        });
        // Navigate the page to a URL
        await page.goto(offerLink);
        // Set screen size
        await page.setViewport({ width: 1080, height: 1024 });
        try {
            // Close cookies info
            await page.waitForSelector('#onetrust-accept-btn-handler', { visible: true });
            await page.click('#onetrust-accept-btn-handler');
            // Close info box
            await page.waitForSelector('.closeBodyContent');
            await page.click('.closeBodyContent');
        }
        catch (error) {
            console.log(error);
        }
        // Iterate through offer    
        const nextPage = '.s7ecatrightbutton div[aria-label="Next"]';
        while (1) {
            await page.waitForNetworkIdle();
            const nextPageButton = await page.waitForSelector(nextPage, { visible: true });
            const nextPageEnabled = await nextPageButton?.evaluate(el => el.getAttribute('state'));
            if (nextPageEnabled != 'disabled') {
                await nextPageButton.click();
            }
            else {
                break;
            }
        }
        await page.close();
        return imagesUrl;
    }
    getOfferFolderName(url) {
        const urlObj = new URL(url);
        const urlParts = urlObj.pathname.split(',');
        return urlParts[urlParts.length - 1];
    }
    isValidPageUrl(url) {
        const urlObj = new URL(url);
        if (urlObj.hostname == 's7g10.scene7.com' && urlObj.searchParams.get("req") == null)
            return true;
        return false;
    }
    sortOfferPages(list) {
        return list.sort((a, b) => {
            const pageARegex = a.url.match(/.*_P(?<page>[\d]*).*/);
            const pageBRegex = b.url.match(/.*_P(?<page>[\d]*).*/);
            const pageA = Number((pageARegex.groups?.page) ? pageARegex.groups?.page : 0);
            const pageB = Number((pageBRegex.groups?.page) ? pageBRegex.groups?.page : 0);
            return pageA - pageB;
        });
    }
    modifyOfferPages(list) {
        for (let of = 0; of < list.length; of++) {
            const urlObj = new URL(list[of].url);
            urlObj.searchParams.set('wid', '1940');
            urlObj.searchParams.set('hei', '1524');
            list[of].url = urlObj.toString();
        }
        return list;
    }
}
//# sourceMappingURL=Shop.js.map