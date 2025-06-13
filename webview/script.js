// Get the VS Code API, only available in webviews
const vscode = acquireVsCodeApi();

const iframe = document.getElementById('preview-iframe');
const deviceFrame = document.querySelector('.device-frame');
const container = document.querySelector('.container');

/**
 * Calculates and applies the correct scale to fit the device frame
 * within the container.
 */
function updateScale() {
    //debug code
    console.log('--- updateScale called ---');

    if (!deviceFrame || !container) {
        console.error('deviceFrame or container not found!'); //debug code
        return;
    }
    // true device dims (including borders)
    const deviceWidth = deviceFrame.offsetWidth;
    const deviceHeight = deviceFrame.offsetHeight;
    console.log(`Measured device dimensions: ${deviceWidth}w x ${deviceHeight}h`); //debug code

    if (deviceWidth === 0 || deviceHeight === 0) {
        return;
    }
    
    // use available container space to find scale ratio
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const scaleX = containerWidth / deviceWidth;
    const scaleY = containerHeight / deviceHeight;

    // pick smaller ratio so it fits in extension
    const scale = Math.min(scaleX, scaleY, 1);
    console.log(`Container width: ${containerWidth}, Calculated scale: ${scale}`);

    deviceFrame.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

/**
 * Handles messages received from the VSCode extension.
 * @param {MessageEvent} event The message event.
 */
window.addEventListener('message', event => {
    const message = event.data; // JSON event data from extension

    switch (message.command) {
        case 'updateUrl':
            // update source iframe URL
            if (iframe) {
                iframe.src = message.url;
            }
            break;
        case 'updateDimensions':
            // update dims of the device frame and iframe
            if (deviceFrame && iframe) {
                const width = message.width;
                const height = message.height;
                console.log(`Received new dimensions: ${width}w x ${height}h`);
                
                // reset transform immediately
                deviceFrame.style.transform = 'scale(1)';

                // apply new width and height
                deviceFrame.style.width = `${width}px`;
                deviceFrame.style.height = `${height}px`;
                iframe.style.width = `100%`; // iframe always fills its parent frame
                iframe.style.height = `100%`;

                //Adjust border-radius based on size for a more "phone-like" feel?
                // TODO: test this more
                // Larger devices might have less pronounced rounded corners.
                if (width > 600 || height > 1000) {
                    deviceFrame.style.borderRadius = '15px';
                } else {
                    deviceFrame.style.borderRadius = '25px';
                }
                // update scale after dimensions are applied 
                // timeout allows DOM to update before measuring
                // setTimeout(updateScale, 50);
                
                // try requestAnimationFrame for more reliable update
                // requestAnimationFrame(() => {
                //     // ensure browser has completed layout before changing css
                //     requestAnimationFrame(() => {
                //         updateScale();
                //     });
                // });

                void deviceFrame.offsetWidth;
                updateScale();
                setTimeout(updateScale, 200);
            }
            break;
    }
});

// re-calcualte scale on window resize
window.addEventListener('resize', updateScale);

document.addEventListener('DOMContentLoaded', () => {
    vscode.postMessage({ command: 'webviewReady', text: 'Webview is fully loaded and ready for commands.' });
    // Run an initial scale check when the content loads
    // in case the panel is already smaller than the default device size
    setTimeout(updateScale, 50);
});