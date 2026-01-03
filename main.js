import * as THREE from './vendor/three.module.js';
import GUI from './vendor/lil-gui.module.min.js';
import { createHeart } from './particles/heart.js';
import { createGalaxy } from './particles/galaxy.js';

// 使用全局变量方式获取 MediaPipe Hands 和 Camera
const HandsClass = window.Hands;
const CameraClass = window.Camera;

let scene, camera, renderer, group, points;
let currentModel = 'heart';

init();
initUI();
initHands();
animate();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.z = 80;

  renderer = new THREE.WebGLRenderer({ antialias:true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  group = new THREE.Group();
  scene.add(group);
  buildParticles();

  window.addEventListener('resize', onResize);
}

function buildParticles() {
  group.clear();
  const geometry = currentModel === 'heart' ? createHeart(THREE) : createGalaxy(THREE);
  const material = new THREE.PointsMaterial({ color: 0xff4d6d, size: 1.5 });
  points = new THREE.Points(geometry, material);
  group.add(points);
}

function initUI() {
  const gui = new GUI();
  const cfg = {
    模型: '爱心',
    颜色: '#ff4d6d',
    全屏: () => document.documentElement.requestFullscreen(),
    视野归位: resetView
  };
  gui.add(cfg, '模型', ['爱心','星系']).onChange(v => {
    currentModel = v === '爱心' ? 'heart' : 'galaxy';
    buildParticles();
  });
  gui.addColor(cfg, '颜色').onChange(v => points.material.color.set(v));
  gui.add(cfg, '全屏');
  gui.add(cfg, '视野归位');
}

function initHands() {
  const video = document.getElementById('video');

  const hands = new HandsClass({ locateFile: f => `./vendor/${f}` });
  hands.setOptions({ maxNumHands:1, modelComplexity:1 });

  hands.onResults(res => {
    if (!res.multiHandLandmarks) return;
    const lm = res.multiHandLandmarks[0];

    // 双手拇指与食指距离控制缩放
    const dx = lm[4].x - lm[8].x;
    const dy = lm[4].y - lm[8].y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const scale = THREE.MathUtils.clamp(dist * 5, 0.6, 3);
    group.scale.set(scale, scale, scale);

    // 手掌基点位置控制移动
    group.position.x = (lm[0].x - 0.5) * 60;
    group.position.y = -(lm[0].y - 0.5) * 40;
  });

  const cam = new CameraClass(video, {
    onFrame: async () => await hands.send({ image: video }),
    width: 640, height: 480
  });
  cam.start();
}

function resetView() {
  camera.position.set(0,0,80);
  group.position.set(0,0,0);
  group.scale.set(1,1,1);
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

function onResize() {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
