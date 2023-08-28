chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'startDownload') {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const currentTab = tabs[0];
            if (currentTab.url.includes("aliexpress.com") || currentTab.url.includes("alibaba.com")) {
                chrome.tabs.executeScript(currentTab.id, {file: "content.js"}, function() {
                    chrome.tabs.sendMessage(currentTab.id, message);
                });
            } else {
                showNotification(currentTab, "Please navigate to Alibaba or AliExpress to use this extension.")
            }
        });
    }
});

function showNotification(tab, textMessage) {
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: function(message) {
            // Create a notification container
            var notificationContainer = document.createElement('div');
            notificationContainer.style.position = 'fixed';
            notificationContainer.style.bottom = '20px';
            notificationContainer.style.right = '20px';
            notificationContainer.style.width = '300px';
            notificationContainer.style.backgroundColor = '#ffffff';
            notificationContainer.style.zIndex = '10000';
            notificationContainer.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.5)';
            notificationContainer.style.borderRadius = '5px';
            notificationContainer.style.padding = '10px';
            notificationContainer.style.overflow = 'hidden';
            notificationContainer.style.maxHeight = '300px';  // Set to your desired maximum height

            // Create the title
            var notificationTitle = document.createElement('h2');
            notificationTitle.style.color = '#333333';  // Dark gray color
            notificationTitle.textContent = 'Erorr!';
            notificationContainer.appendChild(notificationTitle);

            // Create the message
            var notificationMessage = document.createElement('p');
            notificationMessage.style.fontSize = '14px';
            notificationMessage.style.color = '#333333';  // Dark gray color
            notificationMessage.textContent = message;  // Using the passed-in message
            notificationContainer.appendChild(notificationMessage);

            // Create the close button
            var closeButton = document.createElement('span');
            closeButton.innerHTML = '&times;';
            closeButton.style.position = 'absolute';
            closeButton.style.top = '10px';
            closeButton.style.right = '10px';
            closeButton.style.cursor = 'pointer';
            closeButton.style.fontSize = '18px';
            closeButton.style.color = '#aaa';
            closeButton.onclick = function() {
                document.body.removeChild(notificationContainer);
            };
            notificationContainer.appendChild(closeButton);

            // Append the notification to the body
            document.body.appendChild(notificationContainer);

            // Set a timeout to remove the notification after 4 seconds (4000 milliseconds)
            setTimeout(() => {
                if (document.body.contains(notificationContainer)) {
                    document.body.removeChild(notificationContainer);
                }
            }, 4000);
        },
        args: [textMessage]  // Passed into the function
    });
}

