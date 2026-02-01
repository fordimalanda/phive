import * as os from 'os';

/**
 * Récupère l'adresse IPv4 locale (WiFi ou LAN) de la machine.
 * Retourne '127.0.0.1' si aucune connexion réseau n'est trouvée.
 */
export function getLocalIPv4(): string {
    const interfaces = os.networkInterfaces();
    
    for (const name of Object.keys(interfaces)) {
        const networkInterface = interfaces[name];
        if (!networkInterface) continue;

        for (const iface of networkInterface) {
            // On cherche une adresse IPv4 qui n'est pas "interne" (loopback)
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    
    return '127.0.0.1';
}