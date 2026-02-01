import { WebSocketServer, WebSocket } from 'ws';
import * as vscode from 'vscode';

export class LiveReloadServer {
    private _wss: WebSocketServer | undefined;
    private _clients: Set<WebSocket> = new Set();

    public start(port: number) {
        this._wss = new WebSocketServer({ port });

        this._wss.on('connection', (ws) => {
            this._clients.add(ws);
            ws.on('close', () => this._clients.delete(ws));
        });

        // Surveiller les changements de fichiers dans le projet
        vscode.workspace.onDidSaveTextDocument((document) => {
            if (document.languageId === 'php' || document.languageId === 'html') {
                this.broadcastReload();
            }
        });
    }

    private broadcastReload() {
        this._clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send('reload');
            }
        });
    }

    public stop() {
        this._wss?.close();
        this._clients.clear();
    }
}