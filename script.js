// Global variables
let currentYear = 2025;
let events = [];

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
        generateCalendar();
    });

    nextYearBtn.addEventListener('click', () => {
        currentYear++;
        yearDisplay.textContent = currentYear;
        generateCalendar();
    });
}

// Load events from Google Sheets
async function loadEventsFromSheet() {
    console.log('Loading events from Google Sheets...');
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
        
        events = parseSheetData(data);
        console.log(`Successfully loaded ${events.length} events from Google Sheets:`, events);
        
        displayUpcomingEvents();
        generateCalendar();
        
    } catch (error) {
        console.error('Error loading events from Google Sheets:', error);
        console.log('Loading sample events as fallback...');
        loadSampleEvents();
    }
}

// Parse Google Sheets data
function parseSheetData(data) {
    console.log('Parsing Google Sheets data:', data);
    
    if (!data.table || !data.table.rows) {
        console.error('Invalid data structure from Google Sheets');
        return [];
    }
    
    const rows = data.table.rows;
    const parsedEvents = [];
    
    console.log(`Processing ${rows.length} rows from spreadsheet`);
    
    // Skip header row (index 0) and process data rows
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        
        if (!row.c || row.c.length < 2) {
            console.log(`Skipping row ${i}: insufficient data`);
            continue;
        }
        
        // Extract data from each column
        const dateCell = row.c[0];
        const titleCell = row.c[1];
        const descriptionCell = row.c[2];
        const typeCell = row.c[3];
        const locationCell = row.c[4];
        
        const event = {
            date: dateCell ? parseSheetDate(dateCell.v) : null,
            title: titleCell ? titleCell.v : '',
            description: descriptionCell ? descriptionCell.v : '',
            type: typeCell ? typeCell.v.toLowerCase() : 'other',
            location: locationCell ? locationCell.v : ''
        };
        
        console.log(`Row ${i}:`, event);
        
        // Only add events with valid date and title
        if (event.date && event.title && event.title.trim() !== '') {
            parsedEvents.push(event);
            console.log(`Added event: ${event.title} on ${event.date}`);
        } else {
            console.log(`Skipped row ${i}: missing date or title`);
        }
    }
    
    // Sort events by date
    const sortedEvents = parsedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    console.log('Final sorted events:', sortedEvents);
    
    return sortedEvents;
}

// Parse date from Google Sheets format
function parseSheetDate(dateValue) {
    console.log('Parsing date value:', dateValue, typeof dateValue);
    
    if (typeof dateValue === 'string') {
        // Try to parse as ISO date or other common formats
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
            const isoDate = date.toISOString().split('T')[0];
            console.log(`Parsed string date "${dateValue}" to ${isoDate}`);
            return isoDate;
        }
        console.log(`Could not parse string date: ${dateValue}`);
        return dateValue;
    } else if (typeof dateValue === 'number') {
        // Google Sheets date serial number (days since December 30, 1899)
        const date = new Date((dateValue - 25569) * 86400 * 1000);
        const isoDate = date.toISOString().split('T')[0];
        console.log(`Parsed numeric date ${dateValue} to ${isoDate}`);
        return isoDate;
    }
    
    console.log('Could not parse date value:', dateValue);
    return null;
}

// Fallback sample events for demonstration
function loadSampleEvents() {
    console.log('Loading sample events as fallback...');
    events = [
        {
            date: '2025-09-15',
            title: 'AWS re:Invent 2025 Planning Session',
            description: 'Initial planning and coordination session for AWS re:Invent 2025 ISV activities and partner engagement',
            type: 'meeting',
            location: 'Virtual'
        },
        {
            date: '2025-09-30',
            title: 'Q3 ISV Partner Business Review',
            description: 'Quarterly business review with key ISV partners across EMEA region',
            type: 'meeting',
            location: 'London'
        },
        {
            date: '2025-10-15',
            title: 'ISV Technical Deep Dive Series',
            description: 'Monthly technical session covering latest AWS services and ISV integration patterns',
            type: 'training',
            location: 'Virtual'
        },
        {
            date: '2025-11-01',
            title: 'EMEA ISV SA All-Hands Meeting',
            description: 'Regional all-hands meeting for EMEA ISV Solutions Architects',
            type: 'meeting',
            location: 'Dublin'
        },
        {
            date: '2025-12-02',
            title: 'AWS re:Invent 2025',
            description: 'Annual AWS conference in Las Vegas - ISV partner activities and sessions',
            type: 'conference',
            location: 'Las Vegas, NV'
        },
        {
            date: '2026-01-28',
            title: 'EMEA ISV SA Offsite - End of January',
            description: 'Team offsite and strategic planning session for EMEA ISV Solutions Architects',
            type: 'offsite',
            location: 'Amsterdam'
        },
        {
            date: '2026-06-25',
            title: 'EMEA ISV SA Offsite - End of June',
            description: 'Mid-year team offsite and business review for EMEA ISV Solutions Architects',
            type: 'offsite',
            location: 'Barcelona'
        }
    ];
    
    console.log('Sample events loaded:', events);
    displayUpcomingEvents();
    generateCalendar();
}

// Display upcoming events (next 90 days)
function displayUpcomingEvents() {
    console.log('Displaying upcoming events...');
    const today = new Date();
    const next90Days = new Date(today.getTime() + (90 * 24 * 60 * 60 * 1000));
    
    const upcomingEvents = events.filter(event => {
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
                    ${formatDate(event.date)} ${daysUntil > 0 ? `(in ${daysUntil} days)` : daysUntil === 0 ? '(Today)' : ''}
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
    
    // Get events for this month
    const monthEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });
    
    console.log(`${monthNames[month]} ${year}: Found ${monthEvents.length} events`, monthEvents);
    
    // Month events container
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'month-events';
    
    if (monthEvents.length === 0) {
        const noEvents = document.createElement('div');
        noEvents.className = 'no-events-month';
        noEvents.textContent = 'No events scheduled for this month';
        eventsContainer.appendChild(noEvents);
    } else {
        // Sort events by date within the month
        monthEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        monthEvents.forEach(event => {
            const eventElement = createMonthEventElement(event);
            eventsContainer.appendChild(eventElement);
        });
    }
    
    monthSection.appendChild(eventsContainer);
    return monthSection;
}

// Create individual event element for month view
function createMonthEventElement(event) {
    const eventDate = new Date(event.date);
    const day = eventDate.getDate();
    const weekday = eventDate.toLocaleDateString('en-US', { weekday: 'short' });
    
    const eventDiv = document.createElement('div');
    eventDiv.className = 'month-event';
    
    eventDiv.innerHTML = `
        <div class="event-date-day">
            <span class="day">${day}</span>
            <span class="weekday">${weekday}</span>
        </div>
        <div class="event-details">
            <div class="title">${event.title}</div>
            <div class="description">${event.description}</div>
            <div class="meta">
                ${event.location ? `<span>📍 ${event.location}</span>` : ''}
                <span class="event-type-badge">${capitalizeFirst(event.type)}</span>
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
    
    upcomingContainer.innerHTML = '<div class="loading-spinner">Loading upcoming events from Google Sheets...</div>';
    calendarContainer.innerHTML = '<div class="loading-spinner">Loading calendar from Google Sheets...</div>';
}

// Refresh data periodically (every 10 minutes)
setInterval(() => {
    console.log('Refreshing events data...');
    loadEventsFromSheet();
}, 10 * 60 * 1000);
