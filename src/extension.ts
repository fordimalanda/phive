import * as vscode from 'vscode';
import * as os from 'os';
import * as portfinder from 'portfinder';
import * as open from 'open';
import { PHPStackManager } from './serverManager';
import { LiveReloadServer } from './liveReload';

let statusBarItem: vscode.StatusBarItem;
let phpManager = new PHPStackManager();
let lrServer = new LiveReloadServer();
let isRunning = false;

export function activate(context: vscode.ExtensionContext) {
    
    // Commande pour DÉMARRER
    let startCommand = vscode.commands.registerCommand('phive.startServer', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage("Open a folder or a PHP project first !");
            return;
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        const ip = getLocalIPv4();

        try {
            // 1. Trouver des ports libres automatiquement
            // On cherche à partir de 8000 pour PHP et 9001 pour le WebSocket
            const phpPort = await portfinder.getPortPromise({ port: 8000 });
            const wsPort = await portfinder.getPortPromise({ port: 9001 });

            // 2. Démarrer le serveur WebSocket (Live Reload)
            lrServer.start(wsPort);

            // 3. Démarrer le serveur PHP (avec injection du script de reload)
            phpManager.start(rootPath, "0.0.0.0", phpPort, wsPort, ip);
            
            isRunning = true;
            updateStatusBar();

            // 4. Ouverture automatique du navigateur
            const url = `http://localhost:${phpPort}`;
            await open(url);

            vscode.window.showInformationMessage(`Phive active on ${url} (Network:${ip}:${phpPort})`);
        } catch (err) {
            vscode.window.showErrorMessage("Error starting services : " + err);
        }
    });

    // Commande pour ARRÊTER
    let stopCommand = vscode.commands.registerCommand('phive.stopServer', () => {
        stopAllServices();
        vscode.window.showInformationMessage("Phive server down.");
    });

    // Initialisation du bouton dans la barre d'état
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    updateStatusBar();
    statusBarItem.show();

    context.subscriptions.push(startCommand, stopCommand, statusBarItem);
}

/**
 * Arrête tous les services en cours
 */
function stopAllServices() {
    phpManager.stop();
    lrServer.stop();
    isRunning = false;
    updateStatusBar();
}

/**
 * Met à jour le bouton Go Live / Stop
 */
function updateStatusBar() {
    if (!isRunning) {
        statusBarItem.text = `$(play) Phive: Go Live`;
        statusBarItem.command = 'phive.startServer';
        statusBarItem.backgroundColor = undefined;
        statusBarItem.tooltip = "Launch the PHP server and the Live Reload";
    } else {
        statusBarItem.text = `$(primitive-square) Phive: Stop`;
        statusBarItem.command = 'phive.stopServer';
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        statusBarItem.tooltip = "Stop Phive";
    }
}

/**
 * Récupère l'adresse IP locale (WiFi/Ethernet)
 */
function getLocalIPv4(): string {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        const networkInterface = interfaces[name];
        if (networkInterface) {
            for (const iface of networkInterface) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
    }
    return '127.0.0.1';
}

/**
 * Nettoyage lors de la désactivation de l'extension
 */
export function deactivate() {
    stopAllServices();
}