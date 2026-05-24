import * as vscode from 'vscode';
import * as portfinder from 'portfinder';
import open = require('open');
import { PHPStackManager } from './serverManager';
import { LiveReloadServer } from './liveReload';
import { getLocalIPv4 } from './networkUtils';

let statusBarItem: vscode.StatusBarItem;
let phpManager = new PHPStackManager();
let lrServer = new LiveReloadServer();
let isRunning = false;
let currentIp: string = "";
let currentPort: number = 0;

export function activate(context: vscode.ExtensionContext) {
    
    let startCommand = vscode.commands.registerCommand('phive.startServer', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage("Please open a project folder.");
            return;
        }

        // 1. Sélection du dossier (Gestion Multi-root)
        let rootPath: string;
        if (workspaceFolders.length === 1) {
            rootPath = workspaceFolders[0].uri.fsPath;
        } else {
            const selected = await vscode.window.showQuickPick(
                workspaceFolders.map(f => ({ label: f.name, description: f.uri.fsPath })),
                { placeHolder: "Select the project folder to launch with Phive" }
            );
            if (!selected) return; // Annulation de l'utilisateur
            rootPath = selected.description;
        }

        currentIp = getLocalIPv4();

        // Récupération du port préféré depuis les paramètres utilisateur (Défaut: 8000)
        const config = vscode.workspace.getConfiguration('phive');
        const preferredPort = config.get<number>('port') || 8000;

        try {
            // Détection automatique et robuste des ports libres à partir du port préféré
            currentPort = await portfinder.getPortPromise({ port: preferredPort });
            const wsPort = await portfinder.getPortPromise({ port: 9001 });

            // Notification si les ports par défaut ou configurés ont été modifiés à cause d'un conflit
            if (currentPort !== preferredPort) {
                vscode.window.showWarningMessage(`Port ${preferredPort} is occupied. Phive automatically switched to port ${currentPort}.`);
            }
            
            if (wsPort !== 9001) {
                vscode.window.showWarningMessage(`Port 9001 is occupied. WebSocket port automatically switched to ${wsPort}.`);
            }

            // Démarrage des serveurs avec les ports sécurisés
            lrServer.start(wsPort);
            phpManager.start(rootPath, "0.0.0.0", currentPort, wsPort, currentIp);
            
            isRunning = true;
            updateStatusBar(currentIp, currentPort);

            // Ouverture du navigateur local sur le port dynamique adéquat
            const url = `http://localhost:${currentPort}`;
            open(url);

            // Message informatif avec le port réellement utilisé
            const networkUrl = `http://${currentIp}:${currentPort}`;
            vscode.window.showInformationMessage(`✅ Phive Live: Server active on ${networkUrl}`);
            
            // Notification additionnelle si le port est différent du défaut/configuré
            if (currentPort !== preferredPort) {
                vscode.window.showInformationMessage(`📱 Connect your mobile device to ${networkUrl} (custom port due to conflict)`);
            } else {
                vscode.window.showInformationMessage(`📱 Connect your mobile device to ${networkUrl}`);
            }
            
        } catch (err) {
            vscode.window.showErrorMessage("❌ Phive port allocation error: " + err);
        }
    });

    let stopCommand = vscode.commands.registerCommand('phive.stopServer', () => {
        phpManager.stop();
        lrServer.stop();
        isRunning = false;
        updateStatusBar();
        vscode.window.showInformationMessage("🛑 Phive server stopped");
    });

    // Initialisation de la barre de statut
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    updateStatusBar();
    statusBarItem.show();

    context.subscriptions.push(startCommand, stopCommand, statusBarItem);
}

/**
 * Met à jour l'interface visuelle de la barre de statut
 */
function updateStatusBar(ip?: string, port?: number) {
    if (!isRunning) {
        statusBarItem.text = `$(play) Phive: Go Live`;
        statusBarItem.command = 'phive.startServer';
        statusBarItem.tooltip = "🚀 Start the PHP Live Reload server";
        statusBarItem.backgroundColor = undefined;
    } else {
        // Affichage professionnel de l'IP et du Port réellement utilisés
        statusBarItem.text = `$(primitive-square) Phive: ${ip}:${port}`;
        statusBarItem.command = 'phive.stopServer';
        statusBarItem.tooltip = `✅ Server active on http://${ip}:${port} (Click to stop)`;
        
        // Utilisation d'une couleur distinctive pour indiquer que le serveur tourne
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    }
}

export function deactivate() {
    phpManager.stop();
    lrServer.stop();
}