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
    public static createOrShow(extensionUri: vscode.Uri, viewColumn: vscode.ViewColumn | undefined) {
        const column = viewColumn || vscode.ViewColumn.Beside;

        // If we already have a panel, show it.
        if (MobilePreviewPanel.currentPanel) {
            MobilePreviewPanel.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            'mobilePreview', // Identifies the type of the webview. Used internally
            'Mobile Preview', // Title of the panel displayed to the user
            column, // Editor column to show the new webview panel in.
            {
                // Enable JavaScript in the webview
                enableScripts: true,
                // Restrict the webview to only loading content from our extension's `webview` directory.
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'webview')]
            }
        );

        MobilePreviewPanel.currentPanel = new MobilePreviewPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set the webview's HTML content
        this._updateWebview();

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

        // Get the URI for the webview's local resources
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview', 'script.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview', 'style.css'));

        // Use a content security policy to only allow loading images from https or from our extension.
        // const nonce = getNonce();

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
                <div class="device-frame">
                    <iframe id="preview-iframe" src="about:blank"></iframe>
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

// This method is called when your extension is deactivated
export function deactivate() {}
