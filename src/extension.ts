import * as vscode from 'vscode';
import * as portfinder from 'portfinder';
import * as open from 'open';
import { PHPStackManager } from './serverManager';
import { LiveReloadServer } from './liveReload';
import { getLocalIPv4 } from './networkUtils'; // On importe notre utilitaire ici

let statusBarItem: vscode.StatusBarItem;
let phpManager = new PHPStackManager();
let lrServer = new LiveReloadServer();
let isRunning = false;

export function activate(context: vscode.ExtensionContext) {
    
    let startCommand = vscode.commands.registerCommand('phive.startServer', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage("Veuillez ouvrir un dossier de projet.");
            return;
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        const ip = getLocalIPv4(); // Utilisation de la fonction exportée

        try {
            const phpPort = await portfinder.getPortPromise({ port: 8000 });
            const wsPort = await portfinder.getPortPromise({ port: 9001 });

            lrServer.start(wsPort);
            phpManager.start(rootPath, "0.0.0.0", phpPort, wsPort, ip);
            
            isRunning = true;
            updateStatusBar();

            const url = `http://localhost:${phpPort}`;
            open(url);

            vscode.window.showInformationMessage(`Phive : Connectez votre mobile sur http://${ip}:${phpPort}`);
        } catch (err) {
            vscode.window.showErrorMessage("Erreur Phive : " + err);
        }
    });

    let stopCommand = vscode.commands.registerCommand('phive.stopServer', () => {
        phpManager.stop();
        lrServer.stop();
        isRunning = false;
        updateStatusBar();
    });

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
    } else {
        statusBarItem.text = `$(primitive-square) Phive: Stop`;
        statusBarItem.command = 'phive.stopServer';
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    }
}

export function deactivate() {
    phpManager.stop();
    lrServer.stop();
}