import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import fragmentShader from './shader/fragmentShader.glsl';
import vertexShader from './shader/vertexShader.glsl';

let stats: Stats;
let camera: THREE.PerspectiveCamera,
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer;
let theta = 0; // 세타는 각도를 나타낸다. 카메라가 원형 궤도를 따라 움직이는 속도를 결정하기 위해 사용된다.

const radius = 5; // 카메라가 원형 궤도를 따라 움직일 때의 반지름이다.

// 각 인스턴스마다 하나의 행렬을 설정해야 한다. init 함수 내부의 matrixArray가 attribute에 전달될 행렬이다.
const numInstances = 2000;

init();

function init() {
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(1, 1, 1).normalize();
  scene.add(light);

  // GPU에는 단지 이 지오메트리 하나의 인스턴스의 정보만 갖도록 한다.
  const geometry = new THREE.BoxGeometry();
  const instancedGeometry = new THREE.InstancedBufferGeometry();

  // BoxGeometry의 속성(attributes)을 InstancedBufferGeometry에 복사
  // 각 인스턴스가 동일한 지오메트리 속성을 공유하기 위함.
  Object.keys(geometry.attributes).forEach((attributeName) => {
    instancedGeometry.attributes[attributeName] =
      geometry.attributes[attributeName];
  });

  // 인덱스는 지오메트리의 정점 배열을 참조하여 폴리곤을 정의하는 데 사용됨
  instancedGeometry.index = geometry.index;
  instancedGeometry.instanceCount = numInstances;

  // matrixArray는 2000개의 4x4 행렬을 저장할 수 있는 일차원 배열이다. 각 행렬은 16개의 요소로 구성된다.(2000 * 16)
  const matrixArray = new Float32Array(numInstances * 16);
  // instanceColorArray는 2000개의 색상 정보를 저장할 수 있는 일차원 배열이다. 각 색상은 RGB 3개의 요소로 구성된다.(2000 * 3)
  const instanceColorArray = new Float32Array(numInstances * 3);

  const position = new THREE.Vector3();
  const rotation = new THREE.Euler();
  const scale = new THREE.Vector3();
  const matrix = new THREE.Matrix4();

  for (let i = 0; i < numInstances; i++) {
    // position : -20~20 사이의 난수 3개
    position.set(
      Math.random() * 40 - 20,
      Math.random() * 40 - 20,
      Math.random() * 40 - 20
    );

    // rotation : 0~360 사이의 난수 3개
    rotation.set(
      Math.random() * 2 * Math.PI,
      Math.random() * 2 * Math.PI,
      Math.random() * 2 * Math.PI
    );

    scale.set(Math.random() + 0.5, Math.random() + 0.5, Math.random() + 0.5);

    const quaternion = new THREE.Quaternion().setFromEuler(rotation);
    matrix.compose(position, quaternion, scale);

    // 행렬 attribute는 mat4다.
    matrix.toArray(matrixArray, i * 16);

    const color = new THREE.Color(Math.random() * 0xffffff);
    color.toArray(instanceColorArray, i * 3);
  }

  // 인스턴스의 행렬과 색상을 버퍼에 입력하여 셰이더에서 사용하도록 한다.
  // 위치, 회전, 스케일에 대한 정보들인 4x4 벡터의 버퍼
  instancedGeometry.setAttribute(
    'instanceMatrix',
    new THREE.InstancedBufferAttribute(matrixArray, 16)
  );
  // 인스턴스마다 별도의 색상을 갖도록 색상에 대한 RGB값 3가지의 정보인 버퍼
  instancedGeometry.setAttribute(
    'instanceColor',
    new THREE.InstancedBufferAttribute(instanceColorArray, 3)
  );

  const instanceMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
  });

  const instancedMesh = new THREE.Mesh(instancedGeometry, instanceMaterial);
  scene.add(instancedMesh);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  document.body.appendChild(renderer.domElement);

  stats = new Stats();
  document.body.appendChild(stats.dom);

  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  render();
  stats.update();
}

function render() {
  theta += 0.1;

  // 원의 방정식을 사용하여 카메라의 x,y,z 좌표를 설정, 카메라가 원형 궤도를 따라 돌도록 한다.
  camera.position.x = radius * Math.sin(THREE.MathUtils.degToRad(theta));
  camera.position.y = radius * Math.sin(THREE.MathUtils.degToRad(theta));
  camera.position.z = radius * Math.cos(THREE.MathUtils.degToRad(theta));
  camera.lookAt(scene.position);
  // 카메라의 월드 변환 행렬을 업데이트하여 카메라의 새로운 위치와 방향을 장면에 반영한다.
  camera.updateMatrixWorld();

  console.log(`드로우 콜 수: ${renderer.info.render.calls}`); // 드로우 콜 수
  renderer.render(scene, camera);
}
