const downloadBtn = document.querySelector('.download-btn');
const progressBar = document.querySelector('.download-progress');

downloadBtn.addEventListener('click', function() {
    // Disable and gray out the button
    downloadBtn.disabled = true;

    // Start showing the progress bar and reset its value
    progressBar.style.display = 'block';
    progressBar.value = 0;

    // Animate the progress bar over 6 seconds (6000 milliseconds)
    const interval = 60; // Update every 60 milliseconds
    const increment = 100 * interval / 6000; // Amount to increase the value

    const progressInterval = setInterval(() => {
        progressBar.value += increment;

        if (progressBar.value >= 100) {
            clearInterval(progressInterval);
            downloadBtn.disabled = false; // Re-enable the button
            progressBar.style.display = 'none'; // Hide the progress bar again
        }
    }, interval);

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
