/**
 * Optional private Cloudflare Worker for BEAM Tone Lab.
 * Keep OPENAI_API_KEY and APP_ACCESS_KEY in Cloudflare Secrets.
 * Use ALLOWED_ORIGIN to limit browser calls to your GitHub Pages domain.
 * The website works without this Worker for the included artist/song starters.
 */
import { CATALOG } from './catalog.js';

const names = new Set(CATALOG.map(x => x.name));
const choices = group => CATALOG.filter(group).map(x=>x.name);
const schema = {
  type:'object', additionalProperties:false,
  properties:{
    title:{type:'string'},amp:{type:'string',enum:choices(x=>x.section==='Amp')},
    cab:{type:'string',enum:choices(x=>x.section==='Cabinet')},
    mic:{type:'string',enum:choices(x=>x.section==='Cabinet Mic')},
    pre:{type:'string',enum:['',...choices(x=>x.section==='Pre-FX')]},
    mod:{type:'string',enum:['',...choices(x=>x.section==='Post-FX'&&!['Delay','Reverb'].includes(x.type))]},
    delay:{type:'string',enum:['',...choices(x=>x.section==='Post-FX'&&x.type==='Delay')]},
    reverb:{type:'string',enum:['',...choices(x=>x.section==='Post-FX'&&x.type==='Reverb')]},
    pickup:{type:'string',enum:['Bridge','Middle','Neck']},
    gain:{type:'integer',minimum:0,maximum:10},bass:{type:'integer',minimum:0,maximum:10},
    mid:{type:'integer',minimum:0,maximum:10},treble:{type:'integer',minimum:0,maximum:10},
    isf:{type:'integer',minimum:0,maximum:100},
    notes:{type:'string'},guide:{type:'string'},pickNote:{type:'string'}
  },
  required:['title','amp','cab','mic','pre','mod','delay','reverb','pickup','gain','bass','mid','treble','isf','notes','guide','pickNote']
};
const error = (message,status,headers) => new Response(JSON.stringify({error:message}),{status,headers});
const json = (data,status,headers)=>new Response(JSON.stringify(data),{status,headers});
const headers = (origin,allowed) => ({'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':allowed||'*','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, X-Tone-Passphrase','Vary':'Origin','Cache-Control':'no-store'});

export default {
 async fetch(request,env){
  const origin=request.headers.get('Origin')||'';
  const expected=String(env.ALLOWED_ORIGIN||'').trim().replace(/\/$/,'');
  const cors=headers(origin,expected||'*');
  if(expected && origin && origin!==expected)return error('Origin not permitted.',403,cors);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  const url=new URL(request.url);
  if(request.method!=='POST'||url.pathname!=='/generate')return error('Route not found.',404,cors);
  if(!env.OPENAI_API_KEY||!env.APP_ACCESS_KEY)return error('Worker secrets not configured.',503,cors);
  if(request.headers.get('x-tone-passphrase')!==env.APP_ACCESS_KEY)return error('Incorrect access passphrase.',401,cors);
  if(Number(request.headers.get('Content-Length')||0)>2048)return error('Request too large.',413,cors);
  let body;try{body=await request.json()}catch{return error('Invalid JSON.',400,cors)}
  const query=String(body?.query||'').trim();
  if(!query||query.length>160)return error('Provide an artist or song, maximum 160 characters.',400,cors);
  const catalogue = CATALOG.map(x=>`${x.section} | ${x.name} | ${x.description} | ${x.similar||''}`).join('\n');
  const prompt=`You are a practical guitar tone designer. The user plays a standard TELECASTER with two traditional SINGLE-COIL pickups and a 3-way Bridge / Middle(both) / Neck switch, plugged into a Blackstar BEAM Solo.\nGenerate one practical tone-inspired STARTING RECIPE for the requested song, band or guitarist, and describe in 1-2 sentences the sonic rationale. For a song, prefer the guitar sound heard on that song instead of the artist's general sound, but do not claim to know the exact recording rig. If unfamiliar or ambiguous, state that uncertainty in notes and propose a genre-appropriate starting tone, never make up a factual backstory or specific recording claims. All specific effect, amp, mic, cabinet strings MUST be chosen strictly from the enums; leave unused effects as empty strings. Gain/bass/mid/treble: 0-10; ISF: percentage 0-100. Include specific pickup selection and practical adjustment guidance. Never suggest P90s or humbuckers. Only 1 pre-effect, 1 modulation, 1 delay and 1 reverb are allowed in this first version. This is for an approximate simulation, not an authentic artist-branded preset.\nAVAILABLE HARDWARE:\n${catalogue}`;
  let apiResponse;
  try{ apiResponse=await fetch('https://api.openai.com/v1/responses',{
    method:'POST',headers:{'Authorization':`Bearer ${env.OPENAI_API_KEY}`,'Content-Type':'application/json'},
    body:JSON.stringify({model:env.OPENAI_MODEL||'gpt-4.1-mini',input:[{role:'system',content:prompt},{role:'user',content:query}],temperature:0.4,max_output_tokens:1100,text:{format:{type:'json_schema',name:'beam_tone_recipe',strict:true,schema}}})
  });}catch{return error('Unable to reach the AI provider.',502,cors)}
  if(!apiResponse.ok){return error('The AI provider returned an error. Check your Worker/API configuration.',502,cors)}
  let response;try{response=await apiResponse.json()}catch{return error('Invalid AI provider response.',502,cors)}
  let output='';
  for(const item of response.output||[])for(const content of item.content||[])if(content.type==='output_text')output+=content.text||'';
  let recipe;try{recipe=JSON.parse(output)}catch{return error('The provider did not return a complete JSON recipe.',502,cors)}
  // Defense in depth: validate returned model names even with structured outputs.
  const slotCheck=['amp','cab','mic','pre','mod','delay','reverb'];
  for(const slot of slotCheck)if(recipe[slot]&&!names.has(recipe[slot]))return error('Unrecognized model in the generated recipe.',502,cors);
  for(const slot of ['gain','bass','mid','treble'])if(!Number.isInteger(recipe[slot])||recipe[slot]<0||recipe[slot]>10)return error('Out-of-range setting returned.',502,cors);
  if(!Number.isInteger(recipe.isf)||recipe.isf<0||recipe.isf>100)return error('Invalid ISF value.',502,cors);
  return json({recipe},200,cors);
 }
};
