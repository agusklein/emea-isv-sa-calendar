#!/usr/bin/env node

// Manual update script for EMEA ISV SA Calendar
// Run this script monthly to sync with Google Sheets data

const fs = require('fs');
const https = require('https');

// Configuration
const SHEET_ID = '1DOlgJyYL7w_p1kR4IKjHvn7E8Cw31YWKZ2WOt-b_aJs';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Sheet1`;

console.log('🚀 EMEA ISV SA Calendar - Manual Update Script');
console.log('='.repeat(50));
console.log(`📊 Reading from Sheet ID: ${SHEET_ID}`);
console.log(`🕐 Started at: ${new Date().toISOString()}`);
console.log('');

async function fetchGoogleSheets() {
    return new Promise((resolve, reject) => {
        https.get(SHEET_URL, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonString = data.substring(47).slice(0, -2);
                    const parsedData = JSON.parse(jsonString);
                    resolve(parsedData);
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
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

function updateJavaScriptFile(recurringEvents) {
    console.log('');
    console.log('📝 Updating JavaScript file with new data...');
    
    const jsFilePath = 'script.js';
    let jsContent = fs.readFileSync(jsFilePath, 'utf8');
    
    const currentDate = new Date();
    
    // Create the static data injection
    const staticDataString = `// 🤖 AUTO-GENERATED DATA - Last updated: ${currentDate.toISOString()}
// Source: Manual Google Sheets Sync
// Events: ${recurringEvents.length} recurring events loaded
const STATIC_RECURRING_EVENTS = ${JSON.stringify(recurringEvents, null, 2)};
const LAST_SHEETS_UPDATE = '${currentDate.toISOString()}';

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
    
    if (typeof STATIC_RECURRING_EVENTS !== 'undefined' && STATIC_RECURRING_EVENTS.length > 0) {
        recurringEvents = STATIC_RECURRING_EVENTS;
        console.log(\`Loaded \${recurringEvents.length} static recurring events from sheets sync\`);
    } else {
        // Ultimate fallback if no static data available
        recurringEvents = [
            {
                month: 8, // September
                title: 'OP2 Prep',
                description: 'Annual OP2 preparation and planning session - happens every September',
                type: 'planning',
                location: 'London'
            },
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
        lastUpdate: currentDate.toISOString(),
        eventsCount: recurringEvents.length,
        source: 'Manual Google Sheets Sync',
        events: recurringEvents.map(e => ({ title: e.title, month: getMonthName(e.month) }))
    };
    
    fs.writeFileSync('last-update.json', JSON.stringify(statusData, null, 2));
    console.log('📊 Created update status file');
}

async function main() {
    try {
        // Fetch data from Google Sheets
        console.log('📥 Fetching data from Google Sheets...');
        const data = await fetchGoogleSheets();
        
        // Parse the data
        const recurringEvents = parseSheetData(data);
        console.log(`✅ Successfully parsed ${recurringEvents.length} recurring events`);
        
        if (recurringEvents.length === 0) {
            console.log('⚠️  No events found in spreadsheet. Exiting without changes.');
            return;
        }
        
        // Update the JavaScript file with static data
        updateJavaScriptFile(recurringEvents);
        
        console.log('');
        console.log('🎉 Calendar update completed successfully!');
        console.log('');
        console.log('📋 Summary:');
        console.log(`   • ${recurringEvents.length} recurring events processed`);
        console.log(`   • JavaScript file updated with static data`);
        console.log(`   • Status file created: last-update.json`);
        console.log('');
        console.log('🚀 Next steps:');
        console.log('   1. Review the changes in script.js');
        console.log('   2. Commit and push the updated files to GitHub');
        console.log('   3. The website will automatically use the new data');
        console.log('');
        console.log('💡 Run this script monthly to keep the calendar updated!');
        
    } catch (error) {
        console.error('❌ Error during calendar update:', error.message);
        console.log('');
        console.log('🔧 Troubleshooting:');
        console.log('   • Check your internet connection');
        console.log('   • Verify the Google Sheets URL is accessible');
        console.log('   • Ensure the spreadsheet has the correct format');
        process.exit(1);
    }
}

// Run the main function
main();
