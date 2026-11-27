// Generates the static site into dist/:  node scripts/build-site.js
// Source of truth: recipes/*.json (+ recipes/manifest.json) and research/recipe-images.json (open-licence photo credits).
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),dist=path.join(root,'dist');
const DOMAIN='https://kitchen.worldwellbeingforum.com';

// ---------- data ----------
const man=JSON.parse(fs.readFileSync(path.join(root,'recipes/manifest.json'),'utf8')).recipes;
const recipes=man.map(f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'))).sort((a,b)=>a.id-b.id);
const imgFile=path.join(root,'research/recipe-images.json');
const images=fs.existsSync(imgFile)?JSON.parse(fs.readFileSync(imgFile,'utf8')):{};
const slugify=s=>s.toLowerCase().replace(/[’']/g,'').replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

const COLLECTIONS=[
 {slug:'up-home-classics',title:'Uttar Pradesh Home Classics',group:'everyday',range:[1,25],blurb:'Everyday sabzis, dals and chaat from the kitchens of Uttar Pradesh, rebuilt with more plant protein and far less oil.',tile:'linear-gradient(135deg,#b4532e,#d89a1b)',glyph:'अ'},
 {slug:'morning-meals',title:'Morning Meals',group:'everyday',range:[26,65],blurb:'Chillas, idlis, upma and porridges that carry protein into the first meal of the day.',tile:'linear-gradient(135deg,#d89a1b,#e9c46a)',glyph:'☀'},
 {slug:'soups-broths',title:'Soups & Broths',group:'everyday',range:[66,85],blurb:'Warm, gentle bowls of lentils, vegetables and spice. Light enough for evening, filling enough for a meal.',tile:'linear-gradient(135deg,#3d6350,#6b9080)',glyph:'♨'},
 {slug:'sabzi-curry',title:'Sabzi & Curry Classics',group:'everyday',range:[86,105],blurb:'Restaurant favourites and regional specialities, without the cream, butter or deep-frying.',tile:'linear-gradient(135deg,#8c3b1f,#c8693c)',glyph:'❋'},
 {slug:'paneer-tofu',title:'Paneer & Tofu',group:'everyday',range:[106,125],blurb:'Protein-forward mains: tikkas, bhurjis, stir-fries and gravies built on paneer and tofu.',tile:'linear-gradient(135deg,#7a6a3a,#c9b458)',glyph:'◆'},
 {slug:'dals-beans',title:'Dals, Beans & Pulses',group:'everyday',range:[126,145],blurb:'The heart of Indian home cooking: lentils, beans and pulses simmered with tempered spices.',tile:'linear-gradient(135deg,#a8742a,#d8a64a)',glyph:'❂'},
 {slug:'khichdi-millets',title:'Khichdi, Millets & Grains',group:'everyday',range:[146,165],blurb:'Comforting one-pot grains: khichdi, pulao, pongal and biryani, built on millets and whole grains.',tile:'linear-gradient(135deg,#5b7a4a,#9bb36d)',glyph:'✺'},
 {slug:'salads-bowls',title:'Salads & Nourishing Bowls',group:'everyday',range:[166,185],blurb:'Fresh and warm bowls that put legumes, tofu and vegetables at the centre.',tile:'linear-gradient(135deg,#4d7c5a,#8cb369)',glyph:'❀'},
 {slug:'snacks-chaat',title:'Snacks & Chaat',group:'everyday',range:[186,205],blurb:'Street-food flavours made with steaming, baking and dry roasting instead of the fryer.',tile:'linear-gradient(135deg,#c1440e,#e8a33d)',glyph:'✦'},
 {slug:'oven-baked',title:'Oven-Baked',group:'modern',range:[206,225],blurb:'One-dish bakes, trays and casseroles: hands-off cooking with little oil.',tile:'linear-gradient(135deg,#7b3f2a,#b4532e)',glyph:'▣'},
 {slug:'air-fryer',title:'Air-Fryer',group:'modern',range:[226,245],blurb:'Crisp kebabs, tikkis and bites with a spoonful of oil.',tile:'linear-gradient(135deg,#34495e,#5c7a99)',glyph:'◎'},
 {slug:'microwave',title:'Microwave-Friendly',group:'modern',range:[246,265],blurb:'Real meals in 10–25 minutes for busy days, with microwave-specific timings.',tile:'linear-gradient(135deg,#46657a,#7aa2b8)',glyph:'◉'},
 {slug:'world-kitchen',title:'From Around the World',group:'beyond',range:[266,285],blurb:'Plant-forward dishes from Thailand to Peru, kept free of nuts and eggs.',tile:'linear-gradient(135deg,#6a4c93,#a07bc0)',glyph:'✧'},
 {slug:'sweet-endings',title:'Sweet Endings',group:'beyond',range:[286,300],blurb:'Desserts sweetened with fruit, with no added sugar.',tile:'linear-gradient(135deg,#a64b6a,#d98aa3)',glyph:'❦'},
 {slug:'seasonal-greens',title:'Seasonal Winter Greens',group:'everyday',range:[301,301],blurb:'Winter greens and pulses inspired by regional home cooking, adapted with measured oil and added plant protein.',tile:'linear-gradient(135deg,#3d6350,#8ca77a)',glyph:'✿'}
];
const GROUPS={everyday:['Everyday Indian cooking','From the home kitchens of India, rebuilt for steady energy and plenty of plant protein.'],modern:['The modern kitchen','The same flavours, cooked the way many of us cook today: oven, air fryer and microwave.'],beyond:['Beyond the thali','Dishes from elsewhere, and a few sweet things.']};
for(const r of recipes){const c=COLLECTIONS.find(c=>r.id>=c.range[0]&&r.id<=c.range[1]);r.collection=c;r.slug=slugify(r.name);const im=images[r.id];if(im||r.image){r.photo={...(im||{}),url:r.imagePath||r.image||(im&&im.url)}}}
const bySlug={};recipes.forEach(r=>{if(bySlug[r.slug])throw new Error('duplicate slug '+r.slug);bySlug[r.slug]=r});
COLLECTIONS.forEach(c=>c.items=recipes.filter(r=>r.collection===c));

// ---------- helpers ----------
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const methodOf=r=>r.methodLabel||'Stovetop method';
const methodKey=r=>/air/i.test(methodOf(r))?'air-fryer':/microwave/i.test(methodOf(r))?'microwave':/oven|grill/i.test(methodOf(r))?'oven':/no-cook|no-bake/i.test(methodOf(r))?'no-cook':'stovetop';
const thumb=(url,w)=>url.replace(/\/\d+px-/,`/${w}px-`);
const tags=r=>[r.protein>=15&&'High protein',r.fiber>=8&&'High fibre',r.carbs<=35&&'Moderate carbs'].filter(Boolean);
const TASTES=[['Sweet','madhura',/pumpkin|carrot|sweet potato|banana|corn|coconut|beetroot|apple|pear|mango|plum|strawberr|raspberr|berries|rice|millet|oats|quinoa|barley|ragi|pomegranate|dalia|couscous|soy milk|jowar|bajra/i],
 ['Sour','amla',/lemon|lime|tamarind|amchur|yogurt|curd|vinegar|tomato|pomegranate|raw mango/i],
 ['Salty','lavana',/soy sauce|miso|olives|black salt|nutritional yeast|cheese|feta/i],
 ['Pungent','katu',/chilli|chili|ginger|garlic|pepper|mustard|onion|ajwain|cloves|cinnamon|berbere|gochujang|doubanjiang/i],
 ['Bitter','tikta',/methi|fenugreek|karela|bitter gourd|spinach|kale|greens|broccoli|cocoa|dark chocolate|turmeric|callaloo|amaranth leaves/i],
 ['Astringent','kashaya',/dal\b|lentil|chickpea|beans?\b|chana|moong|rajma|lobia|peas\b|tofu|pomegranate|besan|sattu|barley|buckwheat|tempeh|edamame/i]];
const tastesOf=r=>{const t=r.ingredients.join(' ');return TASTES.filter(([,,re])=>re.test(t)).map(([n,s])=>({n,s}))};
const glyph=r=>esc(r.collection.glyph);

function nav(depth,active){
  const p='../'.repeat(depth);
  const L=[['Collections',p+'collections/','collections'],['Browse all',p+'browse/','browse'],['Kitchen Wisdom',p+'kitchen-wisdom/','wisdom'],['Planner',p+'planner/','planner'],['About',p+'about/','about']];
  return L.map(([t,h,k])=>`<a href="${h}"${active===k?' aria-current="page"':''}>${t}</a>`).join('');
}
const lotus=`<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="#e3ead8"/><path d="M32 12c5 7 8 13 8 19 0 6-3 11-8 15-5-4-8-9-8-15 0-6 3-12 8-19z" fill="#2e4a3b"/><path d="M14 26c8 1 14 5 18 12-3 5-8 8-14 8-2-6-4-13-4-20zm36 0c0 7-2 14-4 20-6 0-11-3-14-8 4-7 10-11 18-12z" fill="#d89a1b"/></svg>`;
function layout({title,desc,depth=0,active='',body,canonical='',head=''}){
  const p='../'.repeat(depth);
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
${canonical?`<link rel="canonical" href="${DOMAIN}${canonical}">`:''}
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="website">
<link rel="stylesheet" href="${p}assets/css/site.css">${head}</head>
<body data-root="${p||'./'}"><a class="skip" href="#main">Skip to content</a>
<header class="site-header"><div class="wrap"><a class="brand" href="${p||'./'}">${lotus}<span>World Wellbeing Kitchen<small>An initiative of World Wellbeing Forum</small></span></a>
<button class="nav-toggle" aria-expanded="false" aria-controls="nav">Menu</button><nav class="nav" id="nav" aria-label="Main">${nav(depth,active)}</nav></div></header>
<main id="main">${body}</main>
<footer class="site-footer"><div class="wrap"><div class="cols"><div><h3>World Wellbeing Kitchen</h3><p>Traditional wisdom, modern nutrition. Home-style vegetarian and vegan cooking by Sadhna Dixit, an initiative of the <a href="https://worldwellbeingforum.com">World Wellbeing Forum</a>.</p></div>
<div><h3>Explore</h3><ul><li><a href="${p}collections/">All collections</a></li><li><a href="${p}browse/">Browse &amp; search</a></li><li><a href="${p}kitchen-wisdom/">Kitchen Wisdom</a></li><li><a href="${p}planner/">Weekly planner</a></li></ul></div>
<div><h3>Good to know</h3><ul><li><a href="${p}about/">Our approach</a></li><li><a href="${p}about/#sources">Sources &amp; photo credits</a></li><li><a href="${p}about/#disclaimer">Health disclaimer</a></li></ul></div></div>
<small>Nutrition values are estimates per serving, not laboratory analyses. Appliance timings are starting estimates until kitchen-tested. This site is educational and is not medical advice; it does not diagnose, prevent or treat any condition. Vegan status is based on listed ingredients; check packaged products for hidden animal-derived ingredients and cross-contact allergens.</small></div></footer>
<script src="${p}assets/js/site.js" defer></script></body></html>`;
}
function card(r,depth){
  const p='../'.repeat(depth);const href=`${p}recipes/${r.slug}/`;
  const im=r.photo?`<img src="${esc(thumb(r.photo.url,500))}" alt="${esc(r.name)}" loading="lazy" width="500" height="375">`:`<span class="glyph" aria-hidden="true">${glyph(r)}</span>`;
  return `<article class="card" data-name="${esc(r.name.toLowerCase())}" data-protein="${r.protein}" data-vegan="${r.vegan?1:0}"><a class="cover" href="${href}"><div class="thumb" style="--tile:${r.collection.tile}">${im}<span class="badge">${r.vegan?'VEGAN':'VEGETARIAN'}</span>${r.photo&&r.photo.match==='similar'?'<span class="similar">Similar dish</span>':''}</div>
<div class="card-body"><div class="meta"><span>${esc(r.collection.title)}</span></div><h3>${esc(r.name)}</h3><div class="meta"><span>${r.mins} min</span><span>${r.cal} kcal</span><span>${r.carbs} g carbs</span><span>${r.fiber} g fibre</span><span class="protein">${r.protein} g<small style="font:600 .7rem var(--sans);color:var(--muted)"> protein</small></span></div>
<div class="chips">${tags(r).map(t=>`<span class="chip${t==='High protein'?' warm':''}">${t}</span>`).join('')}</div></div></a></article>`;
}
const write=(rel,html)=>{const f=path.join(dist,rel);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,html)};

// ---------- build ----------
fs.mkdirSync(dist,{recursive:true});
for(const e of fs.readdirSync(dist))fs.rmSync(path.join(dist,e),{recursive:true,force:true}); // clear contents (keeps the folder, which a dev server may hold open)
fs.cpSync(path.join(root,'assets'),path.join(dist,'assets'),{recursive:true});
fs.mkdirSync(path.join(dist,'recipes'),{recursive:true});
fs.writeFileSync(path.join(dist,'recipes/all.json'),JSON.stringify(recipes.map(({collection,photo,...r})=>({...r,slug:undefined,collectionSlug:collection.slug}))));
fs.writeFileSync(path.join(dist,'recipes/index.json'),JSON.stringify(recipes.map(r=>({id:r.id,slug:r.slug,name:r.name,col:r.collection.slug,colTitle:r.collection.title,tile:r.collection.tile,glyph:r.collection.glyph,vegan:r.vegan,protein:r.protein,cal:r.cal,carbs:r.carbs,fiber:r.fiber,mins:r.mins,method:methodKey(r),tags:tags(r),img:r.photo?thumb(r.photo.url,500):null,similar:!!(r.photo&&r.photo.match==='similar')}))));

// recipe pages
recipes.forEach((r,i)=>{
  const col=r.collection,idx=col.items.indexOf(r),prev=col.items[idx-1],next=col.items[idx+1];
  const refs=(r.inspirationReferences||[]).filter(x=>/^https:\/\//.test(x.url));
  const nrefs=(r.nutritionReferences||[]).filter(x=>/^https:\/\//.test(x.url));
  const tastes=tastesOf(r);
  const photo=r.photo?`<figure style="margin:0"><div class="recipe-photo" style="--tile:${col.tile}"><img src="${esc(thumb(r.photo.url,960))}" alt="${esc(r.name)}" width="960" height="720"></div><figcaption class="credit">${r.photo.match==='similar'?'A similar dish, shown for illustration. ':''}Photo: ${esc(r.photo.creator)} · <a href="${esc(r.photo.licenseUrl||r.photo.page)}" target="_blank" rel="noopener">${esc(r.photo.license)}</a> · <a href="${esc(r.photo.page)}" target="_blank" rel="noopener">Wikimedia Commons</a></figcaption></figure>`
    :`<div class="recipe-photo" style="--tile:${col.tile}"><span class="glyph" aria-hidden="true">${glyph(r)}</span></div><p class="credit">Dish photograph coming soon.</p>`;
  const body=`<div class="page-head" style="padding-bottom:0"><div class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="../../">Home</a> › <a href="../../collections/">Collections</a> › <a href="../../collections/${col.slug}/">${esc(col.title)}</a></nav>
<span class="eyebrow">${esc(col.title)} · ${r.vegan?'Vegan':'Vegetarian'}</span></div></div>
<div class="wrap"><div class="recipe-hero"><div><h1>${esc(r.name)}</h1><p class="lead muted">${esc(r.note)}</p>
<div class="chips" style="margin:14px 0">${tags(r).map(t=>`<span class="chip warm">${t}</span>`).join('')}<span class="chip">${r.mins} minutes</span><span class="chip">Serves ${r.servings}</span><span class="chip rose">${esc(methodOf(r).replace(' method',''))}</span></div>
<div class="metrics"><div class="metric"><b>${r.protein} g</b><span>Protein</span></div><div class="metric"><b>${r.cal}</b><span>Calories</span></div><div class="metric"><b>${r.carbs} g</b><span>Carbs</span></div><div class="metric"><b>${r.fiber} g</b><span>Fibre</span></div></div>
<p class="muted" style="font-size:.85rem">Per serving, estimated. Fat ${r.fat} g. Prep ${r.prep} min · cook ${r.cook} min.</p>
<div class="hero-actions" style="margin-top:8px"><button class="btn primary" data-add="${r.id}">Add to weekly planner</button><button class="btn" onclick="window.print()">Print recipe</button></div></div>${photo}</div>
<div class="recipe-cols"><div class="panel"><h2 style="font-size:1.5rem">Ingredients</h2><p class="muted" style="font-size:.85rem">Serves ${r.servings}</p><ul>${r.ingredients.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>
<div><div class="panel"><h2 style="font-size:1.5rem">${esc(methodOf(r))}</h2><ol>${r.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div>
${tastes.length?`<div class="note" style="margin-top:14px"><b>Tastes in this dish</b> <span class="muted">(shad rasa, the six tastes of traditional Indian cooking)</span><div class="chips" style="margin-top:8px">${tastes.map(t=>`<span class="chip warm">${t.n} · ${t.s}</span>`).join('')}</div><a href="../../kitchen-wisdom/#tastes" style="font-size:.85rem">About the six tastes →</a></div>`:''}
<div class="note" style="margin-top:14px"><b>Cooking inspiration</b>${refs.length?`<ul class="refs">${refs.map(x=>`<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a> <span class="muted">· ${esc(x.site)}</span></li>`).join('')}</ul><small>These pages inspired the dish. The text, quantities and nutrition estimates here are our own adaptation.</small>`:`<br>Developed by World Wellbeing Kitchen from standard cooking techniques; no single source recipe was used.`}</div>
<div class="note" style="margin-top:14px"><b>Nutrition estimate & references</b><br>${esc(r.nutritionMethod||'Values are estimates, not laboratory analyses, and are not medical advice.')}<br>See <a href="../../about/#disclaimer">our approach</a>. Dietary guidance: <a href="https://nin.res.in/dietaryguidelines/pdfjs/locale/DGI_2024.pdf" target="_blank" rel="noopener">ICMR-NIN Dietary Guidelines (2024)</a>.${nrefs.length ? '<ul class="refs">' + nrefs.map(x => '<li><a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.title) + '</a> <span class="muted">· ' + esc(x.publisher || x.site || '') + '</span></li>').join('') + '</ul>' : ''}${r.editorialStatus ? '<small>Editorial status: ' + esc(r.editorialStatus) + '.</small>' : ''}</div></div></div>
<div class="pager"><span>${prev?`← <a href="../${prev.slug}/">${esc(prev.name)}</a>`:''}</span><span>${next?`<a href="../${next.slug}/">${esc(next.name)}</a> →`:''}</span></div></div>`;
  write(`recipes/${r.slug}/index.html`,layout({title:`${r.name} | World Wellbeing Kitchen`,desc:`${r.name}: ${r.protein} g protein, ${r.cal} kcal per serving, ${r.mins} minutes. ${r.note}`.slice(0,300),depth:2,active:'',body,canonical:`/recipes/${r.slug}/`}));
});

// collection pages
const photoCount=c=>c.items.filter(r=>r.photo).length;
COLLECTIONS.forEach(c=>{
  const body=`<div class="page-head" style="background:${c.tile}"><div class="wrap" style="color:#fff"><nav class="crumbs" style="color:#ffffffcc"><a style="color:#fff" href="../../">Home</a> › <a style="color:#fff" href="../">Collections</a></nav><span class="eyebrow" style="color:#fff;opacity:.85">${esc(GROUPS[c.group][0])}</span><h1 style="color:#fff">${esc(c.title)}</h1><p style="max-width:40em;font-size:1.1rem">${esc(c.blurb)}</p><p style="font-size:.9rem;opacity:.9">${c.items.length} recipes · ${c.items.filter(r=>r.vegan).length} vegan</p></div></div>
<section class="block" style="padding-top:34px"><div class="wrap"><div class="toolbar"><input class="search" type="search" placeholder="Search ${esc(c.title)}…" aria-label="Search recipes" data-search><button class="filter" aria-pressed="false" data-flag="vegan">Vegan</button><button class="filter" aria-pressed="false" data-flag="protein">15 g+ protein</button></div><p class="result-count" data-count></p>
<div class="grid cols-3" data-grid>${c.items.map(r=>card(r,2)).join('')}</div></div></section>`;
  write(`collections/${c.slug}/index.html`,layout({title:`${c.title} | World Wellbeing Kitchen`,desc:c.blurb,depth:2,active:'collections',body,canonical:`/collections/${c.slug}/`}));
});
// collections index
write('collections/index.html',layout({title:'Recipe collections | World Wellbeing Kitchen',desc:'Fourteen collections of plant-forward home cooking: Indian classics, soups, dals, grains, snacks, and the modern oven, air-fryer and microwave kitchen.',depth:1,active:'collections',canonical:'/collections/',
 body:`<div class="page-head"><div class="wrap"><span class="eyebrow">300 recipes</span><h1>Collections</h1><p class="lead muted" style="max-width:40em">Choose a collection to explore: each has its own page, from everyday dals to oven bakes and desserts.</p></div></div>
${Object.keys(GROUPS).map(g=>`<section class="block" style="padding:30px 0"><div class="wrap"><div class="section-head"><h2>${GROUPS[g][0]}</h2><p class="muted">${GROUPS[g][1]}</p></div><div class="grid cols-3">${COLLECTIONS.filter(c=>c.group===g).map(c=>`<a class="collection-card" style="--tile:${c.tile}" href="${c.slug}/"><div><h3>${esc(c.title)}</h3><p>${esc(c.blurb)}</p></div><span class="count">${c.items.length} recipes</span></a>`).join('')}</div></div></section>`).join('')}`}));

// browse
write('browse/index.html',layout({title:'Browse all recipes | World Wellbeing Kitchen',desc:'Search and filter all 300 recipes by collection, diet, protein and cooking method.',depth:1,active:'browse',canonical:'/browse/',
 body:`<div class="page-head"><div class="wrap"><span class="eyebrow">All 300 recipes</span><h1>Browse &amp; search</h1></div></div>
<section class="block" style="padding-top:30px"><div class="wrap"><div class="toolbar"><input class="search" type="search" id="q" placeholder="Search by dish or ingredient…" aria-label="Search recipes">
<button class="filter" aria-pressed="false" data-f="vegan">Vegan</button><button class="filter" aria-pressed="false" data-f="protein">15 g+ protein</button><button class="filter" aria-pressed="false" data-f="fibre">8 g+ fibre</button>
<select class="filter" id="col" aria-label="Collection"><option value="">All collections</option>${COLLECTIONS.map(c=>`<option value="${c.slug}">${esc(c.title)}</option>`).join('')}</select>
<select class="filter" id="method" aria-label="Cooking method"><option value="">Any method</option><option value="stovetop">Stovetop</option><option value="oven">Oven</option><option value="air-fryer">Air fryer</option><option value="microwave">Microwave</option><option value="no-cook">No-cook</option></select></div>
<p class="result-count" id="count"></p><div class="grid cols-3" id="grid"></div><p><button class="btn" id="more" hidden>Show more</button></p></div></section>`,
 head:'<meta name="robots" content="index,follow">'}));

// kitchen wisdom
const seasonPick=(re,cols)=>recipes.filter(r=>(cols.includes(r.collection.slug)||re.test(r.name))).slice(0,100);
const winter=recipes.filter(r=>/soup|khichdi|stew|dal\b|undhiyu|pongal|halwa|kheer|saag|tagine|curry/i.test(r.name)).slice(0,6);
const summer=recipes.filter(r=>/salad|chaat|raita|curd|chia|yogurt|mousse|tabbouleh|slaw|sattu/i.test(r.name)).slice(0,6);
const monsoon=recipes.filter(r=>/pakora|khichdi|kebab|tikki|cutlet|muthia|dhokla|soup|bhaji/i.test(r.name)).slice(0,6);
const mini=l=>`<ul style="padding-left:1.1em;margin:.5em 0 0">${l.map(r=>`<li><a href="../recipes/${r.slug}/">${esc(r.name)}</a></li>`).join('')}</ul>`;
write('kitchen-wisdom/index.html',layout({title:'Kitchen Wisdom | World Wellbeing Kitchen',desc:'Ayurveda-inspired home-cooking ideas for modern life: the six tastes, the spice shelf, the rhythm of the day and eating with the seasons.',depth:1,active:'wisdom',canonical:'/kitchen-wisdom/',
 body:`<div class="page-head"><div class="wrap"><span class="eyebrow">A resource, not a rulebook</span><h1>Kitchen Wisdom</h1><p class="lead muted" style="max-width:42em">Indian home cooking has always been a practical, living knowledge: what to cook in which season, how to balance a plate, why a pinch of hing goes into the dal. We borrow these ideas from Ayurvedic and regional traditions, and design them for how people cook today.</p></div></div>
<section class="block" style="padding-top:30px"><div class="wrap"><blockquote class="quote">“Tradition is not the opposite of modern. It is what lets modern food feel like home.”</blockquote>
<div class="note" style="margin-top:24px"><b>Please note.</b> These are cooking traditions and kitchen ideas, not medical advice or treatment. Ayurveda-inspired here means inspired by its food culture; we do not make claims about curing, preventing or treating any condition. Talk to your clinician or a registered dietitian about your own needs.</div></div></section>
<section class="block alt" id="tastes"><div class="wrap"><div class="section-head"><span class="eyebrow">Shad rasa</span><h2>The six tastes</h2><p class="muted">Traditional Indian meal-planning looks for all six tastes across the day, and ideally at each main meal. Every recipe page shows which tastes appear in the dish.</p></div>
<div class="grid cols-3">${[['Sweet · madhura','Grains, pumpkin, carrot, coconut, ripe fruit. Grounding and satisfying.'],['Sour · amla','Lemon, tamarind, tomato, yogurt, amchur. Brightens and wakes up the appetite.'],['Salty · lavana','Soy sauce, miso, black salt. Used lightly, it rounds out flavour.'],['Pungent · katu','Ginger, chilli, garlic, pepper, mustard. The warming heat of the spice box.'],['Bitter · tikta','Methi, bitter gourd, leafy greens, turmeric. Often the missing taste.'],['Astringent · kashaya','Lentils, beans, chickpeas, pomegranate. The dry, firm taste of pulses.']].map(([a,b])=>`<div class="taste"><b>${a}</b><span>${b}</span></div>`).join('')}</div></div></section>
<section class="block" id="spices"><div class="wrap"><div class="section-head"><span class="eyebrow">Masala dabba</span><h2>The spice shelf</h2><p class="muted">A small round tin of spices is the working pharmacy of the Indian kitchen, in the sense of seasoning, not medicine. Traditionally these are used to flavour food and to make hearty pulses and vegetables more comfortable to eat.</p></div>
<div class="grid cols-4">${[['Cumin (jeera)','Toasted in oil first, the base of most tempering.'],['Turmeric (haldi)','Earthy colour and gentle bitterness.'],['Coriander seed','Mild, citrusy body for gravies.'],['Ajwain','Often paired with besan and beans.'],['Fennel (saunf)','Sweet-anise note; used in gravies and after meals.'],['Hing (asafoetida)','A pinch in dals and legumes; savoury depth.'],['Ginger &amp; black pepper','Warmth for soups and broths.'],['Kasuri methi','Dried fenugreek leaf for a finishing aroma.']].map(([a,b])=>`<div class="taste"><b>${a}</b><span>${b}</span></div>`).join('')}</div></div></section>
<section class="block alt" id="rhythm"><div class="wrap"><div class="section-head"><span class="eyebrow">Dinacharya</span><h2>The rhythm of the day</h2><p class="muted">A traditional pattern many people still find sensible: a protein-rich morning, the largest meal at midday, a lighter and warmer evening.</p></div>
<div class="grid cols-3"><div class="rhythm"><div class="icon">☀</div><h3>Morning</h3><p class="muted">Start with something warm and protein-forward.</p><a href="../collections/morning-meals/">Morning Meals →</a></div>
<div class="rhythm"><div class="icon">☼</div><h3>Midday</h3><p class="muted">The main meal: dal or beans, a sabzi, a whole grain, a little protein.</p><a href="../collections/dals-beans/">Dals</a> · <a href="../collections/sabzi-curry/">Sabzi &amp; Curry</a> · <a href="../collections/khichdi-millets/">Grains</a></div>
<div class="rhythm"><div class="icon">☾</div><h3>Evening</h3><p class="muted">Lighter, warm and easy to digest.</p><a href="../collections/soups-broths/">Soups</a> · <a href="../collections/salads-bowls/">Bowls</a></div></div></div></section>
<section class="block" id="seasons"><div class="wrap"><div class="section-head"><span class="eyebrow">Ritucharya</span><h2>Eating with the seasons</h2><p class="muted">A gentle guide, not a prescription: warmer, heartier food as it cools; fresher, lighter food in the heat; hot, simple snacks in the rains.</p></div>
<div class="grid cols-3"><div class="panel"><h3>Cool season</h3><p class="muted">Soups, khichdi, dals, stews.</p>${mini(winter)}</div><div class="panel"><h3>Hot season</h3><p class="muted">Salads, chaat, yogurt, cooling herbs.</p>${mini(summer)}</div><div class="panel"><h3>Monsoon</h3><p class="muted">Warm, freshly cooked snacks and bowls.</p>${mini(monsoon)}</div></div></div></section>
<section class="block alt"><div class="wrap"><div class="section-head"><span class="eyebrow">How we cook</span><h2>Principles for a modern kitchen</h2></div><div class="grid cols-3">
${[['Legumes at the centre','Pulses, tofu, soy and beans anchor most recipes, giving protein and fibre.'],['Measured oil, no ghee or cream','Unsaturated oils in small amounts keep recipes light on saturated fat.'],['Whole grains, smaller portions','Millets, barley, brown rice and whole wheat, in portions that keep carbohydrates moderate.'],['No added sugar','Sweetness comes from fruit, vegetables and spice.'],['Fresh, simple and warm','Cook from scratch, taste as you go, season at the end.'],['Nut-free and egg-free','Recipes are designed without nuts or eggs. Always check labels for cross-contact.']].map(([a,b])=>`<div class="taste"><b>${a}</b><span>${b}</span></div>`).join('')}</div></div></section>`}));

// planner
write('planner/index.html',layout({title:'Weekly planner, shopping list & protein tracker | World Wellbeing Kitchen',desc:'Plan lunch and dinner for the week, build a shopping list, and tally your daily protein.',depth:1,active:'planner',canonical:'/planner/',
 body:`<div class="page-head"><div class="wrap"><span class="eyebrow">Kitchen tools</span><h1>Plan your week</h1><p class="lead muted" style="max-width:40em">Your choices are saved in this browser only.</p></div></div>
<section class="block" style="padding-top:20px"><div class="wrap"><div class="tabs" role="tablist"><button class="tab" role="tab" aria-selected="true" data-tab="plan">Weekly planner</button><button class="tab" role="tab" aria-selected="false" data-tab="shop">Shopping list</button><button class="tab" role="tab" aria-selected="false" data-tab="track">Protein tracker</button></div>
<div id="tab-plan"><div class="metrics" style="margin-top:0"><div class="metric"><b id="avgProtein">0 g</b><span>Avg planned protein / day</span></div><div class="metric"><b id="mealCount">0</b><span>Meals chosen</span></div></div><div class="planner" id="plannerGrid"></div><p class="muted" style="font-size:.88rem;margin-top:14px">Add a protein-rich breakfast and snack too: one main meal alone may not meet your day's needs.</p></div>
<div id="tab-shop" hidden><div class="panel"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px"><b id="shopCount">0 ingredients</b><span><button class="btn small" id="copyShop">Copy list</button> <button class="btn small" onclick="window.print()">Print</button></span></div><div class="shopping" id="shopList"></div></div></div>
<div id="tab-track" hidden><div class="panel"><div class="tracker"><div><label for="goal">Daily protein goal (g)</label><input class="field" type="number" id="goal" value="100" min="1"></div><div><label for="t-b">Breakfast (g)</label><input class="field" type="number" id="t-b" value="0" min="0"></div><div><label for="t-l">Lunch (g)</label><input class="field" type="number" id="t-l" value="0" min="0"></div><div><label for="t-d">Dinner (g)</label><input class="field" type="number" id="t-d" value="0" min="0"></div><div><label for="t-s">Snacks (g)</label><input class="field" type="number" id="t-s" value="0" min="0"></div></div>
<p style="margin-top:18px"><b id="tTotal">0 g consumed</b> · <span id="tLeft" class="muted">100 g to goal</span></p><div class="progress"><span id="tBar"></span></div><p class="muted" id="tMsg" style="margin-top:10px"></p></div><div class="note" style="margin-top:14px">Protein needs vary with body size, activity, kidney health and clinical context. 100 g is an editable planning figure, not a prescription.</div></div></div></section>`}));

// about
write('about/index.html',layout({title:'Our approach | World Wellbeing Kitchen',desc:'How World Wellbeing Kitchen develops recipes, cites sources, credits photographs, and what the nutrition labels mean.',depth:1,active:'about',canonical:'/about/',
 body:`<div class="page-head"><div class="wrap"><span class="eyebrow">By Sadhna Dixit</span><h1>Our approach</h1><p class="lead muted" style="max-width:42em">Traditional wisdom. Modern nutrition. A healthier world. World Wellbeing Kitchen is a growing collection of vegetarian and vegan recipes for enjoyable everyday cooking, built around plant protein, fibre and practical methods.</p></div></div>
<section class="block" style="padding-top:20px"><div class="wrap" style="max-width:820px">
<h2>How recipes are made</h2><p>Each recipe is an original adaptation written for two servings. We aim for plant-forward protein, measured unsaturated oil, no ghee, butter or cream, no added sugar and no nuts or eggs. Stovetop, oven, air-fryer and microwave recipes each describe the method for that appliance. Timings are starting estimates until tested in your kitchen.</p>
<h2 id="labels">Dietary labels</h2><p>Vegan recipes contain no animal-derived ingredients. Vegetarian recipes may include dairy and contain no meat, fish or eggs. Check packaged ingredients for hidden animal-derived ingredients and allergens.</p>
<h2 id="sources">Sources and photo credits</h2><p>Where a published recipe inspired a dish, we link to it on the recipe page. Links are inspiration, not copied text. Recipes without a listed source were developed from standard techniques. Some links come from the sites' own sitemaps and from our earlier research, and some sites block automated link checks, so a link may occasionally have moved.</p>
<p>Photographs come only from Wikimedia Commons files carrying an open licence (Creative Commons or public domain), credited to their creators on each page. Where we could not find an openly licensed photograph of the same dish, we may show a similar dish, clearly labelled, or none at all. We do not use photographs from recipe blogs or stock services without permission.</p>
<h2 id="disclaimer">Health disclaimer</h2><p>Nutrition values are estimates per serving, not laboratory analyses. They vary with brands, ingredient size, cooking yield and portion. This site is educational and is not medical advice. It does not diagnose, prevent or treat any condition, and no recipe is claimed to lower LDL cholesterol or HbA1c. People managing diabetes, prediabetes, kidney disease or high cholesterol should follow the plan of their clinician or registered dietitian. Ayurveda-inspired ideas on this site are cooking traditions, not treatments.</p>
<h2>Reference guidance</h2><ul><li><a href="https://nin.res.in/dietaryguidelines/pdfjs/locale/DGI_2024.pdf" target="_blank" rel="noopener">ICMR-NIN Dietary Guidelines for Indians (2024)</a></li><li><a href="https://www.jacc.org/doi/10.1016/j.jacc.2025.11.016" target="_blank" rel="noopener">2026 ACC/AHA dyslipidemia guideline, dietary management</a></li><li><a href="https://professional.diabetes.org/sites/dpro/files/2025-05/PE25-Plan-Your-Plate-FINAL-5-22-25.pdf" target="_blank" rel="noopener">American Diabetes Association: Plan Your Plate</a></li><li><a href="https://fdc.nal.usda.gov/" target="_blank" rel="noopener">USDA FoodData Central</a></li></ul></div></section>`}));

// home
const featured=['palak-tofu','light-dal-makhani','baked-falafel-with-yogurt-dip','moong-dal-chilla','mulligatawny-lentil-soup','air-fryer-gobi-and-tofu-65'].map(s=>bySlug[s]).filter(Boolean);
const vegan=recipes.filter(r=>r.vegan).length,hp=recipes.filter(r=>r.protein>=15).length;
write('index.html',layout({title:'World Wellbeing Kitchen | Traditional home cooking, redesigned for modern life',desc:'300 plant-forward recipes inspired by Indian home-cooking traditions and designed for modern life: high protein, fibre-rich, nut-free, egg-free, no added sugar.',depth:0,canonical:'/',
 body:`<section class="hero"><div class="wrap"><div><span class="eyebrow">Home cooking · Tradition · Modern life</span><h1>Traditional wisdom,<br><em style="color:var(--terracotta)">redesigned for today.</em></h1>
<p class="lead">A collection of plant-forward recipes and kitchen resources inspired by Ayurvedic and regional home-cooking traditions, built for people with busy lives: protein-rich, fibre-rich, nut-free and made with very little oil.</p>
<div class="hero-actions"><a class="btn primary" href="collections/">Explore the collections</a><a class="btn" href="kitchen-wisdom/">Kitchen Wisdom</a></div>
<div class="stats"><div><b>${recipes.length}</b><span>Recipes</span></div><div><b>${vegan}</b><span>Fully vegan</span></div><div><b>${hp}</b><span>With 15 g+ protein</span></div><div><b>4</b><span>Ways to cook: stove, oven, air fryer, microwave</span></div></div></div>
<div class="mandala" aria-hidden="true"><div class="mandala-label">Shad rasa<br><small style="font:600 .7rem var(--sans);letter-spacing:.12em;text-transform:uppercase">the six tastes</small></div></div></div></section>
<section class="block"><div class="wrap"><div class="section-head"><span class="eyebrow">Cook by the clock</span><h2>What does your day need?</h2><p class="muted">Traditional meal rhythms, simplified: a protein-rich morning, a grounded midday meal, a light and warm evening.</p></div>
<div class="grid cols-3"><div class="rhythm"><div class="icon">☀</div><h3>Morning</h3><p class="muted">Chillas, idlis, upma and warm porridges.</p><a href="collections/morning-meals/">Morning Meals →</a></div>
<div class="rhythm"><div class="icon">☼</div><h3>Midday</h3><p class="muted">Dals, sabzis, paneer and tofu, khichdi and millets.</p><a href="collections/dals-beans/">Dals</a> · <a href="collections/sabzi-curry/">Sabzi</a> · <a href="collections/paneer-tofu/">Paneer &amp; Tofu</a></div>
<div class="rhythm"><div class="icon">☾</div><h3>Evening</h3><p class="muted">Soups, bowls and light grains.</p><a href="collections/soups-broths/">Soups</a> · <a href="collections/salads-bowls/">Bowls</a></div></div></div></section>
<section class="block alt"><div class="wrap"><div class="section-head"><span class="eyebrow">Fourteen collections</span><h2>Find your next favourite</h2></div>
${Object.keys(GROUPS).map(g=>`<h3 style="margin:24px 0 12px">${GROUPS[g][0]}</h3><div class="grid cols-3">${COLLECTIONS.filter(c=>c.group===g).map(c=>`<a class="collection-card" style="--tile:${c.tile}" href="collections/${c.slug}/"><div><h3>${esc(c.title)}</h3><p>${esc(c.blurb)}</p></div><span class="count">${c.items.length} recipes</span></a>`).join('')}</div>`).join('')}</div></section>
<section class="block"><div class="wrap"><div class="section-head"><span class="eyebrow">Start here</span><h2>Six dishes to cook this week</h2></div><div class="grid cols-3">${featured.map(r=>card(r,0)).join('')}</div><p style="margin-top:22px"><a class="btn" href="browse/">Browse all ${recipes.length} recipes</a></p></div></section>
<section class="block alt"><div class="wrap grid cols-2" style="align-items:center;gap:40px"><div><span class="eyebrow">A resource, not a rulebook</span><h2>Ideas from the old kitchen, tuned for modern life</h2><p class="muted">The six tastes, the spice shelf, the rhythm of the day and the turn of the seasons: practical ideas from India's home-cooking traditions that make everyday meals more balanced and more enjoyable.</p><a class="btn primary" href="kitchen-wisdom/">Read Kitchen Wisdom</a></div>
<div class="panel"><b>Plan the week</b><p class="muted">Pick lunches and dinners, get a shopping list, and tally your protein for the day.</p><a class="btn" href="planner/">Open the planner</a></div></div></section>`}));

// misc
write('404.html',layout({title:'Page not found | World Wellbeing Kitchen',desc:'Page not found',depth:0,body:'<section class="block"><div class="wrap" style="text-align:center"><h1>Page not found</h1><p><a class="btn primary" href="/">Back to the kitchen</a></p></div></section>'}));
fs.writeFileSync(path.join(dist,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${DOMAIN}/sitemap.xml\n`);
const urls=['/','/collections/','/browse/','/kitchen-wisdom/','/planner/','/about/',...COLLECTIONS.map(c=>`/collections/${c.slug}/`),...recipes.map(r=>`/recipes/${r.slug}/`)];
fs.writeFileSync(path.join(dist,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`<url><loc>${DOMAIN}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log('built',urls.length,'pages;',recipes.filter(r=>r.photo).length,'with photos ->',dist);
