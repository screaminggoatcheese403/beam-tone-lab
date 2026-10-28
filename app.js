/* BEAM Tone Lab • no framework, no third-party tracking or CDNs */
(() => {
'use strict';
const db = window.BEAM_DATA;
if (!db?.models?.length) { document.body.textContent = 'Equipment database failed to load.'; return; }
const $ = id => document.getElementById(id);
const copy = value => JSON.parse(JSON.stringify(value));
const norm = s => String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const clamp = (n, min, max) => Math.max(min,Math.min(max,Math.round(Number(n)||0)));
const bySection = sec => db.models.filter(x=>x.section === sec).map(x=>x.name);
const post = db.models.filter(x=>x.section === 'Post-FX');
const slots = [
  {key:'pre',label:'PRE EFFECT',icon:'◉',options:['',...bySection('Pre-FX')]},
  {key:'amp',label:'AMPLIFIER',icon:'▤',options:bySection('Amp')},
  {key:'cab',label:'CABINET',icon:'▥',options:bySection('Cabinet')},
  {key:'mic',label:'MIC',icon:'◌',options:bySection('Cabinet Mic')},
  {key:'mod',label:'MODULATION',icon:'≈',options:['',...post.filter(x=>!['Delay','Reverb'].includes(x.type)).map(x=>x.name)]},
  {key:'delay',label:'DELAY',icon:'⟲',options:['',...post.filter(x=>x.type==='Delay').map(x=>x.name)]},
  {key:'reverb',label:'REVERB',icon:'〰',options:['',...post.filter(x=>x.type==='Reverb').map(x=>x.name)]}
];
const keys = ['gain','bass','mid','treble'];
const SLOT_MAP = Object.fromEntries(slots.map(x=>[x.key,x]));
const allNames = new Set(db.models.map(x=>x.name));
const SONGS = [
  ['rumble','link-wray','Rumble · Link Wray'],['jack the ripper','link-wray','Jack the Ripper · Link Wray'],['raw hide','link-wray','Rawhide · Link Wray'],['rawhide','link-wray','Rawhide · Link Wray'],['ace of spades','link-wray','Ace of Spades · Link Wray'],
  ['rebel rouser','duane-eddy','Rebel Rouser · Duane Eddy'],['peter gunn','duane-eddy','Peter Gunn · Duane Eddy'],['because they re young','duane-eddy','Because They’re Young · Duane Eddy'],
  ['chinese rocks','johnny-thunders','Chinese Rocks · Johnny Thunders'],['born to lose','johnny-thunders','Born to Lose · Johnny Thunders'],['you can t put your arms around a memory','johnny-thunders','You Can’t Put Your Arms Around a Memory · Johnny Thunders'],
  ['blitzkrieg bop','johnny-ramone-ramones','Blitzkrieg Bop · Ramones'],['sheena is a punk rocker','johnny-ramone-ramones','Sheena Is a Punk Rocker · Ramones'],
  ['human fly','poison-ivy-the-cramps','Human Fly · The Cramps'],['goo goo muck','poison-ivy-the-cramps','Goo Goo Muck · The Cramps'],['garbageman','poison-ivy-the-cramps','Garbageman · The Cramps'],
  ['misirlou','surf','Misirlou · Vintage Surf'],['pipeline','surf','Pipeline · Vintage Surf'],['surf rider','surf','Surf Rider · Vintage Surf'],['walk don t run','surf','Walk, Don’t Run · Vintage Surf'],
  ['apache','spaghetti','Apache · Twang Instrumental'],['ghost riders in the sky','spaghetti','Ghost Riders in the Sky · Western Twang'],
  ['rock around the clock','rockabilly','Rock Around the Clock · Rockabilly'],
  ['last caress','misfits-franche-coma-doyle','Last Caress · Misfits'],['green hell','misfits-franche-coma-doyle','Green Hell · Misfits'],
  ['holiday','green-day-billie-joe-armstrong','Holiday · Green Day'],['basket case','green-day-billie-joe-armstrong','Basket Case · Green Day'],
  ['highway to hell','malcolm-young-ac-dc','Highway to Hell · AC/DC'],['back in black','malcolm-young-ac-dc','Back in Black · AC/DC'],
  ['master of puppets','metallica-classic-80s','Master of Puppets · Metallica'],['seek and destroy','metallica-classic-80s','Seek & Destroy · Metallica'],
  ['sex beat','the-gun-club-jeffrey-lee-pierce','Sex Beat · The Gun Club']
];
const alias = [
  [/\b(cramps|poison ivy)\b/,'poison-ivy-the-cramps'],[/\b(link wray|rumble)\b/,'link-wray'],[/\b(duane eddy)\b/,'duane-eddy'],[/\b(johnny thunders|new york dolls|heartbreakers)\b/,'johnny-thunders'],
  [/\b(ramones|johnny ramone)\b/,'johnny-ramone-ramones'],[/\b(misfits|doyle|franche coma)\b/,'misfits-franche-coma-doyle'],[/\b(green day|billie joe)\b/,'green-day-billie-joe-armstrong'],[/\b(metallica|james hetfield|kirk hammett)\b/,'metallica-classic-80s'],[/\b(malcolm young|ac dc|angus young)\b/,'malcolm-young-ac-dc'],[/\b(gun club|jeffrey lee pierce)\b/,'the-gun-club-jeffrey-lee-pierce']
];
const styleTriggers = [
  [/\b(surf|dick dale|reverb drenched|beach|twang instrumental)\b/,'surf'],
  [/\b(spaghetti|western|morricone|cinematic|spy|shadows|en nio|twilight)\b/,'spaghetti'],
  [/\b(rockabilly|slapback|gene vincent|eddie cochran|stray cats|brian setzer|elvis)\b/,'rockabilly'],
  [/\b(garage|the sonics|trashmen|fuzz garage|primitive|swamp)\b/,'garage'],
  [/\b(punk|distillers|stooges|sex pistols|raw rock|proto punk)\b/,'punk'],
  [/\b(fuzz|psych|hendrix|big muff|fuzz face)\b/,'fuzz'],
  [/\b(metal|thrash|doom|heavy)\b/,'metal'],
  [/\b(clean|jazz|ambient|soft|sparkle)\b/,'clean']
];
const fallbackStyles = new Map(db.styles.map(x=>[x.key,x]));
const artistById = new Map(db.artists.map(x=>[x.id,x]));
const storageKey='beamtonelab.saved.v1'; const urlKey='beamtonelab.workerurl.v1';
let stored = []; try { stored = JSON.parse(localStorage.getItem(storageKey)||'[]'); if(!Array.isArray(stored)) stored=[]; }catch{}
stored=stored.filter(x=>x && typeof x.title==='string' && x.amp && x.cab).slice(0,80);
let workerUrl = localStorage.getItem(urlKey)||'';
let passphrase=''; let recipe; let toastTimer;

function safeRecipe(raw){
 const base=copy(db.styles[0]);
 const r={...base,...raw};
 for(const {key,options} of slots) {
   const v=String(r[key]||'');
   r[key]=options.includes(v) ? v : (['amp','cab','mic'].includes(key) ? base[key] : '');
 }
 r.pickup=['Bridge','Middle','Neck'].includes(r.pickup)?r.pickup:'Bridge';
 for(const key of keys)r[key]=clamp(r[key],0,10);
 r.isf=clamp(r.isf,0,100);
 for(const key of ['title','notes','guide','pickNote','origin'])r[key]=String(r[key]||'').slice(0,600);
 if(!r.title)r.title='Untitled sound';
 return r;
}
function findLocal(query){
 const q=norm(query);
 const song=SONGS.find(row=>q===row[0] || q.startsWith(row[0]+' ') || q.endsWith(' '+row[0]) || q.includes(' '+row[0]+' '));
 if(song){const target=artistById.get(song[1])||fallbackStyles.get(song[1]);if(target)return safeRecipe({...target,title:song[2],origin:'CURATED SONG STARTER',_match:'song',guide:(target.guide||'')+' This is a tonal starting point, not a verified transcription of the recording.'});}
 const found=alias.find(([rx])=>rx.test(q));
 if(found){const art=artistById.get(found[1]);if(art)return safeRecipe({...art,origin:'WORKBOOK ARTIST RECIPE',_match:'artist'});}
 const exactArtist=db.artists.find(x=>norm(x.title)===q || norm(x.title).includes(q)&&q.length>5);
 if(exactArtist)return safeRecipe({...exactArtist,origin:'WORKBOOK ARTIST RECIPE',_match:'artist'});
 const style=styleTriggers.find(([rx])=>rx.test(q));
 if(style){const s=fallbackStyles.get(style[1]);return safeRecipe({...s,title:query,origin:'STYLE-BASED ESTIMATE',_match:'style',notes:`Style-based starting point for “${query}”. ${s.notes}`,guide:'This is a general style estimate. Adjust it by ear; exact song characteristics have not been verified.'});}
 const s=fallbackStyles.get('clean');
 return safeRecipe({...s,title:query,origin:'UNVERIFIED / GENERAL STARTER',_match:'unknown',notes:`“${query}” isn't in the local artist or song library. Here's a neutral Telecaster starting setup — not a researched match.`,guide:'Connect the optional AI generator for unfamiliar songs or artists, or choose a genre like surf, garage, punk or rockabilly.'});
}
function setText(id,text){$(id).textContent=text;}
function render(){
 if(!recipe)return;
 setText('recipeHeading','');
 const h=$('recipeHeading'); const main=document.createTextNode(recipe.title.toUpperCase()+' '); const span=document.createElement('span');span.className='subheading';span.textContent='/ TONE RECIPE';h.append(main,span);
 setText('recipeSource',recipe.origin||'MANUAL TONE EDIT');
 setText('lcdTitle',recipe.title.toUpperCase());
 setText('lcdDescription',recipe.notes||'Start with the settings below, then adjust by ear.');
 setText('lcdFlag',recipe._match==='ai'?'AI ESTIMATE • ADJUST BY EAR':'STARTING POINT • NOT AN EXACT REPRODUCTION');
 setText('engineerNotes',recipe.notes||'');setText('guideNotes',recipe.guide||'');
 setText('pickupNote',recipe.pickNote||'Standard Telecaster single coils · 3-way switch');
 document.querySelectorAll('[data-pickup]').forEach(btn=>{const selected=btn.dataset.pickup===recipe.pickup;btn.classList.toggle('active',selected);btn.setAttribute('aria-pressed',selected?'true':'false')});
 const chain=$('signalChain');chain.replaceChildren();
 for(const slot of slots){
  const item=document.createElement('button');item.type='button';item.className='chain-module'+(!recipe[slot.key]?' module-bypass':'');item.title='Change '+slot.label.toLowerCase();
  const kick=document.createElement('span');kick.className='module-kicker';kick.textContent=slot.label;
  const ico=document.createElement('span');ico.className='module-icon';ico.textContent=slot.icon;
  const val=document.createElement('span');val.className='module-value';val.textContent=recipe[slot.key]||'BYPASS';
  const edit=document.createElement('span');edit.className='module-edit';edit.textContent='CHANGE ›';
  item.append(kick,ico,val,edit);item.addEventListener('click',()=>editSlot(item,slot));chain.append(item);
 }
 $('faderRack').replaceChildren();
 for(const key of keys){
  const holder=document.createElement('div');holder.className='fader-unit';
  const output=document.createElement('output');output.className='fader-number';output.textContent=String(recipe[key]).padStart(2,'0');output.setAttribute('for','range-'+key);
  const title=document.createElement('div');title.className='fader-name';title.textContent=key==='mid'?'MIDS':key.toUpperCase();
  const control=document.createElement('div');control.className='fader-control';const slider=document.createElement('input');slider.type='range';slider.id='range-'+key;slider.min='0';slider.max='10';slider.step='1';slider.value=recipe[key];slider.setAttribute('aria-label',key+' level');
  slider.addEventListener('input',()=>{recipe[key]=Number(slider.value);output.textContent=String(recipe[key]).padStart(2,'0');syncSavedState();});
  const scale=document.createElement('div');scale.className='fader-scale';scale.setAttribute('aria-hidden','true');const lo=document.createElement('span');lo.textContent='0';const hi=document.createElement('span');hi.textContent='10';scale.append(lo,hi);control.append(slider,scale);const led=document.createElement('span');led.className='fader-led';holder.append(output,title,control,led);$('faderRack').append(holder);
 }
 $('isfSlider').value=recipe.isf;setText('isfValue',recipe.isf+'%');syncSavedState();
 $('vuNeedle').style.transform='rotate('+(recipe.gain*5-38)+'deg)';
}
function editSlot(button,slot){
 if(button.querySelector('select'))return;
 const select=document.createElement('select');select.setAttribute('aria-label','Choose '+slot.label);select.className='gear-swap-select';
 for(const name of slot.options){const option=document.createElement('option');option.value=name;option.textContent=name||'BYPASS';select.append(option);}
 select.value=recipe[slot.key];button.replaceWith(select);select.focus();
 // Stop click propagation so re-opening cannot consume the chosen option.
 select.addEventListener('click',event=>event.stopPropagation());
 select.addEventListener('change',()=>{recipe[slot.key]=select.value;render()});
 select.addEventListener('blur',()=>queueMicrotask(()=>{if(select.isConnected)render();}));
 select.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();render();}});
}
function setRecipe(next,scroll=true){recipe=safeRecipe(next);render();if(scroll)$('resultSection').scrollIntoView({behavior:'smooth',block:'start'});}
function toast(message){const e=$('toast');e.textContent=message;e.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove('show'),3300);}
function signature(r){return JSON.stringify({title:r.title,amp:r.amp,cab:r.cab,mic:r.mic,pre:r.pre,mod:r.mod,delay:r.delay,reverb:r.reverb,pickup:r.pickup,gain:r.gain,bass:r.bass,mid:r.mid,treble:r.treble,isf:r.isf});}
function syncSavedState(){const saved=stored.some(x=>signature(x)===signature(recipe));$('saveBtn').textContent=saved?'★ SAVED':'☆ SAVE PRESET';setText('savedCount',stored.length);}
function saveRecipe(){const sig=signature(recipe);const already=stored.findIndex(x=>signature(x)===sig);if(already>=0){stored.splice(already,1);toast('Preset removed from saved library.')}else{stored.unshift({...recipe,_savedAt:new Date().toISOString()});stored=stored.slice(0,80);toast('Preset saved to this browser.')}localStorage.setItem(storageKey,JSON.stringify(stored));syncSavedState();}
function recipeText(r){return [
  'BEAM TONE LAB — '+r.title,'Source: '+(r.origin||'User preset'),'Instrument: Telecaster (bridge + neck single coils)',
  'PICKUP: '+r.pickup,'SIGNAL CHAIN:',...slots.map(x=>`  ${x.label.padEnd(12)} ${r[x.key]||'BYPASS'}`),
  'STARTING LEVELS (0–10):',`  Gain ${r.gain} · Bass ${r.bass} · Mids ${r.mid} · Treble ${r.treble}`,`  ISF ${r.isf}%`,
  'NOTES: '+r.notes,'TIPS: '+r.guide,'', 'Approximate starting point; listen and adjust to taste.'
].join('\n');}
async function copyRecipe(){const val=recipeText(recipe);try{await navigator.clipboard.writeText(val);toast('Recipe copied to clipboard.');}catch{download('beam-tone-recipe.txt',val,'text/plain');toast('Text downloaded (clipboard unavailable).');}}
function download(filename,content,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
function openDialog(id){$(id).showModal();}
function renderInventory(category='All'){
 const row=$('gearFilters');row.replaceChildren();
 for(const title of ['All','Pre-FX','Amp','Cabinet','Cabinet Mic','Post-FX']){
  const b=document.createElement('button');b.type='button';b.className=title===category?'active':'';b.textContent=title; b.addEventListener('click',()=>renderInventory(title));row.append(b);
 }
 const list=$('gearList');list.replaceChildren();
 const matches=db.models.filter(x=>category==='All'||x.section===category);
 for(const m of matches){const el=document.createElement('div');el.className='gear-item';const strong=document.createElement('strong');strong.textContent=m.name;const small=document.createElement('small');small.textContent=m.section.toUpperCase()+' / '+m.type.toUpperCase();const p=document.createElement('p');p.textContent=m.description+(m.equivalent?' · Similar to: '+m.equivalent:'');el.append(strong,small,p);list.append(el);}
}
function renderSaved(){const list=$('savedList');list.replaceChildren();if(!stored.length){const msg=document.createElement('div');msg.className='empty-state';msg.textContent='No presets saved yet. Dial in a tone and press “Save preset.”';list.append(msg);return;}
 for(const [i,r] of stored.entries()){
  const item=document.createElement('div');item.className='saved-item';const left=document.createElement('div');const title=document.createElement('strong');title.textContent=r.title;const sub=document.createElement('small');sub.textContent=r.amp+' / '+r.cab+' · '+r.pickup+' pickup';left.append(title,sub);
  const right=document.createElement('div');right.className='saved-buttons';const load=document.createElement('button');load.textContent='LOAD ↗';load.addEventListener('click',()=>{setRecipe(r);$('libraryDialog').close();toast('Preset loaded into the mixing desk.');});const del=document.createElement('button');del.className='delete';del.textContent='DELETE';del.addEventListener('click',()=>{stored.splice(i,1);localStorage.setItem(storageKey,JSON.stringify(stored));renderSaved();syncSavedState();});right.append(load,del);item.append(left,right);list.append(item);
 }
}
async function askAI(query){
 const response=await fetch(workerUrl.replace(/\/$/,'')+'/generate',{method:'POST',mode:'cors',credentials:'omit',headers:{'content-type':'application/json','x-tone-passphrase':passphrase},body:JSON.stringify({query})});
 const body=await response.json().catch(()=>({}));if(!response.ok)throw Error(body.error||`Service error ${response.status}`);
 if(!body.recipe||!body.recipe.amp||!body.recipe.cab)throw Error('No usable recipe was returned.');
 const result=safeRecipe({...body.recipe,origin:'AI / TONAL ESTIMATE',_match:'ai'});return result;
}
async function submitQuery(query){
 const clean=String(query||'').trim().slice(0,160);if(!clean)return;
 $('toneQuery').value=clean; const button=$('generateBtn');
 if(workerUrl&&passphrase){button.disabled=true;button.textContent='✦ GENERATING RECIPE...';setText('modeStatus','AI GENERATOR CONNECTED');
 try{const answer=await askAI(clean);setRecipe(answer);toast('AI recipe generated. Compare by ear.');}
 catch(e){setRecipe(findLocal(clean));toast('AI unavailable: '+String(e.message).slice(0,95)+' — using local library.');}
 finally{button.disabled=false;button.replaceChildren();button.innerHTML='<span class="generate-spark">✦</span> DIAL IT IN <span class="generate-arrow">↗</span>';}
 }else{const result=findLocal(clean);setRecipe(result);if(result._match==='unknown')toast('Not in the local library. Shown a general starter, not a verified match.');}
}
function refreshMode(){const connected=!!(workerUrl&&passphrase);setText('modeStatus',connected?'AI GENERATOR CONNECTED':'LOCAL LIBRARY ACTIVE');setText('aiHeadline',connected?'AI connected.':'Local by default.');setText('aiSummary',connected?'Your secure Worker is connected. Type an unfamiliar song or guitarist to request a new, equipment-limited recipe.':'The starter version recognizes workbook artists and selected songs/styles. For anything else, connect the optional secure AI service.');}
$('toneForm').addEventListener('submit',event=>{event.preventDefault();submitQuery($('toneQuery').value);});
document.querySelectorAll('.chip').forEach(button=>button.addEventListener('click',()=>submitQuery(button.dataset.query)));
document.querySelectorAll('[data-pickup]').forEach(button=>button.addEventListener('click',()=>{recipe.pickup=button.dataset.pickup;render()}));
$('isfSlider').addEventListener('input',event=>{recipe.isf=Number(event.target.value);setText('isfValue',recipe.isf+'%');syncSavedState();});
$('copyBtn').addEventListener('click',copyRecipe);$('saveBtn').addEventListener('click',saveRecipe);
$('gearBtn').addEventListener('click',()=>{renderInventory();openDialog('gearDialog')});$('libraryBtn').addEventListener('click',()=>{renderSaved();openDialog('libraryDialog')});
$('settingsBtn').addEventListener('click',openSettings);$('connectBtn').addEventListener('click',openSettings);
function openSettings(){$('workerUrl').value=workerUrl; $('workerPassword').value=passphrase;openDialog('settingsDialog')}
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>$(button.dataset.close).close()));
$('settingsForm').addEventListener('submit',event=>{event.preventDefault();const url=$('workerUrl').value.trim().replace(/\/$/,'');const secret=$('workerPassword').value;
 if(url&&!/^https:\/\//i.test(url)){toast('Use an HTTPS Worker URL.');return;}workerUrl=url;passphrase=url?secret:'';
 if(workerUrl)localStorage.setItem(urlKey,workerUrl);else localStorage.removeItem(urlKey);
 $('settingsDialog').close();refreshMode();toast(workerUrl&&passphrase?'AI generator configured.':'Local library mode enabled.');
});
$('disconnectBtn').addEventListener('click',()=>{workerUrl='';passphrase='';localStorage.removeItem(urlKey);$('settingsDialog').close();refreshMode();toast('Disconnected. Local mode only.');});
$('exportAllBtn').addEventListener('click',()=>{if(!stored.length){toast('No saved presets to export.');return;}download('beam-tone-presets.json',JSON.stringify({format:'beam-tone-lab-presets',version:1,presets:stored},null,2),'application/json');});
$('importBtn').addEventListener('click',()=>$('importFile').click());
$('importFile').addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;
 try{if(file.size>500000)throw Error('File is too large');const data=JSON.parse(await file.text());if(data.format!=='beam-tone-lab-presets'||!Array.isArray(data.presets))throw Error('Not a BEAM Tone Lab export');
  const imports=data.presets.slice(0,80).filter(x=>x && typeof x.title==='string').map(x=>safeRecipe(x));stored=[...imports,...stored].filter((x,i,a)=>a.findIndex(y=>signature(y)===signature(x))===i).slice(0,80);localStorage.setItem(storageKey,JSON.stringify(stored));renderSaved();syncSavedState();toast('Presets imported.');
 }catch(err){toast('Could not import: '+err.message);}finally{event.target.value='';}
});
setText('modelCount',db.models.length);refreshMode();setRecipe({...artistById.get('link-wray'),origin:'WORKBOOK ARTIST RECIPE',_match:'artist'},false);
})();
