// wahapedia-stratagem-scraper.js
// Requires: puppeteer (install with: npm install puppeteer)

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

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

function extractFactionAndDetachment(jsonData) {
    // Extract faction name and remove prefix before the first '-'
    let faction = jsonData.roster?.forces?.[0]?.catalogueName || "Unknown Faction";
    if (faction.includes('-')) {
        faction = faction.split('-').slice(1).join('-').trim();
    }

    // Extract detachment name
    let detachment = "Unknown Detachment";
    const selections = jsonData.roster?.forces?.[0]?.selections || [];
    for (const selection of selections) {
        if (selection.group === "Detachment") {
            detachment = selection.name;
            break;
        }
    }

    return { faction, detachment };
}

// Main function to load JSON and scrape data
(async () => {
    const jsonFilePath = path.resolve(__dirname, '../data/New.json'); // Adjust path if needed
    if (!fs.existsSync(jsonFilePath)) {
        console.error(`JSON file not found: ${jsonFilePath}`);
        return;
    }

    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
    const { faction, detachment } = extractFactionAndDetachment(jsonData);

    console.log(`Faction: ${faction}`);
    console.log(`Detachment: ${detachment}`);

    // Example unit name (adjust as needed)
    const unit = "Hearthkyn Warriors";

    try {
        const stratagems = await scrapeStratagems(faction, unit, detachment);
        console.log(JSON.stringify(stratagems, null, 2));
    } catch (err) {
        console.error(`Error scraping stratagems:`, err);
    }
})();
