// All GLSL for the Tesseract world.
export const FS_VERT = /* glsl */`
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

/* ---------- raymarched interior: the lattice, its pillar variations, and the funnel ---------- */
export const LATTICE_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform float uTime, uAspect, uZ, uRoll, uFog, uGlow, uTunnel, uTunnelLen, uTunnelStage;
uniform vec3 uColA, uColB;
uniform vec4 uMode;   // weights: grid, rings, nodes, field
uniform vec2 uCell;   // xz cell, y cell
uniform vec2 uLook;
#ifndef STEPS
#define STEPS 56
#endif
mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
float sdBox(vec3 p, vec3 b){ vec3 q=abs(p)-b; return length(max(q,0.)) + min(max(q.x,max(q.y,q.z)),0.); }
float sdFrame(vec3 p, vec3 b, float e){
  p=abs(p)-b; vec3 q=abs(p+e)-e;
  return min(min(
    length(max(vec3(p.x,q.y,q.z),0.))+min(max(p.x,max(q.y,q.z)),0.),
    length(max(vec3(q.x,p.y,q.z),0.))+min(max(q.x,max(p.y,q.z)),0.)),
    length(max(vec3(q.x,q.y,p.z),0.))+min(max(q.x,max(q.y,p.z)),0.));
}
vec3 rep(vec3 p, vec3 c){ return mod(p+.5*c,c)-.5*c; }

float gridD(vec3 p){
  vec3 c=vec3(uCell.x,uCell.y,uCell.x);
  vec3 q=rep(p,c);
  float d=sdFrame(q,c*.5,.035);
  // a smaller cell turning inside each large one: cube within a cube
  vec3 r=q; r.xz*=rot(uTime*.13); r.xy*=rot(uTime*.09);
  d=min(d,sdFrame(r,c*.17,.022));
  // the eight struts that make it read as a tesseract cell
  vec3 a=abs(q); float s=length(a.xy-a.z*vec2(1.))-.012;
  return min(d,max(s,sdBox(q,c*.5)));
}
float ringsD(vec3 p){
  float rr=length(p.xy);
  float z=mod(p.z+3.,6.)-3.;
  float best=1e3;
  for(int i=0;i<3;i++){
    float R=mod(rr+float(i)*.0,7.)-3.5;
    best=min(best,length(vec2(R,z))-.05);
    p.xy*=rot(.5);
  }
  return best;
}
float nodesD(vec3 p){
  vec3 c=vec3(5.);
  vec3 q=rep(p,c);
  float d=length(q)-.17;
  vec3 a=abs(q);
  d=min(d,length(a.xy)-.018);
  d=min(d,length(a.yz)-.018);
  d=min(d,length(a.xz)-.018);
  vec3 b=q; b=abs(b); float diag=length(b-dot(b,vec3(.577))*vec3(.577))-.012;
  return min(d,diag);
}
float fieldD(vec3 p){
  vec3 c=vec3(1.5);
  vec3 id=floor((p+.5*c)/c);
  vec3 q=rep(p,c);
  q+=.45*sin(id.yzx*3.1+uTime*.5+id.zxy);
  return length(q)-.035;
}
float mapWorld(vec3 p){
  float d=1e3, w=0.;
  if(uMode.x>.004){ d=gridD(p); w=uMode.x; }
  if(uMode.y>.004){ float e=ringsD(p); d= w>0.? mix(d,e,uMode.y/(w+uMode.y)) : e; w+=uMode.y; }
  if(uMode.z>.004){ float e=nodesD(p); d= w>0.? mix(d,e,uMode.z/(w+uMode.z)) : e; w+=uMode.z; }
  if(uMode.w>.004){ float e=fieldD(p); d= w>0.? mix(d,e,uMode.w/(w+uMode.w)) : e; }
  return d;
}
float tunnelRadius(float z){ return mix(9.,1.9,smoothstep(0.,1.,clamp(z/uTunnelLen,0.,1.))); }
float mapTunnel(vec3 p){
  float R=tunnelRadius(p.z);
  vec2 a=abs(p.xy);
  float hexd=max(a.x*.866+a.y*.5,a.y)-R;   // hex wall
  float sp=8.;
  float zr=mod(p.z+.5*sp,sp)-.5*sp;
  float ring=length(vec2(hexd,zr))-.09;     // the gates
  // long ribs running down the wall
  float ang=atan(p.y,p.x); float k=6.283/12.;
  float fa=mod(ang+.5*k,k)-.5*k;
  float rib=length(vec2(hexd,sin(fa)*length(p.xy)))-.022;
  return min(ring,rib);
}
void main(){
  vec2 uv=(vUv-.5)*2.; uv.x*=uAspect;
  vec3 ro=vec3(0.,0.,uZ);
  vec3 rd=normalize(vec3(uv*.62,1.));
  rd.xy*=rot(uRoll); rd.xz*=rot(uLook.x); rd.yz*=rot(uLook.y);
  float t=.05, glow=0., hit=0., wave=0.;
  bool tun=uTunnel>.5;
  float dith=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
  t+=dith*.045;
  for(int i=0;i<STEPS;i++){
    vec3 p=ro+rd*t;
    float d=tun?mapTunnel(p):mapWorld(p);
    float ad=abs(d);
    glow+=.011/(.02+ad*ad*34.)*exp(-t*uFog)*smoothstep(.2,3.5,t);
    if(ad<.002){ hit=1.; break; }
    t+=max(ad*.72,.012);
    if(t>70.) break;
  }
  vec3 p=ro+rd*t;
  float fog=exp(-t*uFog)*smoothstep(.2,3.5,t);
  vec3 col;
  if(tun){
    float s=clamp(p.z/uTunnelLen,0.,1.);
    vec3 c=mix(uColA,uColB,smoothstep(.1,.85,s));
    // the gate you are about to pass is the bright one
    float gate=exp(-pow((p.z-(uZ+8.))*.12,2.));
    col=c*glow*.032*(1.+gate*2.6)+c*hit*fog*.5*(.35+gate*3.2);
    col+=c*pow(max(0.,1.-length(uv)*.9),6.)*.12;
  } else {
    float band=sin(p.z*.22-uTime*1.1)*.5+.5; band=pow(band,6.);
    vec3 c=mix(uColA,uColB,clamp(.5+.5*sin(p.y*.14+p.x*.09+uTime*.1),0.,1.));
    col=c*glow*.03+c*hit*fog*(.5+band*2.2);
    col+=uColB*(1.-fog)*.018;
  }
  gl_FragColor=vec4(col*uGlow,1.);
}`;

/* ---------- world composite: paintings with true parallax, lattice, flip-to-white sky, vault ---------- */
export const WORLD_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform sampler2D tPaintA,tDepthA,tPaintB,tDepthB,tLat;
uniform float uPaintA,uPaintB,uLat,uSky,uVault,uTime,uAspect,uAspA,uAspB,uDolly,uVaultBeams;
uniform vec2 uOff,uFocus,uGlowPos,uBeam,uPosA,uPosB;
uniform float uGlowAmt,uBeamAmt,uBeamW;
uniform vec3 uGlowCol,uVaultCol;
uniform float uBeamsX[5];
uniform float uBeamHot[5];

vec2 coverUv(vec2 s,float ai,vec2 pos){
  vec2 k = uAspect>ai ? vec2(1.,ai/uAspect) : vec2(uAspect/ai,1.);
  return (s-.5)*k+.5+(1.-k)*(pos-.5);
}
vec3 paint(sampler2D col,sampler2D dep,vec2 s,float ai,vec2 pos,out float dOut){
  vec2 u0=coverUv(.5+(s-.5)*.9,ai,pos);
  vec2 f=coverUv(uFocus,ai,pos);
  vec2 u=u0; float d=0.;
  for(int i=0;i<6;i++){
    d=texture2D(dep,u).r;
    u=f+(u0-f)/(1.+uDolly*(.22+d*1.15))-uOff*(d-.12);
  }
  // sky and far cloud breathe; near stone stays put
  float far=1.-smoothstep(.04,.32,d);
  u+=far*.0035*vec2(sin(u.y*9.+uTime*.14)+sin(u.y*23.+uTime*.21)*.4,cos(u.x*7.+uTime*.11));
  dOut=d;
  return texture2D(col,u).rgb;
}
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float v=0.,a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p=p*2.03+7.1; a*=.5; } return v; }
vec3 toLin(vec3 c){ return pow(c,vec3(2.2)); }

void main(){
  vec2 s=vUv; vec3 col=vec3(0.);
  float weightSum=0.;
  if(uPaintA>.002){
    float d; vec3 c=toLin(paint(tPaintA,tDepthA,s,uAspA,uPosA,d));
    // the tesseract actually lights the painting; closer stone catches more
    vec2 g=(s-uGlowPos)*vec2(uAspect,1.);
    float r2=dot(g,g);
    c+=uGlowCol*uGlowAmt*(exp(-r2*5.)*.35+exp(-r2*30.)*.5)*(.55+d*.8);
    // volumetric beam out of the well
    float dx=(s.x-uBeam.x)*uAspect;
    float h=clamp((s.y-uBeam.y)/(1.-uBeam.y),0.,1.);
    float flick=.88+.12*sin(uTime*2.3+s.y*14.)*sin(uTime*1.1);
    float core=exp(-dx*dx/(uBeamW*uBeamW*.012))+.32*exp(-dx*dx/(uBeamW*uBeamW*.18));
    c+=vec3(.25,.95,1.)*core*uBeamAmt*flick*smoothstep(0.,.06,h)*(1.-h*.25);
    col+=c*uPaintA;
  }
  if(uPaintB>.002){
    float d; vec3 c=toLin(paint(tPaintB,tDepthB,s,uAspB,uPosB,d));
    vec2 g=(s-uGlowPos)*vec2(uAspect,1.);
    float r2=dot(g,g);
    c+=uGlowCol*uGlowAmt*(exp(-r2*5.)*.3+exp(-r2*30.)*.4)*(.55+d*.8);
    col+=c*uPaintB;
  }
  if(uLat>.002){ col+=texture2D(tLat,s).rgb*uLat; }
  if(uSky>.002){
    vec2 p=(s-.5)*vec2(uAspect,1.)*2.;
    float hz=-.12;
    float y=p.y-hz;
    vec3 top=vec3(.2,.55,.74), mid=vec3(.62,.86,.93), low=vec3(1.,.82,.68);
    vec3 c=mix(mid,top,smoothstep(0.,1.1,y));
    c=mix(c,low,exp(-max(y,0.)*7.));
    float sun=exp(-dot(p-vec2(.0,-.02),p-vec2(.0,-.02))*1.6);
    c+=vec3(1.,.9,.74)*sun*.3;
    if(y<0.){
      float z=.34/(-y+.012);
      vec2 q=vec2(p.x*z*.7,z-uTime*.06);
      float n=fbm(q*.8), n2=fbm(q*2.4+n*2.);
      float cl=smoothstep(.28,.72,n*.7+n2*.45);
      vec3 cc=mix(vec3(.42,.6,.76),vec3(1.,.97,.93),cl);
      cc=mix(cc,vec3(1.,.8,.68),exp(y*5.)*.5*(1.-cl*.5));
      c=mix(low,cc,smoothstep(0.,.05,-y));
    } else {
      float n=fbm(vec2(p.x*.8-uTime*.012,y*3.2));
      c=mix(c,vec3(1.),smoothstep(.55,.85,n)*.32*(1.-smoothstep(0.,1.,y)));
    }
    col+=toLin(min(c,vec3(1.)))*uSky;
  }
  if(uVault>.002){
    vec2 p=(s-.5)*vec2(uAspect,1.)*2.;
    float hz=-.34;
    vec3 c=uVaultCol*.03*exp(-max(p.y-hz,0.)*1.2);
    if(p.y<hz){ float z=.5/(hz-p.y+.03); float gl=abs(fract(p.x*z*.42+.5)-.5); float gz=abs(fract(z*.42)-.5);
      float line=smoothstep(.02,.0,min(gl,gz)*(1.+.0))*exp(-z*.09);
      c=uVaultCol*(.02+line*.1); c+=uVaultCol*.08*exp(-(hz-p.y)*2.4);
    }
    for(int i=0;i<5;i++){
      float x=uBeamsX[i]; float top=1.25;
      float k=clamp((top-p.y)/(top-(hz-.12)),0.,1.);
      float w=mix(.018,.24,k);
      float dx=p.x-x;
      float cone=exp(-dx*dx/(w*w))*(1.-k*.28)*step(p.y,top);
      c+=uVaultCol*cone*.22*(.5+uBeamHot[i]*1.8)*uVaultBeams*step(hz-.14,p.y);
      vec2 e=(p-vec2(x,hz-.1))*vec2(1.,3.6);
      c+=uVaultCol*exp(-dot(e,e)*18.)*.5*(.6+uBeamHot[i]*1.4)*uVaultBeams;
    }
    col+=c*uVault;
  }
  gl_FragColor=vec4(col,1.);
}`;

export const BG_FRAG = /* glsl */`
varying vec2 vUv; uniform sampler2D tBg;
void main(){ gl_FragColor=vec4(texture2D(tBg,vUv).rgb,1.); }`;

/* ---------- glass: hex rods with light inside; screen-space refraction with dispersion ---------- */
export const GLASS_VERT = /* glsl */`
attribute vec3 aColor; attribute float aEnergy; attribute float aPhase;
varying vec3 vP,vC; varying float vE,vPh,vY;
void main(){
  vY=position.y+.5; vC=aColor; vE=aEnergy; vPh=aPhase;
  vec4 mv=modelViewMatrix*instanceMatrix*vec4(position,1.);
  vP=mv.xyz; gl_Position=projectionMatrix*mv;
}`;
export const GLASS_FRAG = /* glsl */`
precision highp float;
uniform sampler2D tBg; uniform vec2 uRes; uniform float uTime,uInk,uSolid,uAlpha,uRefract,uBar,uFade;
varying vec3 vP,vC; varying float vE,vPh,vY;
void main(){
  vec3 N=normalize(cross(dFdx(vP),dFdy(vP)));
  vec3 V=normalize(-vP);
  if(dot(N,V)<0.) N=-N;
  float nv=clamp(dot(N,V),0.,1.);
  float F=.04+.96*pow(1.-nv,4.);
  vec2 uv=gl_FragCoord.xy/uRes;
  vec2 o=N.xy*uRefract;
  vec3 refr=vec3(texture2D(tBg,uv-o*.82).r,texture2D(tBg,uv-o).g,texture2D(tBg,uv-o*1.18).b);
  vec3 R=reflect(-V,N);
  vec3 refl=texture2D(tBg,clamp(.5+R.xy*.48,.01,.99)).rgb;
  float spec=pow(max(dot(R,normalize(vec3(.35,.8,.5))),0.),90.)*1.6;
  // a filament of light through the middle of each rod, pulses travelling along it
  float core=pow(nv,3.2);
  float x=fract(uTime*.16+vPh)*1.4-.2;
  float pulse=exp(-pow((vY-x)*9.,2.));
  vec3 lit=vC*(core*(.34+pulse*1.5)*vE);
  refr*=mix(.16,1.,pow(nv,.9));
  vec3 col=mix(refr*vec3(.72,.93,1.),refl*1.5,F)+lit+vec3(spec);
  col=mix(col,vec3(.006,.03,.05)+refl*F*.5+vC*.05*core*vE+vec3(spec*.6),uInk);
  col=mix(col,vec3(1.)*(.82+.5*nv),uSolid);
  col=mix(col,vC*vE*(.55+nv*.75)+vec3(pow(nv,5.))*vE*.5,uBar);
  float a=uAlpha;
  if(uFade>0.) a*=smoothstep(uFade-.3,uFade,uv.y)*.9;
  gl_FragColor=vec4(col,a);
}`;

export const PANE_VERT = /* glsl */`
attribute vec2 aUv; attribute vec3 aTint;
varying vec3 vP,vT; varying vec2 vU;
void main(){ vU=aUv; vT=aTint; vec4 mv=modelViewMatrix*vec4(position,1.); vP=mv.xyz; gl_Position=projectionMatrix*mv; }`;
export const PANE_FRAG = /* glsl */`
precision highp float;
uniform float uAlpha,uInk,uTime;
varying vec3 vP,vT; varying vec2 vU;
vec3 film(float c){ return .5+.5*cos(6.283*(c*1.6+vec3(0.,.33,.67))); }
void main(){
  vec3 N=normalize(cross(dFdx(vP),dFdy(vP)));
  vec3 V=normalize(-vP);
  float nv=abs(dot(N,V));
  float F=pow(1.-nv,2.6);
  float e=max(abs(vU.x),abs(vU.y));
  float rim=pow(e,7.);
  vec3 irid=film(nv+vU.x*.12+vU.y*.08+uTime*.015);
  vec3 c=vT*(.006+rim*.07)+irid*vT*(F*.1+.006)+irid*F*.022;
  c*=1.-uInk;
  gl_FragColor=vec4(c*uAlpha,0.);
}`;

/* ---------- particles: dust around the object, and the Community swarm ---------- */
export const DUST_VERT = /* glsl */`
attribute vec3 aSeed; uniform float uTime,uSize,uSwarm,uRadius; uniform vec3 uCenter;
varying float vA;
vec3 curl(vec3 p){ return vec3(sin(p.y*1.3+uTime*.3)+cos(p.z*.9),sin(p.z*1.1+uTime*.25)+cos(p.x*1.2),sin(p.x*.8+uTime*.28)+cos(p.y*1.1)); }
void main(){
  vec3 base=(aSeed-.5)*vec3(26.,16.,14.)+vec3(0.,0.,-10.);
  base.xy+=sin(uTime*.05*(aSeed.zx+.3)*6.28+aSeed.yz*40.)*1.2;
  float th=aSeed.x*6.283+uTime*.14*(aSeed.z+.2), ph=acos(2.*aSeed.y-1.);
  vec3 shell=uCenter+vec3(sin(ph)*cos(th),cos(ph),sin(ph)*sin(th))*uRadius*(1.+aSeed.z*.5);
  shell+=curl(shell*.7)*.16*uRadius;
  vec3 p=mix(base,shell,uSwarm*smoothstep(0.,1.,aSeed.z*.6+.4));
  vec4 mv=viewMatrix*vec4(p,1.);
  vA=(.35+.65*abs(sin(uTime*.8+aSeed.x*40.)));
  gl_PointSize=uSize*(.5+aSeed.y)/max(-mv.z,.3);
  gl_Position=projectionMatrix*mv;
}`;
export const DUST_FRAG = /* glsl */`
precision highp float; uniform vec3 uColor; uniform float uAlpha; varying float vA;
void main(){ vec2 q=gl_PointCoord-.5; float d=dot(q,q)*4.; float a=exp(-d*5.)*vA*uAlpha; gl_FragColor=vec4(uColor*a,0.); }`;

/* ---------- final grade: warp streaks, flip to white, dispersion, vignette, dither ---------- */
export const FINAL_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform sampler2D tDiffuse; uniform float uWarp,uWhite,uVig,uCA,uTime,uScrim,uScrimDesk,uDim,uTone; uniform vec3 uTint;
vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.); }
vec3 sampleC(vec2 uv){
  vec2 d=uv-.5; float r=dot(d,d);
  float k=uCA*(r+.02)+uWarp*.018;
  return vec3(texture2D(tDiffuse,uv-d*k).r,texture2D(tDiffuse,uv).g,texture2D(tDiffuse,uv+d*k).b);
}
void main(){
  vec3 col;
  if(uWarp>.003){
    vec3 acc=vec3(0.); float n=0.; vec2 d=(vUv-.5);
    for(int i=0;i<14;i++){ float f=float(i)/13.; float w=1.-f*.7; acc+=sampleC(vUv-d*f*uWarp*.42)*w; n+=w; }
    col=acc/n;
  } else col=sampleC(vUv);
  col=mix(clamp(col,0.,1.),aces(col*1.02),uTone);
  col=pow(col,vec3(1./2.2));
  col*=uTint;
  vec2 q=vUv-.5; col*=1.-dot(q,q)*uVig;
  float sc=uScrimDesk>.5?smoothstep(.0,.6,vUv.x):smoothstep(.05,.62,vUv.y);
  col*=mix(1.,.16+.84*sc,uScrim);
  col*=uDim;
  col=mix(col,vec3(1.),uWhite);
  col+=(fract(sin(dot(gl_FragCoord.xy+uTime,vec2(12.9898,78.233)))*43758.5453)-.5)/255.;
  gl_FragColor=vec4(col,1.);
}`;

/* ---------- the project marks sealed inside the Cohort 1 crystals ---------- */
export const LOGO_VERT = /* glsl */`
attribute float aLayer; uniform float uThick,uFlip,uSpread;
varying vec2 vUv; varying float vL,vA; varying vec3 vN;
void main(){
  vUv=uv; float l=uFlip>.5?1.-aLayer:aLayer; vL=l; vA=aLayer;
  vec3 p=position; p.z=(l-.5)*(uThick+uSpread*1.1); p.xy*=1.+(l-.5)*uSpread*.5;
  vN=normalize(mat3(modelViewMatrix)*vec3(0.,0.,1.));
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
}`;
export const LOGO_FRAG = /* glsl */`
precision highp float;
uniform sampler2D tLogo; uniform float uTime,uAlpha,uTurn,uHot,uFadeY,uFaceOnly; uniform vec3 uGlow; uniform vec2 uRes;
varying vec2 vUv; varying float vL,vA; varying vec3 vN;
void main(){
  if(uFaceOnly>.5&&vA<.99) discard;
  vec4 t=texture2D(tLogo,vUv);
  if(t.a<.004) discard;
  // the two faces carry the real colours; the body between them is lit by the mark's own colour
  float face=smoothstep(.93,1.,abs(vL*2.-1.));
  float nv=abs(vN.z);
  vec3 body=(uGlow*.42+t.rgb*.12)*t.a;
  // a slow band of light crosses the face as it turns
  float sweep=exp(-pow((vUv.x+vUv.y*.35-.68-sin(uTurn*1.7+uTime*.22)*.75)*5.,2.));
  vec3 col=t.rgb*(1.+sweep*.55*nv+uHot*.06);
  col=mix(body,col,face);
  float a=uAlpha*mix(smoothstep(.6,.96,t.a),1.,face);
  if(uFadeY>0.) a*=smoothstep(uFadeY-.3,uFadeY,gl_FragCoord.y/uRes.y)*.9;
  gl_FragColor=vec4(col,t.a)*a;
}`;
export const HALO_VERT = /* glsl */`
varying vec2 vUv;
void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
export const HALO_FRAG = /* glsl */`
precision highp float;
uniform vec3 uGlow; uniform float uHot,uAlpha,uFadeY; uniform vec2 uRes; varying vec2 vUv;
void main(){
  float d=length(vUv-.5)*2.;
  float a=uAlpha*pow(max(0.,1.-d),2.2)*(.2+uHot*.08);
  if(uFadeY>0.) a*=smoothstep(uFadeY-.3,uFadeY,gl_FragCoord.y/uRes.y);
  gl_FragColor=vec4(uGlow*a,0.);
}`;

/* the hot point at the object's centre: drawn over the rods so nothing ever crosses it */
export const NODE_FRAG = /* glsl */`
precision highp float;
uniform float uAlpha,uTime; varying vec2 vUv;
void main(){
  vec2 p=(vUv-.5)*2.; float r=length(p),b=.94+.06*sin(uTime*1.15);
  float e=max(0.,1.-r); e*=e;
  float hot=exp(-r*r*420.)*1.9+exp(-r*r*60.)*.3+exp(-r*r*9.)*.05;
  float streak=exp(-p.y*p.y*5200.)*exp(-p.x*p.x*8.)*.42+exp(-p.x*p.x*5200.)*exp(-p.y*p.y*20.)*.16; // a soft lens star
  vec3 c=mix(vec3(.3,.9,1.),vec3(1.),smoothstep(.1,1.2,hot))*(hot+streak)*e*b;
  gl_FragColor=vec4(c*uAlpha,0.);
}`;
