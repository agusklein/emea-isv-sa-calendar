// Global variables
let currentYear = 2025;
let recurringEvents = []; // Changed from events to recurringEvents
let generatedEvents = []; // All events generated for display

// Google Sheets configuration
const SHEET_ID = '1DOlgJyYL7w_p1kR4IKjHvn7E8Cw31YWKZ2WOt-b_aJs';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Sheet1`;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing EMEA ISV SA Managers Annual Clock...');
    initializeCalendarControls();
    loadEventsFromSheet();
});

// Calendar controls
function initializeCalendarControls() {
    const prevYearBtn = document.getElementById('prevYear');
    const nextYearBtn = document.getElementById('nextYear');
    const yearDisplay = document.getElementById('currentYear');

    prevYearBtn.addEventListener('click', () => {
        currentYear--;
        yearDisplay.textContent = currentYear;
        generateEventsForDisplay();
        displayUpcomingEvents();
        generateCalendar();
    });

    nextYearBtn.addEventListener('click', () => {
        currentYear++;
        yearDisplay.textContent = currentYear;
        generateEventsForDisplay();
        displayUpcomingEvents();
        generateCalendar();
    });
}

// Load events from Google Sheets
async function loadEventsFromSheet() {
    console.log('Loading recurring events from Google Sheets...');
    showLoadingState();
    
    try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        console.log('Raw response received from Google Sheets');
        
        // Parse Google Sheets JSON response
        const jsonString = text.substring(47).slice(0, -2);
        const data = JSON.parse(jsonString);
        
        recurringEvents = parseSheetData(data);
        console.log(`Successfully loaded ${recurringEvents.length} recurring events from Google Sheets:`, recurringEvents);
        
        generateEventsForDisplay();
        displayUpcomingEvents();
        generateCalendar();
        
    } catch (error) {
        console.error('Error loading events from Google Sheets:', error);
        console.log('Loading sample recurring events as fallback...');
        loadSampleRecurringEvents();
    }
}

// Parse Google Sheets data for recurring events
function parseSheetData(data) {
    console.log('Parsing Google Sheets data for recurring events:', data);
    
    if (!data.table || !data.table.rows) {
        console.error('Invalid data structure from Google Sheets');
        return [];
    }
    
    const rows = data.table.rows;
    const parsedRecurringEvents = [];
    
    console.log(`Processing ${rows.length} rows from spreadsheet`);
    
    // Skip header row (index 0) and process data rows
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        
        if (!row.c || row.c.length < 2) {
            console.log(`Skipping row ${i}: insufficient data`);
            continue;
        }
        
        // Extract data from each column
        const monthCell = row.c[0]; // Month name or number
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
        
        console.log(`Row ${i}:`, recurringEvent);
        
        // Only add events with valid month and title
        if (recurringEvent.month !== null && recurringEvent.title && recurringEvent.title.trim() !== '') {
            parsedRecurringEvents.push(recurringEvent);
            console.log(`Added recurring event: ${recurringEvent.title} in ${getMonthName(recurringEvent.month)}`);
        } else {
            console.log(`Skipped row ${i}: missing month or title`);
        }
    }
    
    console.log('Final recurring events:', parsedRecurringEvents);
    return parsedRecurringEvents;
}

// Parse month from Google Sheets (could be month name or number)
function parseMonthFromSheet(monthValue) {
    console.log('Parsing month value:', monthValue, typeof monthValue);
    
    if (typeof monthValue === 'string') {
        const monthStr = monthValue.toLowerCase().trim();
        const monthNames = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
        ];
        
        // Try to find full month name
        const monthIndex = monthNames.findIndex(name => name.startsWith(monthStr));
        if (monthIndex !== -1) {
            console.log(`Parsed month name "${monthValue}" to month ${monthIndex}`);
            return monthIndex;
        }
        
        // Try to parse as number
        const monthNum = parseInt(monthStr);
        if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
            console.log(`Parsed month number "${monthValue}" to month ${monthNum - 1}`);
            return monthNum - 1; // Convert to 0-based index
        }
    } else if (typeof monthValue === 'number') {
        if (monthValue >= 1 && monthValue <= 12) {
            console.log(`Parsed numeric month ${monthValue} to month ${monthValue - 1}`);
            return monthValue - 1; // Convert to 0-based index
        }
    }
    
    console.log('Could not parse month value:', monthValue);
    return null;
}

// Generate events for display based on recurring events
function generateEventsForDisplay() {
    console.log('Generating events for display...');
    generatedEvents = [];
    
    // Generate events for current year and next year
    const yearsToGenerate = [currentYear, currentYear + 1];
    
    yearsToGenerate.forEach(year => {
        recurringEvents.forEach(recurringEvent => {
            // Create an event for this year and month
            const event = {
                date: `${year}-${String(recurringEvent.month + 1).padStart(2, '0')}-15`, // Use 15th as default day
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
    console.log(`Generated ${generatedEvents.length} events for display:`, generatedEvents);
}

// Get month name from index
function getMonthName(monthIndex) {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[monthIndex];
}

// Fallback sample recurring events
function loadSampleRecurringEvents() {
    console.log('Loading sample recurring events as fallback...');
    recurringEvents = [
        {
            month: 6, // July (0-based index)
            title: 'OLR Johan\'s Level',
            description: 'Quarterly leadership review session with Johan - happens every July',
            type: 'meeting',
            location: 'Virtual'
        },
        {
            month: 0, // January (0-based index)
            title: 'OLR Johan\'s Level',
            description: 'Quarterly leadership review session with Johan - happens every January',
            type: 'meeting',
            location: 'Virtual'
        },
        {
            month: 8, // September (0-based index)
            title: 'OP2 Prep',
            description: 'Annual OP2 preparation and planning session - happens every September',
            type: 'planning',
            location: 'London'
        },
        {
            month: 11, // December (0-based index)
            title: 'AWS re:Invent',
            description: 'Annual AWS conference - happens every December',
            type: 'conference',
            location: 'Las Vegas, NV'
        },
        {
            month: 2, // March (0-based index)
            title: 'Q1 Business Review',
            description: 'Quarterly business review - happens every March',
            type: 'meeting',
            location: 'Dublin'
        }
    ];
    
    console.log('Sample recurring events loaded:', recurringEvents);
    generateEventsForDisplay();
    displayUpcomingEvents();
    generateCalendar();
}

// Display upcoming events (next 90 days)
function displayUpcomingEvents() {
    console.log('Displaying upcoming events...');
    const today = new Date();
    const next90Days = new Date(today.getTime() + (90 * 24 * 60 * 60 * 1000));
    
    const upcomingEvents = generatedEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= today && eventDate <= next90Days;
    });
    
    console.log(`Found ${upcomingEvents.length} upcoming events in next 90 days:`, upcomingEvents);
    
    const container = document.getElementById('upcomingEventsGrid');
    const noEventsMessage = document.getElementById('noEventsMessage');
    
    if (upcomingEvents.length === 0) {
        container.innerHTML = '';
        container.style.display = 'none';
        noEventsMessage.style.display = 'block';
        return;
    }
    
    container.style.display = 'grid';
    noEventsMessage.style.display = 'none';
    
    container.innerHTML = upcomingEvents.map(event => {
        const eventDate = new Date(event.date);
        const daysUntil = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
        
        return `
            <div class="event-card">
                <div class="event-date">
                    ${getMonthName(event.month)} ${event.year} ${daysUntil > 0 ? `(in ~${daysUntil} days)` : daysUntil === 0 ? '(This month)' : ''}
                </div>
                <div class="event-title">${event.title}</div>
                <div class="event-description">${event.description}</div>
                ${event.location ? `<div class="event-location">📍 ${event.location}</div>` : ''}
                <div class="event-type">${capitalizeFirst(event.type)}</div>
            </div>
        `;
    }).join('');
}

// Generate calendar with monthly view
function generateCalendar() {
    console.log(`Generating calendar for year ${currentYear}...`);
    const container = document.getElementById('monthsList');
    const startMonth = currentYear === 2025 ? 7 : 0; // Start from August 2025 (month 7)
    const endMonth = 11; // Always end at December
    
    container.innerHTML = '';
    
    for (let month = startMonth; month <= endMonth; month++) {
        const monthSection = createMonthSection(currentYear, month);
        container.appendChild(monthSection);
    }
}

// Create individual month section
function createMonthSection(year, month) {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const monthSection = document.createElement('div');
    monthSection.className = 'month-section';
    
    // Month header
    const header = document.createElement('div');
    header.className = 'month-header';
    header.textContent = `${monthNames[month]} ${year}`;
    monthSection.appendChild(header);
    
    // Get recurring events for this month
    const monthEvents = recurringEvents.filter(event => event.month === month);
    
    console.log(`${monthNames[month]} ${year}: Found ${monthEvents.length} recurring events`, monthEvents);
    
    // Month events container
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'month-events';
    
    if (monthEvents.length === 0) {
        const noEvents = document.createElement('div');
        noEvents.className = 'no-events-month';
        noEvents.textContent = 'No events scheduled for this month';
        eventsContainer.appendChild(noEvents);
    } else {
        monthEvents.forEach(event => {
            const eventElement = createMonthEventElement(event, year);
            eventsContainer.appendChild(eventElement);
        });
    }
    
    monthSection.appendChild(eventsContainer);
    return monthSection;
}

// Create individual event element for month view
function createMonthEventElement(recurringEvent, year) {
    const eventDiv = document.createElement('div');
    eventDiv.className = 'month-event';
    
    eventDiv.innerHTML = `
        <div class="event-date-day">
            <span class="day">${getMonthName(recurringEvent.month)}</span>
            <span class="weekday">${year}</span>
        </div>
        <div class="event-details">
            <div class="title">${recurringEvent.title}</div>
            <div class="description">${recurringEvent.description}</div>
            <div class="meta">
                ${recurringEvent.location ? `<span>📍 ${recurringEvent.location}</span>` : ''}
                <span class="event-type-badge">${capitalizeFirst(recurringEvent.type)}</span>
            </div>
        </div>
    `;
    
    return eventDiv;
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Show loading state
function showLoadingState() {
    const upcomingContainer = document.getElementById('upcomingEventsGrid');
    const calendarContainer = document.getElementById('monthsList');
    
    upcomingContainer.innerHTML = '<div class="loading-spinner">Loading recurring events from Google Sheets...</div>';
    calendarContainer.innerHTML = '<div class="loading-spinner">Loading calendar from Google Sheets...</div>';
}

// Refresh data periodically (every 10 minutes)
setInterval(() => {
    console.log('Refreshing recurring events data...');
    loadEventsFromSheet();
}, 10 * 60 * 1000);
