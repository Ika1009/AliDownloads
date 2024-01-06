const extpay = ExtPay('ali-downloads');
const button = document.getElementsByClassName('download-btn')[0];

/**
 * Adds a listener to the payment button.
 * @function addPaymentButtonListener
 * @returns {void}
 */
function addPaymentButtonListener() {
    console.log('Adding payment button listener');
    button.removeEventListener('click', openTrial);
    button.textContent = "Pay for Subscription";
    button.addEventListener('click', openPaymentPage);
}

function openTrial() {
    extpay.openTrialPage();
}
function openPaymentPage() {
    extpay.openPaymentPage();
}

extpay.getUser().then(user => {
    const now = new Date();
    const sevenDays = 1000 * 60 * 60 * 24 * 7; // seven days in milliseconds

    if(user.paid) {
        getUserAccess();
    }
    else if (user.trialStartedAt) {
        if ((now - new Date(user.trialStartedAt)) < sevenDays) { 
            getUserAccess();
        } else {
            chrome.storage.local.get('userPaidStatus', function(data) {
                if (data.userPaidStatus) {
                    getUserAccess();
                } else {
                    addPaymentButtonListener();
                    document.querySelector('p').innerHTML = "7 Day Trial is now over. Please make payment to continue the service";
                }
            });
        }
    } else {
        button.textContent = "Start Free Trial";
        button.addEventListener('click', openTrial);
    }
}).catch(err => {
    document.querySelector('p').innerHTML = "Error fetching data :( Check that you're connected to the internet, if that isn't an issue contact us: "+ err.message;
});

function getUserAccess()
{
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
                <!-- Add the small text here -->
                <span class="corner-text">© Ali-Downloads</span>
                <a href="#" class="manage-subscription" id="manageSubscriptionsButton">Manage Subscription</a>
            </div>
        </div>
        `;

        const downloadBtn = document.querySelector('.download-btn');
        const progressBar = document.querySelector('.download-progress');

        downloadBtn.addEventListener('click', function() {
            // Disable and gray out the button
            downloadBtn.disabled = true;


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
            chrome.runtime.sendMessage(message, function(response) {
                if (response && response.status === "noData") {
                    clearInterval(progressInterval);  // Stop the progress bar
                    progressBar.value = 0;  // Reset progress bar to 0
                    downloadBtn.disabled = false;  // Re-enable the button
                    progressBar.style.display = 'none';  // Hide the progress bar again
                    showNotification("No relevant data found on the current page.", "Error!");  // This assumes you have a showNotification function defined or you can use another way to notify the user
                }
            });

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
        });
        document.getElementById("manageSubscriptionsButton").addEventListener('click', () => {
            console.log("Manage subscription clicked");
        });
}
