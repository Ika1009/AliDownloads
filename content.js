chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'probe') {
        sendResponse({status: "active"});
        return;
    }

    if (message.action === 'startDownload') {
        const downloadOptions = message.downloadOptions;
        
        if (window.location.href.includes("aliexpress.com")) {
            extractFromAliExpress(downloadOptions);
        } else if (window.location.href.includes("alibaba.com")) {
            extractFromAlibaba(downloadOptions);
        }

        // Send back a message if needed
        sendResponse({status: "downloaded"});
    }
});

// ... rest of your content.js code ...


function extractFromAliExpress(options) {
    console.log("ALIEKSPRES");
    console.log(options);
    if (options.images) {
        // AliExpress specific logic to extract images
    }
    if (options.videos) {
        // AliExpress specific logic to extract videos
    }
    if (options.description) {
        // AliExpress specific logic to extract product description
    }
}

function extractFromAlibaba(options) {
    console.log("ALIBABA");
    console.log(options);
    if (options.images) {
        // Alibaba specific logic to extract images
    }
    if (options.videos) {
        // Alibaba specific logic to extract videos
    }
    if (options.description) {
        // Alibaba specific logic to extract product description
    }
}
