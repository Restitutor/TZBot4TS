import dgram from "dgram"
import {TZRequest} from "./TZRequest.js";
import {TZResponse} from "./TZResponse.js";
import {TZConfig} from "../config/TZConfig.js";
import {TZFlag} from "../config/TZFlag.js";
import {decode, encode} from "@msgpack/msgpack";
import {gunzip, gzip} from "zlib";
import {promisify} from "util";
import {AES256Factory} from "../crypto/AES256Factory.js";

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export class TZBot {
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
        const headerLen = flags.length + 3;
        const header = Buffer.alloc(headerLen);

        let payloadBytes: Buffer = Buffer.from(JSON.stringify(payload));

        header[0] = "t".charCodeAt(0);
        header[1] = "z".charCodeAt(0);
        header[2] = headerLen;

        const seen: Array<TZFlag> = []
        for (let i = 0; i < flags.length; i++) {
            // @ts-ignore
            if(seen.includes(flags[i])) continue;
            // @ts-ignore
            seen.push(flags[i]);
            if(flags[i] === TZFlag.ENCRYPT && this.aes == null) continue;
            // @ts-ignore
            header[3 + i] = flags[i].charCodeAt(0)
        }


        if(flags.includes(TZFlag.MSGPACK)) {
            payloadBytes = Buffer.from(encode(payload))
        }
        if(flags.includes(TZFlag.GUNZIP)) {
            payloadBytes = await gzipAsync(payloadBytes)
        }
        if(flags.includes(TZFlag.ENCRYPT) && this.aes) {
            payloadBytes = this.aes.encrypt(payloadBytes);
        }

        return Buffer.concat([
            header,
            payloadBytes
        ]);
    }

    private async rebuildFromFlags(response: Buffer): Promise<TZResponse | null> {
        if(response.length < 3) return null;
        // @ts-ignore
        if(String.fromCharCode(response[0]) !== "t" || String.fromCharCode(response[1]) !== "z" || response[2] < 3) return null;

        const header = response.slice(0, response[2]);
        let body: Buffer = response.slice(response[2] as number);

        const headerLen = response[2];

        const flags: TZFlag[] = [];
        // @ts-ignore
        for(let i = 3; i < headerLen; i++) {
            // @ts-ignore
            const currentFlag = TZFlag.fromValue(header[i]);
            if(currentFlag == null) return null;
            flags.push(currentFlag)
        }

        if(flags.includes(TZFlag.ENCRYPT)) {
            if(this.aes === null) return null;
            body = this.aes.decrypt(body);
        }
        if(flags.includes(TZFlag.GUNZIP)) {
            body = await gunzipAsync(body)
        }
        if(flags.includes(TZFlag.MSGPACK)) {
            body = Buffer.from(JSON.stringify(decode(body)));
        }

        return JSON.parse(body.toString()) as TZResponse;
    }

    public async send(msg: TZRequest, ...flags: TZFlag[]): Promise<TZResponse | null> {
        msg.setAPIKey(this.apiKey ? this.apiKey : "");

        return new Promise(async (resolve, reject) => {
            const onMessage = async (msg: Buffer)=> {
                resolve(await this.rebuildFromFlags(msg))
            }
            const onError = (err: Error)=> {
                reject(err)
            }

            this.sock.once("message", onMessage);
            this.sock.once("error", onError);
            this.sock.send(await this.applyFlags(msg, ...flags), this.port, this.addr);
        });
    }

    public close() {
        this.sock.close();
    }
}