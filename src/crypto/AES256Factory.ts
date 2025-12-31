import crypto from "crypto";

export class AES256Factory {
    #key: Buffer;

    constructor(key: string | Buffer) {
        if (typeof key === 'string') this.#key = Buffer.from(key);
        else this.#key = key;
    }

    public encrypt(msg: Buffer | string): Buffer {
        if (typeof msg === 'string') return this.encrypt(Buffer.from(msg));
        const iv = crypto.randomBytes(16)
        const cipher = crypto.createCipheriv("aes-256-cbc", this.#key, iv);

        return Buffer.concat([
            iv,
            cipher.update(msg),
            cipher.final()
        ]);
    }

    public decrypt(msg: Buffer): Buffer {
        const iv = msg.slice(0, 16);
        const ciphertext = msg.slice(16);
        const cipher = crypto.createDecipheriv("aes-256-cbc", this.#key, iv);

        return Buffer.concat([
            cipher.update(ciphertext),
            cipher.final()
        ]);
    }
}