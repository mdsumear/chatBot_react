import { useEffect, useRef } from "react";
import * as THREE from "three";

import Stats from "three/addons/libs/stats.module.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

export default function Face() {
  const containerRef = useRef(null);

  useEffect(() => {
    let camera, scene, renderer, mixer, controls, stats;
    const clock = new THREE.Clock();

    const container = containerRef.current;

    camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      20
    );
    camera.position.set(-1.8, 0.8, 3);

    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    const ktx2Loader = new KTX2Loader()
      .setTranscoderPath("/basis/")
      .detectSupport(renderer);

    new GLTFLoader()
      .setKTX2Loader(ktx2Loader)
      .setMeshoptDecoder(MeshoptDecoder)
      .load("/facecap.glb", (gltf) => {
        const mesh = gltf.scene;

        scene.add(mesh);

        const light = new THREE.HemisphereLight(0xffffff, 0x444444, 4);
        light.position.set(0, 1, 0);
        scene.add(light);

        // const dirLight = new THREE.DirectionalLight(0xffffff, 3);
        // dirLight.position.set(5, 10, 7.5);
        // scene.add(dirLight);

        mixer = new THREE.AnimationMixer(mesh);
        mixer.clipAction(gltf.animations[0]).play();

        const head = mesh.getObjectByName("mesh_2");
        const influences = head.morphTargetInfluences;

        const gui = new GUI();
        gui.close();

        for (const [key, value] of Object.entries(head.morphTargetDictionary)) {
          gui
            .add(influences, value, 0, 1, 0.01)
            .name(key.replace("blendShape1.", ""))
            .listen();
          console.log(key, value);
        }
      });

    const environment = new RoomEnvironment();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);

    scene.background = new THREE.Color(0xffffff);
    scene.environment = pmremGenerator.fromScene(environment).texture;

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 2.5;
    controls.maxDistance = 5;
    controls.minAzimuthAngle = -Math.PI / 2;
    controls.maxAzimuthAngle = Math.PI / 2;
    controls.maxPolarAngle = Math.PI / 1.8;
    controls.target.set(0, 0.15, -0.2);

    stats = new Stats();
    container.appendChild(stats.dom);

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", onResize);

    function animate() {
      requestAnimationFrame(animate);

      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);

      controls.update();
      renderer.render(scene, camera);
      stats.update();
    }
    animate();

    return () => {
      window.removeEventListener("resize", onResize);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: "100vw", height: "100vh", overflow: "hidden" }}
    />
  );
}
