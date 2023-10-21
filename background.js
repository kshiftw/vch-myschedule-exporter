let entries = [];
let numPages = 0;
let currentPage = 0;
let exportStarted = false;

let settings = {
    title: "name",
    custom_title: "",
    include_working_status: true,
    include_planned_leave_status: true
};

chrome.runtime.onMessage.addListener(
    (message, _, sendResponse) => {
        if (message.action == "exportStarted") {
            exportStarted = true;
        }
        else if (message.action == "exportReset") {
            resetExport();
        }
        else if (message.action === 'getStatus') {
            returnStatus(sendResponse);
        }
        else if (message.action === 'updateStatus') {
            updateStatus(message);
        }
        else if (message.action === 'getSettings') {
            returnSettings(sendResponse);
        }
        else if (message.action === 'updateSettings') {
            updateSettings(message);
        }
    }
);

function resetExport() {
    entries = [];
    numPages = 0;
    currentPage = 0;
    exportStarted = false;
}

function returnStatus(sendResponse) {
    let status = {
        numPages: numPages,
        currentPage: currentPage,
        exportStarted: exportStarted,
        entries: entries
    }
    sendResponse(status);
}

function updateStatus(message) {
    const newStatus = {
        numPages: message.data.numPages,
        currentPage: message.data.currentPage,
        entriesInPage: message.data.entriesInPage
    }

    numPages = newStatus.numPages;
    currentPage = newStatus.currentPage;
    entries = entries.concat(newStatus.entriesInPage);
}

function returnSettings(sendResponse) {
    sendResponse(settings);
}

function updateSettings(message) {
    const newSettings = {
        title: message.data.title,
        custom_title: message.data.custom_title,
        include_working_status: message.data.include_working_status,
        include_planned_leave_status: message.data.include_planned_leave_status
    }

    settings.title = newSettings.title;
    settings.custom_title = newSettings.custom_title;
    settings.include_working_status = newSettings.include_working_status;
    settings.include_planned_leave_status = newSettings.include_planned_leave_status;
}
