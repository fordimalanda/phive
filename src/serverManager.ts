import * as cp from 'child_process';
import * as vscode from 'vscode';

export class PHPStackManager {
    private _process: cp.ChildProcess | undefined;
    private _outputChannel: vscode.OutputChannel;

    constructor() {
        this._outputChannel = vscode.window.createOutputChannel("Phive Server Logs");
    }

    public start(rootPath: string, host: string, port: number) {
        this._outputChannel.clear();
        this._outputChannel.show();
        this._outputChannel.appendLine(`[Phive] Attempting to start on http://${host}:${port}`);

        // On lance la commande : php -S 0.0.0.0:8000
        this._process = cp.spawn('php', ['-S', `${host}:${port}`], {
            cwd: rootPath // Dossier racine du projet ouvert
        });

        // Capturer les logs (requêtes, erreurs, etc.)
        this._process.stderr?.on('data', (data) => {
            const log = data.toString();
            this._outputChannel.append(`[Log] ${log}`);
        });

        this._process.on('close', (code) => {
            this._outputChannel.appendLine(`[Phive] Server stopped (Code: ${code})`);
        });

        this._process.on('error', (err) => {
            vscode.window.showErrorMessage(`PHP Error : ${err.message}. Check that PHP is installed.`);
        });
    }

    public stop() {
        if (this._process) {
            this._process.kill();
            this._process = undefined;
            vscode.window.showInformationMessage("Phive server down.");
        }
    }
}