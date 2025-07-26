import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Manages the mobile preview webview panel.
 */
class MobilePreviewPanel {
    public static currentPanel: MobilePreviewPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    /**
     * Creates or shows a new MobilePreviewPanel.
     * @param extensionUri The extension's URI, used to resolve local resources.
     * @param viewColumn The column in which to show the panel.
     */
    public static createOrShow(extensionUri: vscode.Uri, viewColumn: vscode.ViewColumn | undefined, presetDevices: object) {
        const column = viewColumn || vscode.ViewColumn.Beside;

        if (MobilePreviewPanel.currentPanel) {
            MobilePreviewPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'flexPreview', 'Flex Preview', column,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'webview')],
                retainContextWhenHidden: true
            }
        );

        MobilePreviewPanel.currentPanel = new MobilePreviewPanel(panel, extensionUri, presetDevices);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, presetDevices: object) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set the webview's HTML content
        this._updateWebview();

        // send device list to webview
        this._panel.webview.postMessage({ command: 'loadDevices', devices: presetDevices });
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'alert':
                        vscode.window.showErrorMessage(message.text);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    /**
     * Disposes the current panel and cleans up resources.
     */
    public dispose() {
        MobilePreviewPanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    /**
     * Updates the webview with the HTML content.
     */
    private _updateWebview() {
        const webview = this._panel.webview;
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview', 'script.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview', 'style.css'));
        const nonce = getNonce();
    
        this._panel.webview.html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Mobile Preview</title>
                <link href="${styleUri}" rel="stylesheet">
            </head>
            <body>
                <div class="controls">
                    <label for="device-select">Device:</label>
                    <select id="device-select">
                        </select>
    
                    <label for="width-input">Size:</label>
                    <input type="number" id="width-input" />
                    <span>x</span>
                    <input type="number" id="height-input" />
                </div>
                <div class="container">
                    <div class="device-frame">
                        <iframe id="preview-iframe" src="about:blank"></iframe>
                    </div>
                </div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>
        `;
    }

    /**
     * Sends a message to the webview to update its content.
     * @param command The command to send (e.g., 'updateUrl', 'updateDimensions').
     * @param data The data associated with the command.
     */
    public postMessage(command: string, data: any) {
        this._panel.webview.postMessage({ command, ...data });
    }
}


/**
 * Generates a random nonce for Content Security Policy.
 */
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

/**
 * This method is called when your extension is activated.
 * Your extension is activated the very first time the command is executed.
 */
export function activate(context: vscode.ExtensionContext) {

    console.log('Congratulations, your extension "flex-preview" is now active!');

    // Define preset device resolutions (width x height in logical pixels)
    const presetDevices = {
        'iPhone 15 Pro': { width: 393, height: 852 },
        'iPhone 15 Pro (Landscape)': { width: 852, height: 393 },
        'iPhone 16 Pro Max': { width: 440, height: 956 },
        'iPhone 13 mini': { width: 360, height: 780 },
        'Google Pixel 8': { width: 412, height: 915 },
        'Galaxy Fold': { width: 768, height: 1076 },
        'iPad Air': { width: 820, height: 1180 },
        'Small Android Phone': { width: 360, height: 640 }, // Example small phone
        'Large Tablet (Landscape)': { width: 1366, height: 1024 }, // Example large tablet
        'MacBook Pro 13.3': { width: 1280, height: 800 },
        'MacBook Pro 16': { width: 1536, height: 960 }
    };


    // Register command to show the mobile preview panel
    let disposableShow = vscode.commands.registerCommand('flexPreview.show', async () => {
        // Create or show the panel
        MobilePreviewPanel.createOrShow(context.extensionUri, vscode.ViewColumn.Beside, presetDevices);

        if (MobilePreviewPanel.currentPanel) {
            const url = await vscode.window.showInputBox({
                prompt: 'Enter the URL of your web application (e.g., http://localhost:3000)',
                value: 'http://localhost:3000' // Default value
            });

            if (url) {
                MobilePreviewPanel.currentPanel.postMessage('updateUrl', { url });
                // Set default initial resolution
                const defaultDevice = presetDevices['iPhone 15 Pro'];
                MobilePreviewPanel.currentPanel.postMessage('updateDimensions', { width: defaultDevice.width, height: defaultDevice.height });
            } else {
                vscode.window.showInformationMessage('URL is required to show the preview.');
            }
        }
    });

    // Register command to set custom resolution
    let disposableCustom = vscode.commands.registerCommand('flexPreview.setCustomResolution', async () => {
        if (!MobilePreviewPanel.currentPanel) {
            vscode.window.showWarningMessage('Please open the Flex Preview panel first.');
            return;
        }

        const widthStr = await vscode.window.showInputBox({
            prompt: 'Enter custom width (pixels)',
            placeHolder: 'e.g., 400'
        });

        if (!widthStr) return;
        const width = parseInt(widthStr, 10);
        if (isNaN(width) || width <= 0) {
            vscode.window.showErrorMessage('Invalid width. Please enter a positive number.');
            return;
        }

        const heightStr = await vscode.window.showInputBox({
            prompt: 'Enter custom height (pixels)',
            placeHolder: 'e.g., 700'
        });

        if (!heightStr) return;
        const height = parseInt(heightStr, 10);
        if (isNaN(height) || height <= 0) {
            vscode.window.showErrorMessage('Invalid height. Please enter a positive number.');
            return;
        }

        MobilePreviewPanel.currentPanel.postMessage('updateDimensions', { width, height });
        vscode.window.showInformationMessage(`Preview updated to custom resolution: ${width}x${height}`);
    });

    // Register command to select preset resolution
    let disposablePreset = vscode.commands.registerCommand('flexPreview.setPresetResolution', async () => {
        if (!MobilePreviewPanel.currentPanel) {
            vscode.window.showWarningMessage('Please open the Flex Preview panel first.');
            return;
        }

        const quickPickItems = (Object.keys(presetDevices) as Array<keyof typeof presetDevices>).map(key => ({
            label: key,
            description: `${presetDevices[key].width}x${presetDevices[key].height}px`
        }));

        const selectedItem = await vscode.window.showQuickPick(quickPickItems, {
            placeHolder: 'Select a preset device resolution'
        });

        if (selectedItem) {
            // Again, use a type assertion for selectedItem.label when accessing presetDevices
            const device = presetDevices[selectedItem.label as keyof typeof presetDevices];
            MobilePreviewPanel.currentPanel.postMessage('updateDimensions', { width: device.width, height: device.height });
            vscode.window.showInformationMessage(`Preview updated to ${selectedItem.label} resolution.`);
        }
    });

    context.subscriptions.push(disposableShow, disposableCustom, disposablePreset);
}

// This method is called when your extension is deactivated
export function deactivate() {}
