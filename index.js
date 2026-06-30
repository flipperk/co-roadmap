/**
 * C&O Roadmap — Worker + KV Sync (all-in-one)
 * De app-HTML zit hierin ingebakken; daarnaast twee API-routes voor opslag in KV.
 */
const KV_NS = 'CO_ROADMAP_DATA';
const SK = 'co-roadmap-state';

const HTML = `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>C&O Roadmap — Brown Paper</title>
<style>
  :root{
    --bg:#f5f6f8; --panel:#ffffff; --ink:#1a2230; --ink-soft:#5b6675;
    --line:#e3e7ee; --line-strong:#cfd6e0; --shadow:0 1px 2px rgba(20,30,50,.06),0 4px 14px rgba(20,30,50,.06);
    --accent:#1f2a44;
    --p-hoog:#dc2626; --p-midden:#d97706; --p-laag:#16a34a;
    --cell:#fbfcfd; --cell-alt:#f3f5f8;
    --radius:10px;
    --lane-w:200px; --col-w:148px; --row-min:96px;
  }
  *{box-sizing:border-box}
  html,body{margin:0;height:100%}
  body{
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    color:var(--ink);background:var(--bg);font-size:13px;line-height:1.4;
    -webkit-font-smoothing:antialiased;display:flex;flex-direction:column;height:100vh;overflow:hidden;
  }
  /* ---------- Toolbar ---------- */
  header{
    flex:0 0 auto;background:var(--panel);border-bottom:1px solid var(--line-strong);
    padding:10px 16px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;box-shadow:var(--shadow);z-index:30;
  }
  .brand{display:flex;flex-direction:column;line-height:1.15;margin-right:6px}
  .brand b{font-size:15px;letter-spacing:-.01em}
  .brand span{font-size:11px;color:var(--ink-soft)}
  .spacer{flex:1 1 auto}
  .grp{display:flex;align-items:center;gap:6px}
  button.tb{
    appearance:none;border:1px solid var(--line-strong);background:#fff;color:var(--ink);
    padding:7px 11px;border-radius:8px;font-size:12.5px;cursor:pointer;font-weight:550;
    display:inline-flex;align-items:center;gap:6px;transition:.12s;white-space:nowrap;
  }
  button.tb:hover{border-color:#9fb0c6;background:#f7f9fc}
  button.tb:focus-visible{outline:2px solid #2563eb;outline-offset:1px}
  button.tb.primary{background:var(--accent);color:#fff;border-color:var(--accent)}
  button.tb.primary:hover{background:#2b3a5e}
  button.tb.on{background:#eef4ff;border-color:#2563eb;color:#1d4ed8}
  select.tb{appearance:none;border:1px solid var(--line-strong);background:#fff;padding:7px 26px 7px 10px;border-radius:8px;font-size:12.5px;cursor:pointer;
    background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%235b6675' fill='none' stroke-width='1.5'/%3E%3C/svg%3E");
    background-repeat:no-repeat;background-position:right 9px center}
  .hint{font-size:11px;color:var(--ink-soft);max-width:240px}
  /* ---------- Board ---------- */
  #scroller{flex:1 1 auto;overflow:auto;position:relative}
  #board{position:relative;min-width:max-content}
  .grid{display:grid;position:relative}
  /* header row */
  .corner{position:sticky;left:0;top:0;z-index:25;background:var(--panel);border-right:2px solid var(--line-strong);border-bottom:1px solid var(--line-strong)}
  .yearhead,.periodhead{position:sticky;top:0;z-index:20;background:var(--panel);border-bottom:1px solid var(--line-strong);text-align:center}
  .yearhead{border-left:1px solid var(--line);font-weight:700;font-size:11.5px;letter-spacing:.03em;color:var(--ink);padding:6px 0 2px}
  .periodhead{font-size:11px;color:var(--ink-soft);font-weight:600;padding:6px 4px;border-left:1px solid var(--line)}
  .periodhead.now{color:#1d4ed8}
  .yearhead.continu{color:var(--ink-soft)}
  /* lane label */
  .lane-label{
    position:sticky;left:0;z-index:15;background:var(--panel);border-right:2px solid var(--line-strong);
    border-bottom:1px solid var(--line);padding:10px 12px 10px 14px;display:flex;flex-direction:column;gap:5px;justify-content:flex-start;
  }
  .lane-label .ltop{display:flex;align-items:center;gap:8px}
  .lane-dot{width:11px;height:11px;border-radius:3px;flex:0 0 auto}
  .lane-name{font-weight:650;font-size:12.5px;letter-spacing:-.01em;cursor:text;border-radius:4px;padding:1px 3px;margin:-1px -3px}
  .lane-name:hover{background:#f0f3f8}
  .lane-meta{font-size:10.5px;color:var(--ink-soft);display:flex;gap:8px;align-items:center;padding-left:1px}
  .lane-eyebrow{font-size:8.5px;font-weight:750;letter-spacing:.08em;text-transform:uppercase;color:#9aa6b5}
  .lane-owner{font-size:10px;color:var(--ink-soft);font-style:italic;padding-left:1px;margin-top:-1px}
  .lane-adviseur{font-size:10px;color:#475569;display:flex;align-items:center;gap:4px;margin-top:2px;font-weight:550}
  .lane-adviseur .adv-ico{color:#94a3b8;font-size:11px}
  .popmenu{position:fixed;z-index:80;width:240px;background:#fff;border:1px solid var(--line-strong);border-radius:10px;box-shadow:0 10px 30px rgba(20,30,50,.2);padding:5px;display:flex;flex-direction:column}
  .popmenu .pm-head{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-soft);padding:6px 8px 4px}
  .popmenu .pm-item{text-align:left;border:none;background:#fff;padding:7px 8px;border-radius:7px;cursor:pointer;font-size:12.5px;color:var(--ink);display:flex;align-items:center;gap:6px}
  .popmenu .pm-item:hover{background:#f0f4fb}
  .popmenu .pm-item.sel{background:#eef4ff;font-weight:600}
  .popmenu .pm-check{margin-left:auto;color:#2563eb}
  .popmenu .pm-note{margin-left:auto;font-size:10px;color:#b6c0cf;font-style:italic}
  .popmenu .pm-clear{color:#c0392b}
  .popmenu .pm-clear:hover{background:#fdf3f2}
  .lane-label.kind-directeur{background:linear-gradient(90deg,#eef4ff, #ffffff 60%);border-right-color:#2563eb}
  .lane-label.kind-directeur .lane-eyebrow{color:#2563eb}
  .lane-label.kind-perifeer{background:repeating-linear-gradient(135deg,#fbf8f1,#fbf8f1 7px,#f6f1e6 7px,#f6f1e6 14px)}
  .lane-label.kind-perifeer .lane-eyebrow{color:#b08236}
  .cell.perifeer{background-image:repeating-linear-gradient(135deg,transparent,transparent 9px,rgba(176,130,54,.05) 9px,rgba(176,130,54,.05) 18px)}
  .lane-load{height:5px;border-radius:3px;background:var(--line);overflow:hidden;width:100%;margin-top:2px}
  .lane-load i{display:block;height:100%;border-radius:3px}
  .lane-tools{display:flex;gap:4px;margin-top:2px;opacity:0;transition:.12s}
  .lane-label:hover .lane-tools{opacity:1}
  .mini{border:1px solid var(--line-strong);background:#fff;border-radius:6px;font-size:10.5px;padding:2px 6px;cursor:pointer;color:var(--ink-soft)}
  .mini:hover{background:#f7f9fc;color:var(--ink)}
  /* cell */
  /* cell (legacy, niet meer gebruikt) */
  .cell{border-left:1px solid var(--line);border-bottom:1px solid var(--line);padding:7px 7px 6px;min-height:var(--row-min);display:flex;flex-direction:column;gap:6px;background:var(--cell)}
  /* timeline track + achtergrondkolommen */
  .lane-track{position:relative;border-bottom:1px solid var(--line)}
  .lane-bg{position:absolute;inset:0;display:flex}
  .bgcell{flex:0 0 var(--col-w);border-left:1px solid var(--line);background:var(--cell)}
  .bgcell.alt{background:var(--cell-alt)}
  .bgcell.continu{background:#fcfbf6}
  .bgcell.dragover{background:#eaf2ff;box-shadow:inset 0 0 0 2px #93b4f6}
  .lane-track.perifeer .bgcell{background-image:repeating-linear-gradient(135deg,transparent,transparent 9px,rgba(176,130,54,.05) 9px,rgba(176,130,54,.05) 18px)}
  /* Gantt-balk */
  .bar{position:absolute;background:#fff;border:1px solid var(--line-strong);border-left:4px solid var(--lane-c,#888);
    border-radius:8px;padding:6px 9px;cursor:pointer;box-shadow:0 1px 1px rgba(20,30,50,.05);
    overflow:hidden;z-index:6;display:flex;flex-direction:column;gap:3px;transition:box-shadow .12s}
  .bar:hover{box-shadow:0 3px 12px rgba(20,30,50,.16);z-index:7}
  .bar.dragging{opacity:.4}
  .bar .ttl{font-weight:600;font-size:11.4px;line-height:1.22;color:var(--ink);letter-spacing:-.005em;
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .thema.range{background:#e7effb;color:#2557a7;font-weight:600}
  body.dragbar .bar{pointer-events:none}
  .cell.alt{background:var(--cell-alt)}
  .cell.dragover{background:#eaf2ff;box-shadow:inset 0 0 0 2px #93b4f6}
  .cell.continu{background:#fcfbf6}
  /* card */
  .card{
    background:#fff;border:1px solid var(--line-strong);border-left:4px solid var(--lane-c,#888);
    border-radius:8px;padding:7px 8px 7px;cursor:pointer;box-shadow:0 1px 1px rgba(20,30,50,.05);
    position:relative;transition:transform .08s, box-shadow .12s;font-size:11.6px;
  }
  .card:hover{box-shadow:0 2px 10px rgba(20,30,50,.13);transform:translateY(-1px)}
  .card.dragging{opacity:.4}
  .card.linksel{box-shadow:0 0 0 2px #2563eb,0 2px 10px rgba(37,99,235,.25)}
  .card .ttl{font-weight:600;line-height:1.28;color:var(--ink);letter-spacing:-.005em}
  .card .row{display:flex;align-items:center;gap:6px;margin-top:5px;flex-wrap:wrap}
  .pill{font-size:9.5px;font-weight:650;padding:1px 6px;border-radius:20px;letter-spacing:.02em;text-transform:uppercase}
  .prio{display:inline-flex;align-items:center;gap:3px;font-size:10px;color:var(--ink-soft);font-weight:600}
  .prio i{width:7px;height:7px;border-radius:50%}
  .lead{font-size:10px;color:var(--ink-soft);font-weight:600}
  .thema{font-size:9.5px;color:#5b6675;background:#eef1f6;padding:1px 6px;border-radius:5px}
  .linkbadge{position:absolute;top:-6px;right:-6px;background:#2563eb;color:#fff;border-radius:50%;width:16px;height:16px;font-size:9.5px;display:none;align-items:center;justify-content:center;font-weight:700}
  .card.haslinks .linkbadge{display:flex}
  /* SVG connections */
  #wires{position:absolute;top:0;left:0;pointer-events:none;z-index:5;overflow:visible}
  #wires path{fill:none;stroke:#8aa0c2;stroke-width:1.6;opacity:.85}
  #wires path.hot{stroke:#2563eb;stroke-width:2.2;opacity:1}
  /* link mode banner */
  #linkbanner{position:fixed;left:50%;transform:translateX(-50%);bottom:20px;background:var(--accent);color:#fff;
    padding:9px 16px;border-radius:30px;font-size:12.5px;display:none;align-items:center;gap:12px;z-index:50;box-shadow:0 6px 24px rgba(0,0,0,.25)}
  #linkbanner b{font-weight:700}
  #linkbanner button{background:rgba(255,255,255,.18);border:none;color:#fff;border-radius:20px;padding:4px 12px;cursor:pointer;font-size:12px}
  /* ---------- Drawer ---------- */
  #drawer{position:fixed;top:0;right:0;height:100%;width:380px;max-width:92vw;background:var(--panel);
    box-shadow:-8px 0 30px rgba(20,30,50,.18);transform:translateX(100%);transition:transform .22s cubic-bezier(.4,0,.2,1);z-index:60;display:flex;flex-direction:column}
  #drawer.open{transform:translateX(0)}
  .dr-head{padding:16px 18px 12px;border-bottom:1px solid var(--line);display:flex;align-items:flex-start;gap:10px}
  .dr-head h3{margin:0;font-size:14px;flex:1}
  .iconbtn{border:none;background:#f0f3f8;border-radius:7px;width:30px;height:30px;cursor:pointer;font-size:16px;color:var(--ink-soft);flex:0 0 auto}
  .iconbtn:hover{background:#e5eaf2;color:var(--ink)}
  .dr-body{padding:14px 18px;overflow:auto;flex:1}
  .fld{margin-bottom:13px}
  .fld label{display:block;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--ink-soft);margin-bottom:4px}
  .fld input,.fld select,.fld textarea{width:100%;border:1px solid var(--line-strong);border-radius:8px;padding:8px 10px;font-size:13px;font-family:inherit;color:var(--ink);background:#fff}
  .fld textarea{min-height:88px;resize:vertical;line-height:1.45}
  .fld input:focus,.fld select:focus,.fld textarea:focus{outline:2px solid #2563eb;outline-offset:0;border-color:#2563eb}
  .two{display:flex;gap:10px}
  .two>.fld{flex:1}
  .links-box{border:1px solid var(--line);border-radius:8px;padding:8px;background:#fafbfd}
  .link-row{display:flex;align-items:center;gap:6px;font-size:11.5px;padding:3px 4px;border-radius:6px}
  .link-row:hover{background:#fff}
  .link-row .x{margin-left:auto;cursor:pointer;color:#b94a4a;font-weight:700;padding:0 4px}
  .link-row .d{width:8px;height:8px;border-radius:2px;flex:0 0 auto}
  .dr-foot{padding:12px 18px;border-top:1px solid var(--line);display:flex;gap:8px}
  .dr-foot button{flex:1;padding:9px;border-radius:8px;border:1px solid var(--line-strong);background:#fff;cursor:pointer;font-weight:600;font-size:12.5px}
  .dr-foot .del{color:#c0392b;border-color:#f1c9c4;background:#fdf3f2}
  .dr-foot .del:hover{background:#fbe7e4}
  .dr-foot .save{background:var(--accent);color:#fff;border-color:var(--accent)}
  /* misc */
  .empty-hint{color:#b6c0cf;font-size:10.5px;text-align:center;padding:8px 2px;font-style:italic}
  .legend{display:flex;gap:14px;align-items:center;font-size:11px;color:var(--ink-soft);flex-wrap:wrap}
  .legend .li{display:inline-flex;align-items:center;gap:5px}
  .legend i{width:8px;height:8px;border-radius:50%}
  #filebox{display:none}
  @media print{
    header,#linkbanner,.lane-tools,.hint,#filehint{display:none!important}
    body{height:auto;overflow:visible}
    #scroller{overflow:visible}
    .card{break-inside:avoid}
  }
</style>
</head>
<body>
<header>
  <div class="brand"><b>C&amp;O Roadmap</b><span>Brown Paper · governance &amp; activiteitenstromen</span></div>
  <div class="grp">
    <button class="tb primary" id="addItem">+ Activiteit</button>
    <button class="tb" id="addLane">+ Baan</button>
    <button class="tb" id="linkMode" title="Verbind twee activiteiten">↔ Verbinden</button>
  </div>
  <div class="grp legend" id="legend">
    <span class="li"><i style="background:var(--p-hoog)"></i>Hoog</span>
    <span class="li"><i style="background:var(--p-midden)"></i>Midden</span>
    <span class="li"><i style="background:var(--p-laag)"></i>Laag</span>
  </div>
  <div class="spacer"></div>
  <div id="sync-badge" style="font-size:12px;font-weight:600;color:var(--ink-soft);min-width:140px"></div>
  <div class="grp">
    <select class="tb" id="fPrio"><option value="">Alle prioriteiten</option><option value="hoog">Hoog</option><option value="midden">Midden</option><option value="laag">Laag</option></select>
    <button class="tb" id="exportBtn">↥ Exporteren</button>
    <button class="tb" id="importBtn">↧ Importeren</button>
    <button class="tb" id="printBtn">⎙ Print / PDF</button>
    <input type="file" id="filebox" accept="application/json">
  </div>
</header>

<div id="scroller">
  <div id="board">
    <svg id="wires"><defs>
      <marker id="arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.2" orient="auto">
        <path d="M0,0 L7,3.2 L0,6.4 Z" fill="#8aa0c2"/>
      </marker>
      <marker id="arrowhot" markerWidth="7" markerHeight="7" refX="6" refY="3.2" orient="auto">
        <path d="M0,0 L7,3.2 L0,6.4 Z" fill="#2563eb"/>
      </marker>
    </defs></svg>
    <div class="grid" id="grid"></div>
  </div>
</div>

<div id="linkbanner"><span><b>Verbindmodus</b> — klik op de bron, daarna op het doel.</span><button id="linkCancel">Stoppen</button></div>

<div id="drawer">
  <div class="dr-head"><h3 id="drTitle">Activiteit</h3><button class="iconbtn" id="drClose">×</button></div>
  <div class="dr-body" id="drBody"></div>
  <div class="dr-foot">
    <button class="del" id="drDelete">Verwijderen</button>
    <button class="save" id="drSave">Opslaan</button>
  </div>
</div>

<script>
"use strict";

/* ----------------------------------------------------------------
   PERIODES (kolommen)
-----------------------------------------------------------------*/
const YEARS = [
  {id:"2526", label:"’25/’26"},
  {id:"2627", label:"’26/’27"},
  {id:"2728", label:"’27/’28"},
];
const PERIODS = [{id:"continu", year:"continu", label:"Continu"}];
YEARS.forEach(y => ["p1","p2","p3","p4"].forEach(p =>
  PERIODS.push({id:\`\${y.id}-\${p}\`, year:y.id, label:p.toUpperCase()})
));
const NOW_PERIOD = "2526-p4"; // huidige periode-markering

// Beschikbare adviseurs (advies/borging, geen lijn)
const ADVISEURS = [
  "Daphne (onderwijskundige)",
  "Jana (onderwijskundige)",
  "Irene (onderwijskundige)",
  "Marco (business controller)",
  "Dimitri (adviseur technologie)",
  "Monique (M&O-adviseur)",
];

/* ----------------------------------------------------------------
   STARTDATA — banen (portefeuilles) en activiteiten uit het document
-----------------------------------------------------------------*/
const SEED = {
  lanes:[
    {id:"onderwijs",   name:"Visie, portfolio & vakinhoud",  color:"#2563eb", kind:"directeur", owner:"Directeur + onderwijskundige"},
    {id:"kwaliteit",   name:"Kwaliteit & examinering",       color:"#7c3aed", kind:"mt", owner:""},
    {id:"basis",       name:"Basisvaardigheden",             color:"#0891b2", kind:"mt", owner:""},
    {id:"bpvlob",      name:"BPV, LOB & studentbegeleiding",  color:"#059669", kind:"mt", owner:""},
    {id:"innovatie",   name:"Innovatie & technologie",       color:"#ea580c", kind:"mt", owner:"", adviseur:"Dimitri (adviseur technologie)"},
    {id:"hr",          name:"HR & professionalisering",      color:"#db2777", kind:"mt", owner:"", adviseur:""},
    {id:"voorlichting",name:"Voorlichting & werving",        color:"#0d9488", kind:"mt", owner:"", adviseur:""},
    {id:"bedrijf",     name:"Bedrijfsvoering & processen",   color:"#64748b", kind:"mt", owner:"", adviseur:"Marco (business controller)"},
    {id:"arbeidsmarkt",name:"Arbeidsmarkt & werkveldrelaties",color:"#b08236", kind:"perifeer", owner:"Ieke · Relatiemanager · geen MT"},
  ],
  items:[
    // Onderwijs, visie & portfolio
    {id:"i_visie", lane:"onderwijs", period:"2526-p4", title:"Visieontwikkeling: uitgangspunten vaststellen", lead:"Jana", prio:"hoog", thema:"Visie op onderwijs", detail:"Voorbereidende bijeenkomst 9 apr, 1e bijeenkomst 17 apr, 2e op 12 mei. Uitgangspunten vormen het kader voor verdere visieontwikkeling.", links:["i_doorvert"]},
    {id:"i_memobpv", lane:"onderwijs", period:"2526-p4", title:"Memo visie BPV", lead:"Wendy", prio:"midden", thema:"BPV / Visie", detail:"", links:[]},
    {id:"i_doorvert", lane:"onderwijs", period:"2627-p1", title:"Doorvertaling visie naar clusters", lead:"Jan / Erjan", prio:"hoog", thema:"Visie op onderwijs", detail:"Doorvertaling BBL-groep juni ’26, overige domeinen vanaf p1 ’26/’27. Retail (MCS) en Evenementen urgent(er) vanwege KD-wijzigingen. Voorkomen dat de visie een papieren tijger wordt.", links:["i_locshift"]},
    {id:"i_btg", lane:"onderwijs", period:"2526-p4", title:"BTG-dialoog bedrijfsleven & modularisering", lead:"Marianne", prio:"midden", thema:"Visie op onderwijs", detail:"Dialoog over modularisering, samenwerking en afstemming (kwalificatie)dossiers. Klaar juni ’26, maar nieuwe ontwikkelingen blijven volgen.", links:["i_visie"]},
    {id:"i_vaba", lane:"onderwijs", period:"2627-p2", title:"Wet Vaba — flexibilisering & urennormen", lead:"Irene", prio:"hoog", thema:"Inrichting onderwijs", detail:"Gepland aug ’26, mogelijk aug ’27. Flexibilisering, verlaging urennormen, betere aansluiting arbeidsmarkt.", links:["i_modulair"]},
    {id:"i_kdcomm", lane:"onderwijs", period:"2728-p4", title:"KD-wijziging cluster Commercie", lead:"Niek", prio:"midden", thema:"Visie op onderwijs", detail:"Vraagt ontwerpcapaciteit gedurende kalenderjaar 2027 t.b.v. schooljaar ’28/’29.", links:[]},
    {id:"i_kdhandel", lane:"onderwijs", period:"2728-p1", title:"KD-wijziging Ondernemer Handel", lead:"Marianne / Wendy", prio:"midden", thema:"Visie op onderwijs", detail:"", links:[]},
    {id:"i_ecom", lane:"onderwijs", period:"2627-p1", title:"E-commerce: pilot Almelo (klas 3)", lead:"Wendy / Erjan / Jana", prio:"midden", thema:"Onderwijsportfolio", detail:"Pilot ’26/’27, evaluatie feb 2027, daarna bespreking in MT.", links:[]},
    {id:"i_retailkader", lane:"onderwijs", period:"2728-p1", title:"Verbreding retail-/handelkader (SBB)", lead:"Marianne", prio:"midden", thema:"Kwalificatiestructuur", detail:"Opdracht SBB over inrichting KD's voor modulair werken en bredere opleidingen. Besluit verwacht 2027 — invloed op alle KD's.", links:[]},
    {id:"i_kdeven", lane:"onderwijs", period:"2728-p1", title:"KD Medewerker Evenementen wijzigt", lead:"Jana", prio:"midden", thema:"Onderwijsportfolio", detail:"Verwacht per 1 okt 2027. KD verandert niet, het gaat om de uitvoering.", links:[]},
    {id:"i_niveau2", lane:"onderwijs", period:"2627-p1", title:"Breder niveau 2 opleiding — advies", lead:"", prio:"midden", thema:"Onderwijsportfolio", detail:"Advies oktober ’26.", links:[]},
    {id:"i_portfolio", lane:"onderwijs", period:"2526-p4", title:"Portfolio-afspraken & teamvorming", lead:"", prio:"hoog", thema:"Onderwijsportfolio", detail:"Start teamvorming, gesprekken met collega's, besluit over formatie en bezetting, gezamenlijke ambitie, bedrijven informeren.", links:[]},
    {id:"i_vakinhoud", lane:"onderwijs", period:"continu", title:"Borging samenhang & actualiteit beroepsgerichte vakinhoud", lead:"Onderwijskundige", prio:"midden", thema:"Vakinhoud (borging)", detail:"Going concern, geen project. Bewaakt het beroepsgerichte vakmanschap en de KD-actualiteit over de teams heen. Bewust géén aparte MT-portefeuille: geborgd via de onderwijskundige, dicht bij visie/portfolio en bij de kwalificatiestructuur waar de inhoud feitelijk verandert.", links:[]},

    // Kwaliteit & examinering
    {id:"i_examsys", lane:"kwaliteit", period:"continu", title:"Eigen examensysteem C&O (POC)", lead:"Sander", prio:"hoog", thema:"Examinering", detail:"Vervangt commerciële providers ESS en SPL. Dekt 15 opleidingen, 7 teams, 5 locaties.", links:[]},
    {id:"i_examcie", lane:"kwaliteit", period:"2627-p3", title:"Positie examencommissie t.a.v. MCS", lead:"Examencommissie (Ronald & Daphne)", prio:"midden", thema:"Examinering", detail:"", links:[]},
    {id:"i_exameisennl", lane:"kwaliteit", period:"2728-p1", title:"Nieuwe exameneisen Nederlands", lead:"Sanne Meinders", prio:"laag", thema:"Inrichting onderwijs", detail:"Verwachte ingang schooljaar ’27/’28.", links:[]},
    {id:"i_dashboard", lane:"kwaliteit", period:"2627-p2", title:"Kwaliteitsdashboard & referentiewaardemodel", lead:"", prio:"midden", thema:"Kwaliteitszorg", detail:"Referentiewaardemodel tegen einde jaar door alle onderwijsteams ingevuld, gekoppeld aan teamactiviteitenplannen.", links:["i_refmt"]},
    {id:"i_refmt", lane:"kwaliteit", period:"2627-p2", title:"Referentiewaardemodel in MT invullen", lead:"", prio:"midden", thema:"Kwaliteitszorg", detail:"Ambities en standaarden definiëren, mogelijk in lijn met de visieontwikkeling.", links:[]},
    {id:"i_evalkw", lane:"kwaliteit", period:"2627-p2", title:"Evaluatie kwaliteitsinstrumenten", lead:"", prio:"midden", thema:"Kwaliteitszorg", detail:"Welke instrumenten (kwaliteitsmonitor, studentenenquêtes, JOB, feedback) zetten we in, welke zijn dienstig op college-niveau?", links:[]},
    {id:"i_verzuimmon", lane:"kwaliteit", period:"continu", title:"Verzuim- & uitvalmonitoring (dashboard)", lead:"", prio:"midden", thema:"Monitoring", detail:"Zicht op verzuim en VSV over de teams heen. Levert het beeld; de sturing op de uitkomst hoort bij studentbegeleiding, de keten/registratie bij bedrijfsvoering.", links:["i_uitval"]},

    // Basisvaardigheden
    {id:"i_themanl", lane:"basis", period:"continu", title:"Themagroep Nederlands", lead:"Wendy (coörd. Sanne Meinders)", prio:"midden", thema:"Taal — Nederlands", detail:"Team-overstijgend in gesprek. Examen­instrumenten afstemmen, beoordeling. Koppelen aan discussie over NT2.", links:[]},
    {id:"i_engels", lane:"basis", period:"continu", title:"Vakgroep Engels", lead:"Paul", prio:"laag", thema:"Taal — Engels", detail:"Vooral praktische vraagstukken.", links:[]},
    {id:"i_burger", lane:"basis", period:"2728-p1", title:"Burgerschap: vorming vs. onderwijs", lead:"Montse", prio:"laag", thema:"Burgerschap", detail:"Vanaf aug 2027 twee stromingen: burgerschapsvorming en burgerschapsonderwijs. Inrichting en examinering bepalen.", links:[]},
    {id:"i_basisorde", lane:"basis", period:"2627-p4", title:"Docenten burgerschap & basisvaardigheden op orde", lead:"", prio:"midden", thema:"Basisvaardigheden", detail:"", links:[]},

    // BPV, LOB & studentbegeleiding
    {id:"i_schoolwerk", lane:"bpvlob", period:"2526-p4", title:"Wet School naar Duurzaam Werk — impactanalyse", lead:"Irene", prio:"midden", thema:"LOB", detail:"Wet actief, ROC-breed voorzien. C&O bepaalt impact en hoe aan te sluiten.", links:[]},
    {id:"i_stagedis", lane:"bpvlob", period:"2526-p4", title:"Meldpunt stagediscriminatie", lead:"Niek", prio:"midden", thema:"BPV", detail:"Verhouden tot vertrouwenspersonen. Na platformoverleg terugkoppeling in MT en verwerking in stagegids.", links:[]},
    {id:"i_themalob", lane:"bpvlob", period:"continu", title:"Themagroep loopbaanoriëntatie", lead:"MT-portefeuille", prio:"midden", thema:"LOB", detail:"Opdracht, doel, belang en aansturing formuleren.", links:[]},
    {id:"i_studieloopbaan", lane:"bpvlob", period:"2627-p2", title:"Studieloopbaantraject aanpassen", lead:"", prio:"midden", thema:"LOB", detail:"O.a. rol-/taakverdeling SLB'r en loopbaandeskundige, en gevraagde scholing.", links:[]},
    {id:"i_samenwerk", lane:"bpvlob", period:"2627-p1", title:"Notitie samenwerking bedrijfsleven", lead:"Wendy", prio:"midden", thema:"BPV", detail:"Inventariseren wat we college-breed doen en voorstel hoe we het willen.", links:["i_arbeidsmarkt"]},
    {id:"i_uitval", lane:"bpvlob", period:"continu", title:"Sturing op verzuim & uitval (VSV)", lead:"", prio:"hoog", thema:"Studentbegeleiding", detail:"Uitkomsteigenaar: terugdringen van verzuim en voortijdig schoolverlaten via binding, begeleiding en SLB. Niet de keten/registratie (bedrijfsvoering) en niet de monitoring (kwaliteit), maar de sturing op het resultaat.", links:[]},
    {id:"i_llo", lane:"bpvlob", period:"continu", title:"Onderwijsagenda LLO (OCW)", lead:"? (te herbeleggen)", prio:"midden", thema:"LLO", detail:"Doorlopend thema vanuit OCW. Eigenaarschap te herbeleggen: Ieke stapt terug van de LLO-portefeuille; LLO/maatwerk ontstaat voortaan vanuit haar arbeidsmarktrelaties.", links:[]},

    // Innovatie & technologie
    {id:"i_et", lane:"innovatie", period:"continu", title:"Werkgroep Educatieve Technologie", lead:"Paul (coörd. Dimitri)", prio:"midden", thema:"ET", detail:"Nulmeting herfst 2025: basisniveau divers. Opdracht formuleren: vaardigheden, cursussen, best practices delen.", links:[]},
    {id:"i_ai", lane:"innovatie", period:"2627-p1", title:"AI in onderwijs — standpunt College", lead:"", prio:"midden", thema:"Innovatie", detail:"Vraag over standpunt College, bijv. t.a.v. 1000-urennorm.", links:[]},
    {id:"i_modulair", lane:"innovatie", period:"2627-p2", title:"Modulair onderwijs — definitie & implementatie", lead:"", prio:"midden", thema:"Innovatie", detail:"Definitie en implementatie als discussiepunt, incl. verwijzing naar nieuw 'opleidingshuis'.", links:[]},
    {id:"i_digitrans", lane:"innovatie", period:"2627-p2", title:"Digitale transitie ROC-breed", lead:"Paul (en Dimitri)", prio:"midden", thema:"ET", detail:"Focus op digitale vaardigheden collega's. Start p2 ’26/’27 met vragenlijst, daarna workshops.", links:[]},

    // HR & professionalisering
    {id:"i_profverm", lane:"hr", period:"2526-p4", title:"Professioneel vermogen per team", lead:"", prio:"midden", thema:"HR", detail:"Onderdeel van referentiewaardemodel per team. Koppeling kwaliteitszorg en investeren in medewerkers.", links:["i_spp"]},
    {id:"i_spp", lane:"hr", period:"2627-p1", title:"Strategische Personeelsplanning (SPP)", lead:"", prio:"midden", thema:"HR", detail:"", links:[]},
    {id:"i_cultuur", lane:"hr", period:"2526-p4", title:"Cultuur & aanspreekcultuur C&O", lead:"", prio:"hoog", thema:"HR / Cultuur", detail:"Gesprek over kernwaarden en kader voor teams. Onderzoek aanspreekcultuur op MT-agenda. Blauwdruk teamvorming/onboarding.", links:[]},

    // Voorlichting & werving
    {id:"i_internecomm", lane:"voorlichting", period:"2526-p4", title:"Interne communicatie transities", lead:"Kim / Michel", prio:"midden", thema:"Communicatie", detail:"Collega's blijven informeren over de voortgang; komen tot plan van aanpak.", links:[]},
    {id:"i_werving", lane:"voorlichting", period:"2627-p1", title:"Voorlichting/werving stroomlijnen", lead:"", prio:"midden", thema:"Werving", detail:"Stroomlijnen van voorlichtings- en wervingsactiviteiten binnen C&O.", links:[]},

    // Bedrijfsvoering & processen
    {id:"i_verzuim", lane:"bedrijf", period:"2627-p1", title:"Herinrichting verzuimketen", lead:"Paul", prio:"midden", thema:"Verzuim — keten & registratie", detail:"95% gereed, implementatie schooljaar ’26/’27. Ziekteverzuim en ongeoorloofd verzuim, meer uniformiteit, registratie en opvolging. Leverancier van de keten — de sturing op terugdringen ligt bij studentbegeleiding.", links:["i_uitval"]},
    {id:"i_hegi", lane:"bedrijf", period:"2526-p4", title:"HEGI-herindeling & verhuizing", lead:"Marianne", prio:"hoog", thema:"Huisvesting", detail:"Samenvoeging onderwijsplek in HEGI, verhuizing zomer (juli/aug). Voorbereiding in juni ’26.", links:[]},
    {id:"i_invoeg", lane:"bedrijf", period:"2627-p1", title:"Invoegtraject 2.0 — evaluatie", lead:"Daphne", prio:"hoog", thema:"Bedrijfsvoering", detail:"Evaluatie ROC-breed (rol Sander) en binnen C&O (rol Daphne). Overzicht ophalen en pva binnen C&O.", links:[]},
    {id:"i_locshift", lane:"bedrijf", period:"2627-p1", title:"Locatie- & inschrijvingsverschuivingen", lead:"", prio:"midden", thema:"Huisvesting", detail:"Geen nieuwe inschrijvingen Retail/Handel Enschede; verschuivingen naar Rijssen/HEGI; LLO-maatwerk naar Rijssen.", links:[]},
    {id:"i_rooster", lane:"bedrijf", period:"2728-p2", title:"Harmoniseren planning & roostering", lead:"", prio:"midden", thema:"Processen", detail:"Programma van eisen p1 ’26/’27, daarna aanbesteding. Eerst proces harmoniseren ROC-breed.", links:[]},
    {id:"i_enschede", lane:"bedrijf", period:"2728-p1", title:"Nieuwe locatie Enschede operationeel", lead:"", prio:"midden", thema:"Huisvesting", detail:"", links:[]},
    {id:"i_bekost", lane:"bedrijf", period:"2728-p2", title:"Nieuwe bekostiging", lead:"Marco", prio:"laag", thema:"Bedrijfsvoering", detail:"Verwacht per januari 2028.", links:[]},
    {id:"i_stratagenda", lane:"bedrijf", period:"2728-p2", title:"Nieuwe strategische ROC-agenda", lead:"", prio:"midden", thema:"Bedrijfsvoering", detail:"", links:[]},

    // Arbeidsmarkt & werkveldrelaties (Ieke — Relatiemanager, perifeer, geen MT)
    {id:"i_arbeidsmarkt", lane:"arbeidsmarkt", period:"2526-p4", title:"Onderzoek veranderende eisen arbeidsmarkt", lead:"Ieke", prio:"hoog", thema:"Arbeidsmarkt", detail:"Onderzoeksopdracht formuleren, o.m. als input voor visieontwikkeling.", links:["i_visie"]},
    {id:"i_amarktbeeld", lane:"arbeidsmarkt", period:"2627-p4", title:"Actueel arbeidsmarktbeeld domein Economie", lead:"Ieke", prio:"hoog", thema:"Arbeidsmarkt", detail:"Beoogd resultaat eind ’26/’27: een gedragen arbeidsmarktbeeld met variatie naar clusters, dat structureel wordt gebruikt in MT-besluiten.", links:["i_visie"]},
    {id:"i_netwerken", lane:"arbeidsmarkt", period:"continu", title:"Branche- & werkgeversnetwerken verbinden", lead:"Ieke", prio:"midden", thema:"Arbeidsmarkt", detail:"Regionaal netwerk opbouwen en bestendigen (MKB, Inretail, Inntwente, IKT). Bedrijven actief verbinden aan onderwijs en teams; hybride leeromgevingen stimuleren.", links:[]},
    {id:"i_amarktvertaling", lane:"arbeidsmarkt", period:"2627-p2", title:"Vertaling arbeidsmarkt → modulair/praktijkgericht aanbod", lead:"Ieke", prio:"midden", thema:"Arbeidsmarkt", detail:"Signalen uit de arbeidsmarkt vertalen naar flexibel, modulair en praktijkgericht onderwijs; MT en teams adviseren. LLO/maatwerk ontstaat logisch vanuit deze relaties.", links:["i_modulair","i_llo"]},
    {id:"i_amarktvaba", lane:"arbeidsmarkt", period:"2627-p1", title:"Coördinatie Wet Vaba / werkgroep niet-bekostigd onderwijs", lead:"Ieke", prio:"midden", thema:"Arbeidsmarkt", detail:"Overige opdracht (0,3 fte): coördinatie werkgroep O&K en deelname landelijke kopgroep MBO Raad MBO-MKB.", links:["i_vaba"]},
  ]
};

/* ----------------------------------------------------------------
   STATE + persistentie (localStorage + KV op Cloudflare)
-----------------------------------------------------------------*/
const STORE_KEY = "co_roadmap_v1";
const API_BASE = window.location.origin + '/api/roadmap';

// Gantt-geometrie (COLW moet --col-w in de CSS volgen)
const COLW = 148, BARH = 74, VGAP = 8, TOPPAD = 8, INSET = 5;
function pIndex(id){ return PERIODS.findIndex(p=>p.id===id); }
function perLabel(id){
  if(id==="continu") return "Continu";
  const p = PERIODS.find(x=>x.id===id); if(!p) return id;
  const y = YEARS.find(y=>y.id===p.year);
  return (y?y.label+" ":"") + p.label;
}
// Zet oude (één-periode) items om naar begin/eind, en bewaak geldige volgorde
function normalizeState(){
  if(!state || !state.items) return;
  state.items.forEach(it=>{
    if(!it.start) it.start = it.period || NOW_PERIOD;
    if(!it.end)   it.end   = it.period || it.start;
    if(pIndex(it.start)<0) it.start = NOW_PERIOD;
    if(pIndex(it.end)<0)   it.end   = it.start;
    if(pIndex(it.end) < pIndex(it.start)) it.end = it.start; // eind nooit vóór begin
    delete it.period;
  });
}

let state = load() || clone(SEED);
let syncStatus = 'idle'; // idle, loading, saving, saved, error

// Bij pagina-load: server-state ophalen en gebruiken
(async ()=>{
  try{
    syncStatus = 'loading';
    updateSyncStatus();
    const res = await fetch(API_BASE + '/load');
    const data = await res.json();
    if(data && (data.ok || data.success) && data.state){
      state = data.state; // Server-state wint van lokale cache
      syncStatus = 'saved';
    }else{
      syncStatus = 'idle'; // geen server-state, blijf bij lokaal
    }
  }catch(e){
    console.warn('Server load failed, using local:', e);
    syncStatus = 'idle';
  }
  updateSyncStatus();
  render();
})();

function clone(o){ return JSON.parse(JSON.stringify(o)); }
async function save(){
  // Lokaal bewaren
  try{ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }catch(e){/* artifact-sandbox */}
  // Server sync
  if(syncStatus !== 'error'){
    syncStatus = 'saving';
    updateSyncStatus();
    try{
      const res = await fetch(API_BASE + '/save', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({state}) });
      const data = await res.json();
      syncStatus = (data && (data.ok || data.success)) ? 'saved' : 'error';
    }catch(e){
      console.warn('Server save failed:', e);
      syncStatus = 'error';
    }
    updateSyncStatus();
  }
}
function updateSyncStatus(){
  const badge = document.getElementById('sync-badge');
  if(!badge) return;
  const icons = { idle:'', loading:'⟳', saving:'💾', saved:'✓', error:'⚠' };
  const labels = { idle:'', loading:'Laden…', saving:'Opslaan…', saved:'Gesynchroniseerd', error:'Sync mislukt' };
  const colors = { idle:'', loading:'#2563eb', saving:'#2563eb', saved:'#16a34a', error:'#c0392b' };
  badge.textContent = icons[syncStatus] + (labels[syncStatus]?' '+labels[syncStatus]:'');
  badge.style.color = colors[syncStatus] || 'var(--ink-soft)';
}
function load(){
  try{ const s = localStorage.getItem(STORE_KEY); return s ? JSON.parse(s) : null; }catch(e){ return null; }
}
function uid(){ return "i_"+Math.random().toString(36).slice(2,9); }
function laneById(id){ return state.lanes.find(l=>l.id===id); }
function itemById(id){ return state.items.find(i=>i.id===id); }

/* ----------------------------------------------------------------
   FILTER
-----------------------------------------------------------------*/
let filterPrio = "";
function visibleItems(){ return state.items.filter(i => !filterPrio || i.prio===filterPrio); }

/* ----------------------------------------------------------------
   RENDER GRID
-----------------------------------------------------------------*/
const grid = document.getElementById("grid");
const wires = document.getElementById("wires");
const scroller = document.getElementById("scroller");

function buildGridTemplate(){
  grid.style.gridTemplateColumns = \`var(--lane-w) repeat(\${PERIODS.length}, var(--col-w))\`;
}

function render(){
  normalizeState();
  buildGridTemplate();
  grid.querySelectorAll(".cell,.lane-track,.lane-label,.corner,.yearhead,.periodhead").forEach(n=>n.remove());

  // --- header: corner + year band + period row ---
  const corner = document.createElement("div");
  corner.className = "corner";
  corner.style.gridRow = "1 / span 2"; corner.style.gridColumn = "1";
  grid.appendChild(corner);

  // year band (row 1)
  let col = 2;
  // group periods by year
  const groups = [];
  PERIODS.forEach(p=>{
    const key = p.year;
    let g = groups.find(g=>g.key===key);
    if(!g){ g={key, label: key==="continu" ? "" : (YEARS.find(y=>y.id===key)||{}).label, count:0, start:col}; groups.push(g); }
    g.count++; col++;
  });
  groups.forEach(g=>{
    const yh = document.createElement("div");
    yh.className = "yearhead" + (g.key==="continu"?" continu":"");
    yh.style.gridRow = "1"; yh.style.gridColumn = \`\${g.start} / span \${g.count}\`;
    yh.textContent = g.key==="continu" ? "—" : g.label;
    grid.appendChild(yh);
  });
  // period row (row 2)
  PERIODS.forEach((p,idx)=>{
    const ph = document.createElement("div");
    ph.className = "periodhead" + (p.id===NOW_PERIOD?" now":"");
    ph.style.gridRow = "2"; ph.style.gridColumn = \`\${idx+2}\`;
    ph.textContent = p.label;
    grid.appendChild(ph);
  });

  // --- lanes ---
  const items = visibleItems();
  state.lanes.forEach((lane, li)=>{
    const rowNum = li + 3; // header occupies rows 1-2
    // lane label
    const ll = document.createElement("div");
    const kind = lane.kind || "mt";
    ll.className = "lane-label kind-" + kind;
    ll.style.gridRow = \`\${rowNum}\`; ll.style.gridColumn = "1";
    const laneItems = items.filter(i=>i.lane===lane.id);
    const hoog = laneItems.filter(i=>i.prio==="hoog").length;
    const loadPct = Math.min(100, laneItems.length * 11);
    const eyebrow = kind==="directeur" ? "Directeursopgave" : kind==="perifeer" ? "Perifeer · geen MT" : "MT-portefeuille";
    ll.innerHTML = \`
      <div class="lane-eyebrow">\${eyebrow}</div>
      <div class="ltop"><span class="lane-dot" style="background:\${lane.color}"></span>
        <span class="lane-name" data-lane="\${lane.id}" title="Klik om te hernoemen">\${esc(lane.name)}</span></div>
      \${lane.owner?\`<div class="lane-owner">\${esc(lane.owner)}</div>\`:""}
      \${lane.adviseur?\`<div class="lane-adviseur"><span class="adv-ico">◇</span>Adviseur: \${esc(lane.adviseur)}</div>\`:""}
      <div class="lane-meta">\${laneItems.length} activiteiten\${hoog?\` · <b style="color:var(--p-hoog)">\${hoog} hoog</b>\`:""}</div>
      <div class="lane-load"><i style="width:\${loadPct}%;background:\${lane.color}"></i></div>
      <div class="lane-tools">
        <button class="mini" data-adviseur="\${lane.id}">\${lane.adviseur?"Adviseur wijzigen":"+ Adviseur"}</button>
        <button class="mini" data-recolor="\${lane.id}">Kleur</button>
        <button class="mini" data-dellane="\${lane.id}">Verwijder baan</button>
      </div>\`;
    grid.appendChild(ll);

    // --- timeline track (één strook over alle periode-kolommen) ---
    const track = document.createElement("div");
    track.className = "lane-track" + (kind==="perifeer"?" perifeer":"");
    track.style.gridRow = \`\${rowNum}\`;
    track.style.gridColumn = \`2 / span \${PERIODS.length}\`;

    // achtergrond-kolommen (scheidingslijnen + sleepdoelen)
    const bg = document.createElement("div");
    bg.className = "lane-bg";
    PERIODS.forEach((p,idx)=>{
      const bc = document.createElement("div");
      bc.className = "bgcell" + (idx%2?" alt":"") + (p.year==="continu"?" continu":"");
      bc.dataset.lane = lane.id; bc.dataset.period = p.id;
      bc.addEventListener("dragover", e=>{ e.preventDefault(); bc.classList.add("dragover"); });
      bc.addEventListener("dragleave", ()=> bc.classList.remove("dragover"));
      bc.addEventListener("drop", e=>{
        e.preventDefault(); bc.classList.remove("dragover");
        const id = e.dataTransfer.getData("text/plain");
        const it = itemById(id); if(!it) return;
        const tgt = pIndex(p.id);
        const s = pIndex(it.start), en = pIndex(it.end);
        const dur = en - s;                 // duur behouden bij verslepen
        const max = PERIODS.length - 1;
        let ns = tgt, ne = tgt + dur;
        if(ne > max){ ne = max; ns = max - dur; if(ns < 0) ns = 0; }
        it.lane = lane.id; it.start = PERIODS[ns].id; it.end = PERIODS[Math.max(ns,ne)].id;
        save(); render();
      });
      bg.appendChild(bc);
    });
    track.appendChild(bg);

    // balken pakken in sub-rijen zodat ze niet overlappen
    const laneBars = laneItems.slice().sort((a,b)=> (pIndex(a.start)-pIndex(b.start)) || (pIndex(a.end)-pIndex(b.end)));
    const trackEnds = [];
    laneBars.forEach(it=>{
      const s = pIndex(it.start), en = pIndex(it.end);
      let t = trackEnds.findIndex(e=> e < s);
      if(t < 0){ t = trackEnds.length; trackEnds.push(en); } else trackEnds[t] = en;
      track.appendChild(makeBar(it, lane, s, en, t));
    });
    const tracksCount = Math.max(1, trackEnds.length);
    const needed = tracksCount*(BARH+VGAP) - VGAP + TOPPAD*2;
    track.style.minHeight = Math.max(needed, 84) + "px";

    grid.appendChild(track);
  });

  requestAnimationFrame(drawWires);
}

function makeBar(it, lane, s, en, t){
  const c = document.createElement("div");
  c.className = "card bar" + (it.links&&it.links.length?" haslinks":"") + (linkSource===it.id?" linksel":"");
  c.style.setProperty("--lane-c", lane.color);
  c.dataset.id = it.id;
  c.draggable = true;
  c.style.left   = (s*COLW + INSET) + "px";
  c.style.width  = ((en-s+1)*COLW - INSET*2) + "px";
  c.style.top    = (t*(BARH+VGAP) + TOPPAD) + "px";
  c.style.height = BARH + "px";
  const prioCol = it.prio==="hoog"?"var(--p-hoog)":it.prio==="midden"?"var(--p-midden)":"var(--p-laag)";
  const multi = en > s;
  const rangeChip = multi ? \`<span class="thema range">\${perLabel(it.start)} → \${perLabel(it.end)}</span>\` : "";
  c.innerHTML = \`
    <div class="linkbadge">\${it.links?it.links.length:0}</div>
    <div class="ttl">\${esc(it.title)}</div>
    <div class="row">
      <span class="prio"><i style="background:\${prioCol}"></i>\${cap(it.prio)}</span>
      \${it.lead?\`<span class="lead">\${esc(it.lead)}</span>\`:""}
      \${it.thema?\`<span class="thema">\${esc(it.thema)}</span>\`:""}
      \${rangeChip}
    </div>\`;
  c.addEventListener("click", e=>{
    if(linkMode){ handleLinkClick(it.id); return; }
    openDrawer(it.id);
  });
  c.addEventListener("dragstart", e=>{
    if(linkMode){ e.preventDefault(); return; }
    e.dataTransfer.setData("text/plain", it.id);
    e.dataTransfer.effectAllowed="move";
    c.classList.add("dragging");
    document.body.classList.add("dragbar");
  });
  c.addEventListener("dragend", ()=>{ c.classList.remove("dragging"); document.body.classList.remove("dragbar"); });
  return c;
}

/* ----------------------------------------------------------------
   WIRES (verbindingen)
-----------------------------------------------------------------*/
function drawWires(){
  const board = document.getElementById("board");
  const bw = grid.scrollWidth, bh = grid.scrollHeight;
  wires.setAttribute("width", bw); wires.setAttribute("height", bh);
  wires.style.width = bw+"px"; wires.style.height = bh+"px";
  // clear drawn paths (keep marker paths inside <defs>)
  [...wires.querySelectorAll("path")].forEach(p=>{ if(!p.closest("defs")) p.remove(); });
  const gridRect = grid.getBoundingClientRect();
  const cardRect = id=>{
    const el = grid.querySelector(\`.card[data-id="\${id}"]\`);
    if(!el) return null;
    const r = el.getBoundingClientRect();
    return { x:r.left-gridRect.left, y:r.top-gridRect.top, w:r.width, h:r.height };
  };
  const hot = hoverItem;
  state.items.forEach(src=>{
    (src.links||[]).forEach(tid=>{
      const a = cardRect(src.id), b = cardRect(tid);
      if(!a||!b) return;
      // from right-center of a to left-center of b (or reverse if b is left of a)
      let x1,y1,x2,y2;
      if(b.x >= a.x){ x1=a.x+a.w; y1=a.y+a.h/2; x2=b.x; y2=b.y+b.h/2; }
      else { x1=a.x; y1=a.y+a.h/2; x2=b.x+b.w; y2=b.y+b.h/2; }
      const dx = Math.max(28, Math.abs(x2-x1)*0.4);
      const c1x = x1 + (x2>=x1?dx:-dx), c2x = x2 - (x2>=x1?dx:-dx);
      const path = document.createElementNS("http://www.w3.org/2000/svg","path");
      path.setAttribute("d", \`M \${x1} \${y1} C \${c1x} \${y1}, \${c2x} \${y2}, \${x2} \${y2}\`);
      const isHot = hot && (hot===src.id || hot===tid);
      if(isHot){ path.classList.add("hot"); path.setAttribute("marker-end","url(#arrowhot)"); }
      else path.setAttribute("marker-end","url(#arrow)");
      wires.appendChild(path);
    });
  });
}
let hoverItem = null;
grid.addEventListener("mouseover", e=>{
  const card = e.target.closest(".card");
  const id = card?card.dataset.id:null;
  if(id!==hoverItem){ hoverItem=id; drawWires(); }
});
scroller.addEventListener("scroll", ()=>requestAnimationFrame(drawWires), {passive:true});
window.addEventListener("resize", ()=>requestAnimationFrame(drawWires));

/* ----------------------------------------------------------------
   LINK MODE
-----------------------------------------------------------------*/
let linkMode = false, linkSource = null;
const linkBtn = document.getElementById("linkMode");
const linkBanner = document.getElementById("linkbanner");
function setLinkMode(on){
  linkMode = on; linkSource = null;
  linkBtn.classList.toggle("on", on);
  linkBanner.style.display = on ? "flex" : "none";
  render();
}
linkBtn.addEventListener("click", ()=> setLinkMode(!linkMode));
document.getElementById("linkCancel").addEventListener("click", ()=> setLinkMode(false));
function handleLinkClick(id){
  if(!linkSource){ linkSource = id; render(); return; }
  if(linkSource===id){ linkSource=null; render(); return; }
  const src = itemById(linkSource);
  src.links = src.links||[];
  if(!src.links.includes(id)) src.links.push(id);
  linkSource = null; save(); render();
}

/* ----------------------------------------------------------------
   DRAWER (detail + bewerken)
-----------------------------------------------------------------*/
const drawer = document.getElementById("drawer");
const drBody = document.getElementById("drBody");
let editingId = null;

function openDrawer(id){
  const it = itemById(id); if(!it) return;
  editingId = id;
  document.getElementById("drTitle").textContent = "Activiteit bewerken";
  const laneOpts = state.lanes.map(l=>\`<option value="\${l.id}" \${l.id===it.lane?"selected":""}>\${esc(l.name)}</option>\`).join("");
  const perOptsFor = sel => PERIODS.map(p=>{
    const yr = p.year==="continu" ? "" : (YEARS.find(y=>y.id===p.year)||{}).label+" · ";
    return \`<option value="\${p.id}" \${p.id===sel?"selected":""}>\${yr}\${p.label}</option>\`;
  }).join("");
  const startOpts = perOptsFor(it.start);
  const endOpts = perOptsFor(it.end);
  const linkRows = (it.links||[]).map(tid=>{
    const t = itemById(tid); if(!t) return "";
    const ln = laneById(t.lane);
    return \`<div class="link-row"><span class="d" style="background:\${ln?ln.color:'#999'}"></span>\${esc(t.title)}<span class="x" data-unlink="\${tid}">×</span></div>\`;
  }).join("") || \`<div class="empty-hint">Nog geen verbindingen. Gebruik “↔ Verbinden” in de balk.</div>\`;

  drBody.innerHTML = \`
    <div class="fld"><label>Titel</label><input id="f_title" value="\${esc(it.title)}"></div>
    <div class="fld"><label>Baan / portefeuille</label><select id="f_lane">\${laneOpts}</select></div>
    <div class="two">
      <div class="fld"><label>Van (begin)</label><select id="f_start">\${startOpts}</select></div>
      <div class="fld"><label>Tot en met (eind)</label><select id="f_end">\${endOpts}</select></div>
    </div>
    <div class="two">
      <div class="fld"><label>Lead</label><input id="f_lead" value="\${esc(it.lead||"")}"></div>
      <div class="fld"><label>Prioriteit</label><select id="f_prio">
        <option value="hoog" \${it.prio==="hoog"?"selected":""}>Hoog</option>
        <option value="midden" \${it.prio==="midden"?"selected":""}>Midden</option>
        <option value="laag" \${it.prio==="laag"?"selected":""}>Laag</option>
      </select></div>
    </div>
    <div class="fld"><label>Thema / portefeuille-tag</label><input id="f_thema" value="\${esc(it.thema||"")}"></div>
    <div class="fld"><label>Toelichting</label><textarea id="f_detail">\${esc(it.detail||"")}</textarea></div>
    <div class="fld"><label>Verbindingen</label><div class="links-box">\${linkRows}</div></div>\`;

  drBody.querySelectorAll("[data-unlink]").forEach(x=>x.addEventListener("click",()=>{
    const tid = x.getAttribute("data-unlink");
    it.links = (it.links||[]).filter(l=>l!==tid);
    save(); openDrawer(id); render();
  }));
  drawer.classList.add("open");
}
function closeDrawer(){ drawer.classList.remove("open"); editingId=null; }
document.getElementById("drClose").addEventListener("click", closeDrawer);
document.getElementById("drSave").addEventListener("click", ()=>{
  const it = itemById(editingId); if(!it) return;
  it.title = val("f_title")||"Naamloos";
  it.lane = val("f_lane");
  let st = val("f_start"), en = val("f_end");
  if(pIndex(en) < pIndex(st)) en = st; // eind nooit vóór begin
  it.start = st; it.end = en;
  it.lead = val("f_lead"); it.prio = val("f_prio");
  it.thema = val("f_thema"); it.detail = val("f_detail");
  save(); render(); closeDrawer();
});
document.getElementById("drDelete").addEventListener("click", ()=>{
  if(!editingId) return;
  if(!confirm("Deze activiteit verwijderen?")) return;
  state.items = state.items.filter(i=>i.id!==editingId);
  // remove inbound links
  state.items.forEach(i=> i.links = (i.links||[]).filter(l=>l!==editingId));
  save(); render(); closeDrawer();
});

/* ----------------------------------------------------------------
   TOOLBAR ACTIES
-----------------------------------------------------------------*/
document.getElementById("addItem").addEventListener("click", ()=>{
  const it = { id:uid(), lane:state.lanes[0].id, start:NOW_PERIOD, end:NOW_PERIOD, title:"Nieuwe activiteit", lead:"", prio:"midden", thema:"", detail:"", links:[] };
  state.items.push(it); save(); render(); openDrawer(it.id);
});
document.getElementById("addLane").addEventListener("click", ()=>{
  const name = prompt("Naam van de nieuwe baan / portefeuille:");
  if(!name) return;
  const palette = ["#2563eb","#7c3aed","#0891b2","#059669","#ea580c","#db2777","#0d9488","#64748b","#9333ea","#0ea5e9"];
  state.lanes.push({ id:"l_"+Math.random().toString(36).slice(2,7), name, color: palette[state.lanes.length % palette.length] });
  save(); render();
});
grid.addEventListener("click", e=>{
  const rn = e.target.closest(".lane-name");
  if(rn){ inlineRenameLane(rn.dataset.lane, rn); return; }
  const ad = e.target.closest("[data-adviseur]");
  if(ad){ openAdviseurMenu(ad.getAttribute("data-adviseur"), ad); return; }
  const rc = e.target.closest("[data-recolor]");
  if(rc){ recolorLane(rc.getAttribute("data-recolor")); return; }
  const dl = e.target.closest("[data-dellane]");
  if(dl){ deleteLane(dl.getAttribute("data-dellane")); return; }
});

/* Adviseur-keuzemenu */
function closeAdviseurMenu(){ const m=document.getElementById("adviseur-menu"); if(m) m.remove(); document.removeEventListener("click", outsideAdviseur, true); }
function outsideAdviseur(e){ const m=document.getElementById("adviseur-menu"); if(m && !m.contains(e.target) && !e.target.closest("[data-adviseur]")) closeAdviseurMenu(); }
function openAdviseurMenu(laneId, anchor){
  closeAdviseurMenu();
  const lane = laneById(laneId); if(!lane) return;
  const menu = document.createElement("div");
  menu.id = "adviseur-menu"; menu.className = "popmenu";
  const used = new Set(state.lanes.map(l=>l.adviseur).filter(Boolean));
  const rows = ADVISEURS.map(a=>{
    const sel = lane.adviseur===a;
    const elsewhere = !sel && used.has(a);
    return \`<button class="pm-item\${sel?" sel":""}" data-pick="\${esc(a)}">\${esc(a)}\${elsewhere?' <span class="pm-note">in gebruik</span>':""}\${sel?' <span class="pm-check">✓</span>':""}</button>\`;
  }).join("");
  menu.innerHTML = \`
    <div class="pm-head">Adviseur voor deze baan</div>
    \${rows}
    <button class="pm-item" data-pick="__custom">Eigen invoer…</button>
    \${lane.adviseur?\`<button class="pm-item pm-clear" data-pick="__none">Adviseur verwijderen</button>\`:""}\`;
  document.body.appendChild(menu);
  const r = anchor.getBoundingClientRect();
  const mw = 240;
  let left = r.left, top = r.bottom + 4;
  if(left + mw > window.innerWidth - 8) left = window.innerWidth - mw - 8;
  if(top + menu.offsetHeight > window.innerHeight - 8) top = Math.max(8, r.top - menu.offsetHeight - 4);
  menu.style.left = left + "px"; menu.style.top = top + "px";
  menu.addEventListener("click", ev=>{
    const b = ev.target.closest("[data-pick]"); if(!b) return;
    const v = b.getAttribute("data-pick");
    if(v==="__none"){ lane.adviseur = ""; }
    else if(v==="__custom"){ const c = prompt("Naam en rol van de adviseur:", lane.adviseur||""); if(c===null){ closeAdviseurMenu(); return; } lane.adviseur = c.trim(); }
    else { lane.adviseur = v; }
    save(); closeAdviseurMenu(); render();
  });
  setTimeout(()=>document.addEventListener("click", outsideAdviseur, true), 0);
}
function inlineRenameLane(id, el){
  const lane = laneById(id); if(!lane) return;
  const name = prompt("Naam van de baan:", lane.name);
  if(name===null) return;
  lane.name = name.trim() || lane.name; save(); render();
}
function recolorLane(id){
  const lane = laneById(id); if(!lane) return;
  const c = prompt("Hex-kleur (bijv. #2563eb):", lane.color);
  if(c && /^#?[0-9a-fA-F]{6}\$/.test(c.trim())){ lane.color = c.trim().startsWith("#")?c.trim():"#"+c.trim(); save(); render(); }
}
function deleteLane(id){
  if(state.lanes.length<=1){ alert("Er moet minstens één baan blijven."); return; }
  const lane = laneById(id);
  const n = state.items.filter(i=>i.lane===id).length;
  if(!confirm(\`Baan “\${lane.name}” verwijderen?\` + (n?\` \${n} activiteit(en) verhuizen naar “\${state.lanes.find(l=>l.id!==id).name}”.\`:""))) return;
  const fallback = state.lanes.find(l=>l.id!==id).id;
  state.items.forEach(i=>{ if(i.lane===id) i.lane=fallback; });
  state.lanes = state.lanes.filter(l=>l.id!==id);
  save(); render();
}
document.getElementById("fPrio").addEventListener("change", e=>{ filterPrio = e.target.value; render(); });

/* export / import / print */
document.getElementById("exportBtn").addEventListener("click", ()=>{
  const blob = new Blob([JSON.stringify(state,null,2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "co-roadmap-" + new Date().toISOString().slice(0,10) + ".json";
  a.click(); URL.revokeObjectURL(a.href);
});
const filebox = document.getElementById("filebox");
document.getElementById("importBtn").addEventListener("click", ()=> filebox.click());
filebox.addEventListener("change", e=>{
  const f = e.target.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = ()=>{
    try{
      const d = JSON.parse(r.result);
      if(!d.lanes||!d.items) throw new Error("Onverwacht bestandsformaat.");
      state = d; save(); render();
    }catch(err){ alert("Kon bestand niet inlezen: "+err.message); }
    filebox.value="";
  };
  r.readAsText(f);
});
document.getElementById("printBtn").addEventListener("click", ()=> window.print());

/* ----------------------------------------------------------------
   HELPERS
-----------------------------------------------------------------*/
function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m])); }
function cap(s){ return s? s.charAt(0).toUpperCase()+s.slice(1) : ""; }
function val(id){ const el=document.getElementById(id); return el?el.value.trim():""; }
document.addEventListener("keydown", e=>{ if(e.key==="Escape"){ if(linkMode) setLinkMode(false); else closeDrawer(); } });

/* GO */
render();
</script>
</body>
</html>
`;

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/api/roadmap/load') {
      try {
        const data = await env[KV_NS].get(SK);
        return resp({ ok: true, state: data ? JSON.parse(data) : null });
      } catch (e) { return resp({ ok: false, err: e.message }, 500); }
    }
    if (url.pathname === '/api/roadmap/save' && req.method === 'POST') {
      try {
        const { state } = await req.json();
        await env[KV_NS].put(SK, JSON.stringify(state));
        return resp({ ok: true });
      } catch (e) { return resp({ ok: false, err: e.message }, 400); }
    }
    return new Response(HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
};
function resp(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
