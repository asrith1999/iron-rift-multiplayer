import { HALF, BLOCKERS, SPAWNS } from '/shared/world.mjs';

// IRON RIFT v0.3 — detailed original sci-fi foundry, procedural material atlas.
// Static geometry is baked into one WebGL buffer, keeping draw calls low on phones.
const M={STEEL:0,ALLOY:1,FLOOR:2,CONCRETE:3,HAZARD:4,LIGHT:5,CRATE:6,CARBON:7,
 TITANIUM:8,GRILLE:9,CIRCUIT:10,CERAMIC:11,GOLD:12,WARNING:13,SCREEN:14,COPPER:15};
const C={ink:[.27,.39,.47],iron:[.50,.68,.78],alloy:[.77,.88,.94],wall:[.69,.78,.83],dark:[.23,.31,.39],ground:[.61,.77,.85],teal:[.15,.93,1.0],amber:[1.0,.48,.12],yellow:[1.0,.74,.27],red:[1.0,.23,.16],white:[.95,1,1],skin:[.69,.74,.73],navy:[.22,.43,.53],pale:[.86,1,1],bronze:[.76,.55,.30],titanium:[.86,.97,1],jade:[.26,.79,.72]};
const stride=13*4;
const FACES=[
  {n:[0,0,1],v:[[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],uv:[0,1]},
  {n:[0,0,-1],v:[[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]],uv:[0,1]},
  {n:[1,0,0],v:[[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1]],uv:[2,1]},
  {n:[-1,0,0],v:[[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1]],uv:[2,1]},
  {n:[0,1,0],v:[[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]],uv:[0,2]},
  {n:[0,-1,0],v:[[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]],uv:[0,2]}
];
function perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2),m=new Float32Array(16);m[0]=f/aspect;m[5]=f;m[10]=(far+near)/(near-far);m[11]=-1;m[14]=2*far*near/(near-far);return m;}
function viewMatrix(eye,target){const z=norm(sub(eye,target));let x=norm([z[2],0,-z[0]]);if(!Math.hypot(...x))x=[1,0,0];const y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);}
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const norm=a=>{const d=Math.hypot(...a)||1;return a.map(x=>x/d);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const fromHex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
function compile(gl,type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
function shaderProgram(gl,v,f){const p=gl.createProgram();gl.attachShader(p,compile(gl,gl.VERTEX_SHADER,v));gl.attachShader(p,compile(gl,gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;}
function box(out,pos,size,color=C.iron,glow=0,mat=M.STEEL,angle=0){
 const cs=Math.cos(angle),sn=Math.sin(angle),[sx,sy,sz]=size;
 for(const face of FACES){const {n,v,uv}=face;const nm=[n[0]*cs+n[2]*sn,n[1],-n[0]*sn+n[2]*cs];const order=[0,1,2,0,2,3];
  for(const i of order){const a=v[i];const x=a[0]*sx*.5,z=a[2]*sz*.5;
   const world=[pos[0]+x*cs+z*sn,pos[1]+a[1]*sy*.5,pos[2]-x*sn+z*cs];
   const u=(i===0||i===3?0:1)*(size[uv[0]]/2.7),vv=(i<2?0:1)*(size[uv[1]]/2.7);
   out.push(...world,...nm,u,vv,...color,glow,mat);
  }
 }
}
function rod(out,a,b,r,color=C.iron,mat=M.STEEL,glow=0){const d=sub(b,a);const len=Math.hypot(...d);if(len<.001)return; // XZ-oriented beam or vertical beam
 if(Math.abs(d[1])>Math.hypot(d[0],d[2])*2)box(out,a.map((v,i)=>(v+b[i])*.5),[r,len,r],color,glow,mat);
 else {const yaw=Math.atan2(d[0],d[2]);box(out,a.map((v,i)=>(v+b[i])*.5),[r,r,len],color,glow,mat,yaw);}
}
function cylinder(out,p,r,h,color=C.iron,mat=M.ALLOY,glow=0,seg=12){
 // Vertical polygonal pipe or canister, with cap and side UVs.
 const index=[0,1,2,0,2,3];
 for(let i=0;i<seg;i++){
  const a=i*Math.PI*2/seg,b=(i+1)*Math.PI*2/seg;
  const x1=Math.cos(a)*r,z1=Math.sin(a)*r,x2=Math.cos(b)*r,z2=Math.sin(b)*r;
  const positions=[[x1,-h/2,z1],[x2,-h/2,z2],[x2,h/2,z2],[x1,h/2,z1]];
  const n=norm([Math.cos((a+b)/2),0,Math.sin((a+b)/2)]);
  for(const j of index){const v=positions[j];out.push(p[0]+v[0],p[1]+v[1],p[2]+v[2],...n,(j===0||j===3?0:1),j>=2?1:0,...color,glow,mat);}
  for(const y of [-h/2,h/2]){
   const cap=[[0,y,0],[x1,y,z1],[x2,y,z2]];
   const normy=[0,Math.sign(y),0];
   for(const j of (y<0?[0,2,1]:[0,1,2])){const v=cap[j];out.push(p[0]+v[0],p[1]+v[1],p[2]+v[2],...normy,v[0]/(2*r)+.5,v[2]/(2*r)+.5,...color,glow,mat);}
  }
 }
}

// Cylindrical tubing on an arbitrary axis; also used for the detailed view-model.
function pipeSegment(out,a,b,r,color=C.iron,mat=M.COPPER,glow=0,seg=10){
 const delta=sub(b,a),len=Math.hypot(...delta);if(len<.0001)return;
 const axis=delta.map(x=>x/len),reference=Math.abs(axis[1])>.9?[1,0,0]:[0,1,0];
 const u=norm(cross(axis,reference)),v=norm(cross(axis,u));
 function pt(center,phi){return [0,1,2].map(j=>center[j]+r*(u[j]*Math.cos(phi)+v[j]*Math.sin(phi)));}
 function vertex(pos,normal,tx,ty){out.push(...pos,...normal,tx,ty,...color,glow,mat);}
 for(let i=0;i<seg;i++){
  const t=i/seg*Math.PI*2,q=(i+1)/seg*Math.PI*2;
  const p=pt(a,t),q1=pt(a,q),r1=pt(b,q),s=pt(b,t);
  const n1=norm(sub(p,a)),n2=norm(sub(q1,a));
  vertex(p,n1,i/seg,0);vertex(q1,n2,(i+1)/seg,0);vertex(r1,n2,(i+1)/seg,len/3);
  vertex(p,n1,i/seg,0);vertex(r1,n2,(i+1)/seg,len/3);vertex(s,n1,i/seg,len/3);
 }
}
function pipeRing(out,center,radius,tube,color=C.iron,mat=M.ALLOY,glow=0,axis='z',steps=16){
 const point=t=>axis==='z'?[center[0]+Math.cos(t)*radius,center[1]+Math.sin(t)*radius,center[2]]
  :axis==='x'?[center[0],center[1]+Math.sin(t)*radius,center[2]+Math.cos(t)*radius]
  :[center[0]+Math.cos(t)*radius,center[1],center[2]+Math.sin(t)*radius];
 for(let k=0;k<steps;k++)pipeSegment(out,point(k/steps*2*Math.PI),point((k+1)/steps*2*Math.PI),tube,color,mat,glow,6);
}
const VERT=`attribute vec3 aPosition;attribute vec3 aNormal;attribute vec2 aUV;attribute vec3 aColor;attribute float aGlow;attribute float aMat;
uniform mat4 uProjection;uniform mat4 uView;varying vec3 vWorld;varying vec3 vNormal;varying vec3 vColor;varying vec2 vUV;varying float vGlow;varying float vMat;varying float vDist;
void main(){vec4 view=uView*vec4(aPosition,1.0);gl_Position=uProjection*view;vWorld=aPosition;vNormal=aNormal;vColor=aColor;vUV=aUV;vGlow=aGlow;vMat=aMat;vDist=length(view.xyz);}`;
const FRAG=`#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uAtlas;uniform vec3 uCamera;uniform float uTime;uniform float uFog;uniform float uDetail;
varying vec3 vWorld;varying vec3 vNormal;varying vec3 vColor;varying vec2 vUV;varying float vGlow;varying float vMat;varying float vDist;
void main(){
 // Original 16-tile materials: 4 columns x 4 rows.
 vec2 atlasOffset=vec2(mod(floor(vMat+.5),4.0),floor((vMat+.5)/4.0));
 vec2 texUv=(atlasOffset+(.017+fract(vUV)*.966))/4.0;
 vec3 tex=texture2D(uAtlas,texUv).rgb;
 vec3 n=normalize(vNormal);
 vec3 key=normalize(vec3(.47,.85,.33));
 vec3 fill=normalize(vec3(-.67,.43,-.47));
 float hemi=.16+.21*max(0.0,n.y);
 float diff=.63+hemi+max(dot(n,key),0.)*.52+max(dot(n,fill),0.)*.26;
 vec3 viewer=normalize(uCamera-vWorld);
 float rough=step(2.5,vMat)*.35+.18;
 float spec=pow(max(dot(reflect(-key,n),viewer),0.),mix(38.,10.,rough));
 vec3 col=tex*vColor*diff+spec*vec3(.14,.25,.27)*uDetail;
 // Three colored practical lights: center reactor + two factory corners.
 float reactor=1.0/(1.0+dot(vWorld-vec3(0.,5.2,0.),vWorld-vec3(0.,5.2,0.))*.019);
 float cyan=1.0/(1.0+dot(vWorld-vec3(-16.,7.,-15.),vWorld-vec3(-16.,7.,-15.))*.009);
 float amber=1.0/(1.0+dot(vWorld-vec3(17.,6.,15.),vWorld-vec3(17.,6.,15.))*.012);
 col+=tex*vec3(.17,.82,.92)*(reactor*.55+cyan*.30);
 col+=tex*vec3(.94,.50,.12)*amber*.23;
 float pulse=.88+.12*sin(uTime*2.3+vWorld.y*.14);
 col+=vColor*vGlow*(.67+uDetail*.32)*pulse;
 // Distant factory haze; brighter and less muddy than v0.2.
 float fog=clamp((vDist-33.)/82.,0.,.73)*uFog;
 col=mix(col,vec3(.035,.105,.132),fog);
 col=col/(col+vec3(.72));
 gl_FragColor=vec4(pow(col,vec3(.88)),1.);
}`;
export class Graphics {
 constructor(canvas){
  this.canvas=canvas;const gl=canvas.getContext('webgl',{antialias:true,alpha:false,depth:true,powerPreference:'high-performance'})||canvas.getContext('experimental-webgl');
  if(!gl)throw new Error('WebGL unavailable. Update your browser or enable hardware acceleration.');this.gl=gl;
  this.p=shaderProgram(gl,VERT,FRAG);gl.useProgram(this.p);
  this.attribs=[['aPosition',3,0],['aNormal',3,12],['aUV',2,24],['aColor',3,32],['aGlow',1,44],['aMat',1,48]].map(([name,size,offset])=>({loc:gl.getAttribLocation(this.p,name),size,offset}));
  this.uniforms={proj:gl.getUniformLocation(this.p,'uProjection'),view:gl.getUniformLocation(this.p,'uView'),eye:gl.getUniformLocation(this.p,'uCamera'),time:gl.getUniformLocation(this.p,'uTime'),fog:gl.getUniformLocation(this.p,'uFog'),detail:gl.getUniformLocation(this.p,'uDetail')};
  this.staticBuffer=gl.createBuffer();this.dynamicBuffer=gl.createBuffer();
  this.objects=[];this.buildScene();
  const baked=[];for(const ob of this.objects){if(ob.kind==='cylinder')cylinder(baked,ob.p,ob.r,ob.h,ob.c,ob.mat,ob.g,ob.seg);else if(ob.kind==='pipe')pipeSegment(baked,ob.from,ob.to,ob.r,ob.c,ob.mat,ob.g,ob.seg);else if(ob.kind==='ring')pipeRing(baked,ob.p,ob.radius,ob.r,ob.c,ob.mat,ob.g,ob.axis,ob.seg);else box(baked,ob.p,ob.s,ob.c,ob.g,ob.mat,ob.a);}
  this.staticVertices=baked.length/13;this.staticObjectCount=this.objects.length;
  gl.bindBuffer(gl.ARRAY_BUFFER,this.staticBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(baked),gl.STATIC_DRAW);
  this.texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.texture);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([120,140,150,255]));
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.uniform1i(gl.getUniformLocation(this.p,'uAtlas'),0);
  const img=new Image();img.onload=()=>{gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,img);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);this.atlasReady=true;};img.src='/assets/foundry-materials.png';
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.CULL_FACE);gl.clearColor(.027,.081,.104,1);
  this.quality='auto';this.lastFire=0;this.shots=[];this.frameCount=0;
 }
 add(p,s,c=C.iron,mat=M.STEEL,g=0,a=0){this.objects.push({p,s,c,mat,g,a});}
 can(p,r,h,c,mat=M.ALLOY,g=0,seg=12){this.objects.push({kind:'cylinder',p,r,h,c,mat,g,seg});}
 pipe(from,to,r,c=C.iron,mat=M.COPPER,g=0,seg=8){this.objects.push({kind:'pipe',from,to,r,c,mat,g,seg});}
 ring(p,radius,r,c=C.iron,mat=M.ALLOY,g=0,axis='z',seg=14){this.objects.push({kind:'ring',p,radius,r,c,mat,g,axis,seg});}

 buildScene(){const A=this.add.bind(this), CY=this.can.bind(this),P=this.pipe.bind(this),R=this.ring.bind(this);
  // Baked panel floor: each tile has its own seam, depth and material texture.
  A([0,-.58,0],[48,1.1,48],C.ink,M.CARBON);
  for(let ix=-6;ix<6;ix++)for(let iz=-6;iz<6;iz++){
   const x=(ix+.5)*4,z=(iz+.5)*4,k=(ix*31+iz*7+73)%7;
   A([x,-.012,z],[3.95,.12,3.95],k===0?C.iron:C.ground,M.FLOOR);
   if((ix+iz)%3===0){A([x,.058,z-1.65],[2.2,.025,.08],C.dark,M.CARBON);A([x,.058,z+1.65],[2.2,.025,.08],C.dark,M.CARBON);}
  }
  for(let n=-20;n<=20;n+=4){A([n,.065,0],[.055,.045,47],C.dark,M.CARBON);A([0,.065,n],[47,.045,.055],C.dark,M.CARBON);}
  // Lane lights and painted caution tracks, placed flush with the floor.
  for(const x of [-19,19])for(let z=-18;z<=18;z+=4){A([x,.072,z],[.12,.025,2.7],C.teal,M.LIGHT,.78);}
  for(const z of [-19,19])for(let x=-18;x<=18;x+=4){A([x,.072,z],[2.7,.025,.12],C.amber,M.LIGHT,.7);}
  for(let z=-20;z<=20;z+=5){A([-3.5,.073,z],[.9,.024,.12],C.yellow,M.HAZARD);A([3.5,.073,z],[.9,.024,.12],C.yellow,M.HAZARD);}
  // Structural outer shell, vertical ribs and inset metal panel sections.
  for(const side of [-1,1]){
   A([0,4.7,side*23.45],[48,9.4,1.1],C.wall,M.CONCRETE);
   A([side*23.45,4.7,0],[1.1,9.4,48],C.wall,M.CONCRETE);
   for(let i=-20;i<=20;i+=8){
    A([i,5.2,side*22.75],[.66,10.4,.72],C.ink,M.STEEL);
    A([side*22.75,5.2,i],[.72,10.4,.66],C.ink,M.STEEL);
    A([i,8.65,side*22.34],[5.5,.45,.15],C.iron,M.ALLOY);
    A([side*22.34,8.65,i],[.15,.45,5.5],C.iron,M.ALLOY);
    A([i,7.9,side*22.24],[4.9,.20,.16],C.teal,M.LIGHT,1.35);
    A([side*22.24,7.9,i],[.16,.20,4.9],C.teal,M.LIGHT,1.35);
    A([i,2.55,side*22.76],[5.6,1.35,.15],C.dark,M.CARBON);
    A([side*22.76,2.55,i],[.15,1.35,5.6],C.dark,M.CARBON);
    for(let k=-2;k<=2;k++){
     A([i+k,2.55,side*22.62],[.06,1.15,.08],C.iron,M.STEEL);
     A([side*22.62,2.55,i+k],[.08,1.15,.06],C.iron,M.STEEL);
    }
    A([i,4.25,side*22.58],[3.5,.14,.22],C.amber,M.LIGHT,.6);
    A([side*22.58,4.25,i],[.22,.14,3.5],C.amber,M.LIGHT,.6);
   }
   A([0,9.3,side*22.2],[47,.34,.6],C.dark,M.STEEL);
   A([side*22.2,9.3,0],[.6,.34,47],C.dark,M.STEEL);
   // Massive coolant ducts running around two opposite walls.
   for(const y of [5.2,6.25]){
    A([0,y,side*22.95],[45,.28,.28],C.iron,M.ALLOY);
    A([side*22.95,y,0],[.28,.28,45],C.iron,M.ALLOY);
   }
   for(let i=-20;i<=20;i+=4){
    A([i,5.75,side*22.82],[.23,1.3,.36],C.dark,M.STEEL);
    A([side*22.82,5.75,i],[.36,1.3,.23],C.dark,M.STEEL);
   }
  }
  // Overhead maintenance girders and hanging white/teal industrial luminaires.
  for(const z of [-16,0,16]){
   A([0,9.4,z],[47,.62,.65],C.ink,M.STEEL);
   for(let x=-18;x<=18;x+=9){A([x,9.04,z],[4,.14,1.25],C.alloy,M.ALLOY);A([x,8.91,z],[3.4,.10,.52],C.teal,M.LIGHT,1.35);}
   for(const x of [-18,-6,6,18]){A([x,7.6,z],[.12,3.2,.12],C.iron,M.ALLOY);}
  }
  for(const x of [-16,0,16])A([x,9.8,0],[.55,.55,47],C.ink,M.STEEL);
  // Upgrade only the appearance of shared obstacle footprints (server collision stays identical).
  BLOCKERS.forEach(([x,z,w,d,h],i)=>{
   const mats=i%3===0?M.CRATE:i%3===1?M.STEEL:M.CONCRETE;
   A([x,h/2,z],[w,h,d],i%2===0?C.iron:C.wall,mats);
   A([x,h+.09,z],[w+.22,.2,d+.22],C.dark,M.STEEL);
   A([x,.18,z],[w+.25,.34,d+.25],C.ink,M.CARBON);
   const horizontal=w>d, long=horizontal?w:d;
   for(let j=0;j<Math.max(2,Math.floor(long/1.5));j++){
    const offset=-long/2+.6+j*(long-1.2)/Math.max(1,Math.floor(long/1.5)-1);
    if(horizontal){A([x+offset,h*.52,z-d/2-.045],[.13,h*.78,.12],C.alloy,M.ALLOY);A([x+offset,h*.52,z+d/2+.045],[.13,h*.78,.12],C.alloy,M.ALLOY);}
    else{A([x-w/2-.045,h*.52,z+offset],[.12,h*.78,.13],C.alloy,M.ALLOY);A([x+w/2+.045,h*.52,z+offset],[.12,h*.78,.13],C.alloy,M.ALLOY);}
   }
   A([x,h*.74,z],[w+.24,.18,d+.24],i%2?C.teal:C.amber,M.LIGHT,.64);
   A([x,h*.28,z],[w+.22,.16,d+.22],C.dark,M.CARBON);
   if(w>3&&d>3){A([x,h+.22,z],[w*.74,.1,d*.72],C.yellow,M.HAZARD);A([x,h+.30,z],[w*.64,.11,d*.62],C.ink,M.STEEL);}
   // Decorative reactor stacks are attached to existing solid collision blocks.
   if(i===4){
    CY([x,h+1.05,z],1.7,2.1,C.iron,M.ALLOY);
    CY([x,h+1.22,z],1.34,1.4,C.teal,M.LIGHT,1.25);
    for(let k=0;k<8;k++){const a=k*Math.PI/4;A([x+Math.cos(a)*1.6,h+1.22,z+Math.sin(a)*1.6],[.3,2.4,.3],C.dark,M.CARBON);}
    A([x,h+2.25,z],[4.15,.22,4.15],C.alloy,M.STEEL);
    A([x,h+2.5,z],[2.4,.23,2.4],C.amber,M.LIGHT,1.2);
   }
   if(i%3===0){const top=h+1.0;CY([x,top,z],.34,1.8,C.iron,M.ALLOY);CY([x,top+.72,z],.43,.19,C.teal,M.LIGHT,1.1);}
  });
  // Air ducts and raised gantry sections; all above player head height.
  for(const z of [-10,10]){
   A([0,7.15,z],[38,.32,2.2],C.iron,M.FLOOR);
   for(let x=-17.5;x<=17.5;x+=2.5){A([x,8.1,z-1.05],[.13,1.9,.14],C.dark,M.STEEL);A([x,8.1,z+1.05],[.13,1.9,.14],C.dark,M.STEEL);}
   for(const off of [-1.08,1.08]){A([0,8.95,z+off],[38,.15,.14],C.yellow,M.HAZARD);A([0,7.2,z+off],[38,.12,.14],C.dark,M.CARBON);}
   for(const x of [-18,18])A([x,5.4,z],[.7,10.8,.7],C.ink,M.STEEL);
  }
  for(const x of [-18,18]){
   A([x,6.0,0],[.66,.66,41],C.dark,M.ALLOY);
   for(let z=-17;z<=17;z+=6){A([x,6,z],[1.15,1.15,.23],C.iron,M.STEEL);}
  }
  // Four corner machinery towers + emissive beacon crowns.
  for(const x of [-21,21])for(const z of [-21,21]){
   A([x,5.2,z],[1.7,10.4,1.7],C.ink,M.CARBON);
   A([x,10.45,z],[3.25,.6,3.25],C.alloy,M.ALLOY);
   CY([x,11.3,z],.8,1.2,C.amber,M.LIGHT,1.5);
   A([x,12.2,z],[.22,.8,.22],C.iron,M.STEEL);
   for(const off of [-1,1])A([x+off*.56,5.5,z],[.12,8,.12],C.teal,M.LIGHT,.9);
  }
  // Non-colliding floor markers at spawn stations.
  SPAWNS.forEach(([x,z],i)=>{
   A([x,.075,z],[1.8,.021,.15],i%2?C.amber:C.teal,M.LIGHT,.8);
   A([x,.075,z],[.15,.021,1.8],i%2?C.amber:C.teal,M.LIGHT,.8);
   for(const off of [-1.45,1.45])A([x+off,.085,z],[.45,.025,.13],C.yellow,M.HAZARD);
  });
  // v0.3 / forged architecture: layered side-wall modules, illuminated tracks and cable conduits.
  // All new meshes are wall-mounted, overhead, or attached to existing collision volumes.
  for(const side of [-1,1]){
   for(let i=-19;i<=19;i+=6){
    const Z=side*22.12, X=side*22.12;
    // Recessed reactor access windows with inset frame, grille and digital readouts.
    A([i,5.2,Z],[4.9,2.85,.22],C.ink,M.CARBON);
    A([i,5.2,Z-side*.13],[4.0,1.85,.24],C.navy,M.GRILLE);
    A([i,5.2,Z-side*.28],[3.25,1.24,.07],C.jade,M.SCREEN,.43);
    A([i,6.56,Z-side*.18],[4.8,.14,.18],C.titanium,M.TITANIUM);
    A([i,3.78,Z-side*.18],[4.8,.12,.18],C.titanium,M.TITANIUM);
    A([X,5.2,i],[.22,2.85,4.9],C.ink,M.CARBON);
    A([X-side*.13,5.2,i],[.24,1.85,4.0],C.navy,M.GRILLE);
    A([X-side*.29,5.2,i],[.08,1.24,3.25],C.jade,M.SCREEN,.43);
    A([X-side*.18,6.56,i],[.18,.14,4.8],C.titanium,M.TITANIUM);
    // Wall conduits and their bright retaining clips.
    for(const h of [2.1,7.15]){
     P([i-2.4,h,Z-side*.3],[i+2.4,h,Z-side*.3],.12,C.bronze,M.COPPER,0,7);
     P([X-side*.3,h,i-2.4],[X-side*.3,h,i+2.4],.12,C.bronze,M.COPPER,0,7);
    }
    for(const off of [-2.2,2.2]){
     A([i+off,5.25,Z-side*.38],[.13,3.9,.13],C.alloy,M.TITANIUM);
     A([X-side*.38,5.25,i+off],[.13,3.9,.13],C.alloy,M.TITANIUM);
    }
    A([i,7.36,Z-side*.44],[2.6,.07,.08],C.teal,M.LIGHT,1.6);
    A([X-side*.44,7.36,i],[.08,.07,2.6],C.teal,M.LIGHT,1.6);
   }
  }
  // Ceiling truss triangles: visually layered and cheap because the static mesh is batched.
  for(const z of [-18,-6,6,18])for(let x=-22;x<22;x+=5.5){
   P([x,11.1,z],[x+2.75,9.5,z],.09,C.titanium,M.TITANIUM,0,5);
   P([x+2.75,9.5,z],[x+5.5,11.1,z],.09,C.titanium,M.TITANIUM,0,5);
   A([x+2.75,11.05,z],[5.2,.19,.28],C.ink,M.CARBON);
  }
  // Round ventilation nacelles, double concentric rings, rotor ribs (above player height).
  for(const z of [-16,16])for(const x of [-14,0,14]){
   A([x,9.4,z],[3.1,2.1,.75],C.ink,M.STEEL);
   A([x,9.4,z-.48],[2.7,1.8,.16],C.dark,M.GRILLE);
   R([x,9.4,z-.64],.91,.10,C.titanium,M.TITANIUM,0,'z',16);
   R([x,9.4,z-.68],.57,.055,C.jade,M.LIGHT,.6,'z',14);
   CY([x,9.4,z-.72],.20,.15,C.alloy,M.TITANIUM,0,10);
   for(let k=0;k<5;k++){
    const angle=k*Math.PI*2/5;
    P([x,9.4,z-.7],[x+Math.cos(angle)*.74,9.4+Math.sin(angle)*.74,z-.7],.082,C.iron,M.ALLOY,0,6);
   }
   A([x,8.23,z],[2.45,.09,.15],C.amber,M.GOLD,.8);
  }
  // Major elevated utility pipe runs, supports and valve loops.
  for(const x of [-21,-12,12,21]){
   for(const z of [-19,-11,-3,5,13]){
    P([x,7.2,z],[x,7.2,z+7],.17,C.jade,M.COPPER,0,10);
    R([x,7.2,z+3.5],.46,.065,C.bronze,M.GOLD,0,'z',12);
    A([x,8.02,z+3.5],[.12,.83,.13],C.iron,M.ALLOY);
   }
  }
  // Embellish the existing solid collision towers, never adding unsupported floor blockers.
  BLOCKERS.forEach(([x,z,w,d,h],i)=>{
   const bY=h+.26;
   A([x,bY,z],[Math.min(w,3),.18,Math.min(d,3)],C.titanium,M.TITANIUM);
   for(let k=-1;k<=1;k++){
    const xo=x+k*Math.min(w*.25,.64);
    A([xo,bY+.13,z],[.15,.08,Math.min(d*.7,3.2)],i%2?C.amber:C.teal,M.LIGHT,.75);
   }
   if(i%2===0){
    const r=Math.min(w,d)*.22;
    R([x,h+.9,z],r,.08,C.alloy,M.TITANIUM,0,'y',16);
    CY([x,h+.65,z],r*.73,1.0,C.iron,M.COPPER,0,12);
    CY([x,h+1.2,z],r*.50,.12,C.teal,M.LIGHT,1.65,12);
    for(let p=0;p<6;p++){
     const t=p*Math.PI/3;
     A([x+Math.cos(t)*r*.73,h+.73,z+Math.sin(t)*r*.73],[.13,1.1,.13],C.navy,M.TITANIUM);
    }
   }
   if(i%3===1){
    const wallZ=z+d*.5+.065;
    A([x,h*.48,wallZ],[Math.min(w*.74,2),Math.min(1.7,h*.7),.12],C.dark,M.GRILLE);
    A([x,h*.49,wallZ+.075],[Math.min(w*.55,1.5),.55,.08],C.teal,M.SCREEN,.7);
    for(let k=-1;k<=1;k++)A([x+k*.47,h*.38,wallZ+.13],[.24,.09,.035],C.amber,M.GOLD,.78);
   }
  });
  // Visually significant center stack: rings/cables above its authoritative footprint.
  for(const height of [5.9,7.05,8.22]){
   R([0,height,0],2.05,.145,C.alloy,M.TITANIUM,0,'y',20);
   R([0,height+.16,0],1.45,.085,C.teal,M.LIGHT,1.6,'y',18);
   for(let k=0;k<6;k++){
    const th=k*Math.PI/3;
    P([Math.cos(th)*1.87,height,Math.sin(th)*1.87],[Math.cos(th)*1.22,height+.55,Math.sin(th)*1.22],.115,C.bronze,M.COPPER,0,7);
   }
  }
  CY([0,7.45,0],.82,4.6,C.jade,M.SCREEN,.85,18);
  CY([0,9.8,0],1.3,.3,C.titanium,M.ALLOY,0,16);
  // Industrial hanging information displays, high enough not to block navigation.
  for(const x of [-14,14])for(const z of [-6,6]){
   A([x,7.1,z],[2.75,1.55,.23],C.ink,M.CARBON);
   A([x,7.1,z-.13],[2.34,1.18,.08],C.pale,M.SCREEN,.70);
   A([x,7.77,z-.18],[2.6,.11,.11],C.amber,M.GOLD,.5);
   for(let k=0;k<3;k++)A([x-.75+k*.75,6.85,z-.2],[.36,.06,.06],C.teal,M.LIGHT,1.0);
   P([x,7.88,z],[x,9.7,z],.10,C.iron,M.COPPER,0,8);
  }
  // Distant factory skyline seen behind the walls in lobby fly-over.
  for(let i=0;i<14;i++){
   const x=-40+i*6;const z=i%2?-31:31;
   A([x,7,z],[2.7,14+(i%4)*3,2.7],C.dark,M.CARBON);
   A([x,14+(i%4)*3,z],[3,.5,3],C.iron,M.ALLOY);
   A([x,14.4+(i%4)*3,z],[1,.22,1],C.amber,M.LIGHT,1.2);
  }
 }
 setQuality(value){this.quality=['low','balanced','high','auto'].includes(value)?value:'auto';}
 resize(){const {gl,canvas}=this;const low=innerWidth<780;const cap=this.quality==='low'?1:this.quality==='balanced'?1.35:this.quality==='high'?2:(low?1.16:1.6);
  const dpr=Math.min(globalThis.devicePixelRatio||1,cap);const w=Math.max(1,Math.round(canvas.clientWidth*dpr)),h=Math.max(1,Math.round(canvas.clientHeight*dpr));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}return w/h;
 }
 bind(buffer){const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,buffer);for(const {loc,size,offset} of this.attribs){if(loc<0)continue;gl.vertexAttribPointer(loc,size,gl.FLOAT,false,stride,offset);gl.enableVertexAttribArray(loc);}}
 drawDynamic(arr){if(!arr.length)return;const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,this.dynamicBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(arr),gl.DYNAMIC_DRAW);this.bind(this.dynamicBuffer);gl.drawArrays(gl.TRIANGLES,0,arr.length/13);}
 character(out,p,now){const y=p.y||0,x=p.x,z=p.z,a=p.yaw||0,c=fromHex(p.color||'#ef8733');
  const B=(u,v,w,s,col,mat=M.ALLOY,g=0)=>box(out,[x+Math.cos(a)*u+Math.sin(a)*w,y+v,z-Math.sin(a)*u+Math.cos(a)*w],s,col,g,mat,a);
  const step=Math.sin(now*.007+(p.id?.length||0))*.06;
  B(0,.92,0,[.78,1.15,.50],c,M.STEEL);B(0,1.05,-.30,[.53,.49,.18],C.dark,M.CARBON);
  B(0,1.57,0,[.68,.58,.59],C.dark,M.ALLOY);B(0,1.65,-.306,[.57,.19,.07],C.teal,M.LIGHT,1.2);
  B(0,1.89,.07,[.75,.16,.65],C.iron,M.ALLOY);B(0,1.13,.31,[.60,.71,.20],C.ink,M.CARBON);
  for(const s of [-1,1]){B(s*.5,1.12,0,[.31,.75,.37],C.iron);B(s*.5,.8,-.09,[.18,.3,.31],c,M.STEEL);B(s*.2,.38+step*s,0,[.29,.73,.31],C.dark,M.CARBON);B(s*.2,.07+step*s,-.1,[.32,.16,.55],C.iron);}
  B(0,1.18,-.52,[.23,.24,.95],C.ink,M.ALLOY);B(0,1.25,-.98,[.17,.18,.61],C.teal,M.LIGHT,.6);
  B(0,1.91,-.24,[.42,.20,.13],C.titanium,M.CERAMIC);B(0,1.91,-.34,[.34,.10,.09],C.teal,M.LIGHT,1.0);
  for(const s of [-1,1]){B(s*.31,1.43,.08,[.21,.10,.37],C.titanium,M.TITANIUM);B(s*.48,1.01,-.28,[.10,.45,.13],C.teal,M.LIGHT,.85);}
  B(0,.89,.34,[.55,.15,.1],C.bronze,M.GOLD);
 }
 weapon(out,now){
  // Original fictional RIFT-03 energy tool: concentric coils, heat shields, sights and power cell.
  // Geometry is authored in view-space and has no correspondence to a real weapon mechanism.
  const bob=Math.sin(now*.0023)*.008, lift=bob;
  const B=(p,size,c,mat=M.TITANIUM,g=0)=>box(out,[p[0],p[1]+lift,p[2]],size,c,g,mat);
  const T=(a,b,r,c=C.titanium,mat=M.TITANIUM,g=0,seg=10)=>pipeSegment(out,[a[0],a[1]+lift,a[2]],[b[0],b[1]+lift,b[2]],r,c,mat,g,seg);
  const R=(p,rad,tube,c=C.teal,mat=M.LIGHT,g=.8)=>pipeRing(out,[p[0],p[1]+lift,p[2]],rad,tube,c,mat,g,'z',14);
  // Faceted chassis and light alloy upper armor.
  B([.41,-.36,-.83],[.37,.26,1.18],C.ink,M.CARBON);
  B([.41,-.28,-.96],[.31,.18,1.10],C.titanium,M.TITANIUM);
  B([.41,-.16,-.72],[.29,.10,.59],C.wall,M.CERAMIC);
  B([.41,-.235,-1.46],[.24,.15,.30],C.dark,M.GRILLE);
  B([.41,-.385,-.36],[.36,.20,.55],C.navy,M.STEEL);
  B([.48,-.57,-.37],[.19,.44,.23],C.ink,M.CARBON);
  B([.49,-.63,-.37],[.17,.26,.17],C.skin,M.CERAMIC);
  // Floating emitter barrel and layered front corona.
  T([.41,-.315,-1.18],[.41,-.315,-1.92],.115,C.dark,M.CARBON);
  T([.41,-.315,-1.24],[.41,-.315,-1.84],.07,C.jade,M.CIRCUIT,.7);
  R([.41,-.315,-1.91],.16,.049,C.titanium,M.TITANIUM,.12);
  R([.41,-.315,-1.99],.10,.035,C.teal,M.LIGHT,1.8);
  // A fully original three-tier plasma coil housing.
  for(const z of [-1.11,-1.26,-1.41,-1.56,-1.71]){
   R([.41,-.315,z],.165,.037,C.bronze,M.GOLD,.20);
   R([.41,-.315,z-.055],.18,.022,C.teal,M.LIGHT,1.2);
  }
  for(const x of [.24,.58]){
   T([x,-.23,-1.12],[x,-.23,-1.74],.026,C.titanium,M.TITANIUM,0,7);
   T([x,-.40,-1.12],[x,-.40,-1.74],.026,C.titanium,M.TITANIUM,0,7);
  }
  // Shoulder shrouds, segmented heat fins and visible screen near the top.
  for(let k=0;k<4;k++){
   const z=-.64-k*.18;
   B([.20,-.23,z],[.08,.17,.115],C.alloy,M.ALLOY);
   B([.62,-.23,z],[.08,.17,.115],C.alloy,M.ALLOY);
  }
  B([.40,-.09,-.62],[.18,.045,.26],C.ink,M.CARBON);
  B([.41,-.067,-.64],[.12,.028,.19],C.teal,M.SCREEN,.95);
  for(let k=0;k<3;k++)B([.41,-.24,-.40+k*.13],[.20,.04,.085],C.bronze,M.GOLD);
  B([.40,-.49,-.77],[.18,.25,.27],C.jade,M.CIRCUIT);
  B([.40,-.49,-.785],[.15,.1,.28],C.teal,M.LIGHT,.83);
  B([.4,-.60,-.83],[.15,.07,.24],C.ink,M.CARBON);
  // Low-poly powered gauntlet; a subtle animated glow and fictional firing burst.
  B([.55,-.49,-.31],[.26,.20,.28],C.dark,M.CERAMIC);
  B([.57,-.46,-.36],[.22,.07,.12],C.jade,M.CIRCUIT,.25);
  if(now-this.lastFire<150){
   const r=Math.max(.1,1-(now-this.lastFire)/150);
   R([.41,-.315,-2.12],.31*r,.06,C.amber,M.LIGHT,2.8);
   B([.41,-.315,-2.14],[.12*r,.12*r,.24*r],C.white,M.LIGHT,3.0);
  }
 }
 render(me,players=[],active=false,now=performance.now()){
  const gl=this.gl;const aspect=this.resize();gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.p);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.texture);
  const proj=perspective(Math.PI/3.05,aspect,.08,142);
  let eye,target;
  if(active&&me){const yaw=me.yaw||0,pitch=me.pitch||0;eye=[me.x,(me.y||0)+1.65,me.z];target=[eye[0]+Math.sin(yaw)*Math.cos(pitch),eye[1]+Math.sin(pitch),eye[2]-Math.cos(yaw)*Math.cos(pitch)];}
  else {const t=now*.000075+.65;eye=[Math.sin(t)*33,22+Math.sin(t*2)*2,Math.cos(t)*34];target=[0,3.8,0];}
  gl.uniformMatrix4fv(this.uniforms.proj,false,proj);gl.uniformMatrix4fv(this.uniforms.view,false,viewMatrix(eye,target));gl.uniform3fv(this.uniforms.eye,eye);gl.uniform1f(this.uniforms.time,now*.001);gl.uniform1f(this.uniforms.fog,active?1:.65);gl.uniform1f(this.uniforms.detail,this.quality==='low'?.35:1);
  this.bind(this.staticBuffer);gl.drawArrays(gl.TRIANGLES,0,this.staticVertices);
  const dyn=[];
  for(const p of players)if(p.id!==me?.id&&p.hp>0)this.character(dyn,p,now);
  for(const s of this.shots){const fade=1-(now-s.time)/210;if(fade<=0)continue;
   const d=sub(s.end,s.from),len=Math.hypot(...d),n=Math.min(22,Math.ceil(len/1.4));
   for(let i=0;i<n;i++){const t=(i+.5)/n,p=s.from.map((v,j)=>v+d[j]*t);box(dyn,p,[.07*fade,.07*fade,.42*fade],C.amber,2,M.LIGHT);}
   box(dyn,s.end,[.45*fade,.45*fade,.45*fade],C.teal,2,M.LIGHT);
  }
  this.shots=this.shots.filter(s=>now-s.time<210);this.drawDynamic(dyn);
  if(active&&me){gl.clear(gl.DEPTH_BUFFER_BIT);
   const vp=viewMatrix([0,0,0],[0,0,-1]);gl.uniformMatrix4fv(this.uniforms.view,false,vp);gl.uniform3fv(this.uniforms.eye,[0,0,0]);gl.uniform1f(this.uniforms.fog,0);
   const gun=[];this.weapon(gun,now);this.drawDynamic(gun);
  }
 }
 fire(from,end){this.lastFire=performance.now();if(Array.isArray(from)&&Array.isArray(end))this.shots.push({from,end,time:this.lastFire});}
}
