// Etap 4 (SPEC 11.2): generator Przejdź bez grafiki. 200 seedów × 300 rzędów:
// zawsze istnieje droga przez trawę (BFS), reguły grup, bramki co 25 rzędów, ≥ 4 wolne pola na trawie.
import fs from "fs";
import vm from "vm";
const src = fs.readFileSync(new URL("../../../gry.js", import.meta.url), "utf8");
const ctx = { performance, console }; ctx.window = ctx; vm.createContext(ctx); vm.runInContext(src, ctx);
const N = 300, COLS = 9, bledy = [];
for (let seed = 1; seed <= 200; seed++) {
  const rows = ctx.SKROT_GRY._gen(seed, N);
  const solid = (k) => k === "trawa" || k === "bramka";
  // BFS po polach: trawa/bramka tylko wolne pola, ulica/tory/rzeka – wszystkie kolumny
  const seen = rows.map(() => new Array(COLS).fill(false)), q = [[0, 4]]; seen[0][4] = true; let max = 0;
  while (q.length) {
    const [r, c] = q.shift(); max = Math.max(max, r);
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const r2 = r + dr, c2 = c + dc;
      if (r2 < 0 || r2 >= N || c2 < 0 || c2 >= COLS || seen[r2][c2]) continue;
      if (solid(rows[r2].kind) && rows[r2].trees[c2]) continue;
      seen[r2][c2] = true; q.push([r2, c2]);
    }
  }
  if (max < N - 1) bledy.push(`seed ${seed}: brak drogi dalej niż rząd ${max}`);
  // reguły
  let prevGroup = null, cur = null;
  rows.forEach((x, r) => {
    if (r < 4 && (x.kind !== "trawa" || x.trees.some(Boolean))) bledy.push(`seed ${seed}: rząd ${r} startowy nie jest pustą trawą`);
    if (r >= 4 && r % 25 === 0 && (x.kind !== "bramka" || x.trees.some(Boolean))) bledy.push(`seed ${seed}: rząd ${r} powinien być pustą bramką`);
    if (x.kind !== "bramka" && r % 25 && solid(x.kind) && x.trees.filter((t) => !t).length < 4) bledy.push(`seed ${seed}: rząd ${r} ma < 4 wolne pola`);
    if (x.kind === "ulica" && x.items.some((it, i, a) => i && it.x - (a[i - 1].x + a[i - 1].len) < 80)) bledy.push(`seed ${seed}: rząd ${r} samochody bliżej niż 2 kratki`);
    if (x.kind === "rzeka" && (x.items.length < 1 || x.items.some((it) => it.len < 80 || it.len > 160))) bledy.push(`seed ${seed}: rząd ${r} złe kłody`);
  });
  // grupy: nigdy rzeka po rzece ani tory po torach (bramka nie przerywa grupy)
  const kinds = rows.map((x) => x.kind).filter((k) => k !== "bramka");
  for (let i = 1; i < kinds.length; i++) if (kinds[i] === "tory" && kinds[i - 1] === "tory") bledy.push(`seed ${seed}: tory po torach (indeks ${i})`);
  const groups = []; for (const k of kinds) if (!groups.length || groups.at(-1).k !== k || k === "tory") groups.push({ k, n: 1 }); else groups.at(-1).n++;
  if (groups.some((g) => g.k === "rzeka" && g.n > 3)) bledy.push(`seed ${seed}: grupa rzeki dłuższa niż 3 rzędy (dwie grupy obok siebie)`);
}
console.log(bledy.length ? bledy.slice(0, 20).join("\n") : "✓ 200 seedów × 300 rzędów: droga zawsze istnieje, reguły generatora spełnione");
process.exit(bledy.length ? 1 : 0);
