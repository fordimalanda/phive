import * as vscode from 'vscode';
import * as path from 'path';
import { WebSocketServer, WebSocket } from 'ws';

export class LiveReloadServer {
    private _wss: WebSocketServer | undefined;
    private _clients: Set<WebSocket> = new Set();
    private _reloadTimeout: NodeJS.Timeout | undefined;
    
    // Extensions de fichiers à surveiller pour le rechargement
    private readonly WATCHED_EXTENSIONS = ['php', 'html', 'css', 'js', 'json'];

    public start(port: number) {
        this._wss = new WebSocketServer({ port });

        this._wss.on('connection', (ws) => {
            this._clients.add(ws);
            ws.on('close', () => this._clients.delete(ws));
        });

        // Surveiller les changements de fichiers dans le projet
        vscode.workspace.onDidSaveTextDocument((document) => {
            const fileName = document.fileName;
            const ext = path.extname(fileName).toLowerCase().replace('.', '');

            if (this.WATCHED_EXTENSIONS.includes(ext)) {
                this.scheduleReload();
            }
        });
    }

    /**
     * Lit la configuration utilisateur et planifie le rechargement avec le délai requis.
     * Le debounce annule un rechargement précédent si une rafale de fichiers est enregistrée.
     */
    private scheduleReload() {
        const config = vscode.workspace.getConfiguration('phive');
        const delay = config.get<number>('reloadDelay') ?? 100;

        if (this._reloadTimeout) {
            clearTimeout(this._reloadTimeout);
        }

        this._reloadTimeout = setTimeout(() => {
            this.broadcastReload();
        }, delay);
    }

    private broadcastReload() {
        this._clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send('reload');
            }
        });
    }

    public stop() {
        if (this._reloadTimeout) {
            clearTimeout(this._reloadTimeout);
        }
        this._wss?.close();
        this._clients.clear();
    }
}