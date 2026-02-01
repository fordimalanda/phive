import * as cp from 'child_process';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class PHPStackManager {
    private _process: cp.ChildProcess | undefined;
    private _outputChannel: vscode.OutputChannel;
    private _routerPath: string | undefined;

    constructor() {
        this._outputChannel = vscode.window.createOutputChannel("Phive Server Logs");
    }

    /**
     * Démarre le serveur PHP avec un routeur personnalisé pour le Live Reload
     */
    public start(rootPath: string, host: string, port: number, wsPort: number, ip: string) {
        this.stop(); // Sécurité : On arrête un éventuel serveur déjà lancé

        this._outputChannel.clear();
        this._outputChannel.show();
        this._outputChannel.appendLine(`[Phive] Attempting to start on http://${ip}:${port}`);

        // 1. Script JS à injecter dans les pages HTML/PHP
        const injectionScript = `
        <script>
            (function() {
                const socket = new WebSocket('ws://${ip}:${wsPort}');
                socket.onmessage = (msg) => { 
                    if (msg.data === 'reload') {
                        console.log('Phive: Reloading...');
                        window.location.reload(); 
                    }
                };
                socket.onopen = () => console.log('Phive: Live Reload Connected');
                socket.onerror = () => console.error('Phive: Live Reload Connection Error');
            })();
        </script>`.replace(/\n/g, ''); // On retire les retours à la ligne pour l'injection

        // 2. Création du fichier Router PHP temporaire
        // Ce script intercepte les requêtes pour injecter le JS avant d'envoyer la page
        this._routerPath = path.join(rootPath, '.phive_router.php');
        const routerContent = `<?php
        $path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
        $file = __DIR__ . $path;

        if (is_dir($file)) {
            $file = rtrim($file, "/") . "/index.php";
        }

        if (file_exists($file) && pathinfo($file, PATHINFO_EXTENSION) === "php") {
            ob_start();
            include $file;
            $content = ob_get_clean();
            // Injecte le script juste avant la balise de fermeture body
            if (strpos($content, '</body>') !== false) {
                echo str_replace("</body>", "${injectionScript}</body>", $content);
            } else {
                echo $content . "${injectionScript}";
            }
        } else {
            // Laisse le serveur PHP gérer les fichiers statiques (images, css, js originaux)
            return false;
        }
        `;

        try {
            fs.writeFileSync(this._routerPath, routerContent);
        } catch (err) {
            vscode.window.showErrorMessage(`Failed to create router file: ${err}`);
            return;
        }

        // 3. Lancer le serveur PHP Built-in
        this._process = cp.spawn('php', ['-S', `${host}:${port}`, this._routerPath], {
            cwd: rootPath
        });

        this._outputChannel.appendLine(`[Phive] Server started: http://${ip}:${port}`);

        // Capturer les logs de sortie et d'erreur
        this._process.stderr?.on('data', (data) => {
            this._outputChannel.append(data.toString());
        });

        this._process.stdout?.on('data', (data) => {
            this._outputChannel.append(data.toString());
        });

        // Nettoyage à la fermeture
        this._process.on('close', (code) => {
            this._outputChannel.appendLine(`[Phive] Server stopped (Code: ${code})`);
            this._cleanup();
        });

        this._process.on('error', (err) => {
            vscode.window.showErrorMessage(`PHP Error: ${err.message}. Ensure PHP is in your PATH.`);
            this._cleanup();
        });
    }

    /**
     * Arrête le processus PHP et nettoie les fichiers temporaires
     */
    public stop() {
        if (this._process) {
            this._process.kill();
            this._process = undefined;
            vscode.window.showInformationMessage("Phive server stopped.");
        }
        this._cleanup();
    }

    /**
     * Supprime le fichier router temporaire
     */
    private _cleanup() {
        if (this._routerPath && fs.existsSync(this._routerPath)) {
            try {
                fs.unlinkSync(this._routerPath);
            } catch (e) {
                console.error("Failed to delete router file", e);
            }
        }
    }
}