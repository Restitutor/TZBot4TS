import { promises as fs } from "fs"

export class TZConfig {
    address: string;
    port: number;
    apiKey: string | null;
    encryptionKey: string | null;
    gunzip: boolean;

    private constructor(address: string, port: number, apiKey: string, gunzip: boolean, encryptionKey?: string) {
        this.address = address;
        this.port = port;
        this.apiKey = apiKey;
        this.gunzip = gunzip;
        this.encryptionKey = encryptionKey ? encryptionKey : null;
    }

    public static async load(path: string): Promise<TZConfig | null> {
        try {
            const fileContent = await fs.readFile(path, 'utf8');
            if (!fileContent) return null;

            const raw = JSON.parse(fileContent);

            // Basic validation
            if (typeof raw.address !== 'string' || typeof raw.port !== 'number') {
                return null;
            }

            return new TZConfig(
                raw.address,
                raw.port,
                typeof raw.apiKey === 'string' ? raw.apiKey : "", // Default to empty if missing/invalid, or could fail. Treating as nullable in class but constructor expects string.
                typeof raw.gunzip === 'boolean' ? raw.gunzip : false,
                typeof raw.encryptionKey === 'string' ? raw.encryptionKey : undefined
            );
        } catch (e: any) {
            return null;
        }
    }
}