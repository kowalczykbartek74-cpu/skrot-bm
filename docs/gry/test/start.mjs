// Ekran startu (10.11.2026): nowy gość → żywa karta, jeden przycisk okresu próbnego, logowanie pod linkiem; wracający → od razu formularz.
import { chromium, page, BASE, OUT } from "./lib.mjs";
const b = await chromium.launch();
const fresh = async (opts) => { const p = await page(b, { konto: "brak", ...opts }); await p.addInitScript(() => { if (!sessionStorage.getItem("k-init")) { sessionStorage.setItem("k-init", "1"); localStorage.removeItem("bm-group"); localStorage.removeItem("bm-sub"); localStorage.setItem("skrot-rocznik","wefiz-bm-1-st-2026"); localStorage.setItem("skrot-kierunek","bm"); } }); return p; };
let bad=0; const ok=(t,v)=>{console.log((v?"OK  ":"BŁĄD")+" "+t); if(!v)bad++;};
for (const lang of ["pl","en"]) for (const w of [375, 1280]) {
  const p = await fresh({ lang, w, h: w>900?860:812 });
  await p.goto(BASE + "index.html"); await p.waitForSelector("#loginBox .lg-start .btn.primary");
  ok(`${lang} ${w}: start, bez formularza`, await p.locator("#loginBox input").count()===0);
  ok(`${lang} ${w}: bez poziomego przewijania`, await p.evaluate(()=>document.getElementById("login").scrollWidth<=innerWidth));
  await p.screenshot({ path:`${OUT}/start-${lang}-${w}.png`, fullPage:true });
  const live = p.locator(w>900?".lg-side .lg-live":".lg-live-m");
  ok(`${lang} ${w}: żywa karta widoczna`, await live.isVisible());
  await live.locator(".lg-live-a button").nth(1).click();
  ok(`${lang} ${w}: +10 XP i wyjaśnienie`, (await live.locator(".lg-live-top b").innerText())==="+10 XP" && await live.locator(".lg-live-why").isVisible());
  console.log("   cena:", await p.locator(".lg-trial-price").innerText());
  await p.screenshot({ path:`${OUT}/start-odp-${lang}-${w}.png`, fullPage:true });
  if (w>900) { await live.locator(".lg-live-go").click(); } else { await p.click("#loginBox .lg-start .btn.primary"); }
  await p.waitForSelector("#skrot-login-email");
  ok(`${lang} ${w}: po kliknięciu tryb próbny`, await p.evaluate(()=>localStorage.getItem("skrot-trial")==="1"));
  await p.screenshot({ path:`${OUT}/start-proba-${lang}-${w}.png`, fullPage:true });
  await p.locator("#loginBox .btn.ghost").last().click();
  await p.waitForSelector("#loginBox .lg-new");
  ok(`${lang} ${w}: zwykłe logowanie z linkiem do próby`, await p.locator("#loginBox [role=tablist]").isVisible());
  await p.screenshot({ path:`${OUT}/start-login-${lang}-${w}.png`, fullPage:true });
  await p.reload(); await p.waitForSelector("#loginBox input");
  ok(`${lang} ${w}: wracający widzi od razu logowanie`, await p.locator("#loginBox .lg-start").count()===0);
  if (lang==="en") { const t = await p.evaluate(()=>document.getElementById("login").innerText); const pl = t.match(/[ąćęłńóśźż][^\n]*/gi); ok("en: brak polskich tekstów", !pl || pl.every(x=>/Polski|zł/.test(x))); if(pl) console.log(pl); }
  ok(`${lang} ${w}: konsola bez błędów`, p.errors.length===0); if(p.errors.length) console.log(p.errors);
  await p.context().close();
}
// "Mam już konto" z ekranu startu
{ const p = await fresh({}); await p.goto(BASE+"index.html"); await p.waitForSelector("#loginBox .lg-start"); await p.click("#loginBox .lg-start .btn.ghost"); await p.waitForSelector("#skrot-login-email"); ok("Mam już konto → formularz", await p.locator("#loginBox h2").innerText()==="Zaloguj się"); 
  // zła odpowiedź
  await p.context().close(); }
{ const p = await fresh({}); await p.goto(BASE+"index.html"); await p.waitForSelector(".lg-live-m .lg-live-a button"); await p.locator(".lg-live-m .lg-live-a button").nth(0).click(); ok("zła odpowiedź: Prawie + poprawna zaznaczona", (await p.locator(".lg-live-m .lg-live-top b").innerText())==="Prawie" && await p.locator(".lg-live-m .lg-live-a button.ok").count()===1); await p.screenshot({path:`${OUT}/start-zle-375.png`,fullPage:true}); await p.context().close(); }
await b.close(); console.log(bad?`${bad} błędów`:"wszystko OK"); process.exit(bad?1:0);
