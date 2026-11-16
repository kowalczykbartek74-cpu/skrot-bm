// Składa raport.md rundy: pomiary (pomiar.mjs) + część automatyczna (kontrola.mjs) + wyniki testów.
// ETAP=1 RUNDA=1 TESTY=/tmp/ux-3/testy.txt node docs/audyt-ux/petla-3/raport.mjs
import fs from "fs";
import { execSync } from "child_process";
const E = process.env.ETAP, R = process.env.RUNDA;
const D = new URL(`./etap-${E}/runda-${R}/`, import.meta.url).pathname;
const pom = fs.existsSync(D + "pomiary.md") ? fs.readFileSync(D + "pomiary.md", "utf8") : "(brak pomiarów)";
const kon = execSync(`node ${new URL("./kontrola.mjs", import.meta.url).pathname}`, { encoding: "utf8" });
const log = fs.existsSync(D + "test-etapu.log") ? fs.readFileSync(D + "test-etapu.log", "utf8") : "";
const testy = process.env.TESTY && fs.existsSync(process.env.TESTY) ? fs.readFileSync(process.env.TESTY, "utf8") : "";
const last = log.trim().split("\n").pop();
const md = `${pom}
## Test etapu \`docs/gry/test/ux3-etap${E}.mjs\`: ${last}
\`\`\`
${log.trim()}
\`\`\`

## Pozostałe testy
${testy.trim() || "(brak)"}

# Część automatyczna
${kon}`;
fs.writeFileSync(D + "raport.md", md);
console.log(D + "raport.md");
