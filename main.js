// ---------------- 全局变量与配置 ----------------
let scene, camera, renderer, particles, controls;
let particleGeometry, targetPositions, currentVelocities;
const PARTICLE_COUNT = 20000; 

let handOpenFactor = 0; 
let handPos = { x: 0, y: 0, z: 0 };
let mouseClickFactor = 0;

const settings = {
    mode: 'camera',
    shape: 'heart',
    color: '#00fbff',
    size: 0.15,
    rotation: 0.003,
    sensitivity: 4.0,
    explode: () => { mouseClickFactor = 2.0; }
};

// ---------------- 形状生成器 ----------------
function updateShape(type) {
    for (let i = 0; i < PARTICLE_COUNT * 3; i += 3) {
        let x=0, y=0, z=0;
        const u = Math.random() * Math.PI * 2;
        const v = Math.random() * Math.PI;

        if(type==='heart'){
            const t = Math.random() * Math.PI * 2;
            x = 16 * Math.pow(Math.sin(t),3);
            y = 13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t);
            z = (Math.random()-0.5)*6;
        }
        else if(type==='saturn'){
            if(i<PARTICLE_COUNT*3*0.4){
                const r = 10 * Math.cbrt(Math.random());
                x = r * Math.sin(v)*Math.cos(u);
                y = r * Math.sin(v)*Math.sin(u);
                z = r * Math.cos(v);
            } else {
                const r = 18 + Math.random()*6;
                x = r * Math.cos(u);
                y = (Math.random()-0.5)*1.5;
                z = r * Math.sin(u);
                const tempY = y*0.86 - z*0.5;
                const tempZ = y*0.5 + z*0.86;
                y=tempY; z=tempZ;
            }
        }
        else if(type==='buddha'){
            const r = 15*(0.7+0.3*Math.sin(v*3));
            x = r*Math.sin(v)*Math.cos(u)*0.8;
            y = r*Math.cos(v)*1.2 + 5;
            z = r*Math.sin(v)*Math.sin(u)*0.8;
        }
        else if(type==='spiral'){
            const r = i*0.002;
            x = Math.cos(i*0.1)*r*15;
            y = (Math.random()-0.5)*5;
            z = Math.sin(i*0.1)*r*15;
        }
        else if(type==='sphere'){
            const r = 20;
            x = r*Math.sin(v)*Math.cos(u);
            y = r*Math.sin(v)*Math.sin(u);
            z = r*Math.cos(v);
        }
        else if(type==='flower'){
            const t = i * 0.1; // 控制花瓣密度
            const r = 15 * Math.sin(5 * t); // 5瓣花
            x = r * Math.cos(t);
            y = (Math.random() - 0.5) * 2; // 微微抖动，增加立体感
            z = r * Math.sin(t);
        }


        targetPositions[i] = x;
        targetPositions[i+1] = y;
        targetPositions[i+2] = z;
    }
}

// ---------------- 初始化 ----------------
function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 2000);
    camera.position.set(0,10,60);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    document.getElementById('container').appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    particleGeometry = new THREE.BufferGeometry();
    const initialPos = new Float32Array(PARTICLE_COUNT*3);
    targetPositions = new Float32Array(PARTICLE_COUNT*3);
    currentVelocities = new Float32Array(PARTICLE_COUNT*3);
    for(let i=0;i<PARTICLE_COUNT*3;i++) initialPos[i]=(Math.random()-0.5)*100;
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(initialPos,3));

    const material = new THREE.PointsMaterial({
        size: settings.size,
        color: settings.color,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        map: new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/disc.png')
    });

    particles = new THREE.Points(particleGeometry, material);
    scene.add(particles);

    updateShape(settings.shape);
    animate();

    window.addEventListener('resize', onResize);
    window.addEventListener('mousedown', () => { if(settings.mode==='mouse') settings.explode(); });
}

// ---------------- 动画循环 ----------------
function triggerFirework() {
    // 随机中心位置
    const cx = (Math.random() - 0.5) * 40;
    const cy = (Math.random() - 0.5) * 30 + 10;
    const cz = (Math.random() - 0.5) * 40;

    // 生成临时烟花粒子
    for(let i=0;i<PARTICLE_COUNT*0.05;i++){ // 5%粒子用于烟花
        const idx = Math.floor(Math.random()*PARTICLE_COUNT)*3;
        const angle1 = Math.random()*Math.PI*2;
        const angle2 = Math.random()*Math.PI;
        const radius = Math.random()*5 + 5;
        targetPositions[idx] = cx + radius * Math.sin(angle2) * Math.cos(angle1);
        targetPositions[idx+1] = cy + radius * Math.sin(angle2) * Math.sin(angle1);
        targetPositions[idx+2] = cz + radius * Math.cos(angle2);
    }

    // 烟花衰减
    mouseClickFactor = 2.0; // 临时加速扩散
}

function animate(){
    requestAnimationFrame(animate);
    controls.update();

    const posAttr = particleGeometry.attributes.position;
    const factor = settings.mode==='camera'?handOpenFactor:mouseClickFactor;

    for(let i=0;i<PARTICLE_COUNT*3;i+=3){
        const tx = targetPositions[i]*(1+factor)+handPos.x;
        const ty = targetPositions[i+1]*(1+factor)+handPos.y;
        const tz = targetPositions[i+2]*(1+factor)+handPos.z;

        posAttr.array[i] += (tx-posAttr.array[i])*0.1 + (Math.random()-0.5)*factor;
        posAttr.array[i+1] += (ty-posAttr.array[i+1])*0.1 + (Math.random()-0.5)*factor;
        posAttr.array[i+2] += (tz-posAttr.array[i+2])*0.1 + (Math.random()-0.5)*factor;
    }

    posAttr.needsUpdate = true;
    particles.rotation.y += settings.rotation;
    particles.material.color.set(settings.color);
    particles.material.size = settings.size;

    if(mouseClickFactor>0) mouseClickFactor*=0.92;

    renderer.render(scene,camera);
}

// ---------------- MediaPipe 手势 ----------------
const hands = new Hands({ locateFile:(file)=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}` });
hands.setOptions({ maxNumHands:1, modelComplexity:1, minDetectionConfidence:0.6, minTrackingConfidence:0.6 });

hands.onResults(results=>{
    const status = document.getElementById('status-display');
    if(results.multiHandLandmarks && results.multiHandLandmarks.length>0){
        const landmarks = results.multiHandLandmarks[0];
        status.innerHTML = "✋ 状态: 已锁定手势<br>提示: 张开/握紧拳头控制扩散";
        const d = Math.hypot(landmarks[4].x-landmarks[20].x, landmarks[4].y-landmarks[20].y);
        handOpenFactor = Math.max(0,(d-0.15)*settings.sensitivity);



        if(settings.mode==='camera'){
            handPos.x = (landmarks[0].x-0.5)*-100;
            handPos.y = (landmarks[0].y-0.5)*-60;
        }
    } else {
        status.innerHTML = "🔍 状态: 正在寻找手部...<br>请确保在 Live Server (localhost) 环境下运行";
        handOpenFactor = 0;
    }
});

const cameraMP = new Camera(document.getElementById('input_video'), {
    onFrame: async()=>{ if(settings.mode==='camera') await hands.send({image:document.getElementById('input_video')}); },
    width:640, height:480
});
cameraMP.start();

// ---------------- 窗口自适应 ----------------
function onResize(){
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
}

// ---------------- HTML 控制函数 ----------------
function setMode(mode) { settings.mode = mode; }
function setShape(shape) { settings.shape = shape; updateShape(shape); }
function setColor(color) { settings.color = color; }
function explodeParticles() { settings.explode(); }

// ---------------- 启动 ----------------
window.onload = init;
// ---------------- 粒子大小控制 ----------------
function setSize(val){
    settings.size = parseFloat(val);
    if(particles) particles.material.size = settings.size;
}

// ---------------- UI 展开/收起 ----------------
document.getElementById('toggle-ui').addEventListener('click', ()=>{
    const panel = document.getElementById('control-panel');
    if(panel.classList.contains('expanded')){
        panel.classList.remove('expanded');
        panel.classList.add('collapsed');
        document.getElementById('toggle-ui').innerText = '展开▼';
    } else {
        panel.classList.remove('collapsed');
        panel.classList.add('expanded');
        document.getElementById('toggle-ui').innerText = '收起▲';
    }
});
