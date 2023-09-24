const extpay = ExtPay('ali-downloads')

document.querySelector('button').addEventListener('click', extpay.openPaymentPage);

extpay.getUser().then(user => {
    chrome.storage.local.set({'userPaidStatus': user.paid});
}).catch(err => {
    document.querySelector('p').innerHTML = "Error fetching data :( Check that your ExtensionPay id is correct and you're connected to the internet";
});

chrome.storage.local.get('userPaidStatus', function(data) {
    if (data.userPaidStatus) {
        // Set the new content for paid users
        document.body.innerHTML = `
        <div class="container">
            <h2>Ali-Downloads</h2>
            <div class="options">
                <div class="option">
                    <input type="checkbox" id="images" name="images" checked>
                    <label for="images">Images</label>
                </div>
                <div class="option">
                    <input type="checkbox" id="videos" name="videos" checked>
                    <label for="videos">Videos</label>
                </div>
                <div class="option">
                    <input type="checkbox" id="description" name="description" checked>
                    <label for="description">Description</label>
                </div>
            </div>
            <div class="download-btn-container">
                <button class="download-btn">Download</button>
                <progress class="download-progress" max="100" value="0"></progress>
            </div>
        </div>
        `;

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


    } else {
        // Logic for users who haven't paid.
        // You can update the popup content or any other necessary actions.
    }
});
