import dgram from "dgram"
import { TZRequest } from "./TZRequest.js";
import { TZResponse } from "./TZResponse.js";
import { TZConfig } from "../config/TZConfig.js";
import { TZFlag } from "../config/TZFlag.js";
import { decode, encode } from "@msgpack/msgpack";
import { gunzip, gzip } from "zlib";
import { promisify } from "util";
import { AES256Factory } from "../crypto/AES256Factory.js";

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export class TZBot implements Disposable {
    private sock: dgram.Socket;
    private readonly apiKey: string | null;
    private readonly addr: string;
    private readonly port: number;
    private readonly aes: AES256Factory | null;

    constructor(config: TZConfig) {
        if (config.port < 0 || config.port > 65535) {
            throw new Error("Port must be an unsigned integer");
        }

        this.sock = dgram.createSocket("udp4");
        this.apiKey = config.apiKey;
        this.addr = config.address;
        this.port = config.port;
        this.aes = config.encryptionKey ? new AES256Factory(config.encryptionKey) : null;
    }

    private async applyFlags(payload: TZRequest, ...flags: TZFlag[]): Promise<Buffer> {
        // Deduplicate flags first
        const uniqueFlags = [...new Set(flags)];

        // Validate Encryption Invariant
        if (uniqueFlags.includes(TZFlag.ENCRYPT) && !this.aes) {
            throw new Error("Cannot encrypt: No encryption key configured");
        }

        const headerLen = uniqueFlags.length + 3;
        const header = Buffer.alloc(headerLen);

        let payloadBytes: Buffer = Buffer.from(JSON.stringify(payload));

        header[0] = "t".charCodeAt(0);
        header[1] = "z".charCodeAt(0);
        header[2] = headerLen;

        for (let i = 0; i < uniqueFlags.length; i++) {
            header[3 + i] = uniqueFlags[i].charCodeAt(0)
        }


        if (uniqueFlags.includes(TZFlag.MSGPACK)) {
            payloadBytes = Buffer.from(encode(payload))
        }
        if (uniqueFlags.includes(TZFlag.GUNZIP)) {
            payloadBytes = await gzipAsync(payloadBytes)
        }
        if (uniqueFlags.includes(TZFlag.ENCRYPT) && this.aes) {
            payloadBytes = this.aes.encrypt(payloadBytes);
        }

        return Buffer.concat([
            header,
            payloadBytes
        ]);
    }

    private async rebuildFromFlags(response: Buffer): Promise<TZResponse | null> {
        if (response.length < 3) return null;
        // @ts-ignore
        if (String.fromCharCode(response[0]) !== "t" || String.fromCharCode(response[1]) !== "z" || response[2] < 3) return null;

        const header = response.slice(0, response[2]);
        let body: Buffer = response.slice(response[2] as number);

        const headerLen = response[2];

        const flags: TZFlag[] = [];
        // @ts-ignore
        for (let i = 3; i < headerLen; i++) {
            // @ts-ignore
            const currentFlag = TZFlag.fromValue(header[i]);
            if (currentFlag == null) return null;
            flags.push(currentFlag)
        }

        if (flags.includes(TZFlag.ENCRYPT)) {
            if (this.aes === null) return null;
            body = this.aes.decrypt(body);
        }
        if (flags.includes(TZFlag.GUNZIP)) {
            body = await gunzipAsync(body)
        }
        if (flags.includes(TZFlag.MSGPACK)) {
            body = Buffer.from(JSON.stringify(decode(body)));
        }

        return TZResponse.fromJSON(JSON.parse(body.toString()));
    }

    public async send(msg: TZRequest, ...flags: TZFlag[]): Promise<TZResponse | null> {
        msg.setAPIKey(this.apiKey ? this.apiKey : "");

        const { promise, resolve, reject } = Promise.withResolvers<TZResponse | null>();

        let onMessage: (msg: Buffer) => Promise<void>;
        let onError: (err: Error) => void;

        const cleanup = () => {
            this.sock.off("message", onMessage);
            this.sock.off("error", onError);
        };

        onMessage = async (msg: Buffer) => {
            try {
                resolve(await this.rebuildFromFlags(msg));
            } catch (e) {
                reject(e);
            } finally {
                cleanup();
            }
        };
        onError = (err: Error) => {
            reject(err);
            cleanup();
        };

        // Hook up listeners
        this.sock.once("message", onMessage);
        this.sock.once("error", onError);

        try {
            const payload = await this.applyFlags(msg, ...flags);
            this.sock.send(payload, this.port, this.addr, (err) => {
                if (err) {
                    onError(err);
                }
            });
        } catch (e) {
            reject(e as Error);
            cleanup();
        }

        return promise;
    }

    [Symbol.dispose](): void {
        this.close();
    }

    public close() {
        this.sock.close();
    }
}