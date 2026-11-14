import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { server, ticker, heartbeat, rooms } from '../server.mjs';
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port;
const clients=[];
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
async function client(){const ws=new WebSocket(`ws://127.0.0.1:${port}/ws`);const inbox=[];ws.addEventListener('message',e=>{try{inbox.push(JSON.parse(e.data));}catch{}});await new Promise((ok,bad)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',bad,{once:true});});clients.push(ws);return {ws,inbox,send:m=>ws.send(JSON.stringify(m)),async wait(t,pred=()=>true){for(let n=0;n<120;n++){const found=inbox.find(m=>m.t===t&&pred(m));if(found)return found;await sleep(30);}throw Error('Timed out waiting for '+t+'; got '+JSON.stringify(inbox.slice(-3)));}};}
after(async()=>{for(const c of clients)c.close();clearInterval(ticker);clearInterval(heartbeat);for(const r of rooms.values())for(const c of r.players.values())c.close();await new Promise(resolve=>server.close(resolve));});

test('serves browser app and JSON health endpoint',async()=>{const res=await fetch(`http://127.0.0.1:${port}/`);assert.equal(res.status,200);assert.match(await res.text(),/IRON RIFT/);const health=await (await fetch(`http://127.0.0.1:${port}/health`)).json();assert.equal(health.ok,true);
 const tex=await fetch(`http://127.0.0.1:${port}/assets/foundry-materials.png`);assert.equal(tex.status,200);assert.match(tex.headers.get('content-type'),/image\/png/);assert.ok((await tex.arrayBuffer()).byteLength>100_000);
 const html=await (await fetch(`http://127.0.0.1:${port}/`)).text();assert.match(html,/FOUNDRY ASCENDANT/);assert.match(html,/id=\"quality\"/);});
test('websockets allow create, join, live state, movement, room isolation',async()=>{
 const a=await client();assert.ok(await a.wait('hello'));a.send({t:'create',name:'ALPHA'});const j=await a.wait('joined');assert.match(j.code,/^[A-Z2-9]{6}$/);const b=await client();b.send({t:'join',code:j.code,name:'BRAVO'});assert.ok(await b.wait('joined'));const st=await a.wait('state',m=>m.players.length===2);assert.equal(st.players.length,2);
 const prev=st.players.find(p=>p.id===j.id);a.send({t:'input',f:1,s:0,yaw:0,pitch:0,sprint:false,fire:false,jump:false});await sleep(270);const moved=(await a.wait('state',m=>m.players.some(p=>p.id===j.id&&p.z<prev.z-.45))).players.find(p=>p.id===j.id);assert.ok(moved.z<prev.z-.45,'player should move using server-authoritative input');
 // Place two players with an unobstructed arcade blaster line and verify the server awards a tag.
 const room=rooms.get(j.code),pa=room.players.get(j.id).player;
 const pb=[...room.players.values()].map(c=>c.player).find(p=>p.id!==j.id);
 Object.assign(pa,{x:-10,z:0,y:0,yaw:0,pitch:0,forward:0,side:0});
 Object.assign(pb,{x:-10,z:-4,y:0,forward:0,side:0});
 a.send({t:'input',f:0,s:0,yaw:0,pitch:0,fire:true});
 await sleep(1450);
 assert.ok(pa.kills>=1,'a blaster tag should increment the attacker score');
 assert.ok(pb.deaths>=1,'defender should be marked for respawn');
 a.send({t:'input',f:0,s:0,yaw:0,pitch:0,fire:false});
 const c=await client();c.send({t:'join',code:'ZZZZZZ',name:'BAD'});const err=await c.wait('error');assert.match(err.message,/not found/i);
 b.ws.close();await sleep(100);assert.equal(rooms.get(j.code).players.size,1);
 a.ws.close();await sleep(100);assert.equal(rooms.has(j.code),false);
});
