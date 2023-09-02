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

        if (viewLargerImageBtn) {
            viewLargerImageBtn.click();
            await delay(5000); // Wait for 5 seconds for modal to load fully

            // After the modal loads, extract the image and video URLs
            const sliderDiv = document.querySelector('div.slider-list[data-spm-anchor-id^="a2700.details.0."]');
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
            
                // TODO: Add logic to extract video URLs if present and save everything to a .zip file
            }
        }
    }

    // If the options.videos is true, fetch the video URLs
    if (options.videos) {
        const videoElement = document.querySelector('video'); // Searching in entire document since the video might be outside the clicked item
        if (videoElement) {
            let videoSrc = videoElement.src;
            videoURLs.push(videoSrc);
        }
    }

    if (options.description) {
        // Extract product description
        const descriptionElem = document.querySelector('.product-description-section');
        const description = descriptionElem ? descriptionElem.innerText : "";
        console.log(description);
        // Download or further processing logic for description
    }
}
