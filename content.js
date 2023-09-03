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
    const zip = new JSZip();

    // For description
    if (options.description) {
        const headerElement = document.querySelector("h1");
        if (headerElement) {
            const extractedText = Array.from(headerElement.childNodes)
                .filter(child => child.nodeType === 3)
                .map(child => child.textContent)
                .join('');
            zip.file('description.txt', extractedText);
        }
    }

    const imgURLs = [];

    // For images and videos
    if (options.images || options.videos) {
        const spans = Array.from(document.querySelectorAll('span'));
        const viewLargerImageBtn = spans.find(span => span.textContent.trim() === "View larger image");
        
        if (viewLargerImageBtn) {
            viewLargerImageBtn.click();
            await delay(5000);

            const sliderDiv = document.querySelector('div.slider-list');
            
            if (sliderDiv && options.images) {
                for (let item of sliderDiv.children) {
                    const imgElement = item.querySelector('img');
                    if (imgElement) {
                        let highResURL = imgElement.src.replace('250x250', '960x960');
                        imgURLs.push(highResURL);
                        console.log("Image URL captured:", highResURL);
                    }
                }
            }
        }
    }

    const videoURLs = [];

    // For videos
    if (options.videos) {
        const videoElement = document.querySelector('video');
        
        if (videoElement) {
            videoURLs.push(videoElement.src);
            console.log("Video URL captured:", videoElement.src);
        } else {
            console.log("Video element not found.");
        }
    }

    // Add URLs to zip for images. This part assumes you can fetch and convert blobs to arrayBuffer.
    for (let url of imgURLs) {
        const response = await fetch(url);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        zip.file(`images/${url.split('/').pop()}`, arrayBuffer);
    }

    // Request background to fetch videos due to potential CORS issues
    for (let url of videoURLs) {
        chrome.runtime.sendMessage({
            action: 'fetchVideo',
            url: url
        }, function(response) {
            if (response && response.data) {
                const base64String = response.data;
                const binaryString = atob(base64String);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const arrayBuffer = bytes.buffer;
                zip.file(`videos/${url.split('/').pop().split('?')[0]}`, arrayBuffer);
                console.log("Video added to zip:", url);
            } else {
                console.error("Error fetching video from background:", url);
            }
            resolve();
        });
        
    }

    // Since adding video is an asynchronous operation, let's add a delay here to ensure the video is added before we generate the zip
    await delay(5000);

    // Finally, generate zip and trigger download
    zip.generateAsync({ type: 'blob' }).then(function(content) {
        const tempURL = URL.createObjectURL(content);
        const tempLink = document.createElement('a');
        tempLink.href = tempURL;
        tempLink.setAttribute('download', 'ali-downloads.zip');
        
        // Append to document for Firefox compatibility
        document.body.appendChild(tempLink);
        
        tempLink.click();
        
        // Remove the link and revoke the URL
        document.body.removeChild(tempLink);
        URL.revokeObjectURL(tempURL);

        console.log("ZIP file download triggered.");
    });
    
}