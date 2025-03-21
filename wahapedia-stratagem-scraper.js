// wahapedia-stratagem-scraper.js
// Requires: puppeteer (install with: npm install puppeteer)

const puppeteer = require('puppeteer');

async function scrapeStratagems(factionName, unitName, detachmentName) {
    const formattedFaction = factionName.toLowerCase().replace(/\s+/g, '-');
    const formattedUnit = unitName.toLowerCase().replace(/\s+/g, '-');
    const url = `https://wahapedia.ru/wh40k10ed/factions/${formattedFaction}/${formattedUnit}`;

    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Wait for the detachment dropdown to appear
    await page.waitForSelector('.ctrlSelect');

    // Try selecting the detachment (e.g., "Oathband")
    try {
        await page.select('.ctrlSelect', detachmentName);
        console.log(`Selected detachment: ${detachmentName}`);
    } catch (err) {
        console.warn(`Could not select detachment: ${detachmentName}`);
    }

    // Wait a bit for stratagems to update
    await page.waitForTimeout(1000);

    // Extract visible stratagem cards
    const stratagems = await page.evaluate(() => {
        const result = [];
        const cards = document.querySelectorAll('.stratagem');
        cards.forEach(card => {
            const title = card.querySelector('.stratagem__name')?.innerText?.trim();
            const description = card.querySelector('.stratagem__content')?.innerText?.trim();
            const type = card.querySelector('.stratagem__type')?.innerText?.trim();
            const phase = card.querySelector('.stratagem__phase')?.innerText?.trim();
            if (title && description) {
                result.push({ title, type, phase, description });
            }
        });
        return result;
    });

    await browser.close();
    return stratagems;
}

// Example usage:
(async () => {
    const faction = "Leagues of Votann";
    const unit = "Hearthkyn Warriors";
    const detachment = "Oathband"; // must match value from <select> dropdown

    const stratagems = await scrapeStratagems(faction, unit, detachment);
    console.log(JSON.stringify(stratagems, null, 2));
})();
