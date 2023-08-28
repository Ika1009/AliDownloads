chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'startDownload') {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const currentTab = tabs[0];
            if (currentTab.url.includes("aliexpress.com") || currentTab.url.includes("alibaba.com")) {
                chrome.tabs.executeScript(currentTab.id, {file: "content.js"}, function() {
                    chrome.tabs.sendMessage(currentTab.id, message);
                });
            } else {
                alert("Please navigate to Alibaba or AliExpress to use this extension.");
            }
        });
    }
});


