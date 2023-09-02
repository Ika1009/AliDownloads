chrome.runtime.onMessage.addListener(async function(message, sender, sendResponse) {
    if (message.action === 'probe') {
        sendResponse({status: "active"});
        return;
    }

    if (message.action === 'startDownload') {
        const downloadOptions = message.downloadOptions;
        
        if (window.location.href.includes("aliexpress.com")) {
            extractFromAliExpress(downloadOptions);
        } else if (window.location.href.includes("alibaba.com")) {
            await extractFromAlibaba(downloadOptions);
        }

        // Send back a message if needed
        sendResponse({status: "downloaded"});
    }
});

function delay(ms) {
    return new Promise(res => setTimeout(res, ms));
}

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
async function extractFromAlibaba(options) {

    // Click on the "View larger image" button to open the image/video modal
    if (options.images || options.videos) {
        const potentialButtons = Array.from(document.querySelectorAll('span[data-spm-anchor-id^="a2700.details"]'));        
        const viewLargerImageBtn = potentialButtons.find(btn => btn.innerText.trim() === "View larger image");
        console.log("View larger image button:", viewLargerImageBtn);

        if (viewLargerImageBtn) {
            viewLargerImageBtn.click();
            console.log("Clicked on 'View larger image' button.");
            await delay(5000); // Wait for 5 seconds for modal to load fully

            // After the modal loads, extract the image and video URLs
            const sliderDiv = document.querySelector('div.slider-list[data-spm-anchor-id^="a2700.details.0."]');
            console.log("Slider Div element:", sliderDiv);
            
            if (sliderDiv && options.images) {
                const sliderItems = sliderDiv.children;
                const imgURLs = [];
            
                for (let item of sliderItems) {
                    const imgElement = item.querySelector('img');
                    if (imgElement) {
                        let highResURL = imgElement.src.replace('250x250', '960x960');
                        imgURLs.push(highResURL);
                    }
                }
            
                console.log("Extracted high-res image URLs:", imgURLs);
            }
        }
    }

    // If the options.videos is true, fetch the video URLs
    if (options.videos) {
        const videoElement = document.querySelector('video');
        console.log("Video Element:", videoElement);
        
        if (videoElement) {
            let videoSrc = videoElement.src;
            console.log("Video Source:", videoSrc);
            videoURLs.push(videoSrc);
        }

        //close modal popup
        const selector = 'i.detail-next-icon.detail-next-icon-close.detail-next-medium.detail-next-dialog-close-icon[data-spm-anchor-id^="a2700.details.0."]';
        const closeIcon = document.querySelector(selector);
        console.log("Close icon:", closeIcon);
        
        if (closeIcon) {
            closeIcon.click();
            console.log("Clicked on Close icon.");
        } else {
            console.warn("Close icon not found on the page.");
        }
    }

    if (options.description) {
        const selector = 'h1[data-spm-anchor-id^="a2700.details.0."]';
        const headerElement = document.querySelector(selector);
        console.log("Header element:", headerElement);
        
        if (!headerElement) {
            console.warn("Header element not found on the page.");
            return null;
        }
    
        // Extracting text while ignoring child elements
        const childElements = Array.from(headerElement.childNodes);
        let extractedText = '';
        for (let child of childElements) {
            if (child.nodeType === 3) { // 3 means Text node
                extractedText += child.textContent;
            }
        }
        console.log("Extracted text from header:", extractedText);
    }    
}

