(()=>{
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const root=document.body.dataset.root||'./';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};

// mobile menu
const tg=$('.nav-toggle');if(tg)tg.addEventListener('click',()=>{const o=$('#nav').classList.toggle('open');tg.setAttribute('aria-expanded',o)});

// collection page: search + filters on pre-rendered cards
const grid=$('[data-grid]');
if(grid){
  const q=$('[data-search]'),cards=$$('.card',grid),count=$('[data-count]'),flags={};
  const run=()=>{const t=q.value.trim().toLowerCase();let n=0;cards.forEach(c=>{const ok=(!t||c.dataset.name.includes(t))&&(!flags.vegan||c.dataset.vegan==='1')&&(!flags.protein||+c.dataset.protein>=15);c.hidden=!ok;if(ok)n++});count.textContent=n+' of '+cards.length+' recipes'};
  q.addEventListener('input',run);
  $$('[data-flag]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.flag;flags[k]=!flags[k];b.setAttribute('aria-pressed',flags[k]);run()}));
  run();
}

// browse page
const bg=$('#grid');
if(bg&&$('#q')){
  fetch(root+'recipes/index.json').then(r=>r.json()).then(all=>{
    const st={q:'',vegan:false,protein:false,fibre:false,col:'',method:''},PAGE=60;let shown=PAGE;
    const params=new URLSearchParams(location.search);if(params.get('q')){st.q=params.get('q');$('#q').value=st.q}
    const card=r=>`<article class="card"><a class="cover" href="${root}recipes/${r.slug}/"><div class="thumb" style="--tile:${r.tile}">${r.img?`<img src="${esc(r.img)}" alt="${esc(r.name)}" loading="lazy" width="500" height="375">`:`<span class="glyph" aria-hidden="true">${esc(r.glyph)}</span>`}<span class="badge">${r.vegan?'VEGAN':'VEGETARIAN'}</span>${r.similar?'<span class="similar">Similar dish</span>':''}</div><div class="card-body"><div class="meta"><span>${esc(r.colTitle)}</span></div><h3>${esc(r.name)}</h3><div class="meta"><span>${r.mins} min</span><span>${r.cal} kcal</span><span>${r.carbs} g carbs</span><span>${r.fiber} g fibre</span><span class="protein">${r.protein} g<small style="font:600 .7rem var(--sans);color:var(--muted)"> protein</small></span></div><div class="chips">${r.tags.map(t=>`<span class="chip${t==='High protein'?' warm':''}">${t}</span>`).join('')}</div></div></a></article>`;
    const render=()=>{
      const t=st.q.toLowerCase();
      const list=all.filter(r=>(!t||r.name.toLowerCase().includes(t)||r.colTitle.toLowerCase().includes(t))&&(!st.vegan||r.vegan)&&(!st.protein||r.protein>=15)&&(!st.fibre||r.fiber>=8)&&(!st.col||r.col===st.col)&&(!st.method||r.method===st.method));
      $('#count').textContent=list.length+' recipes';
      bg.innerHTML=list.slice(0,shown).map(card).join('')||'<p>No recipes match those filters.</p>';
      $('#more').hidden=list.length<=shown;
    };
    $('#q').addEventListener('input',e=>{st.q=e.target.value;shown=PAGE;render()});
    $$('[data-f]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.f;st[k]=!st[k];b.setAttribute('aria-pressed',st[k]);shown=PAGE;render()}));
    $('#col').addEventListener('change',e=>{st.col=e.target.value;shown=PAGE;render()});
    $('#method').addEventListener('change',e=>{st.method=e.target.value;shown=PAGE;render()});
    $('#more').addEventListener('click',()=>{shown+=PAGE;render()});
    render();
  }).catch(()=>{bg.innerHTML='<p>Recipes could not be loaded. Please refresh the page.</p>'});
}

// planner data (shared by recipe pages and planner page)
const DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],MEALS=['lunch','dinner'];
const getPlan=()=>store.get('wwk-plan',{}),setPlan=p=>store.set('wwk-plan',p);

// add-to-planner button on recipe pages
$$('[data-add]').forEach(b=>b.addEventListener('click',()=>{
  const id=+b.dataset.add,p=getPlan();
  for(const d of DAYS)for(const m of MEALS){if(!(p[d]&&p[d][m])){p[d]=p[d]||{};p[d][m]=id;setPlan(p);b.textContent='Added to '+d+' '+m+' ✓';b.disabled=true;return}}
  b.textContent='Planner is full';
}));

// planner page
if($('#plannerGrid')){
  fetch(root+'recipes/all.json').then(r=>r.json()).then(all=>{
    const byId=Object.fromEntries(all.map(r=>[r.id,r]));
    const opts='<option value="">Choose a recipe…</option>'+all.map(r=>`<option value="${r.id}">${esc(r.name)} · ${r.protein} g protein</option>`).join('');
    const checked=new Set(store.get('wwk-checked',[]));
    const render=()=>{
      const p=getPlan();
      $('#plannerGrid').innerHTML=DAYS.map(d=>`<div class="day"><h3>${d}</h3>${MEALS.map(m=>`<div class="meal"><label for="${d}-${m}">${m}</label><select id="${d}-${m}" data-d="${d}" data-m="${m}">${opts.replace(`value="${(p[d]||{})[m]||'x'}"`,`value="${(p[d]||{})[m]||'x'}" selected`)}</select></div>`).join('')}<div class="muted" style="font-size:.82rem">${(()=>{let s=0;MEALS.forEach(m=>{const r=byId[(p[d]||{})[m]];if(r)s+=r.protein});return 'Planned protein: '+s+' g'})()}</div></div>`).join('');
      let total=0,n=0;DAYS.forEach(d=>MEALS.forEach(m=>{const r=byId[(p[d]||{})[m]];if(r){total+=r.protein;n++}}));
      $('#mealCount').textContent=n;$('#avgProtein').textContent=Math.round(total/7)+' g';
      // shopping
      const items={};DAYS.forEach(d=>MEALS.forEach(m=>{const r=byId[(p[d]||{})[m]];if(r)r.ingredients.forEach(i=>{items[i.split(',')[0].toLowerCase().trim()+'|'+r.id]=i})}));
      const vals=[...new Set(Object.values(items))];$('#shopCount').textContent=vals.length+' ingredients';
      $('#shopList').innerHTML=vals.length?vals.map((v,i)=>`<label><input type="checkbox" data-i="${esc(v)}" ${checked.has(v)?'checked':''}><span>${esc(v)}</span></label>`).join(''):'<p class="muted">Choose lunch or dinner recipes in the planner to build your shopping list.</p>';
    };
    document.addEventListener('change',e=>{
      const s=e.target.closest('select[data-d]');if(s){const p=getPlan();p[s.dataset.d]=p[s.dataset.d]||{};if(s.value)p[s.dataset.d][s.dataset.m]=+s.value;else delete p[s.dataset.d][s.dataset.m];setPlan(p);render()}
      const c=e.target.closest('input[data-i]');if(c){c.checked?checked.add(c.dataset.i):checked.delete(c.dataset.i);store.set('wwk-checked',[...checked])}
    });
    $('#copyShop').addEventListener('click',()=>{const t=$$('#shopList span').map(s=>s.textContent).join('\n');navigator.clipboard?.writeText(t).then(()=>alert('Shopping list copied.'),()=>alert(t))});
    render();
  });
  $$('.tab').forEach(t=>t.addEventListener('click',()=>{$$('.tab').forEach(x=>x.setAttribute('aria-selected',x===t));['plan','shop','track'].forEach(k=>$('#tab-'+k).hidden=k!==t.dataset.tab)}));
  const ids=['goal','t-b','t-l','t-d','t-s'],saved=store.get('wwk-track',{});ids.forEach(i=>{if(saved[i]!=null)$('#'+i).value=saved[i]});
  const upd=()=>{const g=Math.max(1,+$('#goal').value||100),tot=['t-b','t-l','t-d','t-s'].reduce((s,i)=>s+(+$('#'+i).value||0),0),pc=Math.min(100,tot/g*100);
    $('#tTotal').textContent=tot+' g consumed';$('#tLeft').textContent=Math.max(0,g-tot)+' g to goal';$('#tBar').style.width=pc+'%';
    $('#tMsg').textContent=tot>=g?'You have reached your entered protein goal.':'You have logged '+Math.round(pc)+'% of your entered goal.';
    store.set('wwk-track',Object.fromEntries(ids.map(i=>[i,$('#'+i).value])))};
  ids.forEach(i=>$('#'+i).addEventListener('input',upd));upd();
}
})();
