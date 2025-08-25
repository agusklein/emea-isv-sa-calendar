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
    const parsedEvents = [];
    
    console.log(`📋 Processing ${rows.length} rows from spreadsheet`);
    console.log('Columns:', data.table.cols.map(col => col.label || col.id));
    
    // Process all data rows (no header to skip)
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        if (!row.c || row.c.length < 3) {
            console.log(`⏭️  Skipping row ${i}: insufficient data`);
            continue;
        }
        
        // Extract data from the actual columns
        // Column B (#): Row number (index 1)
        // Column C (Activity): Event title (index 2)  
        // Column D (When?): Month and year (index 3)
        // Column E (Comments): Description (index 4)
        
        const titleCell = row.c[2]; // Activity column
        const whenCell = row.c[3];  // When? column
        const descriptionCell = row.c[4]; // Comments column
        
        if (!titleCell || !whenCell || !titleCell.v || !whenCell.v) {
            console.log(`⏭️  Skipping row ${i}: missing title or when data`);
            continue;
        }
        
        const title = titleCell.v;
        const whenText = whenCell.v;
        const description = descriptionCell ? descriptionCell.v : '';
        
        // Parse the "When?" field to extract month and year
        const parsedWhen = parseWhenField(whenText);
        
        if (!parsedWhen) {
            console.log(`⏭️  Skipped row ${i}: could not parse when field "${whenText}"`);
            continue;
        }
        
        const event = {
            date: `${parsedWhen.year}-${String(parsedWhen.month + 1).padStart(2, '0')}-15`,
            title: title,
            description: description,
            type: 'meeting', // Default type
            location: '',
            month: parsedWhen.month,
            year: parsedWhen.year,
            originalWhen: whenText
        };
        
        parsedEvents.push(event);
        console.log(`✅ Added: ${event.title} (${getMonthName(event.month)} ${event.year})`);
    }
    
    return parsedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function parseWhenField(whenText) {
    console.log(`Parsing when field: "${whenText}"`);
    
    if (!whenText || typeof whenText !== 'string') {
        return null;
    }
    
    const text = whenText.toLowerCase().trim();
    
    // Extract year (look for 4-digit number)
    const yearMatch = text.match(/\b(20\d{2})\b/);
    if (!yearMatch) {
        console.log(`No year found in: ${whenText}`);
        return null;
    }
    const year = parseInt(yearMatch[1]);
    
    // Extract month
    const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
    ];
    
    let month = null;
    for (let i = 0; i < monthNames.length; i++) {
        if (text.includes(monthNames[i]) || text.includes(monthNames[i].substring(0, 3))) {
            month = i;
            break;
        }
    }
    
    if (month === null) {
        console.log(`No month found in: ${whenText}`);
        return null;
    }
    
    console.log(`Parsed "${whenText}" -> ${getMonthName(month)} ${year}`);
    return { month, year };
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

function updateJavaScriptFile(events) {
    console.log('');
    console.log('📝 Updating JavaScript file with new data...');
    
    const jsFilePath = 'script.js';
    let jsContent = fs.readFileSync(jsFilePath, 'utf8');
    
    const currentDate = new Date();
    
    // Create the static data injection
    const staticDataString = `// 🤖 AUTO-GENERATED DATA - Last updated: ${currentDate.toISOString()}
// Source: Manual Google Sheets Sync
// Events: ${events.length} events loaded from spreadsheet
const STATIC_EVENTS = ${JSON.stringify(events, null, 2)};
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
    const sampleEventsFunction = `// Load events from static data (updated from Google Sheets)
function loadSampleRecurringEvents() {
    console.log('Loading static events from last Google Sheets sync...');
    console.log('Last updated:', LAST_SHEETS_UPDATE);
    
    if (typeof STATIC_EVENTS !== 'undefined' && STATIC_EVENTS.length > 0) {
        // Convert static events to the format expected by the website
        generatedEvents = STATIC_EVENTS;
        console.log(\`Loaded \${generatedEvents.length} static events from sheets sync\`);
        
        // Also create recurring events structure for calendar display
        recurringEvents = [];
        const monthGroups = {};
        
        STATIC_EVENTS.forEach(event => {
            const monthKey = event.month;
            if (!monthGroups[monthKey]) {
                monthGroups[monthKey] = [];
            }
            monthGroups[monthKey].push(event);
        });
        
        // Create recurring events for calendar display
        Object.keys(monthGroups).forEach(monthKey => {
            const month = parseInt(monthKey);
            const eventsInMonth = monthGroups[monthKey];
            
            eventsInMonth.forEach(event => {
                recurringEvents.push({
                    month: month,
                    title: event.title,
                    description: event.description,
                    type: event.type,
                    location: event.location,
                    year: event.year,
                    originalWhen: event.originalWhen
                });
            });
        });
        
    } else {
        // Ultimate fallback if no static data available
        generatedEvents = [
            {
                date: '2025-09-15',
                title: 'Sample Event - September 2025',
                description: 'This is a sample event',
                type: 'meeting',
                location: 'Virtual',
                month: 8,
                year: 2025
            }
        ];
        recurringEvents = [
            {
                month: 8,
                title: 'Sample Event - September 2025',
                description: 'This is a sample event',
                type: 'meeting',
                location: 'Virtual'
            }
        ];
        console.log('Using ultimate fallback sample data');
    }
    
    displayUpcomingEvents();
    generateCalendar();
}`;
    
    // Replace the existing loadSampleRecurringEvents function
    const functionRegex = /\/\/ Load events from static data[\s\S]*?function loadSampleRecurringEvents\(\)[\s\S]*?^\}/m;
    
    if (functionRegex.test(jsContent)) {
        jsContent = jsContent.replace(functionRegex, sampleEventsFunction);
        console.log('🔄 Updated loadSampleRecurringEvents function');
    } else {
        // Try the old pattern
        const oldFunctionRegex = /\/\/ Fallback sample recurring events[\s\S]*?function loadSampleRecurringEvents\(\)[\s\S]*?^\}/m;
        if (oldFunctionRegex.test(jsContent)) {
            jsContent = jsContent.replace(oldFunctionRegex, sampleEventsFunction);
            console.log('🔄 Updated loadSampleRecurringEvents function (old pattern)');
        }
    }
    
    // Write the updated content back to the file
    fs.writeFileSync(jsFilePath, jsContent, 'utf8');
    console.log('💾 JavaScript file updated successfully');
    
    // Also update a status file for tracking
    const statusData = {
        lastUpdate: currentDate.toISOString(),
        eventsCount: events.length,
        source: 'Manual Google Sheets Sync',
        events: events.map(e => ({ 
            title: e.title, 
            when: e.originalWhen || `${getMonthName(e.month)} ${e.year}`,
            date: e.date
        }))
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
        const events = parseSheetData(data);
        console.log(`✅ Successfully parsed ${events.length} events`);
        
        if (events.length === 0) {
            console.log('⚠️  No events found in spreadsheet. Exiting without changes.');
            return;
        }
        
        // Update the JavaScript file with static data
        updateJavaScriptFile(events);
        
        console.log('');
        console.log('🎉 Calendar update completed successfully!');
        console.log('');
        console.log('📋 Summary:');
        console.log(`   • ${events.length} events processed`);
        console.log(`   • JavaScript file updated with static data`);
        console.log(`   • Status file created: last-update.json`);
        console.log('');
        console.log('📅 Events loaded:');
        events.forEach(event => {
            console.log(`   • ${event.title} - ${event.originalWhen}`);
        });
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
