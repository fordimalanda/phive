import { WebSocketServer, WebSocket } from 'ws';
import * as vscode from 'vscode';
import * as path from 'path';

export class LiveReloadServer {
    private _wss: WebSocketServer | undefined;
    private _clients: Set<WebSocket> = new Set();
    private _reloadTimeout: NodeJS.Timeout | undefined;
    
    // Extensions de fichiers de base à surveiller pour le rechargement
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
            
            // 1. Vérifier d'abord si le fichier fait partie des chemins à ignorer
            if (this.isIgnored(fileName)) {
                return; // On stoppe immédiatement, aucun rechargement
            }

            // 2. Vérifier l'extension du fichier
            const ext = path.extname(fileName).toLowerCase().replace('.', '');
            if (this.WATCHED_EXTENSIONS.includes(ext)) {
                this.scheduleReload();
            }
        });
    }

    /**
     * Vérifie si le chemin du fichier contient un dossier ou segment à ignorer
     */
    private isIgnored(fileName: string): boolean {
        const config = vscode.workspace.getConfiguration('phive');
        const ignorePaths = config.get<string[]>('ignorePaths') || ['.git', 'node_modules', 'vendor', 'cache'];
        
        // Normalisation du chemin pour éviter les problèmes de slashs entre Windows et Linux
        const normalizedPath = fileName.replace(/\\/g, '/');

        // Si le chemin contient l'un des dossiers exclus, on retourne vrai
        return ignorePaths.some(ignoredSegment => {
            if (!ignoredSegment) return false;
            // On s'assure de chercher le dossier entouré de slashs ou en bordure de chemin
            // pour éviter d'ignorer un fichier nommé "cache.php" si on veut ignorer le dossier "cache"
            return normalizedPath.includes(`/${ignoredSegment}/`) || normalizedPath.endsWith(`/${ignoredSegment}`);
        });
    }

    /**
     * Planifie le rechargement en appliquant le délai configuré par l'utilisateur (v1.1.3).
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