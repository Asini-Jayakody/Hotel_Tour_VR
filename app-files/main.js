import {sendMessageToAvatar, submitAudio } from './chat_rag.js';

// Basic scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.z = 7; // Set initial camera position

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let isDragging = false;
let dragOffset = new THREE.Vector3();
let dragPlane = new THREE.Plane();
let intersection = new THREE.Vector3();


let isTalking = false;
let talkStartTime = 0;
let talkDuration = 10; // seconds


const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('threeCanvas'),
  alpha: true,
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x000000, 0);

// Add lights
const light = new THREE.HemisphereLight(0xffffff, 0x444444);
light.position.set(0, 1, 1);
scene.add(light);

// Load avatar model
// const loader = new THREE.FBXLoader();
const loader = new THREE.GLTFLoader();
let avatar;
let mixer;
const clock = new THREE.Clock(); 
let action; // For animation control

loader.load('models/eve_wall-e__eva/scene.gltf', function(gltf) {
  avatar = gltf.scene;
  avatar.scale.set(1, 1, 1); 
  avatar.position.set(0, -1, 0); 
  scene.add(avatar);

  // ✅ Set up animation mixer
  mixer = new THREE.AnimationMixer(avatar);

  // ✅ Play the first animation clip (if any)
  if (gltf.animations.length > 0) {
    action = mixer.clipAction(gltf.animations[0]);
    action.play();
  }

}, undefined, function(error) {
  console.error(error);
});


// Position the camera
// camera.position.z = 7;


window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});



window.addEventListener('mousedown', (event) => {
  if (!avatar) return;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(avatar, true);

  if (intersects.length > 0) {
    isDragging = true;

    // Create a plane facing the camera where the drag happens
    dragPlane.setFromNormalAndCoplanarPoint(
      camera.getWorldDirection(new THREE.Vector3()).negate(),
      intersects[0].point
    );

    dragOffset.copy(intersects[0].point).sub(avatar.position);
  }
});

window.addEventListener('mouseup', () => {
  isDragging = false;
});

window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // Hover logic
  if (avatar) {
    const intersects = raycaster.intersectObject(avatar, true);

    if (intersects.length > 0) {
      renderer.domElement.style.cursor = 'pointer';
      renderer.domElement.style.pointerEvents = 'auto';
    } else {
      renderer.domElement.style.cursor = 'default';
      renderer.domElement.style.pointerEvents = 'none';
    }
  }

  // Drag logic
  if (isDragging) {
    const dragIntersect = new THREE.Vector3();
    raycaster.ray.intersectPlane(dragPlane, dragIntersect);
    avatar.position.copy(dragIntersect.sub(dragOffset));
  }
});



const message = document.getElementById('sendBtn').addEventListener('click', sendMessageToAvatar);

document.getElementById('recordBtnId').addEventListener('click', submitAudio('recordBtnId','stopBtnId'))
document.getElementById('stopBtnId').addEventListener('click', submitAudio('recordBtnId','stopBtnId'))



function playTalkingAnimation() {
  action.reset().fadeIn(0.5).play();
}

function stopTalkingAnimation() {
  action.stop();
}



// Animate
function animate() {
  requestAnimationFrame(animate);
  
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta); // ✅ update animation
  
  // ✅ Play talking animation only once
  if (!isTalking && avatar) {
    playTalkingAnimation();
    isTalking = true;
    talkStartTime = clock.elapsedTime;
    console.log("play talking animation");
  }
  
  // ✅ Stop after 10 seconds
  if (isTalking && clock.elapsedTime - talkStartTime > talkDuration) {
    stopTalkingAnimation();
    isTalking = false;
    console.log("stop talking animation");
  }
  
  
  renderer.render(scene, camera);
}
animate();




// window.addEventListener('sceneChanged', function(e) {
//   const sceneId = e.detail.id;
//   const sceneName = e.detail.name;

//   console.log(`Scene changed to: ${sceneName} (ID: ${sceneId})`);
// });

// document.getElementById('sendBtn').addEventListener('click', sendMessageToAvatar);
// document.getElementById('sendBtn').addEventListener('click', testBackend);



// async function testBackend() {
//   const response = await fetch("http://localhost:8000/avatar", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ question: "What is the hotel name?" }),
//   });

//   const blob = await response.blob();
//   console.log("Response from backend:");
//   const audioUrl = URL.createObjectURL(blob);
//   const audio = new Audio(audioUrl);
//   console.log("Playing audio from backend response:", audioUrl);
//   await audio.play();
// }


// // Set up the scene
// const scene = new THREE.Scene();
// const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// const renderer = new THREE.WebGLRenderer({ 
//   canvas: document.getElementById('threeCanvas'), 
//   alpha: true, 
//   antialias: true 
// });
// renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.setPixelRatio(window.devicePixelRatio);
// renderer.setClearColor(0x000000, 0); // Transparent backgroun
// document.body.appendChild(renderer.domElement);

// // Create a cube
// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

// // Position the camera
// camera.position.z = 5;

// window.addEventListener('resize', () => {
//   camera.aspect = window.innerWidth / window.innerHeight;
//   camera.updateProjectionMatrix();
//   renderer.setSize(window.innerWidth, window.innerHeight);
// });


// // Animation loop
// function animate() {
//     requestAnimationFrame(animate);
//     cube.rotation.x += 0.01;
//     cube.rotation.y += 0.01;
//     renderer.render(scene, camera);
// }
// animate();