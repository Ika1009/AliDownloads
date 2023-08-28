const downloadBtn = document.querySelector('.download-btn');

downloadBtn.addEventListener('click', function () {
    // Get the checkboxes and their values
    const imagesCheckbox = document.getElementById('images').checked;
    const videosCheckbox = document.getElementById('videos').checked;
    const descriptionCheckbox = document.getElementById('description').checked;

    // Message to be sent to background.js
    const message = {
        action: 'startDownload',
        downloadOptions: {
            images: imagesCheckbox,
            videos: videosCheckbox,
            description: descriptionCheckbox
        }
    };

    // Send message to background.js
    chrome.runtime.sendMessage(message);
});
