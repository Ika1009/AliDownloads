const downloadBtn = document.querySelector('.download-btn');

// Reference to the folder picker and path input
const folderPicker = document.getElementById('folderPicker');
const pathInput = document.querySelector('.path-input');

downloadBtn.addEventListener('click', function () {
    // Get the path from the input field
    const pathInput = pathInput.value;

    // Get the checkboxes and their values
    const imagesCheckbox = document.querySelector('.images-checkbox').checked;
    const videosCheckbox = document.querySelector('.videos-checkbox').checked;
    const descriptionCheckbox = document.querySelector('.description-checkbox').checked;

    // Message to be sent to background.js
    const message = {
        action: 'startDownload',
        path: pathInput,
        downloadOptions: {
            images: imagesCheckbox,
            videos: videosCheckbox,
            description: descriptionCheckbox
        }
    };

    // Send message to background.js
    chrome.runtime.sendMessage(message);
});


// When the folder button is clicked, trigger the folderPicker's click event
document.querySelector('.folder-btn').addEventListener('click', function () {
    folderPicker.click();
});

// When a folder is selected using the folderPicker, update the pathInput
folderPicker.addEventListener('change', function (event) {
    if (event.target.files.length > 0) {
        // Extract the path from the first file's webkitRelativePath
        const fullPath = event.target.files[0].webkitRelativePath;
        
        // Get the directory name by extracting the part of the path before the first "/"
        const dirName = fullPath.split("/")[0];
        
        pathInput.value = dirName;
    }
});
