import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { HALF, SPAWNS, BLOCKERS, canOccupy } from './shared/world.mjs';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const MAX_PLAYERS = 8;
const STEP_MS = 50;
const rooms = new Map();
const clients = new Set();
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'};
const uid = () => randomBytes(5).toString('hex');
const safeName = (value) => String(value ?? 'RIFTER').replace(/[^a-zA-Z0-9 _-]/g,'').trim().slice(0,16) || 'RIFTER';
const colorSet = ['#ff9b36','#43c9e8','#94f28c','#d69dff','#ffd778','#fe7e91','#a1baff','#f0a1ec'];
const CODES = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function code() { let c; do { c=Array.from(randomBytes(6), n=>CODES[n%CODES.length]).join(''); } while(rooms.has(c));return c; }
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const asNum=(v,d=0)=>typeof v==='number'&&Number.isFinite(v)?v:d;

function sphereRay(from, dir, center, r) {
  const mx=from[0]-center[0],my=from[1]-center[1],mz=from[2]-center[2];
  const b=mx*dir[0]+my*dir[1]+mz*dir[2];
  const c=mx*mx+my*my+mz*mz-r*r;
  const disc=b*b-c;
  if (disc<0) return Infinity;
  const hit=-b-Math.sqrt(disc);
  return hit>0?hit:Infinity;
}
function boxRay(from,dir,bounds,maxD=70) {
  let min=0,max=maxD;
  for(let i=0;i<3;i++) {
    const lo=bounds[i*2],hi=bounds[i*2+1];
    if(Math.abs(dir[i])<1e-7){ if(from[i]<lo||from[i]>hi)return Infinity; }
    else {
      let t1=(lo-from[i])/dir[i], t2=(hi-from[i])/dir[i];
      if(t1>t2)[t1,t2]=[t2,t1];
      min=Math.max(min,t1);max=Math.min(max,t2);
      if(min>max)return Infinity;
    }
  }
  return min;
}
function wallDistance(from,dir) {
 let nearest=70;
 for(const [x,z,w,d,h] of BLOCKERS){nearest=Math.min(nearest,boxRay(from,dir,[x-w/2,x+w/2,0,h,z-d/2,z+d/2]));}
 nearest=Math.min(nearest,boxRay(from,dir,[-HALF,-HALF+1.4,0,6,-HALF,HALF]));
 nearest=Math.min(nearest,boxRay(from,dir,[HALF-1.4,HALF,0,6,-HALF,HALF]));
 nearest=Math.min(nearest,boxRay(from,dir,[-HALF,HALF,0,6,-HALF,-HALF+1.4]));
 nearest=Math.min(nearest,boxRay(from,dir,[-HALF,HALF,0,6,HALF-1.4,HALF]));
 return nearest;
}

const server=http.createServer(async(req,res)=>{
 if(req.method!=='GET'){res.writeHead(405);res.end('Method not allowed');return;}
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname==='/health') {res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({ok:true,rooms:rooms.size,players:[...rooms.values()].reduce((a,r)=>a+r.players.size,0)}));return;}
 let requestPath=pathname==='/'?'/public/index.html':pathname.startsWith('/shared/')?pathname:'/public'+pathname;
 let absolute=resolve(ROOT,'.'+requestPath);
 if(!absolute.startsWith(ROOT) || (!absolute.startsWith(resolve(ROOT,'public')+sep)&&!absolute.startsWith(resolve(ROOT,'shared')+sep))){res.writeHead(403);res.end();return;}
 try {
  const info=await stat(absolute);
  if(!info.isFile())throw new Error('not file');
  const file=await readFile(absolute);
  res.writeHead(200,{'Content-Type':mime[extname(absolute)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; connect-src 'self' ws: wss:; style-src 'self'; script-src 'self'; img-src 'self' data:; font-src 'self'; object-src 'none'; base-uri 'none'"});res.end(file);
 }catch{res.writeHead(404);res.end('Not found');}
});

// Minimal standards-compliant text WebSocket transport. Dependency-free for easy setup.
// Production deployments should sit behind TLS and a reverse proxy with connection limits.
class Peer {
 constructor(socket){this.socket=socket;this.buffer=Buffer.alloc(0);this.closed=false;this.player=null;this.room=null;this.messages=0;this.windowStart=Date.now();this.lastPong=Date.now();clients.add(this);
  socket.on('data', b=>this.read(b));socket.on('error',()=>this.close());socket.on('close',()=>this.close());}
 send(message){if(this.closed)return;this.frame(1,Buffer.from(JSON.stringify(message)));}
 frame(op,payload=Buffer.alloc(0)) {if(this.closed||!this.socket.writable)return;const n=payload.length; const head=n<126?Buffer.from([0x80|op,n]):n<65536?Buffer.from([0x80|op,126,n>>8,n&255]):null;if(!head){this.close();return;}this.socket.write(Buffer.concat([head,payload]));}
 read(data){this.buffer=Buffer.concat([this.buffer,data]);if(this.buffer.length>16384){this.close();return;}
  while(this.buffer.length>=2){const b=this.buffer;const fin=!!(b[0]&128),op=b[0]&15,masked=!!(b[1]&128);let n=b[1]&127,head=2;
   if(!fin||!masked){this.close();return;}
   if(n===126){if(b.length<4)return;n=b.readUInt16BE(2);head=4;}else if(n===127){this.close();return;}
   if(n>8192){this.close();return;}if(b.length<head+4+n)return;
   const mask=b.subarray(head,head+4),payload=Buffer.from(b.subarray(head+4,head+4+n));this.buffer=b.subarray(head+4+n);
   for(let i=0;i<n;i++)payload[i]^=mask[i%4];
   if(op===8){this.close();return;}if(op===9){this.frame(10,payload);continue;}if(op===10){this.lastPong=Date.now();continue;}
   if(op!==1){this.close();return;}
   const now=Date.now();if(now-this.windowStart>=1000){this.windowStart=now;this.messages=0;}if(++this.messages>60){this.close();return;}
   try{const m=JSON.parse(payload.toString('utf8'));this.handle(m);}catch{this.send({t:'error',message:'Invalid message'});}
  }
 }
 handle(m){if(!m||typeof m!=='object')return;
  if(m.t==='create'&&!this.room){const c=code();const r={code:c,players:new Map(),seconds:360,started:Date.now()};rooms.set(c,r);this.join(r,m.name);return;}
  if(m.t==='join'&&!this.room){const c=String(m.code||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);const r=rooms.get(c);if(!r){this.send({t:'error',message:'Room not found. Check the 6-character code.'});return;}if(r.players.size>=MAX_PLAYERS){this.send({t:'error',message:'Room is full (8 players).'});return;}this.join(r,m.name);return;}
  if(m.t==='input'&&this.player){const p=this.player;p.forward=clamp(asNum(m.f),-1,1);p.side=clamp(asNum(m.s),-1,1);p.yaw=clamp(asNum(m.yaw),-1000,1000);p.pitch=clamp(asNum(m.pitch),-1.35,1.35);p.sprint=Boolean(m.sprint);p.fire=Boolean(m.fire);p.jump=Boolean(m.jump);}
  if(m.t==='ping')this.send({t:'pong',at:asNum(m.at),server:Date.now()});
 }
 join(room,name){const spawn=SPAWNS[room.players.size%SPAWNS.length];const p={id:uid(),name:safeName(name),color:colorSet[room.players.size%colorSet.length],x:spawn[0],y:0,z:spawn[1],vy:0,yaw:0,pitch:0,hp:100,kills:0,deaths:0,forward:0,side:0,sprint:false,fire:false,jump:false,lastShot:0,respawn:0};
  this.player=p;this.room=room;room.players.set(p.id,this);this.send({t:'joined',id:p.id,code:room.code,mode:'FREE FOR ALL',maxPlayers:MAX_PLAYERS});emit(room,{t:'feed',text:`${p.name} entered the arena`});snapshot(room);}
 close(){if(this.closed)return;this.closed=true;clients.delete(this);try{this.socket.destroy();}catch{}
  if(this.room&&this.player){const room=this.room;room.players.delete(this.player.id);emit(room,{t:'feed',text:`${this.player.name} left the arena`});if(room.players.size===0)rooms.delete(room.code);else snapshot(room);}
  this.room=null;this.player=null;
 }
}
function emit(room,data){for(const c of room.players.values())c.send(data);}
function snapshot(room){emit(room,{t:'state',seconds:Math.max(0,Math.ceil(room.seconds)),players:[...room.players.values()].map(c=>{const p=c.player;return {id:p.id,name:p.name,color:p.color,x:+p.x.toFixed(3),y:+p.y.toFixed(3),z:+p.z.toFixed(3),yaw:+p.yaw.toFixed(3),pitch:+p.pitch.toFixed(3),hp:p.hp,kills:p.kills,deaths:p.deaths};})});}
function tick(){const dt=STEP_MS/1000,now=Date.now();for(const room of rooms.values()){
 room.seconds-=dt;if(room.seconds<=0){const leader=[...room.players.values()].sort((a,b)=>b.player.kills-a.player.kills)[0]?.player;emit(room,{t:'feed',text:`ROUND COMPLETE · ${leader?.name||'Nobody'} leads!`});room.seconds=360;for(const c of room.players.values()){c.player.kills=0;c.player.deaths=0;}}
 for(const c of room.players.values()){
  const p=c.player;
  if(p.hp<=0){if(now>=p.respawn){const spawn=SPAWNS[Math.floor(Math.random()*SPAWNS.length)];p.x=spawn[0];p.z=spawn[1];p.y=0;p.vy=0;p.hp=100;c.send({t:'respawn'});}else continue;}
  let f=p.forward,s=p.side;const mag=Math.hypot(f,s);if(mag>1){f/=mag;s/=mag;}
  const speed=p.sprint?8.7:5.8;
  const vx=(Math.sin(p.yaw)*f+Math.cos(p.yaw)*s)*speed*dt;
  const vz=(-Math.cos(p.yaw)*f+Math.sin(p.yaw)*s)*speed*dt;
  if(canOccupy(p.x+vx,p.z))p.x+=vx;if(canOccupy(p.x,p.z+vz))p.z+=vz;
  if(p.jump&&p.y===0)p.vy=7.4;
  p.y+=p.vy*dt;p.vy-=20*dt;if(p.y<=0){p.y=0;p.vy=0;}
  if(p.fire&&now-p.lastShot>=330){p.lastShot=now;const dir=[Math.sin(p.yaw)*Math.cos(p.pitch),Math.sin(p.pitch),-Math.cos(p.yaw)*Math.cos(p.pitch)],from=[p.x,p.y+1.5,p.z];let hit=null,dist=wallDistance(from,dir);
   for(const other of room.players.values()) {const q=other.player;if(q===p||q.hp<=0)continue;const d=sphereRay(from,dir,[q.x,q.y+1.35,q.z],0.78);if(d<dist){hit=q;dist=d;}}
   const end=from.map((v,i)=>+(v+dir[i]*dist).toFixed(2));emit(room,{t:'shot',by:p.id,from,end,hit:hit?.id||null});
   if(hit){hit.hp=Math.max(0,hit.hp-25);for(const peer of room.players.values())if(peer.player.id===hit.id)peer.send({t:'hurt',hp:hit.hp});if(hit.hp===0){p.kills++;hit.deaths++;hit.respawn=now+2500;emit(room,{t:'feed',text:`${p.name} tagged ${hit.name}`});}}
  }
 }
 snapshot(room);
}}
server.on('upgrade',(req,socket,head)=>{
 try{const path=new URL(req.url,'http://localhost').pathname;if(path!=='/ws'||req.headers['sec-websocket-version']!=='13'||!req.headers['sec-websocket-key']||clients.size>200){socket.destroy();return;}
  const allow=process.env.ALLOWED_ORIGIN;if(allow&&req.headers.origin!==allow){socket.destroy();return;}
  const accept=createHash('sha1').update(req.headers['sec-websocket-key']+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');
  const peer=new Peer(socket);peer.send({t:'hello',version:1,capacity:MAX_PLAYERS});if(head.length)peer.read(head);
 }catch{socket.destroy();}
});
const ticker=setInterval(tick,STEP_MS);
const heartbeat=setInterval(()=>{for(const p of clients){if(Date.now()-p.lastPong>60_000){p.close();continue;}p.frame(9,Buffer.from('hi'));}},20_000);
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url))server.listen(PORT,'0.0.0.0',()=>console.log(`IRON RIFT multiplayer running at http://localhost:${PORT}`));
export { server, rooms, tick, ticker, heartbeat };
