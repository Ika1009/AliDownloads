chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'startDownload') {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const currentTab = tabs[0];
            showNotification(currentTab, "Please ensure you have authors permission before you press download. Ali-Downloads will not be held responsible for any downloads done so without the authors permission.", "Warning");
            if (currentTab.url.includes("aliexpress.com") || currentTab.url.includes("alibaba.com")) {
                // Send a probing message
                chrome.tabs.sendMessage(currentTab.id, {action: "probe"}, function(response) {
                    // If error, it likely means the content script isn't injected yet
                    if (chrome.runtime.lastError) {
                        chrome.scripting.executeScript({
                            target: {tabId: currentTab.id},
                            files: ["vendor/jszip.min.js", "content.js"]
                        }, function() {
                            if(chrome.runtime.lastError) {
                                console.error(chrome.runtime.lastError);
                                sendResponse({status: 'error'});
                                return;
                            }
                            // Send the main message after injection
                            chrome.tabs.sendMessage(currentTab.id, message, function(response) {
                                // Check if the response status is "noData"
                                if (response && response.status === "noData") {
                                    showNotification(currentTab, "No relevant data found on the current page.", "Error!");
                                }
                            });
                        });
                    } else {
                        // If no error, content script is active, just send the main message
                        chrome.tabs.sendMessage(currentTab.id, message, function(response) {
                            // Check if the response status is "noData"
                            if (response && response.status === "noData") {
                                showNotification(currentTab, "No relevant data found on the current page.", "Error!");
                            }
                        });
                    }
                });
    
            } else {
                showNotification(currentTab, "Please navigate to Alibaba or AliExpress to use this extension.", "Error!");
            }
        });
    }
    else if (message.action === 'fetchVideo') {
        fetch(message.url)
            .then(response => response.blob())
            .then(blob => {
                const reader = new FileReader();
                function arrayBufferToBase64(buffer) {
                    let binary = '';
                    const bytes = new Uint8Array(buffer);
                    const len = bytes.byteLength;
                    for (let i = 0; i < len; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    return btoa(binary);
                }           
                reader.onloadend = function() {
                    if (reader.readyState == FileReader.DONE) {
                        const base64String = arrayBufferToBase64(reader.result);
                        sendResponse({data: base64String});
                    }
                };
                               
                reader.readAsArrayBuffer(blob);
            })
            .catch(error => {
                console.error("Error fetching video:", error);
                sendResponse(null);
            });
        return true;  // to allow async `sendResponse`
    }
    return true; // to allow async `sendResponse`
});



function showNotification(tab, textMessage, titleMessage) {
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: function(message, title) {
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
            notificationTitle.textContent = title;
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
            }, 5000);
        },
        args: [textMessage, titleMessage]  // Passed into the function
    });
}

