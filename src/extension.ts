import * as vscode from 'vscode';
import * as os from 'os';
import { PHPStackManager } from './serverManager';
import { LiveReloadServer } from './liveReload';

let statusBarItem: vscode.StatusBarItem;
let phpManager = new PHPStackManager();
let lrServer = new LiveReloadServer();
let isRunning = false;

export function activate(context: vscode.ExtensionContext) {
    
    // Commande pour DÉMARRER le serveur
    let startCommand = vscode.commands.registerCommand('phive.startServer', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        
        if (!workspaceFolders) {
            vscode.window.showErrorMessage("Open a folder or a PHP project first!");
            return;
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        const ip = getLocalIPv4();
        const port = 8000;   // Port du serveur PHP
        const wsPort = 9001; // Port pour les WebSockets (Live Reload)

        try {
            // 1. Démarrer le WebSocket Server pour le Live Reload
            lrServer.start(wsPort);

            // 2. Démarrer le serveur PHP (qui injecte le script pointant vers wsPort)
            phpManager.start(rootPath, "0.0.0.0", port, wsPort, ip);
            
            isRunning = true;
            updateStatusBar();
            
            vscode.window.showInformationMessage(`Phive is online! Access it at http://${ip}:${port}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to start Phive: ${error}`);
        }
    });

    // Commande pour ARRÊTER le serveur
    let stopCommand = vscode.commands.registerCommand('phive.stopServer', () => {
        stopAllServices();
        vscode.window.showInformationMessage("Phive services stopped.");
    });

    // Initialisation de l'élément de la barre d'état
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    updateStatusBar();
    statusBarItem.show();

    // Enregistrement des commandes et de la barre d'état pour le nettoyage
    context.subscriptions.push(startCommand, stopCommand, statusBarItem);
}

/**
 * Arrête proprement le serveur PHP et le serveur WebSocket
 */
function stopAllServices() {
    phpManager.stop();
    lrServer.stop();
    isRunning = false;
    updateStatusBar();
}

/**
 * Met à jour l'interface visuelle du bouton dans la barre d'état
 */
function updateStatusBar() {
    if (!isRunning) {
        statusBarItem.text = `$(play) Phive: Go Live`;
        statusBarItem.command = 'phive.startServer';
        statusBarItem.backgroundColor = undefined;
        statusBarItem.tooltip = "Launch Phive PHP server & Live Reload";
    } else {
        statusBarItem.text = `$(primitive-square) Phive: Stop`;
        statusBarItem.command = 'phive.stopServer';
        // Utilise une couleur d'avertissement/erreur pour indiquer que c'est actif
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        statusBarItem.tooltip = "Stop all Phive services";
    }
}

/**
 * Récupère l'adresse IPv4 locale pour permettre l'accès réseau (ex: WiFi)
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
 * Fonction appelée lors de la fermeture de VS Code ou de l'extension
 */
export function deactivate() {
    stopAllServices();
}