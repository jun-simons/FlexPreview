// Get the VS Code API, only available in webviews
const vscode = acquireVsCodeApi();

const iframe = document.getElementById('preview-iframe');
const deviceFrame = document.querySelector('.device-frame');

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
            // Update the dimensions of the device frame and iframe
            if (deviceFrame && iframe) {
                const width = message.width;
                const height = message.height;

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
            }
            break;
    }
});

// Post a message back to the extension 
// for debugging, future features
function postMessageToExtension(command, text) {
    vscode.postMessage({ command, text });
}

// Example: Send a "webview ready" message to the extension
// This can be useful for the extension to know when the webview is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    postMessageToExtension('webviewReady', 'Webview is fully loaded and ready for commands.');
});
