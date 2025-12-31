
import { TZResponse } from "./net/TZResponse.js";
import { TZConfig } from "./config/TZConfig.js";
import { TZBot } from "./net/TZBot.js";
import { TZFlag } from "./config/TZFlag.js";
import { AES256Factory } from "./crypto/AES256Factory.js";
import { PingData } from "./net/data/RequestData.js";
import fs from "fs/promises";

async function verify() {
    console.log("--- Verifying TZResponse Logic ---");
    const r200 = new TZResponse(200, "OK");
    const r300 = new TZResponse(300, "Redirect");
    const r404 = new TZResponse(404, "Not Found");
    const r20 = new TZResponse(20, "Short");

    console.log(`200 OK: ${r200.isSuccessful()} (Expect true)`);
    console.log(`300 Redirect: ${r300.isSuccessful()} (Expect true)`);
    console.log(`404 Not Found: ${r404.isSuccessful()} (Expect false)`);
    console.log(`20 Short: ${r20.isSuccessful()} (Expect false)`);

    if (r200.isSuccessful() && r300.isSuccessful() && !r404.isSuccessful() && !r20.isSuccessful()) {
        console.log("✅ TZResponse logic fixed");
    } else {
        console.error("❌ TZResponse logic FAILED");
    }

    console.log("\n--- Verifying TZConfig Safety ---");
    const validConfigPath = "valid_config.json";
    const invalidConfigPath = "bad_config.json";

    await fs.writeFile(validConfigPath, JSON.stringify({ address: "127.0.0.1", port: 8080, apiKey: "123" }));
    await fs.writeFile(invalidConfigPath, JSON.stringify({ address: "127.0.0.1", port: "8080" })); // Port as string (invalid)

    const validConf = await TZConfig.load(validConfigPath);
    const invalidConf = await TZConfig.load(invalidConfigPath);

    if (validConf && !invalidConf) {
        console.log("✅ TZConfig safety check passed");
    } else {
        console.error(`❌ TZConfig safety FAILED. Valid: ${!!validConf}, Invalid: ${!invalidConf} (should be null)`);
    }

    await fs.unlink(validConfigPath);
    await fs.unlink(invalidConfigPath);


    console.log("\n--- Verifying TZBot Encryption Invariant ---");
    // Create a bot without encryption key
    // We need to bypass the private constructor of TZConfig or use load, but simpler to mock or use the one we loaded.

    if (validConf) {
        // Create bot with NO encryption key (validConf has none, apiKey is there but encryptionKey is undefined)
        const bot = new TZBot(validConf);
        const req = new PingData();

        try {
            await (bot as any).applyFlags(req, TZFlag.ENCRYPT); // Access private method for testing
            console.error("❌ Encryption check FAILED (Should have thrown)");
        } catch (e: any) {
            if (e.message.includes("Cannot encrypt")) {
                console.log("✅ Encryption invariant enforced (Threw Error)");
            } else {
                console.error(`❌ Encryption check FAILED (Threw wrong error: ${e.message})`);
            }
        }
        bot.close();
    }

    console.log("\n--- Verifying AES Privacy ---");
    const aes = new AES256Factory("mysecretkeymysecretkeymysecretkey"); // 32 chars
    if ((aes as any).key === undefined) {
        console.log("✅ Private field #key is not accessible as 'key'");
    } else {
        console.error("❌ 'key' property is still visible!");
    }

    console.log("\n--- Verification Complete ---");
}

verify().catch(console.error);
