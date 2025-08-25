const fs = require('fs');
const fetch = require('node-fetch');

// Configuration
const SHEET_ID = process.env.SHEET_ID || '1DOlgJyYL7w_p1kR4IKjHvn7E8Cw31YWKZ2WOt-b_aJs';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Sheet1`;

console.log('🚀 Starting monthly Google Sheets sync...');
console.log(`📊 Reading from Sheet ID: ${SHEET_ID}`);

async function main() {
    try {
        // Fetch data from Google Sheets
        console.log('📥 Fetching data from Google Sheets...');
        const response = await fetch(SHEET_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        const jsonString = text.substring(47).slice(0, -2);
        const data = JSON.parse(jsonString);
        
        // Parse the data
        const recurringEvents = parseSheetData(data);
        console.log(`✅ Successfully parsed ${recurringEvents.length} recurring events`);
        
        // Generate static data for the website
        const staticData = generateStaticData(recurringEvents);
        
        // Update the JavaScript file with static data
        updateJavaScriptFile(staticData);
        
        console.log('🎉 Monthly sync completed successfully!');
        
    } catch (error) {
        console.error('❌ Error during monthly sync:', error);
        process.exit(1);
    }
}

function parseSheetData(data) {
    console.log('🔍 Parsing Google Sheets data...');
    
    if (!data.table || !data.table.rows) {
        throw new Error('Invalid data structure from Google Sheets');
    }
    
    const rows = data.table.rows;
    const parsedRecurringEvents = [];
    
    console.log(`📋 Processing ${rows.length} rows from spreadsheet`);
    
    // Skip header row (index 0) and process data rows
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        
        if (!row.c || row.c.length < 2) {
            console.log(`⏭️  Skipping row ${i}: insufficient data`);
            continue;
        }
        
        // Extract data from each column
        const monthCell = row.c[0];
        const titleCell = row.c[1];
        const descriptionCell = row.c[2];
        const typeCell = row.c[3];
        const locationCell = row.c[4];
        
        const recurringEvent = {
            month: monthCell ? parseMonthFromSheet(monthCell.v) : null,
            title: titleCell ? titleCell.v : '',
            description: descriptionCell ? descriptionCell.v : '',
            type: typeCell ? typeCell.v.toLowerCase() : 'other',
            location: locationCell ? locationCell.v : ''
        };
        
        // Only add events with valid month and title
        if (recurringEvent.month !== null && recurringEvent.title && recurringEvent.title.trim() !== '') {
            parsedRecurringEvents.push(recurringEvent);
            console.log(`✅ Added: ${recurringEvent.title} (${getMonthName(recurringEvent.month)})`);
        } else {
            console.log(`⏭️  Skipped row ${i}: missing month or title`);
        }
    }
    
    return parsedRecurringEvents;
}

function parseMonthFromSheet(monthValue) {
    if (typeof monthValue === 'string') {
        const monthStr = monthValue.toLowerCase().trim();
        const monthNames = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
        ];
        
        // Try to find full month name or abbreviation
        const monthIndex = monthNames.findIndex(name => name.startsWith(monthStr));
        if (monthIndex !== -1) {
            return monthIndex;
        }
        
        // Try to parse as number
        const monthNum = parseInt(monthStr);
        if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
            return monthNum - 1; // Convert to 0-based index
        }
    } else if (typeof monthValue === 'number') {
        if (monthValue >= 1 && monthValue <= 12) {
            return monthValue - 1; // Convert to 0-based index
        }
    }
    
    return null;
}

function getMonthName(monthIndex) {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[monthIndex];
}

function generateStaticData(recurringEvents) {
    console.log('🏗️  Generating static data for website...');
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // Generate events for current year and next 2 years
    const generatedEvents = [];
    const yearsToGenerate = [currentYear, currentYear + 1, currentYear + 2];
    
    yearsToGenerate.forEach(year => {
        recurringEvents.forEach(recurringEvent => {
            const event = {
                date: `${year}-${String(recurringEvent.month + 1).padStart(2, '0')}-15`,
                title: recurringEvent.title,
                description: recurringEvent.description,
                type: recurringEvent.type,
                location: recurringEvent.location,
                month: recurringEvent.month,
                year: year
            };
            generatedEvents.push(event);
        });
    });
    
    // Sort by date
    generatedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    console.log(`📅 Generated ${generatedEvents.length} events for ${yearsToGenerate.length} years`);
    
    return {
        recurringEvents,
        generatedEvents,
        lastUpdated: currentDate.toISOString(),
        updateSource: 'Google Sheets Monthly Sync'
    };
}

function updateJavaScriptFile(staticData) {
    console.log('📝 Updating JavaScript file with new data...');
    
    const jsFilePath = 'script.js';
    let jsContent = fs.readFileSync(jsFilePath, 'utf8');
    
    // Create the static data injection
    const staticDataString = `// 🤖 AUTO-GENERATED DATA - Last updated: ${staticData.lastUpdated}
// Source: ${staticData.updateSource}
const STATIC_RECURRING_EVENTS = ${JSON.stringify(staticData.recurringEvents, null, 2)};
const STATIC_GENERATED_EVENTS = ${JSON.stringify(staticData.generatedEvents, null, 2)};
const LAST_SHEETS_UPDATE = '${staticData.lastUpdated}';

`;
    
    // Replace or add the static data at the top of the file
    const staticDataRegex = /\/\/ 🤖 AUTO-GENERATED DATA[\s\S]*?const LAST_SHEETS_UPDATE = '[^']*';\s*/;
    
    if (staticDataRegex.test(jsContent)) {
        // Replace existing static data
        jsContent = jsContent.replace(staticDataRegex, staticDataString);
        console.log('🔄 Updated existing static data in JavaScript file');
    } else {
        // Add static data at the beginning
        jsContent = staticDataString + jsContent;
        console.log('➕ Added new static data to JavaScript file');
    }
    
    // Update the loadSampleRecurringEvents function to use static data
    const sampleEventsFunction = `// Fallback sample recurring events (now uses static data from sheets)
function loadSampleRecurringEvents() {
    console.log('Loading static recurring events from last Google Sheets sync...');
    console.log('Last updated:', LAST_SHEETS_UPDATE);
    
    if (STATIC_RECURRING_EVENTS && STATIC_RECURRING_EVENTS.length > 0) {
        recurringEvents = STATIC_RECURRING_EVENTS;
        console.log(\`Loaded \${recurringEvents.length} static recurring events from sheets sync\`);
    } else {
        // Ultimate fallback if no static data available
        recurringEvents = [
            {
                month: 6, // July
                title: 'Sample Event - July',
                description: 'This is a sample event that occurs every July',
                type: 'meeting',
                location: 'Virtual'
            }
        ];
        console.log('Using ultimate fallback sample data');
    }
    
    generateEventsForDisplay();
    displayUpcomingEvents();
    generateCalendar();
}`;
    
    // Replace the existing loadSampleRecurringEvents function
    const functionRegex = /\/\/ Fallback sample recurring events[\s\S]*?function loadSampleRecurringEvents\(\)[\s\S]*?^\}/m;
    
    if (functionRegex.test(jsContent)) {
        jsContent = jsContent.replace(functionRegex, sampleEventsFunction);
        console.log('🔄 Updated loadSampleRecurringEvents function');
    }
    
    // Write the updated content back to the file
    fs.writeFileSync(jsFilePath, jsContent, 'utf8');
    console.log('💾 JavaScript file updated successfully');
    
    // Also update a status file for tracking
    const statusData = {
        lastUpdate: staticData.lastUpdated,
        eventsCount: staticData.recurringEvents.length,
        generatedEventsCount: staticData.generatedEvents.length,
        source: staticData.updateSource
    };
    
    fs.writeFileSync('last-update.json', JSON.stringify(statusData, null, 2));
    console.log('📊 Created update status file');
}

// Run the main function
main();
