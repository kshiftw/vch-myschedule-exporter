# VCH MySchedule Exporter - Google Chrome Extension

VCH MySchedule Exporter is a Google Chrome Extension that exports your work shifts from Vancouver Coastal Health (VCH) MySchedule into an iCalendar (.ics) file. 

![VCH MySchedule Exporter](./images/screenshot.png)

# Where can I download the extension?
You can find the extension in [the Chrome Web Store!](https://chrome.google.com/webstore/detail/vch-myschedule-exporter/cnlicejghdbkkjbnlihjmijbhkcmeikk)

# Why would I use it?
Vancouver Coastal Health (VCH) MySchedule currently doesn't provide a way to export work shifts. With the help of this extension, you are able to easily export work shifts into events in your personal calendar (Google Calendar, Microsoft Outlook, Apple Calendar, etc.). 

# Requirements
This tool is a Google Chrome browser extension that works on desktop web browsers (i.e. not compatible with mobile devices). To use this tool, you need the following:
- Google Chrome browser on your desktop
- Calendar application (e.g. Google Calendar, Microsoft Outlook, Apple Calendar) that is able to import iCalendar files

# How do I use it?
Follow the instructions [on this page](./docs/instructions.md)!

# How does it work?
The extension will detect if your browser is on the "My Shifts" page in VCH MySchedule. Once you are on the page, it will embed an "Export Calendar" section. Once you click the "Download file" button, it will loop through the shifts in the search results and create calendar events for each shift in an exported iCalendar (.ics) file.

# How would I run it locally?
Follow the instructions [on this page](./docs/develop.md)!

# Troubleshooting
## Why can't I see the Export section on the My Shifts page?
The export section is embedded into the page by the extension. Please make sure you have installed the extension from [the Chrome Web Store](https://chrome.google.com/webstore/detail/vch-myschedule-exporter/cnlicejghdbkkjbnlihjmijbhkcmeikk) and refresh your page.
