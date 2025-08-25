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
    try {
        const response = await fetch(SHEET_URL);
        const text = await response.text();
        
        // Parse Google Sheets JSON response
        const jsonString = text.substring(47).slice(0, -2);
        const data = JSON.parse(jsonString);
        
        events = parseSheetData(data);
        console.log(`Loaded ${events.length} events from Google Sheets`);
        
        displayUpcomingEvents();
        generateCalendar();
        
    } catch (error) {
        console.error('Error loading events from Google Sheets:', error);
        loadSampleEvents(); // Fallback to sample data
    }
}

// Parse Google Sheets data
function parseSheetData(data) {
    const rows = data.table.rows;
    const parsedEvents = [];
    
    // Skip header row (index 0)
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.c && row.c.length >= 2) {
            const event = {
                date: row.c[0] ? parseSheetDate(row.c[0].v) : null,
                title: row.c[1] ? row.c[1].v : '',
                description: row.c[2] ? row.c[2].v : '',
                type: row.c[3] ? row.c[3].v.toLowerCase() : 'other',
                location: row.c[4] ? row.c[4].v : ''
            };
            
            if (event.date && event.title) {
                parsedEvents.push(event);
            }
        }
    }
    
    return parsedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
}

// Parse date from Google Sheets format
function parseSheetDate(dateValue) {
    if (typeof dateValue === 'string') {
        // Handle various date formats
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
        return dateValue;
    } else if (typeof dateValue === 'number') {
        // Google Sheets date serial number (days since December 30, 1899)
        const date = new Date((dateValue - 25569) * 86400 * 1000);
        return date.toISOString().split('T')[0];
    }
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
            date: '2026-01-15',
            title: 'New Year ISV Strategy Planning',
            description: 'Strategic planning session for 2026 ISV initiatives and partner programs',
            type: 'meeting',
            location: 'Virtual'
        }
    ];
    
    displayUpcomingEvents();
    generateCalendar();
}

// Display upcoming events (next 90 days)
function displayUpcomingEvents() {
    const today = new Date();
    const next90Days = new Date(today.getTime() + (90 * 24 * 60 * 60 * 1000));
    
    const upcomingEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= today && eventDate <= next90Days;
    });
    
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

// Generate calendar
function generateCalendar() {
    const container = document.getElementById('monthsGrid');
    const startMonth = currentYear === 2025 ? 7 : 0; // Start from August 2025 (month 7)
    const endMonth = 11; // Always end at December
    
    container.innerHTML = '';
    
    for (let month = startMonth; month <= endMonth; month++) {
        const monthCard = createMonthCard(currentYear, month);
        container.appendChild(monthCard);
    }
}

// Create individual month card
function createMonthCard(year, month) {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const monthCard = document.createElement('div');
    monthCard.className = 'month-card';
    
    // Month header
    const header = document.createElement('div');
    header.className = 'month-header';
    header.textContent = `${monthNames[month]} ${year}`;
    monthCard.appendChild(header);
    
    // Month grid
    const grid = document.createElement('div');
    grid.className = 'month-grid';
    
    // Day headers
    dayNames.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = day;
        grid.appendChild(dayHeader);
    });
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Previous month's trailing days
    const prevMonth = new Date(year, month, 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const dayCell = document.createElement('div');
        dayCell.className = 'day-cell other-month';
        dayCell.textContent = daysInPrevMonth - i;
        grid.appendChild(dayCell);
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'day-cell';
        dayCell.textContent = day;
        
        // Check if this day has events
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = events.filter(event => event.date === dateString);
        
        if (dayEvents.length > 0) {
            dayCell.classList.add('has-event');
            if (dayEvents.length > 1) {
                dayCell.classList.add('has-multiple-events');
            }
            
            // Create tooltip with event details
            const tooltip = document.createElement('div');
            tooltip.className = 'event-tooltip';
            tooltip.innerHTML = dayEvents.map(event => 
                `<strong>${event.title}</strong>${event.location ? ` - ${event.location}` : ''}`
            ).join('<br>');
            dayCell.appendChild(tooltip);
        }
        
        grid.appendChild(dayCell);
    }
    
    // Next month's leading days to fill the grid
    const totalCells = grid.children.length - 7; // Subtract day headers
    const remainingCells = Math.max(0, 42 - totalCells); // 6 rows × 7 days = 42 cells
    
    for (let day = 1; day <= remainingCells && totalCells < 35; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'day-cell other-month';
        dayCell.textContent = day;
        grid.appendChild(dayCell);
    }
    
    monthCard.appendChild(grid);
    return monthCard;
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

// Refresh data periodically (every 10 minutes)
setInterval(() => {
    console.log('Refreshing events data...');
    loadEventsFromSheet();
}, 10 * 60 * 1000);

// Add some visual feedback when data is loading
function showLoadingState() {
    const upcomingContainer = document.getElementById('upcomingEventsGrid');
    const calendarContainer = document.getElementById('monthsGrid');
    
    upcomingContainer.innerHTML = '<div class="loading-spinner">Loading upcoming events...</div>';
    calendarContainer.innerHTML = '<div class="loading-spinner">Loading calendar...</div>';
}
