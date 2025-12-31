import { promises as fs } from "fs"

export class TZConfig {
    address: string;
    port: number;
    apiKey: string | null;
    encryptionKey: string | null;
    gunzip: boolean;

    private constructor(address: string, port: number, apiKey: string, encryptionKey?: string) {
        this.address = address;
        this.port = port;
        this.apiKey = apiKey;
        this.gunzip = false;
        this.encryptionKey = encryptionKey ? encryptionKey : null;
    }

    public static async load(path: string): Promise<TZConfig | null> {
        const data = await fs.readFile(path, 'utf8');
        if(!data) return null;
        try {
            return JSON.parse(data) as TZConfig;
        } catch (e: any) {
            return null;
        }
    }
}