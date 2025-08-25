# EMEA ISV SA Managers Annual Clock

## 🎯 Overview
This website provides a comprehensive planning tool for EMEA ISV Solutions Architect Managers, displaying recurring annual events and upcoming milestones in a clean, AWS-branded interface.

## 🤖 Automated Monthly Updates
The website automatically syncs with Google Sheets data on the **last day of each month** at 23:00 UTC.

### How It Works:
1. **GitHub Action** runs monthly on the last day of each month
2. **Fetches data** from the Google Spreadsheet
3. **Updates the website code** with the latest event information
4. **Commits changes** automatically to keep the site current

### Manual Trigger:
You can also manually trigger the update process:
1. Go to the **Actions** tab in GitHub
2. Select **"Monthly Google Sheets Sync"**
3. Click **"Run workflow"**

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
├── script.js               # Dynamic functionality
├── last-update.json        # Update tracking (auto-generated)
├── .github/
│   ├── workflows/
│   │   └── monthly-update.yml    # GitHub Action workflow
│   └── scripts/
│       └── update-from-sheets.js # Update script
└── README.md               # This file
```

## 🚀 Features:
- ✅ **AWS Branding** - Official colors and styling
- ✅ **Responsive Design** - Works on all devices
- ✅ **Live Google Sheets Integration** - Real-time data loading
- ✅ **Automated Monthly Sync** - Keeps static data current
- ✅ **Recurring Events** - Events repeat annually
- ✅ **Upcoming Events** - Shows next 90 days
- ✅ **Monthly Calendar View** - Clean month-by-month display

## 🔧 Technical Details:
- **Frontend**: Pure HTML, CSS, JavaScript (no frameworks)
- **Hosting**: GitHub Pages
- **Data Source**: Google Sheets
- **Automation**: GitHub Actions
- **Update Frequency**: Monthly (last day of each month)

## 📈 Update History:
Check `last-update.json` for the most recent sync information, including:
- Last update timestamp
- Number of events processed
- Data source confirmation

## 🛠️ Maintenance:
The system is designed to be **maintenance-free**. The monthly automation ensures:
- Website stays current with spreadsheet changes
- No manual intervention required
- Automatic fallback to cached data if Google Sheets is unavailable

---

**Live Website**: https://agusklein.github.io/emea-isv-sa-calendar/

**Google Spreadsheet**: [View Source Data](https://docs.google.com/spreadsheets/d/1DOlgJyYL7w_p1kR4IKjHvn7E8Cw31YWKZ2WOt-b_aJs/edit?gid=0#gid=0)
