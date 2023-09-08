chrome.runtime.onMessage.addListener(async function(message, sender, sendResponse) {
    if (message.action === 'probe') {
        sendResponse({status: "active"});
        return;
    }
    if (message.action === 'startDownload') {
        const downloadOptions = message.downloadOptions;
        
        if (window.location.href.includes("aliexpress.com/item/")) {
            const success = await extractFromAliExpress(downloadOptions);
            if (!success) {
                sendResponse({status: "noData"});
                return;
            }
        } else if (window.location.href.includes("alibaba.com/product-detail/")) {
            const success = await extractFromAlibaba(downloadOptions);
            if (!success) {
                sendResponse({status: "noData"});
                return;
            }
        }
        else
            sendResponse({status: "noData"});
    }
});

function delay(ms) {
    return new Promise(res => setTimeout(res, ms));
}

async function extractFromAliExpress(options) {
    const zip = new JSZip();

    // For description
    if (options.description) {
        let descriptionContent = '';
    
        // Extracting the title
        const headerElement = document.querySelectorAll("h1")[1];
        if (headerElement) {
            const extractedText = Array.from(headerElement.childNodes)
                .filter(child => child.nodeType === 3)
                .map(child => child.textContent)
                .join('');
            descriptionContent += extractedText + '\n';
        }

        const parent = document.getElementById("nav-specification")
        let buttonElement;
        if(parent) buttonElement = parent.querySelector("button.specification--btn--CXRSSZD");
        // Click the button if it's found
        if (buttonElement) {
            buttonElement.click();
            // Extracting the table specifications
            const specificationLines = document.querySelectorAll(".specification--line--iUJOqof");
            if (specificationLines.length > 0) {
            specificationLines.forEach(line => {
                const titles = Array.from(line.querySelectorAll(".specification--title--UbVeyic span"));
                const descriptions = Array.from(line.querySelectorAll(".specification--desc--Mz148Bl span"));
    
                for (let i = 0; i < titles.length; i++) {
                    descriptionContent += titles[i].textContent + ': ' + descriptions[i].textContent + '\n';
                }
            });
            }
        } else {
            const specificationLines = document.querySelectorAll(".specification--line--iUJOqof");
            if (specificationLines.length > 0) {
            specificationLines.forEach(line => {
                const titles = Array.from(line.querySelectorAll(".specification--title--UbVeyic span"));
                const descriptions = Array.from(line.querySelectorAll(".specification--desc--Mz148Bl span"));
    
                for (let i = 0; i < titles.length; i++) {
                    descriptionContent += titles[i].textContent + ': ' + descriptions[i].textContent + '\n';
                }
            });
            }
        }

        zip.file('description.txt', descriptionContent);
    }

    const imgURLs = [];

    // For images and videos
    if (options.images || options.videos) {

        const sliderDiv = document.querySelector('ul.images-view-list');
        
        if (sliderDiv && options.images) {
            for (let item of sliderDiv.children) {
                const imgElement = item.querySelector('img');
                if (imgElement) {
                    let highResURL = imgElement.src.replace('220x220', '960x960');
                    imgURLs.push(highResURL);
                    console.log("Image URL captured:", highResURL);
                }
            }
        }
    }

    async function convertWebpToPng(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = url;
            img.crossOrigin = 'anonymous';  // This ensures that CORS headers are respected
            img.onload = function() {
                const canvas = document.createElement('canvas');
                canvas.width = this.naturalWidth;
                canvas.height = this.naturalHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(this, 0, 0);
                canvas.toBlob(blob => resolve(blob), 'image/png');
            };
            img.onerror = reject;
        });
    }
    let counter=1;
    async function addImageToZip(url) {

        let blob;
        if (url.endsWith('.webp')) {
            blob = await convertWebpToPng(url);
        } else {
            const response = await fetch(url);
            blob = await response.blob();
        }
        const arrayBuffer = await blob.arrayBuffer();
        let filename = `images/${url.split('/').pop()}`;
        filename = `images/image${counter}.png`;
        zip.file(filename, arrayBuffer);
        counter++;
    }
    
    // Convert the for-loop into an array of promises
    const imagePromises = imgURLs.map(addImageToZip);
    
    // Wait for all images to be processed and added to the zip
    await Promise.all(imagePromises);


    const videoURLs = [];

    if (options.videos) {
        const videoElement = document.querySelector('video');
        if (videoElement) {
            let videoSrc = videoElement.src;
            // Change the video codec to h264
            if (videoSrc.includes("definition=h265")) {
                videoSrc = videoSrc.replace("definition=h265", "definition=h264");
            }
            videoURLs.push(videoSrc);
            console.log("Video URL captured:", videoSrc);
        } else {
            console.log("Video element not found.");
        }
    }
    
    const videoPromises = [];
    // Request background to fetch videos due to potential CORS issues
    for (let url of videoURLs) {
        const videoPromise = new Promise((resolve, reject) => {
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
                    zip.file(`videos/${"video_" + url.split('/').pop().split('?')[0]}`, arrayBuffer);
                    console.log("Video added to zip:", url);
                    resolve();
                } else {
                    console.error("Error fetching video from background:", url);
                    reject(new Error("Error fetching video from background"));
                }
            });
        });
        
        videoPromises.push(videoPromise);
    }
    
    // Wait for all video downloads to complete
    await Promise.all(videoPromises);

    // Finally, generate zip and trigger download
    zip.generateAsync({ type: 'blob' }).then(function(content) {
        const tempURL = URL.createObjectURL(content);
        const tempLink = document.createElement('a');
        tempLink.href = tempURL;
        tempLink.setAttribute('download', 'Ali-Express-downloads.zip');
        
        // Append to document for Firefox compatibility
        document.body.appendChild(tempLink);
        
        tempLink.click();
        
        // Remove the link and revoke the URL
        document.body.removeChild(tempLink);
        URL.revokeObjectURL(tempURL);

        console.log("ZIP file download triggered.");
    });
    return true;
}


async function extractFromAlibaba(options) {
    const zip = new JSZip();

    // For description
    if (options.description) {
        let descriptionContent = '';
    
        // Extracting the title
        const headerElement = document.querySelector("h1");
        if (headerElement) {
            const extractedText = Array.from(headerElement.childNodes)
                .filter(child => child.nodeType === 3)
                .map(child => child.textContent)
                .join('');
            descriptionContent += extractedText + '\n';
        }

        for(let i=0; i<2;i++)
        {
            // Extracting the first two rows from the structure-table
            const tableElement = document.getElementsByClassName("structure-table")[i];
            if (tableElement) {
                const rows = tableElement.getElementsByClassName("structure-row");
                for (let i = 0; i < rows.length; i++) { // Only first two rows or less
                    const colLeft = rows[i].getElementsByClassName("col-left")[0];
                    const colRight = rows[i].getElementsByClassName("col-right")[0];
                    
                    if (colLeft && colRight) {
                        const rowContent = `${colLeft.textContent.trim()}: ${colRight.textContent.trim()}`;
                        descriptionContent += rowContent + '\n';
                    }
                }
            }
        }
    
        zip.file('description.txt', descriptionContent);
    }

    const imgURLs = [];

    // For images and videos
    if (options.images || options.videos) {
        const spans = Array.from(document.querySelectorAll('span'));
        const viewLargerImageBtn = spans.find(span => span.textContent.trim() === "View larger image");
        
        if (viewLargerImageBtn) {
            viewLargerImageBtn.click();
            await delay(3000);

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
    // Add URLs to zip for images. This part assumes you can fetch and convert blobs to arrayBuffer.
    let counter = 1;
    for (let url of imgURLs) {
        const response = await fetch(url);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        
        // Extract the file extension from the URL
        const fileExtension = url.split('/').pop().split('.').pop();
    
        // Rename the image using the counter and preserve its extension
        const filename = `images/image_${counter}.${fileExtension}`;
        zip.file(filename, arrayBuffer);
    
        counter++;
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


    const videoPromises = [];

    // Request background to fetch videos due to potential CORS issues
    for (let url of videoURLs) {
        const videoPromise = new Promise((resolve, reject) => {
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
                    const fileExtension = url.split('/').pop().split('?')[0].split('.').pop();
                    const filename = `videos/video.${fileExtension}`;
                    zip.file(filename, arrayBuffer);
                    console.log("Video added to zip:", url);
                    resolve();
                } else {
                    console.error("Error fetching video from background:", url);
                    reject(new Error("Error fetching video from background"));
                }
            });
        });
        
        videoPromises.push(videoPromise);
    }
    // Wait for all video downloads to complete
    await Promise.all(videoPromises);

    // Finally, generate zip and trigger download
    zip.generateAsync({ type: 'blob' }).then(function(content) {
        const tempURL = URL.createObjectURL(content);
        const tempLink = document.createElement('a');
        tempLink.href = tempURL;
        tempLink.setAttribute('download', 'Ali-Baba-downloads.zip');
        
        // Append to document for Firefox compatibility
        document.body.appendChild(tempLink);
        
        tempLink.click();
        
        // Remove the link and revoke the URL
        document.body.removeChild(tempLink);
        URL.revokeObjectURL(tempURL);

        console.log("ZIP file download triggered.");
    });
    return true;
}