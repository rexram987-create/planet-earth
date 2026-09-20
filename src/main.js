import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './style.css';
const $=id=>document.getElementById(id);
let installPrompt;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
window.addEventListener('appinstalled',()=>{$('install').textContent='היישומון מותקן';installPrompt=null;});
$('install').onclick=async()=>{if(installPrompt){await installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;}else{$('install-help').showModal();}};
$('close-help').onclick=()=>$('install-help').close();
$('install-help').addEventListener('click',e=>{if(e.target===$('install-help')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
function notice(message){$('notice').textContent=message;$('notice').hidden=false;setTimeout(()=>$('notice').hidden=true,7000);}
if('serviceWorker' in navigator && import.meta.env.PROD){navigator.serviceWorker.register('/sw.js').then(reg=>{reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)notice('עדכון חדש מוכן. סגרו ופתחו מחדש את היישומון כדי להפעיל אותו.');});});}).catch(()=>notice('שמירה לשימוש ללא אינטרנט לא הצליחה. אפשר להמשיך עם חיבור לרשת.'));}
const view=$('viewport');
const buttons=['zoom-in','zoom-out','rotate-left','rotate-right','reset','play','speed','clouds','light'];
buttons.forEach(id=>$(id).disabled=true);
async function init(){
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;view.appendChild(renderer.domElement);
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('loading').hidden=false;$('loading').textContent='התצוגה נעצרה. יש לרענן את הדף כדי לחדש אותה.';});
const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(38,1,.05,150);camera.position.set(0,.35,4.3);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.065;controls.enablePan=false;controls.minDistance=1.35;controls.maxDistance=8;controls.rotateSpeed=.6;controls.zoomSpeed=.8;controls.target.set(0,0,0);
const sun=new THREE.DirectionalLight(0xfff6e7,3.1);sun.position.set(-3,2,4);scene.add(sun);const ambient=new THREE.AmbientLight(0x819bbb,.25);scene.add(ambient);
const positions=[];let seed=71;function rnd(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646;}
for(let i=0;i<650;i++){const z=rnd()*2-1,t=rnd()*Math.PI*2,r=30+rnd()*25,k=Math.sqrt(1-z*z);positions.push(r*k*Math.cos(t),r*z,r*k*Math.sin(t));}
const starsG=new THREE.BufferGeometry();starsG.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));scene.add(new THREE.Points(starsG,new THREE.PointsMaterial({color:0xa4c2e0,size:.045,sizeAttenuation:true,transparent:true,opacity:.65})));
const texLoader=new THREE.TextureLoader();let completed=0;const progress=()=>{$('loading').textContent=`טוען את כדור הארץ… ${Math.round(++completed/6*100)}%`;};
const loadTex=async(name,color=false)=>{const tex=await texLoader.loadAsync(`/model/${name}.jpg`);tex.flipY=false;tex.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());progress();return tex;};
const [gltf,day,night,cloudMap,bump,water]=await Promise.all([new GLTFLoader().loadAsync('/model/earth.glb').then(x=>{progress();return x;}),loadTex('day',true),loadTex('night',true),loadTex('clouds'),loadTex('bump'),loadTex('water')]);
let original;gltf.scene.traverse(o=>{if(o.isMesh&&!original)original=o;});if(!original)throw new Error('No mesh in supplied model');
const geometry=original.geometry.clone();geometry.computeBoundingSphere();const radius=geometry.boundingSphere.radius;geometry.scale(1/radius,1/radius,1/radius);geometry.computeVertexNormals();
const system=new THREE.Group();system.rotation.z=THREE.MathUtils.degToRad(-23.4);scene.add(system);const globe=new THREE.Group();system.add(globe);globe.rotation.y=-Math.PI/2;
const sunView={value:new THREE.Vector3()};
const nightLightIntensity=3.0;
const earthMat=new THREE.MeshPhongMaterial({map:day,bumpMap:bump,bumpScale:.012,specularMap:water,specular:0x334858,shininess:22,emissiveMap:night,emissive:0xffcf88,emissiveIntensity:nightLightIntensity});
// Lift dim city pixels from the original model's map, keeping black oceans dark.
// Both normals and the Sun direction are in view space, so the mask follows
// the physical night side even while the camera or globe rotates.
earthMat.onBeforeCompile=shader=>{
  shader.uniforms.sunView=sunView;
  shader.fragmentShader='uniform vec3 sunView;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>', `
    #ifdef USE_EMISSIVEMAP
      vec3 cityMap = texture2D(emissiveMap, vEmissiveMapUv).rgb;
      float cityBrightness = max(max(cityMap.r, cityMap.g), cityMap.b);
      float citySignal = smoothstep(0.0003, 0.003, cityBrightness);
      vec3 cityLights = pow(max(cityMap, vec3(0.0)), vec3(0.55)) * citySignal;
      float nightMask = 1.0 - smoothstep(-0.22, 0.02,
        dot(normalize(vNormal), normalize(sunView)));
      totalEmissiveRadiance *= cityLights * nightMask;
    #endif
  `);
};
const earth=new THREE.Mesh(geometry,earthMat);globe.add(earth);
const clouds=new THREE.Mesh(geometry,new THREE.MeshPhongMaterial({color:0xffffff,alphaMap:cloudMap,transparent:true,opacity:.77,depthWrite:false,shininess:0}));clouds.scale.setScalar(1.009);globe.add(clouds);
const atmos=new THREE.Mesh(geometry,new THREE.ShaderMaterial({uniforms:{glow:{value:new THREE.Color(0x449cff)}},vertexShader:'varying vec3 n; varying vec3 v; void main(){ vec4 p=modelViewMatrix*vec4(position,1.0);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',fragmentShader:'uniform vec3 glow;varying vec3 n;varying vec3 v;void main(){float rim=pow(1.0-abs(dot(normalize(n),normalize(v))),3.8);gl_FragColor=vec4(glow,rim*0.38);}',transparent:true,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false}));atmos.scale.setScalar(1.035);system.add(atmos);
let playing=false,period=60;
function setPlaying(value){playing=value;$('play').setAttribute('aria-pressed',String(playing));$('play').innerHTML=playing?'עצירת הסיבוב <span>Ⅱ</span>':'הפעלת סיבוב אוטומטי <span>▶</span>';}
$('play').onclick=()=>setPlaying(!playing);
$('speed').oninput=()=>{period=[120,60,20][Number($('speed').value)];const label=`יום ב־${period} שניות`;$('speed-label').textContent=label;$('speed').setAttribute('aria-valuetext',label);};
$('clouds').onchange=()=>clouds.visible=$('clouds').checked;
$('light').onchange=()=>{ambient.intensity=$('light').checked?2.4:.25;sun.intensity=$('light').checked?1.1:3.1;earthMat.emissiveIntensity=$('light').checked?0:nightLightIntensity;};
const initial=new THREE.Vector3(0,.35,4.3);let fitDistance=4.3;
function zoom(factor){camera.position.multiplyScalar(THREE.MathUtils.clamp(camera.position.length()*factor,controls.minDistance,controls.maxDistance)/camera.position.length());controls.update();}
function rotate(amount){camera.position.applyAxisAngle(new THREE.Vector3(0,1,0),amount);controls.update();}
$('zoom-in').onclick=()=>zoom(.82);$('zoom-out').onclick=()=>zoom(1.22);$('rotate-left').onclick=()=>rotate(-.22);$('rotate-right').onclick=()=>rotate(.22);
$('reset').onclick=()=>{setPlaying(false);globe.rotation.y=-Math.PI/2;camera.position.copy(initial);controls.target.set(0,0,0);controls.update();};
controls.addEventListener('start',()=>setPlaying(false));
view.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')rotate(-.15);else if(e.key==='ArrowRight')rotate(.15);else if(['ArrowUp','+','='].includes(e.key))zoom(.9);else zoom(1.1);}});
let sized=false;function resize(){const w=view.clientWidth,h=view.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();if(!sized){fitDistance=Math.max(4.3,2.95/camera.aspect);initial.set(0,.35,Math.min(7.5,fitDistance));camera.position.copy(initial);sized=true;}controls.update();}
new ResizeObserver(resize).observe(view);resize();
$('loading').hidden=true;buttons.forEach(id=>$(id).disabled=false);
let last=performance.now();function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.08);last=now;if(document.hidden)return;if(playing)globe.rotation.y+=dt*2*Math.PI/period;controls.update();camera.updateMatrixWorld();sunView.value.copy(sun.position).normalize().transformDirection(camera.matrixWorldInverse);$('zoom-value').textContent=`זום ×${(initial.length()/camera.position.length()).toFixed(1)}`;renderer.render(scene,camera);}requestAnimationFrame(animate);
}
init().catch(err=>{console.error(err);$('loading').textContent='לא ניתן לטעון את התצוגה. בדקו את החיבור ונסו לרענן ב־Chrome מעודכן עם תמיכה ב־WebGL. הנתונים האסטרונומיים זמינים למטה.';});
