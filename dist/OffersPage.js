export class OffersPage {
    constructor(url, browser) {
        this.url = url;
        this.browser = browser;
    }
    showUrl() {
        return this.url;
    }
    async checkOffers() {
        const links = await this.getOffersLinks();
        //for (let i = 0; i < links.length; i++) {
        const link = links[0];
        const offerPages = await this.getOfferPages(link);
        //}
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
        const imagesUrl = [];
        page.on('response', response => {
            if (response.ok() && imageTypes.includes(response.headers()['content-type']) && Number(response.headers()['content-length']) > 100000) {
                if (this.isValidPageUrl(response.url()))
                    imagesUrl.push(response.url());
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
        console.log(imagesUrl);
        return imagesUrl;
    }
    isValidPageUrl(url) {
        const urlObj = new URL(url);
        if (urlObj.hostname == 's7g10.scene7.com' && urlObj.searchParams.get("req") == null)
            return true;
        return false;
    }
}
//# sourceMappingURL=OffersPage.js.map