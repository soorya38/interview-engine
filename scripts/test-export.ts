
import { storage } from "../server/storage";

async function main() {
    try {
        console.log("Testing getExportData('all')...");
        const data = await storage.getExportData("all");
        console.log("Success!", data.length, "rows");
        if (data.length > 0) {
            console.log("Sample:", data[0]);
        }
    } catch (e) {
        console.error("Error:", e);
    }
    process.exit(0);
}

main();
