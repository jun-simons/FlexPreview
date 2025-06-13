// webview/script.js

const vscode = acquireVsCodeApi();

const iframe = document.getElementById('preview-iframe');
const deviceFrame = document.querySelector('.device-frame');
const container = document.querySelector('.container');
const deviceSelect = document.getElementById('device-select');

const BORDER_WIDTH = 16; // 8px border per side
let loadedDevices = {}; 

/**
 * A reusable function to set the dimensions and update the scale.
 * @param {number} width 
 * @param {number} height 
 */
function setDimensions(width, height) {
    if (deviceFrame && iframe) {
        // Apply the new styles.
        deviceFrame.style.width = `${width}px`;
        deviceFrame.style.height = `${height}px`;
        iframe.style.width = `100%`;
        iframe.style.height = `100%`;

        if (width > 600 || height > 1000) {
            deviceFrame.style.borderRadius = '15px';
        } else {
            deviceFrame.style.borderRadius = '25px';
        }
        
        updateScale(width, height);
    }
}

/**
 * Calculates and applies the correct scale.
 * This function now ACCEPTS the target dimensions, avoiding stale DOM measurements.
 * @param {number} [targetWidth] - The target content width of the device.
 * @param {number} [targetHeight] - The target content height of the device.
 */
function updateScale(targetWidth, targetHeight) {
    if (!deviceFrame || !container) {
        return;
    }

    let deviceTotalWidth;
    let deviceTotalHeight;

    // If target dims are passed in (from a preset change), use them directly
    if (targetWidth && targetHeight) {
        // Calculate the total width including the borders.
        deviceTotalWidth = targetWidth + BORDER_WIDTH;
        deviceTotalHeight = targetHeight + BORDER_WIDTH; // Assuming square bezels
    } else {
        // otherwise (on resize or initial load), measure the element from the DOM.
        // only reliable if no style change has just happened 
        deviceTotalWidth = deviceFrame.offsetWidth;
        deviceTotalHeight = deviceFrame.offsetHeight;
    }

    if (deviceTotalWidth === 0 || deviceTotalHeight === 0) {
        return;
    }

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const scaleX = containerWidth / deviceTotalWidth;
    const scaleY = containerHeight / deviceTotalHeight;

    const scale = Math.min(scaleX, scaleY, 1);

    // transform handles both centering and scaling.
    deviceFrame.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

/**
 * Handles messages received from the VSCode extension.
 */
window.addEventListener('message', event => {
    const message = event.data;

    switch (message.command) {
        case 'updateUrl':
            if (iframe) {
                iframe.src = message.url;
            }
            break;
        case 'updateDimensions':
            if (deviceFrame && iframe) {
                const width = message.width;
                const height = message.height;

                // Apply the new styles.
                deviceFrame.style.width = `${width}px`;
                deviceFrame.style.height = `${height}px`;
                iframe.style.width = `100%`;
                iframe.style.height = `100%`;

                if (width > 600 || height > 1000) {
                    deviceFrame.style.borderRadius = '15px';
                } else {
                    deviceFrame.style.borderRadius = '25px';
                }

                // call update scale with correct dimensions
                updateScale(width, height);
            }
            break;
            case 'loadDevices':
                loadedDevices = message.devices;
                deviceSelect.innerHTML = ''; // clear existing options
    
                // create a default "Custom" option for when a custom resolution is set
                const customOption = document.createElement('option');
                customOption.value = "custom";
                customOption.textContent = "Custom";
                deviceSelect.appendChild(customOption);
                
                // populate the dropdown with devices
                for (const deviceName in loadedDevices) {
                    const option = document.createElement('option');
                    option.value = deviceName;
                    option.textContent = `${deviceName} (${loadedDevices[deviceName].width}x${loadedDevices[deviceName].height})`;
                    deviceSelect.appendChild(option);
                }
                // set the dropdown to the initial device if possible
                deviceSelect.value = "iPhone 15 Pro";
                break;
    }
});

// event listner for dropdown menu
deviceSelect.addEventListener('change', (event) => {
    const selectedDeviceName = event.target.value;
    if (selectedDeviceName && loadedDevices[selectedDeviceName]) {
        const device = loadedDevices[selectedDeviceName];
        setDimensions(device.width, device.height);
    }
});

// event listner: call updateScale without arguments for default load
window.addEventListener('resize', () => updateScale());

document.addEventListener('DOMContentLoaded', () => {
    vscode.postMessage({ command: 'webviewReady', text: 'Webview is fully loaded and ready for commands.' });
    // timeout works for first load
    setTimeout(() => updateScale(), 100);
});