import * as vscode from 'vscode';
import * as os from 'os';
import { PHPStackManager } from './serverManager';

let statusBarItem: vscode.StatusBarItem;
let phpManager = new PHPStackManager();
let isRunning = false;

export function activate(context: vscode.ExtensionContext) {
    
    // Commande pour DÉMARRER
    let startCommand = vscode.commands.registerCommand('phive.startServer', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        
        if (!workspaceFolders) {
            vscode.window.showErrorMessage("Open a folder or a PHP project first!");
            return;
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        const ip = getLocalIPv4();
        const port = 8000; // Plus tard, on utilisera portfinder ici

        // Lancer le serveur
        phpManager.start(rootPath, "0.0.0.0", port);
        
        isRunning = true;
        updateStatusBar();
        
        vscode.window.showInformationMessage(`Phive is online ! IP WiFi: ${ip}:${port}`);
    });

    // Commande pour ARRÊTER
    let stopCommand = vscode.commands.registerCommand('phive.stopServer', () => {
        phpManager.stop();
        isRunning = false;
        updateStatusBar();
    });

    // Initialisation du bouton
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    updateStatusBar();
    statusBarItem.show();

    context.subscriptions.push(startCommand, stopCommand, statusBarItem);
}

function updateStatusBar() {
    if (!isRunning) {
        statusBarItem.text = `$(play) Phive: Go Live`;
        statusBarItem.command = 'phive.startServer';
        statusBarItem.backgroundColor = undefined;
        statusBarItem.tooltip = "Launch the Phive PHP server";
    } else {
        statusBarItem.text = `$(primitive-square) Phive: Stop`;
        statusBarItem.command = 'phive.stopServer';
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        statusBarItem.tooltip = "Stop the server";
    }
}

function getLocalIPv4(): string {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]!) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

export function deactivate() {
    phpManager.stop();
}