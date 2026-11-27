const fs=require('fs');const root=require('path').join(__dirname,'..')+'/';
const man=JSON.parse(fs.readFileSync(root+'recipes/manifest.json','utf8')).recipes;
const rs=man.map(f=>({f,r:JSON.parse(fs.readFileSync(root+f,'utf8'))}));
const bad=[];const seen={},names={};
const nuts=/\b(almond|cashew|walnut|pistachio|pecan|hazelnut|peanut|macadamia|pine nut|nut butter|badam|kaju)s?\b/i;
const eggs=/\b(eggs?|mayonnaise)\b(?!-free)/i;
const sugar=/(sugar|jaggery|honey|maple|syrup)/i; // ingredient lists only; "no added sugar" notes are stripped below
const sat=/(ghee|butter(?! beans)|cream|coconut oil|palm)/i;
for(const {f,r} of rs){
 const t=r.ingredients.join(' | ')+' '+r.steps.join(' ');
 const need=['id','name','category','protein','cal','carbs','fiber','fat','mins','prep','cook','ingredients','steps','note','servings'];
 for(const k of need)if(r[k]===undefined||r[k]===null||r[k]==='')bad.push(r.id+' missing '+k);
 if(seen[r.id])bad.push(r.id+' dup id');seen[r.id]=1;
 if(names[r.name.toLowerCase()])bad.push(r.id+' dup name '+r.name);names[r.name.toLowerCase()]=1;
 if(nuts.test(t))bad.push(r.id+' '+r.name+' NUT: '+t.match(nuts)[0]);
 if(/eggs?/i.test(t.replace(/egg-free|eggless|flax egg/ig,"")))bad.push(r.id+" "+r.name+" EGG");
 if(sugar.test(r.ingredients.join(" ").replace(/no added sugar/ig,"")))bad.push(r.id+" "+r.name+" SUGAR");
 if(sat.test(r.ingredients.join(' ')))bad.push(r.id+' '+r.name+' SATFAT');
 const c=r.calorieCalculation==='fiber-adjusted-atwater'?4*r.protein+4*(r.carbs-r.fiber)+2*r.fiber+9*r.fat:4*r.protein+4*r.carbs+9*r.fat;if(Math.abs(c-r.cal)>12)bad.push(r.id+' cal mismatch '+r.cal+' vs '+c);
 if(r.fiber>r.carbs)bad.push(r.id+' fibre>carbs');
 if(/main vegetable, pulse|named in the dish|Wash and prepare the vegetables, pulses/i.test(t))bad.push(r.id+' TEMPLATE TEXT');
 if(r.mins!==r.prep+r.cook)bad.push(r.id+' mins!=prep+cook');
}
console.log('recipes',rs.length,'ids',Math.min(...rs.map(x=>x.r.id)),'-',Math.max(...rs.map(x=>x.r.id)));
const miss=[];for(let i=1;i<=300;i++)if(!seen[i])miss.push(i);console.log('missing ids',miss.join(',')||'none');
console.log(bad.length?bad.join('\n'):'NO ISSUES');
const R=rs.map(x=>x.r);
console.log('P>=15:',R.filter(r=>r.protein>=15).length,' P10-14:',R.filter(r=>r.protein>=10&&r.protein<15).length,' P<10:',R.filter(r=>r.protein<10).map(r=>r.id+' '+r.name+' '+r.protein).join('; ')||0);
console.log('C>45:',R.filter(r=>r.carbs>45).map(r=>r.id+' '+r.name+' '+r.carbs).join('; ')||0);
console.log('fibre<5:',R.filter(r=>r.fiber<5).length,' vegan:',R.filter(r=>r.vegan).length,' veg:',R.filter(r=>!r.vegan).length);
