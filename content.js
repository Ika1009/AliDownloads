chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'startDownload') {
        const downloadOptions = message.downloadOptions;

        // Implement your extraction logic based on downloadOptions
        // For example:
        if (downloadOptions.images) {
            // Extract images and save to the path
        }

        if (downloadOptions.videos) {
            // Extract videos and save to the path
        }

        if (downloadOptions.description) {
            // Extract product description and save to the path
        }

        // Send back a message if needed
        sendResponse({status: "downloaded"});
    }
});
