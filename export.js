// Helper function for adding delay
const delay = ms => new Promise(res => setTimeout(res, ms));

/*
 *   Converts date string to iCal format.
 *   Example:
 *       Input: Sep 01, 2020
 *       Output: 20200901
 */
function convertDateToICal(date) {
    let day = moment(date, "MMM DD YYYY");
    let iCalString = day.format("YYYYMMDD");

    return iCalString;
}

/*
 *    Converts duration string to iCal format and the start/end time.
 *    Example:
 *       Input: 07:00 - 15:00 PDT
 *       Output: [070000, 150000, 07:00, 15:00]
 */
function convertEntryTimeToICal(duration) {
    let durationString = duration.replace(/ (PDT|PST)$/, "");
    let startTimeString = durationString.split(" - ")[0];
    let endTimeString = durationString.split(" - ")[1];

    let startTime = moment(startTimeString, "HH:mm");
    let endTime = moment(endTimeString, "HH:mm");

    let iCalStartTime = startTime.format("HHmmss");
    let iCalEndTime = endTime.format("HHmmss");

    return [iCalStartTime, iCalEndTime, startTimeString, endTimeString];
}

/* 
 *    Trims whitespace from status
 */
function cleanStatus(status) {
    let cleanStatus = status.trim()
    return cleanStatus;
}

/*
 *   Removes \n and all excess spaces in between words.
 */
function cleanUnit(unit) {
    let cleanUnit = unit.replace(/\n\s*/g, ' ');
    return cleanUnit;
}

/*
 *    Generates a random iCal UID.
 *    Example: 
 *        Output: 2c9f6b5b-5b4b-4e2e-9c3c-4f5a7a4a5f5a
 */
function generateICalUID() {
    let uid = '';
    const hexChars = '0123456789abcdef';
    for (let i = 0; i < 32; i++) {
        if (i === 8 || i === 12 || i === 16 || i === 20) {
            uid += '-';
        }
        uid += hexChars.charAt(Math.floor(Math.random() * hexChars.length));
    }
    return uid;
}

/*
 * Returns the summary of an entry based on the settings.
 */
function getSummaryFromSettings(entry, settings) {
    let summary;

    let titleSetting = settings.title;
    let customTitleSetting = settings.custom_title;

    if (titleSetting === 'custom') {
        summary = customTitleSetting;
    }
    else {
        summary = entry[titleSetting]
    }

    return summary;
}

/*
 *  Converts an entry object to iCal format.
 */
function convertEntryToICal(entry, settings) {
    const timezone = 'America/Vancouver';

    const { name, union, unit, icon, date, dateText, startTime, endTime, startTimeString, endTimeString, duration, paycode, status } = entry;

    let summary = getSummaryFromSettings(entry, settings);

    let includeDescription = settings.include_description;

    let descriptionContent = '';
    if (includeDescription) {
        descriptionContent =
            'DESCRIPTION:' +
            'Shift: ' + name + '\\n' +
            'Date: ' + dateText + '\\n' +
            'Time: ' + duration + '\\n' +
            'Type: ' + status + '\\n' +
            'Location: ' + unit + '\\n' +
            'Union: ' + union + '\\n' +
            'Pay Code: ' + paycode + '\\n\n';
    }

    let iCalContent =
        'BEGIN:VEVENT\n' +
        'UID:' + generateICalUID() + '\n' +
        'DTSTAMP:' + moment().format("YYYYMMDDTHHmmss") + '\n' +
        'DTSTART;TZID=' + `${timezone}:${date}T${startTime}` + '\n' +
        'DTEND;TZID=' + `${timezone}:${date}T${endTime}` + '\n' +
        'SUMMARY:' + summary + '\n' +
        descriptionContent +
        'END:VEVENT\n';

    // Remove double spaces from content.
    iCalContent = iCalContent.replace(/\s{2,}/g, ' ');

    return iCalContent;
}

/*
 *   Wraps iCal content with iCal header and footer.
 */
function wrapICalContent(iCalContent) {
    return 'BEGIN:VCALENDAR\n' +
        'VERSION:2.0\n' +
        'PRODID:-//VCH MySchedule Exporter//EN\n' +
        iCalContent +
        'END:VCALENDAR\n';
}

/*
 *  Parses a row in the schedule table and returns an entry object.
 */
function getEntryFromRow(row) {
    let columns = $(row).children();

    let name = columns.eq(0).text();
    let union = columns.eq(1).text();
    let unit = columns.eq(2).text();
    let icon = columns.eq(3).text();
    let dateText = columns.eq(4).text();
    let duration = columns.eq(5).text();
    let paycode = columns.eq(6).text();
    let status = columns.eq(7).find('span').text();

    let date = convertDateToICal(dateText);
    let [startTime, endTime, startTimeString, endTimeString] = convertEntryTimeToICal(duration);

    status = cleanStatus(status);
    unit = cleanUnit(unit);

    return {
        name: name,
        union: union,
        unit: unit,
        icon: icon,
        date: date,
        dateText: dateText,
        startTime: startTime,
        endTime: endTime,
        start_time: startTimeString,
        end_time: endTimeString,
        duration: duration,
        paycode: paycode,
        status: status,
    }
}

/*
 *   Redirects to a specific page in the My Shifts page.
 */
function goToPage(pageNumber) {
    let url = window.location.href;

    if (url.includes('page=')) {
        newUrl = url.replace(/(page=)\d+/, `page=${pageNumber}`);
    } else {
        newUrl = url.concat(`&page=${pageNumber}`);
    }

    window.location.replace(newUrl);
}

/*
 *  Returns an array of entries in the current page.
 */
function getEntriesPerPage() {
    let entriesInPage = [];

    let table = $('table#schedule-table');
    let tableRows = table.find('tbody').children();

    tableRows.each(function (_, row) {
        let entry = getEntryFromRow(row);

        entriesInPage.push(entry);
    });

    return entriesInPage;
}

/*
 *  Returns the number of pages in the My Shifts page.
 */
function getNumPages() {
    let numPages = $('nav.pagination').find('ul.pagination-list').children().length;
    return numPages;
}

/*
 *   Generates a downloadable iCal file using the given iCal content.
 */
function downloadICalFile(iCalContentArray, fileName) {
    let iCalContent = wrapICalContent(iCalContentArray.join(''));

    let blob = new Blob([iCalContent], { type: 'text/calendar;charset=UTF-8' });
    let url = URL.createObjectURL(blob);
    let link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();

    // Clean up the URL object
    URL.revokeObjectURL(url);
}

/*
 *  Converts an array of entries to an array of iCal content.
 */
async function convertEntriesToICal(entries) {
    let iCalContentArray = [];

    let settings;
    await chrome.runtime.sendMessage({ action: 'getSettings' }, async (response) => {
        settings = response;
    });
    await delay(1000);
    await entries.forEach(async entry => {
        if (typeof entry === 'undefined') {
            return;
        }

        if (entry.status === 'Working' && !settings.include_working_status) {
            return;
        }

        if (entry.status === 'Planned Leave' && !settings.include_planned_leave_status) {
            return;
        }

        let iCalContent = convertEntryToICal(entry, settings);
        iCalContentArray.push(iCalContent);
    });

    return iCalContentArray;
}

/*
 *   Returns the array of entries from the background script.
 */
async function getEntries() {
    let entries;
    await chrome.runtime.sendMessage({ action: 'getStatus' }, async (response) => {
        entries = response.entries;
    });
    await delay(1000);
    return entries;
}

/*
 * Extracts course schedule info and creates a downloadable iCalendar (.ics) file.
 */
let exportCalendar = async function () {
    console.log("Exporting Calendar to ics file...")

    let entries = await getEntries();

    if (entries.length === 0) {
        alert('Unable to find shifts in the search selection. \nPlease make sure to click the "Search" button first.');
        return false;
    } else {
        let iCalContentArray = await convertEntriesToICal(entries);
        let fileName = 'vch-my-schedule.ics';
        downloadICalFile(iCalContentArray, fileName);
    }
};

/*
 * Appends the Export Calendar section to the My Shifts page.
 */
function appendExportDiv() {
    $('#div_id_pay_code').append(
        '<p class="help">(Optional) Filters the search for a specific pay code</p>'
    )

    $('div.box > form').first().find('div.form-actions').append(
        '<hr /> \
        <h3 class="title is-3">Export Calendar</h3> \
        <div class="control-group field"> \
            <p>Export the search results to an iCalendar (.ics) file which can be imported into Google Calendar, Apple Calendar, Microsoft Outlook, and other calendar applications</p> \
        </div> \
        <div class="control-group field"> \
            <label class="control-label label">Calendar Event Title</label> \
            <div class="control form-field-width select"> \
                <select name="selectTitle" id="selectTitle" class="select"> \
                    <option value="duration">Duration</option> \
                    <option value="name">Occ.</option> \
                    <option value="unit">Unit</option> \
                    <option value="start_time">Start Time</option> \
                    <option value="end_time">End Time</option> \
                    <option value="status">Status</option> \
                    <option value="custom">Custom Text</option> \
                </select> \
            </div> \
            <p class="help">The title for each event exported</p> \
        </div> \
        <div id="customTitleDiv" class="control-group field" style="display: none;"> \
            <label class="control-label label">Custom Event Title</label> \
            <div class="control form-field-width"> \
                <input type="text" id="customTitle" name="customTitle" class="input" placeholder="Enter custom title"> \
            </div> \
        </div> \
        <div id="includeEventDescription" class="control-group field"> \
            <label class="control-label label">Calendar Event Description</label> \
            <div class="controls"> \
                <ul style="margin-left: 0; margin-top: 0"> \
                    <li>\
                        <label class="checkbox-label" for="id_checkbox_description">\
                            <input checked name="checkbox_description" id="id_checkbox_description" type="checkbox" class="checkbox-input" style="margin-right: 5px;">\
                         Include description</label> \
                    </li> \
                </ul> \
            </div> \
        </div> \
        <div class="control-group field"> \
            <label class="control-label label">Calendar Event Preview (Example)</label> \
            <div class="box"> \
                <p><b>Title:</b><br><span id="preview-title">09:30 - 21:30 PST</span></p> \
                <p>---</p> \
                <p><b>Description:</b><br>\
                    <span id="preview-description"> \
                        Shift: Registered Nurse-Critical Care<br> \
                        Date: Nov 01, 2023<br> \
                        Time: 09:30 - 21:30 PST<br> \
                        Type: Working<br> \
                        Location: VGH - PACU-JP PACU Vancouver General Hospital<br> \
                        Union: NURS<br> \
                        Pay Code: RG - REG Regular Hours<br> \
                    </span> \
                </p> \
            </div> \
        </div> \
        <div id="selectStatuses" class="control-group field"> \
            <label class="control-label label">Status</label> \
            <div class="controls"> \
                <ul style="margin-left: 0; margin-top: 0"> \
                    <li>\
                        <label class="checkbox-label" for="id_checkbox_working">\
                            <input checked name="checkbox_working" id="id_checkbox_working" type="checkbox" class="checkbox-input" style="margin-right: 5px;">\
                         Working</label> \
                    </li> \
                    <li>\
                        <label class="checkbox-label" for="id_checkbox_planned_leave">\
                            <input name="checkbox_planned_leave" id="id_checkbox_planned_leave" type="checkbox" class="checkbox-input" style="margin-right: 5px;">\
                         Planned Leave</label> \
                    </li> \
                </ul> \
            </div> \
            <p class="help">Select the types of statuses to include</p> \
        </div> \
        <div class="control-group field"> \
            <label class="control-label label">Download</label> \
            <div> \
                <p>It is recommended that you import the downloaded `vch-my-schedule.ics` file into <em>a new calendar</em> instead of your daily calendar. For more information, see our <a href="https://github.com/kshiftw/vch-myschedule-exporter/blob/main/docs/instructions.md#step-2-import-ical-to-personal-calendar">instructions page.</a></p> \
            </div> \
        </div> \
        <input id="export" value="Download file 🚀" class="btn btn-primary button is-primary submit-button-top-margin">'
    )
}

function updatePreview(selectedOption) {
    switch (selectedOption) {
        case 'duration':
            $('#preview-title').text("09:30 - 21:30 PST");
            break;
        case 'name':
            $('#preview-title').text("Registered Nurse-Critical Care");
            break;
        case 'unit':
            $('#preview-title').text("VGH - PACU-JP PACU Vancouver General Hospital");
            break;
        case 'start_time':
            $('#preview-title').text("09:30");
            break;
        case 'end_time':
            $('#preview-title').text("21:30");
            break;
        case 'status':
            $('#preview-title').text("Working");
            break;
    }
}

/*
 * Updates the status in the background script.
 */
function updateStatus(numPages, currentPage, entriesInPage) {
    let newStatus = {
        numPages: numPages,
        currentPage: currentPage,
        entriesInPage: entriesInPage
    }

    chrome.runtime.sendMessage({ action: 'updateStatus', data: newStatus });
}

/*
 * Updates the status in the background script to indicate that export has started.
 */
function exportStarted() {
    chrome.runtime.sendMessage({ action: 'exportStarted' });
    updateSettings();
}

/*
 * Resets the status in the background script.
 */
function exportReset() {
    chrome.runtime.sendMessage({ action: 'exportReset' });
}

/*
 * Updates the settings in the background script.
 */
function updateSettings() {
    let titleSetting = $('#selectTitle').val();
    let customTitleSetting = $('#customTitle').val();
    let includeDescription = $('#id_checkbox_description').prop('checked');

    let includeWorkingStatus = $('#id_checkbox_working').prop('checked');
    let includePlannedLeaveStatus = $('#id_checkbox_planned_leave').prop('checked');

    let newSettings = {
        title: titleSetting,
        custom_title: customTitleSetting,
        include_description: includeDescription,
        include_working_status: includeWorkingStatus,
        include_planned_leave_status: includePlannedLeaveStatus
    }

    chrome.runtime.sendMessage({ action: 'updateSettings', data: newSettings });
}

$(document).ready(function () {
    // Show dropdown only if on the "My Shifts" page
    if (
        window.location.href.includes('myschedule.vch.ca/employee/sched/readonly/employee') ||
        window.location.href.includes('myschedule.fraserhealth.ca/employee/sched/readonly/employee')
    ) {
        appendExportDiv();
    };

    // Show/hide custom title input if selected option is "custom"
    $('#selectTitle').change(function () {
        let selectedOption = $(this).val()
        let customTitleDiv = document.getElementById('customTitleDiv');

        updatePreview(selectedOption);

        if (selectedOption === 'custom') {
            customTitleDiv.style.display = 'block';
        } else {
            customTitleDiv.style.display = 'none';
        }
    });

    $('#id_checkbox_description').change(function () {
        let checked = $(this).prop('checked');
        let previewDescription = $('#preview-description');

        if (checked) {
            previewDescription.show();
        } else {
            previewDescription.hide();
        }
    });

    $('#customTitle').keyup(function () {
        let customTitle = $(this).val();
        $('#preview-title').text(customTitle);
    });

    // Reset export status when the "Search" button is clicked
    $('#submit-id-submit').click(function () {
        exportReset();
    })

    chrome.runtime.sendMessage({ action: 'getStatus' }, async (response) => {
        const { numPages, currentPage, exportStarted } = response;

        if (exportStarted) {
            if (currentPage <= numPages) {
                let nextPage = currentPage + 1

                let entriesInPage = getEntriesPerPage();
                await delay(1000);

                updateStatus(numPages, nextPage, entriesInPage);
                goToPage(nextPage);
            }
            else {
                exportCalendar();
            }
        }
    });

    // Export calendar when the "Download file" button is clicked
    $(document).on('click', '#export', async function (event) {
        console.log("Export initiated...")
        alert("Export started and your page will reload several times. Please do not close your browser tab! \n\nThis may take a few minutes...")

        let numPages = getNumPages();
        let currentPage = 1;
        let entriesInPage = [];

        exportStarted();
        updateStatus(numPages, currentPage, entriesInPage);
        goToPage(currentPage);
    });
});
