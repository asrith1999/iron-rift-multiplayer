import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Renderer geometry/logic smoke test. This is NOT a real GPU/browser rendering test.
test('v0.3 creates finite geometry, exposes quality modes and renders through a mocked GL API', async () => {
 const graphicsPath=resolve('public/graphics.js');
 const worldURL=pathToFileURL(resolve('shared/world.mjs')).href;
 const src=(await readFile(graphicsPath,'utf8')).replace("'/shared/world.mjs'",JSON.stringify(worldURL));
 const { Graphics }=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
 const prev=globalThis.Image;const prevWidth=globalThis.innerWidth;globalThis.innerWidth=960;
 globalThis.Image=class { set src(value){this.requested=value;} };
 const sent=[];
 const gl=new Proxy({}, {get(target,key){
   if(key==='canvas')return null;
   if(['getShaderParameter','getProgramParameter'].includes(key))return ()=>true;
   if(['createShader','createProgram','createBuffer','createTexture','getUniformLocation'].includes(key))return ()=>({});
   if(['getAttribLocation'].includes(key))return ()=>1;
   if(key==='bufferData')return (_target,data,_usage)=>{if(data instanceof Float32Array)sent.push(data);};
   if(typeof key==='string'&&key.toUpperCase()===key)return 1;
   return ()=>{};
 }});
 const canvas={clientWidth:960,clientHeight:540,width:0,height:0,getContext:()=>gl};
 try {
   const gfx=new Graphics(canvas);
   assert.ok(gfx.staticObjectCount>1400, `expected detailed world, got ${gfx.staticObjectCount}`);
   assert.ok(gfx.staticVertices>55000,`expected detailed geometry, got ${gfx.staticVertices}`);
   assert.ok(gfx.staticVertices<500000,'geometry should remain suitable for a mobile fallback');
   const vertices=sent[0];
   assert.ok(vertices?.length>0);
   assert.equal(vertices.length%13,0);
   assert.ok(vertices.every(Number.isFinite),'no NaN/Infinity in vertex streams');
   let minMat=Infinity,maxMat=-Infinity;
   for(let i=12;i<vertices.length;i+=13){minMat=Math.min(minMat,vertices[i]);maxMat=Math.max(maxMat,vertices[i]);}
   assert.equal(minMat,0);assert.equal(maxMat,15);
   for(const q of ['low','balanced','high','auto']){
     gfx.setQuality(q);gfx.render({x:0,z:-20,y:0,yaw:0,pitch:0,id:'a'},[{x:0,z:-5,y:0,id:'b',color:'#ff9b36',hp:100}],true,performance.now());
   }
   assert.ok(canvas.width>0 && canvas.height>0);
   console.log(`STATIC_OBJECTS=${gfx.staticObjectCount} STATIC_VERTICES=${gfx.staticVertices}`);
 } finally {globalThis.Image=prev;globalThis.innerWidth=prevWidth;}
});
