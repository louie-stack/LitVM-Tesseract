// The Track: one architectural hex tunnel, and the composite that frames it.
export const TUNNEL_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform float uTime,uAspect,uZ,uRoll,uLen;
uniform vec2 uCam;
#ifndef STEPS
#define STEPS 64
#endif
const float GATE=8.;
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float R(float z){float t=clamp(z/uLen,0.,1.);t=t*t*(3.-2.*t);return mix(7.5,3.1,t);}
float hexd(vec2 p){vec2 a=abs(p);return max(a.x,a.x*.5+a.y*.866);}
float wall(vec3 p){return R(p.z)-hexd(p.xy);}
vec3 stageCol(float z){
  float s=clamp(z/uLen,0.,1.)*4.;
  vec3 a=vec3(.42,.82,1.),b=vec3(.16,.86,.98),c=vec3(.16,.98,.78),d=vec3(.42,1.,.6),e=vec3(1.,.74,.42);
  if(s<1.)return mix(a,b,s); if(s<2.)return mix(b,c,s-1.); if(s<3.)return mix(c,d,s-2.); return mix(d,e,smoothstep(.72,1.,s-3.));
}
float gateZ(float z){return mod(z+.5*GATE,GATE)-.5*GATE;}
void main(){
  vec2 uv=(vUv-.5)*2.;uv.x*=uAspect;
  vec3 ro=vec3(uCam,uZ);
  vec3 rd=normalize(vec3(uv*.62,1.));
  rd.xy*=rot(uRoll);
  float zEnd=uLen;
  if(uZ>=zEnd){gl_FragColor=vec4(0.,0.,0.,1.);return;}
  float t=.02,portal=0.;bool hit=false;
  vec3 p=ro;
  for(int i=0;i<STEPS;i++){
    p=ro+rd*t;
    if(p.z>=zEnd){t=(zEnd-ro.z)/rd.z;p=ro+rd*t;portal=1.;break;}
    float d=wall(p);
    if(d<.003){hit=true;break;}
    float st=d*.9;
    t+=st;
    if(t>160.)break;
  }
  vec3 col=vec3(0.);
  if(hit){
    float ang=atan(p.y,p.x);float face=floor(ang/1.0472+.5);
    float fa=face*1.0472;
    vec2 ft=vec2(-sin(fa),cos(fa)),fn=vec2(cos(fa),sin(fa));
    float Rz=R(p.z),half_=Rz*.5774;
    float along=dot(p.xy,ft);
    vec3 sc=stageCol(p.z);
    float gz=gateZ(p.z);
    // each of the six faces has its own tone, like lit architecture
    float tone=.55+.45*(.5+.5*fn.y);
    float pool=exp(-gz*gz*.16)*step(GATE*.5,p.z);
    col=vec3(.0035,.006,.009)+sc*tone*(.006+pool*.05);
    // rails where the faces meet: the lines that draw the tunnel
    float dr=max(half_-abs(along),0.);float wr=clamp(fwidth(dr)*1.2,.012,.22);
    float rail=1.-smoothstep(wr,wr*2.2,dr);
    float run=exp(-pow((fract(p.z*.032-uTime*.1+face*.137)-.5)*22.,2.));
    col+=sc*rail*(.22+run*2.4);
    // a quiet centre line and cross ribs give scale without noise
    float dc=abs(along);float wc=clamp(fwidth(dc)*1.2,.008,.15);
    col+=sc*(1.-smoothstep(wc,wc*2.2,dc))*.035;
    float rb=abs(mod(p.z+1.,2.)-1.);float wb=clamp(fwidth(rb)*1.2,.01,.5);
    col+=sc*(1.-smoothstep(wb,wb*2.2,rb))*.03*smoothstep(0.,GATE,p.z);
    col*=exp(-t*.02);
  }
  if(portal>.5){
    // soft bloom around the way out
    float ed=wall(vec3(p.xy,zEnd-.01));
    col=vec3(0.);
    portal=smoothstep(0.,.06,ed);
    col+=stageCol(zEnd)*exp(-ed*7.)*.3*(1.-portal);
  }
  col+=stageCol(uZ+40.)*pow(max(rd.z,0.),5000.)*.6*(1.-smoothstep(uLen-40.,uLen-12.,uZ));
  gl_FragColor=vec4(col,portal);
}`;

export const WORLD_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform sampler2D tPaintA,tDepthA,tPaintB,tDepthB,tLat,tMask;
uniform float uPaintA,uPaintB,uLat,uGrad,uVault,uTime,uAspect,uAspA,uAspB,uDolly,uVaultBeams,uMaskOn,uMaskFull,uLatGain,uSplit,uScrollA,uHeroDesk;
uniform vec2 uOff,uFocus,uGlowPos,uBeam,uBeamTop,uPosA,uPosB;
uniform float uGlowAmt,uBeamAmt,uBeamW,uNode;
uniform vec3 uGlowCol,uVaultCol,uDimGlow;
uniform float uBeamsX[5];
uniform float uBeamHot[5];
vec2 coverUv(vec2 s,float ai,vec2 pos){
  vec2 k=uAspect>ai?vec2(1.,ai/uAspect):vec2(uAspect/ai,1.);
  return (s-.5)*k+.5+(1.-k)*(pos-.5);
}
vec3 paint(sampler2D col,sampler2D dep,vec2 s,float ai,vec2 pos,out float dOut){
  vec2 u0=coverUv(.5+(s-.5)*.92,ai,pos);
  vec2 f=coverUv(uFocus,ai,pos);
  vec2 u=u0;float d=0.;
  for(int i=0;i<6;i++){
    d=texture2D(dep,u).r;
    u=f+(u0-f)/(1.+uDolly*(.22+d*1.15))-uOff*(d-.12);
  }
  float far=1.-smoothstep(.04,.32,d);
  u+=far*.0032*vec2(sin(u.y*9.+uTime*.14)+sin(u.y*23.+uTime*.21)*.4,cos(u.x*7.+uTime*.11));
  dOut=d;
  return texture2D(col,u).rgb;
}
vec3 toLin(vec3 c){return pow(c,vec3(2.2));}
void main(){
  vec2 s=vUv;vec3 col=vec3(0.);
  bool zone=uSplit<1.5;
  const float W=.24;
  float above=zone?smoothstep(uSplit-W,uSplit+W,s.y):0.;
  if(zone?above<.999:uGrad>.002){
    // the site's own gradient, anchored to the top of its section
    float g=clamp((zone?min(uSplit,1.)-s.y:1.-s.y)+(s.x-.5)*.14,0.,1.);
    vec3 a=vec3(.102,.38,.431),b=vec3(.102,.165,.251),c=vec3(.188,.137,.149);
    col+=toLin(g<.5?mix(a,b,g*2.):mix(b,c,g*2.-1.))*(zone?1.-above:uGrad);
  }
  float wA=zone?above:uPaintA;
  if(wA>.002){
    vec2 sa=s-vec2(0.,uScrollA);
    float d;vec3 c=toLin(paint(tPaintA,tDepthA,sa,uAspA,uPosA,d));
    float shade=uHeroDesk>.5?smoothstep(.1,.74,s.x):smoothstep(.12,.68,s.y+uScrollA);
    c=mix(vec3(.0035,.007,.016),c,.05+.95*shade*shade);
    vec2 g=(s-uGlowPos)*vec2(uAspect,1.);float r2=dot(g,g);
    c+=uGlowCol*uGlowAmt*exp(-r2*9.)*.28*(.55+d*.8);
    // the beam: one straight line of light from the pool to the object's centre, nothing past it
    vec2 bA=vec2(uAspect,1.),b0=(uBeam+vec2(0.,uScrollA))*bA,ax=uBeamTop*bA-b0,bp=s*bA-b0;
    float bL=max(length(ax),.001),al=dot(bp,ax)/bL,h=al/bL,dx=(bp.x*ax.y-bp.y*ax.x)/bL;
    float wb=uBeamW,flow=.9+.1*sin(al*26.-uTime*2.2)*sin(al*7.-uTime*.7);
    float line=exp(-dx*dx/(wb*wb*mix(.0000075,.0000042,clamp(h,0.,1.))))*1.2   // hot thread, tightening as it rises
      +exp(-dx*dx/(wb*wb*.00012))*.34                              // its bloom
      +exp(-dx*dx/(wb*wb*.0042))*.075;                             // the haze around it
    float ends=smoothstep(0.,.05,h)*(1.-smoothstep(.992,1.,h));
    vec3 beamC=mix(vec3(.2,.9,1.),vec3(.85,1.,1.),exp(-dx*dx/(wb*wb*.0000075)));
    // on phones the copy sits under the object, so the beam fades out above it
    c+=beamC*line*ends*flow*uBeamAmt*3.3*(.72+.28*h)*(uHeroDesk>.5?1.:smoothstep(.43,.58,s.y));
    // where it lands: light gathers at the centre and fills the object
    vec2 nd=(s-uBeamTop)*bA;float nr=dot(nd,nd),breath=.92+.08*sin(uTime*1.15);
    c+=vec3(.26,.88,1.)*uNode*breath*(exp(-nr/.0024)*.22+exp(-nr/.019)*.1);
    col+=c*wA;
  }
  if(uPaintB>.002){
    float d;vec3 c=toLin(paint(tPaintB,tDepthB,s,uAspB,uPosB,d));
    vec2 g=(s-uGlowPos)*vec2(uAspect,1.);float r2=dot(g,g);
    c+=uGlowCol*uGlowAmt*(exp(-r2*5.)*.3+exp(-r2*30.)*.4)*(.55+d*.8);
    col+=c*uPaintB;
  }
  { vec2 gd=(s-uGlowPos)*vec2(uAspect,1.); col+=uDimGlow*exp(-dot(gd,gd)*16.); }
  if(uVault>.002){
    vec2 p=(s-.5)*vec2(uAspect,1.)*2.;float hz=-.2;
    float fl=smoothstep(hz+.012,hz-.012,p.y);
    vec3 c=mix(uVaultCol*.008,uVaultCol*.016*exp((p.y-hz)*1.6),fl);
    c+=uVaultCol*.05*exp(-pow((p.y-hz)*7.,2.));
    for(int i=0;i<5;i++){
      float x=uBeamsX[i],top=1.3,k=clamp((top-p.y)/(top-hz),0.,1.),w=mix(.006,.1,k*k),dx=p.x-x;
      float cone=exp(-dx*dx/(w*w))*(1.-k*.45)*(1.-fl);
      c+=uVaultCol*cone*.1*(.55+uBeamHot[i]*1.6)*uVaultBeams;
      vec2 e=(p-vec2(x,hz-.035))*vec2(1.,5.);
      c+=uVaultCol*exp(-dot(e,e)*32.)*.22*(.6+uBeamHot[i]*1.6)*uVaultBeams;
    }
    col+=c*uVault;
  }
  if(uLat>.002){
    vec4 l=texture2D(tLat,s);
    float m=uLat*(1.-l.a);
    if(uMaskOn>.5) m*=max(texture2D(tMask,s).r,uMaskFull);
    col=mix(col,l.rgb*uLatGain,m)+l.rgb*uLat*l.a;
  }
  gl_FragColor=vec4(col,1.);
}`;

export const STREAK_VERT = /* glsl */`
attribute vec3 aSeed; attribute float aEnd;
uniform float uZ,uLen,uStretch,uRoll,uR; uniform vec2 uCam;
varying float vA; varying vec3 vC;
vec3 stageCol(float z){
  float s=clamp(z/uLen,0.,1.)*4.;
  vec3 a=vec3(.42,.82,1.),b=vec3(.16,.86,.98),c=vec3(.16,.98,.78),d=vec3(.42,1.,.6),e=vec3(1.,.74,.42);
  if(s<1.)return mix(a,b,s); if(s<2.)return mix(b,c,s-1.); if(s<3.)return mix(c,d,s-2.); return mix(d,e,smoothstep(.72,1.,s-3.));
}
void main(){
  float L=70.;
  float dz=mod(aSeed.z*L-uZ,L)+.4;
  float zw=uZ+dz;
  float t=clamp(zw/uLen,0.,1.);t=t*t*(3.-2.*t);float R=mix(7.5,3.1,t);
  float a=aSeed.x*6.283,rr=R*(.25+aSeed.y*.68);
  vec2 xy=vec2(cos(a),sin(a))*rr-uCam;
  float z=dz+aEnd*(.18+uStretch);
  float c=cos(uRoll),s=-sin(uRoll);
  vec3 v=vec3(xy.x*c-xy.y*s,xy.x*s+xy.y*c,-z*1.968);
  vA=smoothstep(.4,3.,dz)*smoothstep(70.,45.,dz);
  vC=stageCol(zw);
  gl_Position=projectionMatrix*vec4(v,1.);
}`;
export const STREAK_FRAG = /* glsl */`
precision highp float; varying float vA; varying vec3 vC; uniform float uAlpha,uGain;
void main(){ gl_FragColor=vec4(vC*vA*uAlpha*uGain,0.); }`;
