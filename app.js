/* BEAM TONE LAB V4 — static, offline-capable song and tone catalogue. No paid API. */
(() => {
'use strict';
const db=window.BEAM_DATA, catalog=window.BEAM_SONGS, instruments=window.BEAM_INSTRUMENTS;
const $=id=>document.getElementById(id);
if(!db?.models?.length || !Array.isArray(catalog?.songs) || !instruments?.length){document.body.textContent='BEAM Tone Lab could not load the equipment or song database. Upload every file from the ZIP at the root of the repository.';return;}
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Math.round(Number(v)||0)));
const copy=v=>JSON.parse(JSON.stringify(v));
const types=sec=>db.models.filter(x=>x.section===sec).map(x=>x.name);
const post=db.models.filter(x=>x.section==='Post-FX');
const slots=[
 {key:'pre',label:'PRE EFFECT',icon:'◉',options:['',...types('Pre-FX')]},
 {key:'amp',label:'AMPLIFIER',icon:'▤',options:types('Amp')},
 {key:'cab',label:'CABINET',icon:'▥',options:types('Cabinet')},
 {key:'mic',label:'MIC',icon:'◌',options:types('Cabinet Mic')},
 {key:'mod',label:'MODULATION',icon:'≈',options:['',...post.filter(x=>!['Delay','Reverb'].includes(x.type)).map(x=>x.name)]},
 {key:'delay',label:'DELAY',icon:'⟲',options:['',...post.filter(x=>x.type==='Delay').map(x=>x.name)]},
 {key:'reverb',label:'REVERB',icon:'〰',options:['',...post.filter(x=>x.type==='Reverb').map(x=>x.name)]}
];
const keys=['gain','bass','mid','treble'];
const styles=new Map(db.styles.map(x=>[x.key,x]));
const artists=new Map(db.artists.map(x=>[x.id,x]));
const genreLabels={surf:'Surf',spaghetti:'Spy / Spaghetti Western',rockabilly:'Rockabilly / Roots',punk:'Punk',garage:'Garage / Psychobilly',metal:'Metal',clean:'Clean / Pop',fuzz:'Fuzz Rock'};
const players=[
 {name:'Johnny Thunders',bands:['Johnny Thunders','New York Dolls','Heartbreakers'],aka:['johnny thunders','johnny thunder'],recipe:'johnny-thunders',tag:'Punk'},
 {name:'Johnny Ramone',bands:['Ramones','The Ramones'],aka:['johnny ramone','ramones'],recipe:'johnny-ramone-ramones',tag:'Punk'},
 {name:'Poison Ivy',bands:['The Cramps'],aka:['poison ivy','ivy rorschach'],recipe:'poison-ivy-the-cramps',tag:'Garage'},
 {name:'Link Wray',bands:['Link Wray','Link Wray and his Raymen'],aka:['link wray','fred lincoln wray'],recipe:'link-wray',tag:'Garage'},
 {name:'Duane Eddy',bands:['Duane Eddy'],aka:['duane eddy'],recipe:'duane-eddy',tag:'Rockabilly'},
 {name:'Dick Dale',bands:['Dick Dale'],aka:['dick dale'],style:'surf',tag:'Surf'},
 {name:'Jeffrey Lee Pierce',bands:['The Gun Club'],aka:['jeffrey lee pierce','gun club'],recipe:'the-gun-club-jeffrey-lee-pierce',tag:'Garage'},
 {name:'Billie Joe Armstrong',bands:['Green Day'],aka:['billie joe','billie joe armstrong'],recipe:'green-day-billie-joe-armstrong',tag:'Punk'},
 {name:'James Hetfield',bands:['Metallica'],aka:['james hetfield','hetfield'],recipe:'metallica-classic-80s',tag:'Metal'},
 {name:'Kirk Hammett',bands:['Metallica'],aka:['kirk hammett'],recipe:'metallica-classic-80s',tag:'Metal'},
 {name:'Doyle Wolfgang von Frankenstein',bands:['Misfits'],aka:['doyle','doyle wolfgang','franche coma'],recipe:'misfits-franch-coma-doyle',tag:'Punk'},
 {name:'Ron Asheton',bands:['The Stooges'],aka:['ron asheton','stooges'],style:'garage',tag:'Garage'},
 {name:'Freddy King',bands:['Freddy King'],aka:['freddy king','freddie king'],style:'rockabilly',tag:'Blues'}
];
const artistToPlayer=new Map();for(const p of players)for(const b of p.bands){const key=norm(b);if(!artistToPlayer.has(key))artistToPlayer.set(key,[]);artistToPlayer.get(key).push(p);}
const allSongs=catalog.songs;const songById=new Map(allSongs.map(x=>[String(x.songsterrId),x]));
const storageKey='beamtonelab.saved.v1', instrumentKey='beamtonelab.instrument.v4';
let saved=[];try{saved=JSON.parse(localStorage.getItem(storageKey)||'[]');if(!Array.isArray(saved))saved=[];}catch{}
saved=saved.filter(x=>x&&x.title&&x.amp&&x.cab).slice(0,120);
let selectedInstrument=localStorage.getItem(instrumentKey)||'surfmaster';if(!instruments.some(x=>x.id===selectedInstrument))selectedInstrument='surfmaster';
let recipe=null,activeSong=null,baseGuitarRecipe=null,toastTimer;
let showLimit=18,searchText='',sourceFilter='all',artistFilter='',playerFilter='',genreFilter='',playlistFilter='';
function instrument(){return instruments.find(x=>x.id===selectedInstrument)||instruments[0];}
function safeRecipe(raw){const fallback=copy(styles.get('clean'));const r={...fallback,...raw};for(const slot of slots){r[slot.key]=slot.options.includes(String(r[slot.key]||''))?String(r[slot.key]||''):slot.options[0];}for(const k of keys)r[k]=clamp(r[k],0,10);r.isf=clamp(r.isf,0,100);r.pickup=['Bridge','Middle','Neck','Unknown'].includes(r.pickup)?r.pickup:'Bridge';for(const k of ['title','notes','guide','pickNote','origin'])r[k]=String(r[k]||'').slice(0,1000);r.instrumentId=instruments.some(i=>i.id===r.instrumentId)?r.instrumentId:selectedInstrument;return r;}
function songTemplate(song){
 const ar=song.artistReference?artists.get(song.artistReference):null;
 const st=styles.get(song.toneGroup)||styles.get('clean');const base=ar||st;
 const own=!!ar;
 const notes=own?`${base.notes} This song uses the original workbook's ${ar.title} artist-level starting sound; not a song-specific studio reconstruction.`:`${st.notes} This is an approximate ${genreLabels[song.toneGroup]||'general'}-style starting point, not a researched match for this recording.`;
 const r=safeRecipe({...base,title:`${song.title} — ${song.artist}`,notes,origin:own?'WORKBOOK ARTIST-BASED STARTER':'GENRE STARTER / NOT SONG-VERIFIED',guide:`${base.guide||''} Start here, listen to the recording, and refine by ear.`,songId:song.songsterrId,instrumentId:selectedInstrument});
 return r;
}
function adaptToInstrument(r,inst){
 r.instrumentId=inst.id;
 if(inst.kind==='bass'){
  r.amp=r.toneGroup==='metal'?'U700 Modern':'U700 Classic';r.cab='1x12 Closed Back';r.mic='Dynamic Mic';r.pre='';r.mod='';r.delay='';r.reverb='';
  r.gain=3;r.bass=6;r.mid=5;r.treble=4;r.isf=50;r.pickup=inst.pickupPositions.includes('Neck')?'Neck':'Unknown';
  r.guide+=' BASS ADAPTATION: This is a basic Unity 700 bass starting point, not a recording-specific bass transcription. The workbook does not list separate bass cabinets; confirm cabinet suitability in the BEAM Solo app.';
 }else{r.pickup=inst.pickupPositions.includes(r.pickup)?r.pickup:(inst.pickupPositions.includes('Bridge')?'Bridge':inst.pickupPositions[0]);
   if(inst.id==='gretsch')r.guide+=' With Filter’Trons and flatwounds, try reducing treble or gain slightly if the attack is too sharp.';
   if(inst.id==='danopro-guitar')r.guide+=' Check the actual Dano Pro switch wiring; its switching has not yet been confirmed.';
 }
 return r;
}
function loadSong(song,scroll=true){
 $('profileShortcut').hidden=true;activeSong=song;baseGuitarRecipe=songTemplate(song);
 const r=adaptToInstrument(copy(baseGuitarRecipe),instrument());setRecipe(r,scroll);
 }
function playerForText(q){return players.find(p=>norm(p.name)===q||p.aka.some(a=>norm(a)===q)||p.bands.some(b=>norm(b)===q));}
function loadProfile(query,scroll=true){
 const q=norm(query),player=playerForText(q);
 let original=null,kind='';
 if(player){original=player.recipe?artists.get(player.recipe):styles.get(player.style||'clean');kind=player.name;}
 else if(styles.has(q)){original=styles.get(q);kind=genreLabels[q];}
 else{const match=db.artists.find(x=>norm(x.title)===q);if(match){original=match;kind=match.title;}}
 if(!original)return false;
 activeSong=null;baseGuitarRecipe=safeRecipe({...original,title:kind,origin:player?.recipe||db.artists.includes(original)?'WORKBOOK ARTIST RECIPE':'GENERAL GENRE STARTER',notes:`${original.notes} This is an artist/genre starting point, not a verified song-specific preset.`,instrumentId:selectedInstrument});
 setRecipe(adaptToInstrument(copy(baseGuitarRecipe),instrument()),scroll);return true;
}
function render(){if(!recipe)return;
 $('recipeHeading').replaceChildren(document.createTextNode(recipe.title.toUpperCase()+' '));const sub=document.createElement('span');sub.className='subheading';sub.textContent='/ TONE RECIPE';$('recipeHeading').append(sub);
 const inst=instrument();$('recipeSource').textContent=recipe.origin;$('lcdTitle').textContent=recipe.title.toUpperCase();$('lcdDescription').textContent=recipe.notes;$('lcdFlag').textContent='STARTING POINT • ADJUST BY EAR';$('engineerNotes').textContent=recipe.notes;$('guideNotes').textContent=recipe.guide;
 $('instrumentSelect').value=selectedInstrument;$('instrumentIcon').src=inst.icon;$('instrumentIcon').alt=inst.name+' body silhouette';$('stringLabel').textContent=inst.strings;
 $('pickupNote').textContent=inst.configuration;
 $('instrumentWarning').textContent=inst.kind==='bass'?'Bass mode: Unity 700 starting sound; confirm the cabinet choice in the BEAM Solo.':(inst.id==='danopro-guitar'?'Dano guitar selector configuration still needs confirmation.':inst.id==='surfmaster'?'Chrome flatwound .011s are planned, not installed.':'');
 document.querySelectorAll('[data-pickup]').forEach(btn=>{const allowed=inst.pickupPositions.includes(btn.dataset.pickup);btn.disabled=!allowed;btn.classList.toggle('active',recipe.pickup===btn.dataset.pickup);btn.setAttribute('aria-pressed',String(recipe.pickup===btn.dataset.pickup));});
 const link=$('songsterrLink');if(activeSong?.songsterrUrl){link.href=activeSong.songsterrUrl;link.hidden=false;}else{link.removeAttribute('href');link.hidden=true;}
 $('songSourceLabel').textContent=activeSong?`${activeSong.uploadedByYou?'YOUR UPLOAD · ':''}${activeSong.favorite?'SAVED TAB · ':''} ${activeSong.artist}`:'';
 const chain=$('signalChain');chain.replaceChildren();for(const slot of slots){const item=document.createElement('button');item.type='button';item.className='chain-module'+(recipe[slot.key]?'':' module-bypass');
  item.title='Change '+slot.label.toLowerCase();const kicker=document.createElement('span');kicker.className='module-kicker';kicker.textContent=slot.label;const ico=document.createElement('span');ico.className='module-icon';ico.textContent=slot.icon;const val=document.createElement('span');val.className='module-value';val.textContent=recipe[slot.key]||'BYPASS';const edit=document.createElement('span');edit.className='module-edit';edit.textContent='CHANGE ›';item.append(kicker,ico,val,edit);item.addEventListener('click',()=>editSlot(item,slot));chain.append(item);}
 const rack=$('faderRack');rack.replaceChildren();for(const key of keys){const holder=document.createElement('div');holder.className='fader-unit';const output=document.createElement('output');output.className='fader-number';output.textContent=String(recipe[key]).padStart(2,'0');const title=document.createElement('div');title.className='fader-name';title.textContent=key==='mid'?'MIDS':key.toUpperCase();const control=document.createElement('div');control.className='fader-control';const range=document.createElement('input');range.type='range';range.id='range-'+key;range.min='0';range.max='10';range.step='1';range.value=recipe[key];range.setAttribute('aria-label',key+' level');range.addEventListener('input',()=>{recipe[key]=Number(range.value);output.textContent=String(recipe[key]).padStart(2,'0');syncSavedState();});const scale=document.createElement('div');scale.className='fader-scale';scale.setAttribute('aria-hidden','true');const low=document.createElement('span');low.textContent='0';const high=document.createElement('span');high.textContent='10';scale.append(low,high);control.append(range,scale);const led=document.createElement('span');led.className='fader-led';holder.append(output,title,control,led);rack.append(holder);}
 $('isfSlider').value=recipe.isf;$('isfValue').textContent=recipe.isf+'%';$('vuNeedle').style.transform='rotate('+(recipe.gain*5-38)+'deg)';syncSavedState();
}
function editSlot(button,slot){if(button.querySelector('select'))return;const sel=document.createElement('select');sel.className='gear-swap-select';sel.setAttribute('aria-label','Choose '+slot.label);for(const name of slot.options){const option=document.createElement('option');option.value=name;option.textContent=name||'BYPASS';sel.append(option);}sel.value=recipe[slot.key];button.replaceWith(sel);sel.focus();sel.addEventListener('change',()=>{recipe[slot.key]=sel.value;render()});sel.addEventListener('blur',()=>queueMicrotask(()=>{if(sel.isConnected)render()}));}
function setRecipe(next,scroll=true){recipe=safeRecipe(next);render();if(scroll)$('resultSection').scrollIntoView({behavior:'smooth',block:'start'});}
function toast(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2800);}
function signature(r){const obj={};for(const k of ['songId','title','instrumentId','amp','cab','mic','pre','mod','delay','reverb','pickup','gain','bass','mid','treble','isf'])obj[k]=r[k]||'';return JSON.stringify(obj);}
function syncSavedState(){const isSaved=saved.some(x=>signature(x)===signature(recipe));$('saveBtn').textContent=isSaved?'★ SAVED':'☆ SAVE PRESET';$('savedCount').textContent=saved.length;}
function saveRecipe(){const index=saved.findIndex(x=>signature(x)===signature(recipe));if(index>=0){saved.splice(index,1);toast('Preset removed.');}else{saved.unshift({...recipe,_savedAt:new Date().toISOString()});saved=saved.slice(0,120);toast('Preset saved in this browser.');}localStorage.setItem(storageKey,JSON.stringify(saved));syncSavedState();}
function recipeText(r){const inst=instruments.find(i=>i.id===r.instrumentId)||instruments[0];return ['BEAM TONE LAB — '+r.title,'Source: '+r.origin,'Instrument: '+inst.name+' · '+inst.strings,'Pickup: '+r.pickup,'SIGNAL CHAIN:',...slots.map(x=>`${x.label.padEnd(13)} ${r[x.key]||'BYPASS'}`),`Gain ${r.gain} | Bass ${r.bass} | Mids ${r.mid} | Treble ${r.treble} | ISF ${r.isf}%`,'NOTES: '+r.notes,'DIAL-IN: '+r.guide,'', 'Approximate starting point; adjust by ear.'].join('\n');}
function download(name,data,type){const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
async function copyRecipe(){const data=recipeText(recipe);try{await navigator.clipboard.writeText(data);toast('Recipe copied.');}catch{download('beam-tone-recipe.txt',data,'text/plain');toast('Recipe downloaded.');}}
function openDialog(name){$(name).showModal();}
function renderInventory(cat='All'){$('gearFilters').replaceChildren();for(const section of ['All','Pre-FX','Amp','Cabinet','Cabinet Mic','Post-FX']){const btn=document.createElement('button');btn.textContent=section;btn.className=section===cat?'active':'';btn.type='button';btn.addEventListener('click',()=>renderInventory(section));$('gearFilters').append(btn);}const list=$('gearList');list.replaceChildren();for(const model of db.models.filter(x=>cat==='All'||x.section===cat)){const div=document.createElement('div');div.className='gear-item';const strong=document.createElement('strong');strong.textContent=model.name;const small=document.createElement('small');small.textContent=model.section.toUpperCase()+' / '+model.type.toUpperCase();const p=document.createElement('p');p.textContent=model.description+(model.equivalent?' · Similar to: '+model.equivalent:'');div.append(strong,small,p);list.append(div);}}
function renderSaved(){const list=$('savedList');list.replaceChildren();if(!saved.length){const msg=document.createElement('p');msg.className='empty-state';msg.textContent='No saved presets. Open a song and press SAVE PRESET.';list.append(msg);}for(const [idx,r] of saved.entries()){const item=document.createElement('div');item.className='saved-item';const left=document.createElement('div');const title=document.createElement('strong');title.textContent=r.title;const sub=document.createElement('small');sub.textContent=(instruments.find(x=>x.id===r.instrumentId)?.shortName||'Guitar')+' · '+r.amp+' / '+r.cab;left.append(title,sub);const buttons=document.createElement('div');buttons.className='saved-buttons';const load=document.createElement('button');load.textContent='LOAD ↗';load.addEventListener('click',()=>{selectedInstrument=r.instrumentId||'surfmaster';$('instrumentSelect').value=selectedInstrument;activeSong=songById.get(String(r.songId))||null;baseGuitarRecipe=safeRecipe(r);setRecipe(r);$('libraryDialog').close();});const del=document.createElement('button');del.textContent='DELETE';del.className='delete';del.addEventListener('click',()=>{saved.splice(idx,1);localStorage.setItem(storageKey,JSON.stringify(saved));renderSaved();syncSavedState();});buttons.append(load,del);item.append(left,buttons);list.append(item);}}
function playerMatches(song,player){return !!player&&player.bands.some(b=>norm(b)===norm(song.artist));}
function searchable(song){const people=artistToPlayer.get(norm(song.artist))||[];return norm([song.title,song.artist,song.toneGroup,genreLabels[song.toneGroup],song.playlists.join(' '),people.map(p=>p.name+' '+p.aka.join(' ')).join(' ')].join(' '));}
function queryMatches(song,q){if(!q)return true;const direct=searchable(song).includes(q);if(direct)return true;const player=playerForText(q);return playerMatches(song,player);}
function matchingSongs(){const q=norm(searchText);return allSongs.filter(s=>{
 if(sourceFilter==='uploaded'&&!s.uploadedByYou)return false;
 if(sourceFilter==='favorites'&&!s.favorite&&!s.playlists.length)return false;
 if(sourceFilter==='uploadonly'&&!s.uploadedByYou||sourceFilter==='uploadonly'&&(s.favorite||s.playlists.length))return false;
 if(artistFilter&&norm(s.artist)!==norm(artistFilter))return false;
 if(playerFilter&&!playerMatches(s,players.find(p=>p.name===playerFilter)))return false;
 if(genreFilter&&s.toneGroup!==genreFilter)return false;
 if(playlistFilter&&!s.playlists.includes(playlistFilter))return false;
 return queryMatches(s,q);
 });}
function addOption(sel,value,label){const o=document.createElement('option');o.value=value;o.textContent=label;sel.append(o);}
function initFilters(){for(const name of [...new Set(allSongs.map(x=>x.artist))].sort((a,b)=>a.localeCompare(b)))addOption($('artistFilter'),name,name);
 for(const p of players)addOption($('guitaristFilter'),p.name,p.name);
 for(const [key,value] of Object.entries(genreLabels))if(allSongs.some(s=>s.toneGroup===key))addOption($('genreFilter'),key,value);
 for(const name of Object.keys(catalog.playlists).sort())addOption($('playlistFilter'),name,name);
 const chips=$('genreChips');for(const [key,label] of Object.entries(genreLabels)){if(!allSongs.some(s=>s.toneGroup===key))continue;const b=document.createElement('button');b.type='button';b.dataset.genre=key;b.textContent=label;b.addEventListener('click',()=>{genreFilter=genreFilter===key?'':key;$('genreFilter').value=genreFilter;showLimit=18;renderSongList();});chips.append(b);}}
function makeTag(text,className){const span=document.createElement('span');span.className=className;span.textContent=text;return span;}
function renderSongList(){const matches=matchingSongs();$('visibleCount').textContent=matches.length;$('catalogueTotal').textContent=allSongs.length;
 $('songListSummary').textContent=`Showing ${Math.min(showLimit,matches.length)} of ${matches.length} matching tabs`;
 $('showMoreSongs').hidden=matches.length<=showLimit;
 for(const chip of $('genreChips').children)chip.classList.toggle('active',chip.dataset.genre===genreFilter);
 const list=$('songList');list.replaceChildren();if(!matches.length){const msg=document.createElement('p');msg.className='empty-state';msg.textContent='No matching tabs. Try a different band, guitarist or genre.';list.append(msg);return;}
 for(const song of matches.slice(0,showLimit)){
  const row=document.createElement('div');row.className='song-card';
  const main=document.createElement('button');main.type='button';main.className='song-open';main.setAttribute('aria-label','Load '+song.title+' by '+song.artist);
  const title=document.createElement('strong');title.textContent=song.title;const artist=document.createElement('span');artist.className='song-artist';artist.textContent=song.artist;
  const badges=document.createElement('span');badges.className='song-tags';badges.append(makeTag(genreLabels[song.toneGroup]||'General','song-genre'));if(song.uploadedByYou)badges.append(makeTag('MY UPLOAD','song-own'));if(song.favorite||song.playlists.length)badges.append(makeTag('SAVED','song-saved'));
  main.append(title,artist,badges);main.addEventListener('click',()=>loadSong(song));
  const tab=document.createElement('a');tab.className='song-tab';tab.textContent='TAB ↗';tab.href=song.songsterrUrl;tab.target='_blank';tab.rel='noopener noreferrer';tab.setAttribute('aria-label','Open '+song.title+' in Songsterr');row.append(main,tab);list.append(row);
 }}
function runSearch(raw){const q=String(raw||'').trim();$('profileShortcut').hidden=true;searchText=q;$('librarySearch').value=q;$('toneQuery').value=q;showLimit=18;
 artistFilter='';playerFilter='';genreFilter='';playlistFilter='';$('artistFilter').value='';$('guitaristFilter').value='';$('genreFilter').value='';$('playlistFilter').value='';sourceFilter='all';$('libraryFilter').value='all';
 renderSongList();
 const normalized=norm(q);const exact=allSongs.find(s=>norm(s.title)===normalized||norm(s.title+' '+s.artist)===normalized);
 if(exact){loadSong(exact);return;}
 if(loadProfile(q,false)){$('profileShortcut').hidden=false;$('profileShortcutText').textContent='ARTIST / GENRE STARTING RECIPE: '+recipe.title;const matches=matchingSongs();if(!matches.length)$('resultSection').scrollIntoView({behavior:'smooth',block:'start'});else $('songLibrary').scrollIntoView({behavior:'smooth',block:'start'});return;}
 $('songLibrary').scrollIntoView({behavior:'smooth',block:'start'});
 if(!matchingSongs().length)toast('No matching Songsterr tabs; try a band, guitarist or genre.');
}
// Wire library and console controls.
$('toneForm').addEventListener('submit',e=>{e.preventDefault();runSearch($('toneQuery').value)});
$('librarySearch').addEventListener('input',e=>{searchText=e.target.value;showLimit=18;renderSongList();});
$('libraryFilter').addEventListener('change',e=>{sourceFilter=e.target.value;showLimit=18;renderSongList()});
for(const [id,state] of [['artistFilter','artist'],['guitaristFilter','player'],['genreFilter','genre'],['playlistFilter','playlist']])$(id).addEventListener('change',e=>{if(state==='artist')artistFilter=e.target.value;if(state==='player')playerFilter=e.target.value;if(state==='genre')genreFilter=e.target.value;if(state==='playlist')playlistFilter=e.target.value;showLimit=18;renderSongList();});
$('showMoreSongs').addEventListener('click',()=>{showLimit+=24;renderSongList();});
$('jumpProfileBtn').addEventListener('click',()=>$('resultSection').scrollIntoView({behavior:'smooth',block:'start'}));
document.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>runSearch(b.dataset.query)));
$('instrumentSelect').addEventListener('change',e=>{selectedInstrument=e.target.value;localStorage.setItem(instrumentKey,selectedInstrument);if(activeSong)loadSong(activeSong,false);else if(baseGuitarRecipe)setRecipe(adaptToInstrument(copy(baseGuitarRecipe),instrument()),false);toast('Selected '+instrument().name);});
document.querySelectorAll('[data-pickup]').forEach(b=>b.addEventListener('click',()=>{if(!instrument().pickupPositions.includes(b.dataset.pickup))return;recipe.pickup=b.dataset.pickup;render()}));
$('isfSlider').addEventListener('input',e=>{recipe.isf=Number(e.target.value);$('isfValue').textContent=recipe.isf+'%';syncSavedState();});
$('saveBtn').addEventListener('click',saveRecipe);$('copyBtn').addEventListener('click',copyRecipe);
$('gearBtn').addEventListener('click',()=>{renderInventory();openDialog('gearDialog')});$('libraryBtn').addEventListener('click',()=>{renderSaved();openDialog('libraryDialog')});$('aboutBtn').addEventListener('click',()=>openDialog('aboutDialog'));$('jumpLibraryBtn').addEventListener('click',()=>$('songLibrary').scrollIntoView({behavior:'smooth',block:'start'}));
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
$('exportAllBtn').addEventListener('click',()=>{if(!saved.length){toast('Save at least one preset first.');return;}download('beam-tone-presets.json',JSON.stringify({format:'beam-tone-lab-presets',version:1,presets:saved},null,2),'application/json')});
$('importBtn').addEventListener('click',()=>$('importFile').click());
$('importFile').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>500000)throw Error('File too large');const val=JSON.parse(await file.text());if(val.format!=='beam-tone-lab-presets'||!Array.isArray(val.presets))throw Error('Not a Tone Lab preset export');const items=val.presets.slice(0,120).filter(x=>x&&typeof x.title==='string').map(safeRecipe);saved=[...items,...saved].filter((x,i,arr)=>arr.findIndex(y=>signature(x)===signature(y))===i).slice(0,120);localStorage.setItem(storageKey,JSON.stringify(saved));renderSaved();syncSavedState();toast('Presets imported.');}catch(error){toast('Import failed: '+error.message)}finally{e.target.value='';}});
for(const inst of instruments)addOption($('instrumentSelect'),inst.id,inst.kind==='bass'?'BASS · '+inst.name:'GUITAR · '+inst.name);
$('modelCount').textContent=db.models.length;$('modeStatus').textContent='LOCAL RECIPE LIBRARY';
initFilters();renderSongList();loadProfile('Link Wray',false);
})();
