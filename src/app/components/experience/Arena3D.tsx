"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

/** Geometría propia y pequeña; se importa solo al entrar en la superficie visible. */
export default function Arena3D({ medal = false }: { medal?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = host.current;
    if (!node) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" }); } catch { return; }
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(38,1,.1,50);
    camera.position.set(0,4.7,7.8);camera.lookAt(0,.45,0);
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));node.appendChild(renderer.domElement);
    const room=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromScene(room,.04);
    scene.environment=env.texture;pmrem.dispose();room.dispose();
    scene.add(new THREE.HemisphereLight(0xffffff,0x17171c,2));
    const key=new THREE.DirectionalLight(0xffffff,3);key.position.set(3,6,4);scene.add(key);
    const rim=new THREE.DirectionalLight(0xbe33f5,2);rim.position.set(-3,3,-2);scene.add(rim);
    const object=new THREE.Group();scene.add(object);
    const metal=new THREE.MeshStandardMaterial({color:medal?0xe0cf82:0x303139,roughness:.35,metalness:.82});
    const rope=new THREE.MeshBasicMaterial({color:0xd4f67c});
    const glow=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{time:{value:0}},
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:'varying vec2 vUv;uniform float time;void main(){float d=length(vUv-.5);float a=(1.-smoothstep(.12,.5,d))*.16;vec3 c=mix(vec3(.83,.96,.49),vec3(.74,.2,.96),.5+.5*sin(time*.3));gl_FragColor=vec4(c,a);}' });
    const aura=new THREE.Mesh(new THREE.PlaneGeometry(6,6),glow);aura.rotation.x=-Math.PI/2;aura.position.y=-.05;scene.add(aura);
    if(medal){
      const coin=new THREE.Mesh(new THREE.CylinderGeometry(1.35,1.35,.17,48),metal);coin.rotation.x=Math.PI/2;coin.position.y=1;object.add(coin);
      for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(1.08-i*.14,.018,6,48),rope);ring.position.set(0,1,.1);object.add(ring);}
      const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d')!;
      ctx.fillStyle='#d4f67c';ctx.font='bold 34px sans-serif';ctx.textAlign='center';ctx.fillText('AURA',64,76);
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
      const label=new THREE.Mesh(new THREE.PlaneGeometry(1.55,1.55),new THREE.MeshBasicMaterial({map:texture,transparent:true}));label.position.set(0,1,.105);object.add(label);
    }else{
      object.add(new THREE.Mesh(new THREE.BoxGeometry(3.8,.16,3.8),metal));
      const poleGeo=new THREE.CylinderGeometry(.045,.045,1.7,8),ropeGeo=new THREE.CylinderGeometry(.016,.016,3.7,6);
      for(const x of [-1.85,1.85])for(const z of [-1.85,1.85]){const pole=new THREE.Mesh(poleGeo,metal);pole.position.set(x,.85,z);object.add(pole);}
      for(const y of [.48,.92,1.36])for(const edge of [-1.85,1.85]){const a=new THREE.Mesh(ropeGeo,rope);a.rotation.z=Math.PI/2;a.position.set(0,y,edge);object.add(a);const b=new THREE.Mesh(ropeGeo,rope);b.rotation.x=Math.PI/2;b.position.set(edge,y,0);object.add(b);}
    }
    const target=new THREE.Vector2();
    const move=(e:PointerEvent)=>{if(e.pointerType==='touch')return;const box=node.getBoundingClientRect();target.set(((e.clientX-box.left)/box.width-.5)*.22,((e.clientY-box.top)/box.height-.5)*.1);};
    const leave=()=>target.set(0,0);node.addEventListener('pointermove',move,{passive:true});node.addEventListener('pointerleave',leave);
    const resize=()=>{const {width,height}=node.getBoundingClientRect();if(!width||!height)return;camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height);};
    const observer=new ResizeObserver(resize);observer.observe(node);resize();
    let frame=0,last=performance.now(),elapsed=0,slow=0,downgraded=false;
    const render=(now:number)=>{const dt=Math.min((now-last)/1000,.05);last=now;elapsed+=dt;if(dt>.032)slow++;if(slow>=18&&!downgraded){downgraded=true;renderer.setPixelRatio(1);resize();}
      object.rotation.y=THREE.MathUtils.damp(object.rotation.y,target.x+.35,10,dt);object.rotation.x=THREE.MathUtils.damp(object.rotation.x,target.y,10,dt);
      glow.uniforms.time.value=elapsed;renderer.render(scene,camera);node.dataset.drawCalls=String(renderer.info.render.calls);frame=requestAnimationFrame(render);};
    frame=requestAnimationFrame(render);
    return ()=>{cancelAnimationFrame(frame);observer.disconnect();node.removeEventListener('pointermove',move);node.removeEventListener('pointerleave',leave);
      const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
      scene.traverse(obj=>{if(obj instanceof THREE.Mesh||obj instanceof THREE.LineSegments){geometries.add(obj.geometry);for(const m of Array.isArray(obj.material)?obj.material:[obj.material]){materials.add(m);const map=(m as THREE.MeshStandardMaterial).map;if(map)textures.add(map);}}});
      geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());env.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
  },[medal]);
  return <div ref={host} className="arena-3d" />;
}
