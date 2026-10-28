from artifact_tool import Blob, SpreadsheetFile
import json,re,pathlib
ROOT=pathlib.Path(__file__).resolve().parent
w=SpreadsheetFile.import_xlsx(Blob.load(str(ROOT/'Blackstar_BEAM_Full_Workbook.xlsx')))
def rows(sheet, end, cols):
    x=json.loads(w.inspect({'kind':'table','range':f'{sheet}!A1:{cols}{end}','include':'values','table_max_rows':end,'table_max_cols':len(cols) if False else 7}).ndjson)['values']
    return x[1:]
models=[{'name':r[0],'section':r[1],'type':r[2],'description':r[3],'equivalent':r[4] or '', 'note': (r[5] if len(r)>5 else '') or ''} for r in rows('Models',68,'F') if r[0]]
artists=rows('Artist_Recipes',11,'G')
eqs=rows('EQ_Gain',11,'D')
guides=rows('Beginner_Mode',11,'B')
tones=rows('Tone_Recipes',30,'D')
chains=rows('One_Click_Chains',11,'F')
def n(x,pat,default):
    a=re.search(pat,str(x),re.I)
    return int(a.group(1)) if a else default
amp_by=['Ampton 800','Ampton REC','Ampton Twin','Ampton 800','Ampton REC','Ampton Twin','Ampton 800','Ampton ACE30','Ampton ACE30','Ampton ACE30']
cab_by=['4x12 Classic','4x12 Modern','2x12 Horizontal Open','4x12 Classic','4x12 Classic','2x12 Horizontal Open','4x12 Classic','2x12 Horizontal Open','2x12 Horizontal Open','2x12 Horizontal Open']
pre_by=['','TS Drive','Valve Boost','','TS Drive','Valve Boost','TS Drive','Valve Boost','Yellow Drive','Rodent']
mod_by=['','','Bias Tremolo','','','Bias Tremolo','','Vibrato Chorus','','Vibe']
delay_by=['','Digital Delay','','','','','', 'Tape Echo','','']
rev_by=['Plate','','Spring','','','Spring','Plate','','Plate','Hall']
pickup_by=['Bridge','Bridge','Bridge','Bridge','Bridge','Neck','Bridge','Middle','Bridge','Neck']
# Workbook-based starting points, with two-single-coil Telecaster recommendations.
profiles=[]
for i,r in enumerate(artists):
    name=r[0]
    eq=eqs[i]
    guide=guides[i][1] if len(guides[i])>1 else ''
    guide=re.sub(r'neck P90', 'standard Tele neck pickup', guide, flags=re.I)
    guide=re.sub(r'P90', 'single-coil',guide,flags=re.I)
    profiles.append({
     'id':re.sub('[^a-z0-9]+','-',name.lower()).strip('-'),
     'title':name,'origin':'Workbook artist recipe',
     'amp':amp_by[i],'cab':cab_by[i],'pre':pre_by[i],'mod':mod_by[i],
     'delay':delay_by[i],'reverb':rev_by[i],'mic':'Dynamic Mic','pickup':pickup_by[i],
     'gain':round(sum(map(int,re.findall(r'\d+',str(eq[1]))[:2])) / len(re.findall(r'\d+',str(eq[1]))[:2])) if re.findall(r'\d+',str(eq[1])) else 5,
     'bass':n(eq[2],r'Bass\s+(\d+)',5),'mid':n(eq[2],r'Mid\s+(\d+)',5),
     'treble':n(eq[2],r'Treble\s+(\d+)',5),'isf':n(eq[3],r'(\d+)%',50),
     'notes':r[5], 'guide':guide,
     'pickNote':'Based on the workbook, adapted for a traditional Telecaster bridge/neck single-coil layout.',
    })
# Explicit starting profiles: these are prototypes and not statements about particular artist rig setups.
styles=[
 {'key':'surf','title':'Vintage Surf','amp':'Ampton Twin','cab':'2x12 Horizontal Open','pre':'Red Squeeze','mod':'Opto Tremolo','delay':'','reverb':'Spring','mic':'Dynamic Mic','pickup':'Bridge','gain':2,'bass':5,'mid':5,'treble':8,'isf':40,'notes':'Clean, bright attack with generous spring reverb. A starting point for classic surf instrumentals.','guide':'Start clean, turn up the spring reverb, and use the Tele bridge pickup. Keep your picking precise.'},
 {'key':'spaghetti','title':'Spaghetti Western','amp':'Ampton Twin','cab':'2x12 Horizontal Open','pre':'Valve Boost','mod':'Bias Tremolo','delay':'Tape Echo','reverb':'Spring','mic':'Ribbon Mic','pickup':'Neck','gain':3,'bass':6,'mid':5,'treble':6,'isf':45,'notes':'Dry, haunting twang with tremolo and tape ambience, suitable as a cinematic western starting point.','guide':'Try the Tele neck pickup and a slow tremolo. Add a short, quiet tape echo for space.'},
 {'key':'garage','title':'Primitive Garage Rock','amp':'Ampton ACE30','cab':'2x12 Horizontal Open','pre':'Rodent','mod':'','delay':'Tape Echo','reverb':'Plate','mic':'Dynamic Mic','pickup':'Bridge','gain':6,'bass':4,'mid':7,'treble':6,'isf':65,'notes':'Ragged mid-forward drive and a little trashy echo. A general starting point, not a song transcription.','guide':'Drive the amp slightly, add a touch of Rodent, and let the picking stay wild.'},
 {'key':'rockabilly','title':'Rockabilly Slapback','amp':'Ampton Twin','cab':'1x12 Open Back','pre':'Red Squeeze','mod':'','delay':'Analogue Delay','reverb':'Spring','mic':'Dynamic Mic','pickup':'Bridge','gain':3,'bass':5,'mid':5,'treble':7,'isf':50,'notes':'Snappy clean twang, a brief single-repeat slapback, and just enough room ambience.','guide':'Start clean and bright. Set Analogue Delay for one short repeat, with little feedback.'},
 {'key':'punk','title':'Raw Punk Rhythm','amp':'Ampton 800','cab':'4x12 Classic','pre':'Yellow Drive','mod':'','delay':'','reverb':'','mic':'Dynamic Mic','pickup':'Bridge','gain':7,'bass':3,'mid':8,'treble':6,'isf':70,'notes':'Dry, mid-heavy, forceful rhythm sound with tight low end.','guide':'Bridge pickup, wide-open tone, and driving downstrokes. Keep effects minimal.'},
 {'key':'fuzz','title':'Vintage Fuzz Rock','amp':'Artisan 30','cab':'2x12 Horizontal Open','pre':'Smile Fuzz','mod':'','delay':'Tape Echo','reverb':'Plate','mic':'Ribbon Mic','pickup':'Neck','gain':4,'bass':5,'mid':6,'treble':5,'isf':50,'notes':'Fuzzy edge-of-breakup and warm echoes, a general vintage-rock starter.','guide':'Use neck pickup for roundness; back off the guitar volume if the fuzz is too heavy.'},
 {'key':'metal','title':'High-Gain Metal','amp':'Ampton REC','cab':'4x12 Modern','pre':'TS Drive','mod':'','delay':'','reverb':'','mic':'Dynamic Mic','pickup':'Bridge','gain':8,'bass':5,'mid':4,'treble':7,'isf':70,'notes':'High-gain palm-mute tone, adapted for Tele single-coils; manage noise with a gate as needed.','guide':'Use bridge pickup, keep drive tight and adjust gain to avoid fizz.'},
 {'key':'clean','title':'Glass-Clean Twang','amp':'Ampton Twin','cab':'2x12 Horizontal Open','pre':'Compressor','mod':'','delay':'','reverb':'Spring','mic':'Dynamic Mic','pickup':'Middle','gain':2,'bass':5,'mid':5,'treble':7,'isf':40,'notes':'A bright but balanced clean tone using both standard Telecaster single-coil pickups.','guide':'Middle pickup selector position, clean amp, small amount of compression and spring reverb.'},
]
modelsnames={r['name'] for r in models}
for p in profiles+styles:
    for field in ['amp','cab','pre','mod','delay','reverb','mic']:
        assert not p[field] or p[field] in modelsnames, (p['title'],field,p[field])
db={'models':models,'artists':profiles,'styles':styles,'pedalReference':[{'category':r[0],'real':r[1],'beam':r[2],'notes':r[3]} for r in tones if r[0]],'source':'Blackstar_BEAM_Full_Workbook.xlsx','guitar':'Telecaster — traditional bridge and neck single-coils, 3-way switch'}
out=ROOT
(out/'data.json').write_text(json.dumps(db,ensure_ascii=False,indent=2), encoding='utf-8')
(out/'data.js').write_text('window.BEAM_DATA = '+json.dumps(db,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
print('Extracted',len(models),'models,',len(profiles),'artists,',len(styles),'style starters.',len(db['pedalReference']),'references')
