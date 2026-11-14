import { Graphics } from '/graphics.js';
import { canOccupy } from '/shared/world.mjs';
const $=id=>document.getElementById(id);
const canvas=$('arena');let gfx;
try{gfx=new Graphics(canvas);}catch(err){$('unsupported').hidden=false;$('unsupported').textContent=err.message;throw err;}
let sock=null,connected=false,inGame=false,myId=null,roomCode='',players=[],seconds=360,me=null,pred=null;
let toastUntil=0,hitUntil=0,fire=false,mobileRun=false,moveStick=[0,0],mobileLookId=null,lastLook=null,stickId=null,mouseShoot=false,lastInput=0,renderBefore=performance.now();
let yaw=0,pitch=0,key=new Set();let scoreVisible=!matchMedia('(pointer:coarse)').matches;
$('name').value=localStorage.getItem('rift.name')||'RIFTER';
const isCoarse=matchMedia('(pointer:coarse)').matches;
const quality=$('quality');quality.value=localStorage.getItem('rift.quality')||'auto';gfx.setQuality(quality.value);quality.addEventListener('change',()=>{gfx.setQuality(quality.value);localStorage.setItem('rift.quality',quality.value);showToast('VISUAL PROFILE · '+quality.options[quality.selectedIndex].text);});
$('scoreboard').hidden=!scoreVisible;
function showToast(message){$('toast').textContent=message;$('toast').classList.add('show');toastUntil=performance.now()+2600;}
function error(message){$('error').textContent=message;showToast(message);}
function connection(s){$('connection').textContent=s;document.querySelector('.beacon').style.background=s==='ONLINE'?'#7df6b4':'#ffae56';$('create').disabled=s!=='ONLINE';$('join').disabled=s!=='ONLINE';}
function connect(){if(sock&&[0,1].includes(sock.readyState))return;connection('CONNECTING');const scheme=location.protocol==='https:'?'wss':'ws';sock=new WebSocket(`${scheme}://${location.host}/ws`);
 sock.onopen=()=>{connected=true;connection('ONLINE');$('error').textContent='';};
 sock.onclose=()=>{connected=false;connection('RECONNECTING');if(inGame){showToast('Connection lost — returning to lobby');leave(false);}setTimeout(connect,1300);};
 sock.onerror=()=>{connection('NETWORK ERROR');};
 sock.onmessage=event=>{let m;try{m=JSON.parse(event.data);}catch{return;}handle(m);};
}
function send(m){if(sock?.readyState===WebSocket.OPEN)sock.send(JSON.stringify(m));}
function handle(m){switch(m.t){
 case 'hello': break;
 case 'error':error(m.message||'Unable to join room');break;
 case 'joined':myId=m.id;roomCode=m.code;inGame=true;fire=false;key.clear();$('menu').hidden=true;$('hud').hidden=false;$('roomcode').textContent=roomCode;$('error').textContent='';showToast(`MATCH READY · CODE ${roomCode}`);break;
 case 'state':players=m.players||[];seconds=m.seconds;{const newMe=players.find(p=>p.id===myId);if(newMe){me=newMe;if(!pred){pred={...me};yaw=me.yaw;pitch=me.pitch;}else{const d=Math.hypot(pred.x-me.x,pred.z-me.z);if(d>3){pred.x=me.x;pred.z=me.z;}else{pred.x+=(me.x-pred.x)*.15;pred.z+=(me.z-pred.z)*.15;}pred.y=me.y;pred.hp=me.hp;}hud();}}break;
 case 'shot':gfx.fire(m.from,m.end);if(m.by===myId&&m.hit){hitUntil=performance.now()+160;}break;
 case 'feed':feed(m.text);break;
 case 'hurt':if(m.hp===0){$('respawn').hidden=false;showToast('TAGGED · REDEPLOYING');}else showToast(`HIT TAKEN · ${m.hp} HP`);break;
 case 'respawn':$('respawn').hidden=true;break;
 case 'pong':{const ping=Math.max(0,Date.now()-m.at);$('connection').textContent=`ONLINE · ${ping} MS`;break;}
 }}
function feed(text){if(!inGame)return;const e=document.createElement('div');e.textContent=text;$('feed').prepend(e);while($('feed').children.length>4)$('feed').lastChild.remove();setTimeout(()=>{if(e.isConnected)e.remove();},5500);}
function hud(){if(!me)return;$('health').textContent=me.hp;$('hpfill').style.width=me.hp+'%';$('clock').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;$('playercount').textContent=`${players.length} / 8 OPERATIVES`;
 const rows=[...players].sort((a,b)=>b.kills-a.kills||a.deaths-b.deaths);$('scores').replaceChildren(...rows.map(p=>{const row=document.createElement('div');const dot=document.createElement('span');dot.className='swatch';dot.style.background=p.color;const name=document.createElement('span');name.textContent=p.name+(p.id===myId?' (YOU)':'');name.className='label'+(p.id===myId?' me':'');const kills=document.createElement('span');kills.className='score';kills.textContent=p.kills+' K';const deaths=document.createElement('span');deaths.className='score';deaths.textContent=p.deaths+' D';row.append(dot,name,kills,deaths);return row;}));}
function createOrJoin(action){if(!connected)return error('Connecting to server. Try again.');const name=($('name').value.trim()||'RIFTER').slice(0,16);localStorage.setItem('rift.name',name);if(action==='create')send({t:'create',name});else{const code=$('room').value.toUpperCase().replace(/[^A-Z0-9]/g,'');if(code.length!==6)return error('Please enter a 6-character room code.');send({t:'join',code,name});}}
$('create').addEventListener('click',()=>createOrJoin('create'));
$('join').addEventListener('click',()=>createOrJoin('join'));
$('room').addEventListener('input',()=>{$('room').value=$('room').value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);});
$('room').addEventListener('keydown',e=>{if(e.key==='Enter')createOrJoin('join');});
$('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(roomCode);showToast('Room code copied');}catch{showToast(`Room code: ${roomCode}`);}});
$('scoretoggle').addEventListener('click',()=>{scoreVisible=!scoreVisible;$('scoreboard').hidden=!scoreVisible;});
function leave(resetConnection=true){inGame=false;myId=null;roomCode='';me=null;pred=null;players=[];key.clear();fire=false;mouseShoot=false;$('respawn').hidden=true;$('menu').hidden=false;$('hud').hidden=true;if(document.pointerLockElement)document.exitPointerLock();if(resetConnection){if(sock)sock.close();} }
$('exit').addEventListener('click',()=>leave());
window.addEventListener('keydown',e=>{if(e.target?.tagName==='INPUT')return;key.add(e.code);if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code))e.preventDefault();if(inGame&&e.code==='Tab')$('scoreboard').hidden=false;if(e.code==='Escape'&&inGame){if(document.pointerLockElement)document.exitPointerLock();}});
window.addEventListener('keyup',e=>{key.delete(e.code);if(e.code==='Tab')$('scoreboard').hidden=!scoreVisible;});
window.addEventListener('blur',()=>{key.clear();fire=false;mouseShoot=false;moveStick=[0,0];});
canvas.addEventListener('click',()=>{if(inGame&&!isCoarse&&document.pointerLockElement!==canvas)canvas.requestPointerLock?.();});
canvas.addEventListener('pointerdown',e=>{if(inGame&&e.button===0&&!isCoarse){mouseShoot=true;canvas.requestPointerLock?.();}});
window.addEventListener('pointerup',()=>{mouseShoot=false;});
window.addEventListener('mousemove',e=>{if(inGame&&document.pointerLockElement===canvas){yaw+=e.movementX*.0026;pitch=Math.max(-1.2,Math.min(1.2,pitch-e.movementY*.0026));}});
window.addEventListener('contextmenu',e=>e.preventDefault());
function hold(button,onstart,onend){const el=$(button);el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();el.setPointerCapture(e.pointerId);onstart();});for(const ev of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(ev,e=>{e.preventDefault();onend();});}
hold('fire',()=>fire=true,()=>fire=false);hold('jump',()=>key.add('Space'),()=>key.delete('Space'));hold('sprint',()=>mobileRun=true,()=>mobileRun=false);
const joystick=$('joystick'),stick=joystick.querySelector('.stick');
function moveJoy(e){const r=joystick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;const x=e.clientX-cx,y=e.clientY-cy;const max=39;const length=Math.max(1,Math.hypot(x,y)),amount=Math.min(1,length/max);moveStick=[x/length*amount,-y/length*amount];stick.style.transform=`translate(${moveStick[0]*max}px,${-moveStick[1]*max}px)`;}
joystick.addEventListener('pointerdown',e=>{e.preventDefault();stickId=e.pointerId;joystick.setPointerCapture(e.pointerId);moveJoy(e);});
joystick.addEventListener('pointermove',e=>{if(e.pointerId===stickId)moveJoy(e);});
function stopJoy(e){if(e.pointerId!==stickId)return;stickId=null;moveStick=[0,0];stick.style.transform='';}
joystick.addEventListener('pointerup',stopJoy);joystick.addEventListener('pointercancel',stopJoy);
const lookzone=$('lookzone');lookzone.addEventListener('pointerdown',e=>{if(!inGame)return;mobileLookId=e.pointerId;lastLook=[e.clientX,e.clientY];lookzone.setPointerCapture(e.pointerId);});
lookzone.addEventListener('pointermove',e=>{if(e.pointerId!==mobileLookId||!lastLook)return;yaw+=(e.clientX-lastLook[0])*.006;pitch=Math.max(-1.2,Math.min(1.2,pitch-(e.clientY-lastLook[1])*.006));lastLook=[e.clientX,e.clientY];});
for(const t of ['pointerup','pointercancel'])lookzone.addEventListener(t,e=>{if(e.pointerId===mobileLookId){mobileLookId=null;lastLook=null;}});
function input(){const f=Math.max(-1,Math.min(1,(key.has('KeyW')||key.has('ArrowUp')?1:0)-(key.has('KeyS')||key.has('ArrowDown')?1:0)+moveStick[1]));const s=Math.max(-1,Math.min(1,(key.has('KeyD')||key.has('ArrowRight')?1:0)-(key.has('KeyA')||key.has('ArrowLeft')?1:0)+moveStick[0]));return {f,s,sprint:key.has('ShiftLeft')||key.has('ShiftRight')||mobileRun,jump:key.has('Space'),fire:mouseShoot||fire,yaw,pitch};}
function frame(now){const dt=Math.min(.07,(now-renderBefore)/1000);renderBefore=now;if(toastUntil<now)$('toast').classList.remove('show');$('hitmarker').classList.toggle('show',hitUntil>now);
 if(inGame&&me){const i=input();if(pred){const mag=Math.max(1,Math.hypot(i.f,i.s)),v=(i.sprint?8.7:5.8)*dt;const dx=(Math.sin(yaw)*i.f+Math.cos(yaw)*i.s)*v/mag,dz=(-Math.cos(yaw)*i.f+Math.sin(yaw)*i.s)*v/mag;if(canOccupy(pred.x+dx,pred.z))pred.x+=dx;if(canOccupy(pred.x,pred.z+dz))pred.z+=dz;}
  if(now-lastInput>=50){send({t:'input',...i});lastInput=now;}}
 gfx.render(inGame&&pred?{...pred,id:myId,yaw,pitch}:null,players,inGame,now);requestAnimationFrame(frame);}
connection('CONNECTING');connect();setInterval(()=>{if(connected)send({t:'ping',at:Date.now()});},3500);requestAnimationFrame(frame);
