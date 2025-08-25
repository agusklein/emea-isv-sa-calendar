# EMEA ISV SA Managers Annual Clock

## 🎯 Overview
This website provides a comprehensive planning tool for EMEA ISV Solutions Architect Managers, displaying recurring annual events and upcoming milestones in a clean, AWS-branded interface.

## 🤖 Monthly Update System
The website can be updated monthly with the latest Google Sheets data using the automated update script.

### How to Update (Monthly Process):

1. **Run the Update Script:**
   ```bash
   node update-calendar.js
   ```

2. **Review Changes:**
   - Check the updated `script.js` file
   - Review `last-update.json` for summary

3. **Commit and Push:**
   ```bash
   git add .
   git commit -m "📅 Monthly update: Sync with Google Sheets (YYYY-MM-DD)"
   git push origin main
   ```

4. **Verify Website:**
   - Visit the live site to confirm updates

### What the Update Script Does:
- ✅ Fetches latest data from Google Spreadsheet
- ✅ Parses recurring events by month
- ✅ Updates `script.js` with static data
- ✅ Creates `last-update.json` status file
- ✅ Provides detailed logging and error handling

## 📊 Google Sheets Format
The spreadsheet should have the following columns:

| Column A | Column B | Column C | Column D | Column E |
|----------|----------|----------|----------|----------|
| Month | Event Title | Description | Type | Location |

### Examples:
- `July` | `OLR Johan's Level` | `Leadership review session` | `meeting` | `Virtual`
- `September` | `OP2 Prep` | `Annual planning session` | `planning` | `London`
- `January` | `OLR Johan's Level` | `Leadership review session` | `meeting` | `Virtual`

## 🔄 How Recurring Events Work:
- Events specified for a month (e.g., "July") appear **every year** in that month
- **Upcoming Events** section shows events happening in the next 90 days
- **Calendar** section shows all months with their recurring events

## 📁 File Structure:
```
├── index.html              # Main website
├── styles.css              # AWS-branded styling
├── script.js               # Dynamic functionality (updated by sync)
├── update-calendar.js      # Monthly update script
├── last-update.json        # Update tracking (auto-generated)
├── test.html               # Deployment test page
└── README.md               # This file
```

## 🚀 Features:
- ✅ **AWS Branding** - Official colors and styling
- ✅ **Responsive Design** - Works on all devices
- ✅ **Live Google Sheets Integration** - Real-time data loading with fallback
- ✅ **Monthly Sync Script** - Easy manual updates
- ✅ **Recurring Events** - Events repeat annually
- ✅ **Upcoming Events** - Shows next 90 days
- ✅ **Monthly Calendar View** - Clean month-by-month display

## 🔧 Technical Details:
- **Frontend**: Pure HTML, CSS, JavaScript (no frameworks)
- **Hosting**: GitHub Pages
- **Data Source**: Google Sheets (with static fallback)
- **Update Method**: Manual script (run monthly)
- **Fallback**: Static data embedded in JavaScript

## 📈 Update History:
Check `last-update.json` for the most recent sync information, including:
- Last update timestamp
- Number of events processed
- List of all events with their months

## 🛠️ Monthly Maintenance:
**Recommended Schedule**: Last day of each month

1. Run `node update-calendar.js`
2. Review the changes
3. Commit and push to GitHub
4. Verify the live website

### Prerequisites:
- Node.js installed locally
- Access to the repository
- Internet connection to fetch Google Sheets data

## 🔍 Troubleshooting:
- **Script fails**: Check internet connection and Google Sheets accessibility
- **No events found**: Verify spreadsheet format and data
- **Website not updating**: Clear browser cache, check GitHub Pages deployment

---

**Live Website**: https://agusklein.github.io/emea-isv-sa-calendar/

**Google Spreadsheet**: [View Source Data](https://docs.google.com/spreadsheets/d/1DOlgJyYL7w_p1kR4IKjHvn7E8Cw31YWKZ2WOt-b_aJs/edit?gid=0#gid=0)

## 🎯 Quick Start for Monthly Updates:
```bash
# 1. Update from Google Sheets
node update-calendar.js

# 2. Commit changes
git add .
git commit -m "📅 Monthly sync: $(date +'%Y-%m-%d')"
git push origin main

# 3. Done! Website automatically updates
```
