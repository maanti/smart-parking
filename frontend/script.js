"use strict";

import * as THREE from "./lib/three.module.js";
import {OrbitControls} from "./lib/OrbitControls.js";
import {GLTFLoader} from "./lib/GLTFLoader.js";
import "./lib/jquery.min.js";

let camera;
let scene;
let renderer;
let skyLight;
let floorMat;
let responses;
let y = 0.5;
let parking_lots = [
    {
        x: 1.9,
        z: -3,
        rotation_y: -Math.PI
    },
    {
        x: 1.9,
        z: -1.6,
        rotation_y: -Math.PI
    },
    {
        x: 1.9,
        z: -0.1,
        rotation_y: -Math.PI
    },
    {
        x: 1.9,
        z: 1.4,
        rotation_y: -Math.PI
    },
    {
        x: 1.9,
        z: 2.9,
        rotation_y: -Math.PI
    },
    {
        x: -1.7,
        z: -3,
        rotation_y: 0
    },
    {
        x: -1.7,
        z: -1.6,
        rotation_y: 0
    },
    {
        x: -1.7,
        z: -0.1,
        rotation_y: 0
    },
    {
        x: -1.7,
        z: 1.4,
        rotation_y: 0
    },
    {
        x: -1.7,
        z: 2.9,
        rotation_y: 0
    },
];
window.previousShadowMap = false;
const params = {
    shadows: true,
    exposure: 0.68,
    bulbPower: 400,
    hemiIrradiance: 0.5
};

init();
animate();

function init() {
    setUpCamera();
    createScene();

    setUpSkyLight();
    initMaterials();

    createFloor();
    createObjects();
    setInterval(() => {
        createObjects();
    }, 1000);

    createRenderer();

    initControls();


    window.addEventListener("resize", onWindowResize, false);
}

function setUpCamera() {
    camera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        0.3,
        100
    );
    camera.position.x = -4;
    camera.position.z = 4;
    camera.position.y = 4;
}

function setUpSkyLight() {
    skyLight = new THREE.HemisphereLight(0xddeeff, 0x0f0e0d, 0.2);
    scene.add(skyLight); // A light source positioned directly above the scene

    const ambientLight = new THREE.AmbientLight(0xffffff, 5);
    scene.add(ambientLight); // This light globally illuminates all objects in the scene equally
}

function initMaterials() {
    floorMat = new THREE.MeshStandardMaterial({
        roughness: 1,
        color: 0xffffff,
        metalness: 0.1,
        bumpScale: 0.001
    });
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load("textures/parking2.png", (map) => {
        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;
        map.anisotropy = 4;
        map.repeat.set(1, 1);
        map.encoding = THREE.sRGBEncoding;
        floorMat.map = map;
        floorMat.needsUpdate = true;
    });
}

function createFloor() {
    const floorGeometry = new THREE.PlaneBufferGeometry(10, 10);
    const floorMesh = new THREE.Mesh(floorGeometry, floorMat);
    floorMesh.receiveShadow = true;
    floorMesh.rotation.x = -Math.PI / 2.0;
    scene.add(floorMesh);
}

function createObjects() {
    $.ajax({
        url: "http://3.19.242.4:8080/",
        dataType: "json",
        async: false,
        crossDomain: true,
        success: (function (e) {
            responses = e;
        })
    });
    const loader = new GLTFLoader();

    for(const e of responses) {
        let parking_lot = parking_lots[e.parking_id];
        if (e.busy) {
            if (!parking_lot.scene) {
                loader.load("objects/scene.gltf", gltf => {
                    gltf.scene.position.z = parking_lot.z;
                    gltf.scene.position.x = parking_lot.x;
                    gltf.scene.position.y = y;
                    gltf.scene.rotateY(parking_lot.rotation_y);
                    scene.add(gltf.scene);
                    parking_lots[e.parking_id].scene = gltf.scene;
                });
            }
        } else {
            if (parking_lot.scene)
                scene.remove(parking_lot.scene);
                delete parking_lots[e.parking_id].scene;
        }
    }
}

function createRenderer() {
    const container = document.getElementById("container");
    renderer = new THREE.WebGLRenderer({alpha: true});
    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor (0x08fbfb, 0.3);
    container.appendChild(renderer.domElement);
}

function createScene() {
    scene = new THREE.Scene();
}

function initControls() {
    window.controls = new OrbitControls(camera, renderer.domElement);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    window.requestAnimationFrame(animate);
    render();
}

function render() {
    renderer.toneMappingExposure = Math.pow(params.exposure, 5.0);
    renderer.shadowMap.enabled = params.shadows;
    if (params.shadows !== window.previousShadowMap) {
        floorMat.needsUpdate = true;
        window.previousShadowMap = params.shadows;
    }
    skyLight.intensity = params.hemiIrradiance;

    renderer.render(scene, camera);
}
