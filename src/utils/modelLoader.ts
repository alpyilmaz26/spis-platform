import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { ModelStats, MeshNodeInfo, AnimationClipInfo } from '../types';

export interface LoadedModelResult {
  scene: THREE.Group | THREE.Object3D;
  stats: ModelStats;
  hierarchy: MeshNodeInfo[];
  animations: AnimationClipInfo[];
  rawClips: THREE.AnimationClip[];
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // For files over 25MB, creating base64 data URLs causes string length overflow in V8 and browser tab crashes.
    // Return a lightweight Blob URL instead.
    if (file.size > 25 * 1024 * 1024) {
      resolve(URL.createObjectURL(file));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export async function load3DModelFromDataUrl(
  dataUrl: string,
  fileName: string,
  onProgress?: (percent: number) => void
): Promise<LoadedModelResult> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], fileName, { type: blob.type || 'application/octet-stream' });
  return load3DModelFile(file, onProgress);
}

export async function load3DModelFile(
  file: File,
  onProgress?: (percent: number) => void
): Promise<LoadedModelResult> {
  const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
  const url = URL.createObjectURL(file);

  try {
    let loadedObject: THREE.Object3D;
    let rawClips: THREE.AnimationClip[] = [];

    if (fileExt === 'glb' || fileExt === 'gltf') {
      const loader = new GLTFLoader();
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
      loader.setDRACOLoader(dracoLoader);

      const gltf = await new Promise<any>((resolve, reject) => {
        loader.load(
          url,
          (data) => resolve(data),
          (xhr) => {
            if (xhr.lengthComputable && onProgress) {
              onProgress(Math.round((xhr.loaded / xhr.total) * 100));
            }
          },
          (err) => reject(err)
        );
      });

      loadedObject = gltf.scene || gltf.scenes[0];
      rawClips = gltf.animations || [];
    } else if (fileExt === 'obj') {
      const loader = new OBJLoader();
      loadedObject = await new Promise<THREE.Group>((resolve, reject) => {
        loader.load(
          url,
          (obj) => {
            obj.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.geometry && !child.geometry.attributes.normal) {
                  child.geometry.computeVertexNormals();
                }
                if (child.material) {
                  const convertMat = (m: THREE.Material) => {
                    if (m instanceof THREE.MeshStandardMaterial) {
                      m.side = THREE.DoubleSide;
                      return m;
                    }
                    const color = (m as any).color ? (m as any).color.clone() : new THREE.Color(0xd1d5db);
                    const map = (m as any).map || null;
                    return new THREE.MeshStandardMaterial({
                      color,
                      map,
                      roughness: 0.5,
                      metalness: 0.1,
                      side: THREE.DoubleSide
                    });
                  };

                  if (Array.isArray(child.material)) {
                    child.material = child.material.map(convertMat);
                  } else {
                    child.material = convertMat(child.material);
                  }
                }
              }
            });
            resolve(obj);
          },
          (xhr) => {
            if (xhr.lengthComputable && onProgress) {
              onProgress(Math.round((xhr.loaded / xhr.total) * 100));
            }
          },
          (err) => reject(err)
        );
      });
    } else if (fileExt === 'stl') {
      const loader = new STLLoader();
      const geometry = await new Promise<THREE.BufferGeometry>((resolve, reject) => {
        loader.load(
          url,
          (geo) => resolve(geo),
          (xhr) => {
            if (xhr.lengthComputable && onProgress) {
              onProgress(Math.round((xhr.loaded / xhr.total) * 100));
            }
          },
          (err) => reject(err)
        );
      });

      geometry.computeVertexNormals();
      const material = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.5,
        roughness: 0.4
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = file.name.replace(/\.[^/.]+$/, '');
      const group = new THREE.Group();
      group.add(mesh);
      loadedObject = group;
    } else if (fileExt === 'ply') {
      const loader = new PLYLoader();
      const geometry = await new Promise<THREE.BufferGeometry>((resolve, reject) => {
        loader.load(
          url,
          (geo) => resolve(geo),
          (xhr) => {
            if (xhr.lengthComputable && onProgress) {
              onProgress(Math.round((xhr.loaded / xhr.total) * 100));
            }
          },
          (err) => reject(err)
        );
      });

      geometry.computeVertexNormals();
      const material = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        metalness: 0.3,
        roughness: 0.3
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = file.name.replace(/\.[^/.]+$/, '');
      const group = new THREE.Group();
      group.add(mesh);
      loadedObject = group;
    } else if (fileExt === 'fbx') {
      const loader = new FBXLoader();
      const fbx = await new Promise<THREE.Group>((resolve, reject) => {
        loader.load(
          url,
          (obj) => resolve(obj),
          (xhr) => {
            if (xhr.lengthComputable && onProgress) {
              onProgress(Math.round((xhr.loaded / xhr.total) * 100));
            }
          },
          (err) => reject(err)
        );
      });

      loadedObject = fbx;
      rawClips = fbx.animations || [];
    } else {
      throw new Error(`Unsupported file extension: .${fileExt}. Please upload GLB, GLTF, OBJ, STL, PLY, or FBX.`);
    }

    // Process statistics & hierarchy
    const result = analyzeObject3D(loadedObject, file.name, formatBytes(file.size), fileExt.toUpperCase());
    result.rawClips = rawClips;
    result.animations = rawClips.map((clip, i) => ({
      index: i,
      name: clip.name || `Animation Clip ${i + 1}`,
      duration: Math.round(clip.duration * 100) / 100
    }));

    return result;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function analyzeObject3D(
  object: THREE.Object3D,
  fileName: string,
  fileSizeStr: string = 'Generated',
  formatStr: string = 'Procedural'
): LoadedModelResult {
  let vertexCount = 0;
  let triangleCount = 0;
  let meshCount = 0;

  // Compute overall bounding box
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();

  if (!box.isEmpty()) {
    box.getSize(size);
    box.getCenter(center);
  } else {
    size.set(1, 1, 1);
    center.set(0, 0, 0);
  }

  // Assign original transform positions for explode view
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      meshCount++;
      const geometry = child.geometry;
      if (geometry) {
        if (geometry.attributes.position) {
          vertexCount += geometry.attributes.position.count;
        }
        if (geometry.index) {
          triangleCount += geometry.index.count / 3;
        } else if (geometry.attributes.position) {
          triangleCount += geometry.attributes.position.count / 3;
        }
      }

      // Store initial local position and vector from center for explode view
      if (!child.userData.initialPosition) {
        child.userData.initialPosition = child.position.clone();
        const worldPos = new THREE.Vector3();
        child.getWorldPosition(worldPos);
        const directionFromCenter = worldPos.clone().sub(center);
        if (directionFromCenter.length() < 0.001) {
          directionFromCenter.set(0, 1, 0);
        } else {
          directionFromCenter.normalize();
        }
        child.userData.explodeDir = directionFromCenter;
      }

      // Ensure shadows enabled
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  const maxDim = Math.max(size.x, size.y, size.z);
  const boundingSphereRadius = Math.round((maxDim > 0 ? maxDim / 2 : 2.5) * 100) / 100;

  const stats: ModelStats = {
    name: fileName,
    fileSize: fileSizeStr,
    format: formatStr,
    vertexCount: Math.round(vertexCount),
    triangleCount: Math.round(triangleCount),
    meshCount,
    boundingBox: {
      x: Math.round(size.x * 100) / 100,
      y: Math.round(size.y * 100) / 100,
      z: Math.round(size.z * 100) / 100
    },
    center: {
      x: Math.round(center.x * 100) / 100,
      y: Math.round(center.y * 100) / 100,
      z: Math.round(center.z * 100) / 100
    },
    boundingSphereRadius
  };

  const hierarchy = buildHierarchyTree(object);

  return {
    scene: object,
    stats,
    hierarchy,
    animations: [],
    rawClips: []
  };
}

export function disposeObject3D(object: THREE.Object3D | null | undefined): void {
  if (!object) return;
  object.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (mesh.userData?.pointsMesh) {
      const pts = mesh.userData.pointsMesh as THREE.Points;
      if (pts.geometry) pts.geometry.dispose();
      if (pts.material) {
        if (Array.isArray(pts.material)) {
          pts.material.forEach((m) => m.dispose());
        } else {
          pts.material.dispose();
        }
      }
      delete mesh.userData.pointsMesh;
    }
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    if (mesh.material) {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((mat: any) => {
        if (!mat) return;
        const texKeys = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap'];
        texKeys.forEach((k) => {
          if (mat[k] && typeof mat[k].dispose === 'function') {
            mat[k].dispose();
          }
        });
        if (typeof mat.dispose === 'function') {
          mat.dispose();
        }
      });
    }
  });
}

function buildHierarchyTree(object: THREE.Object3D): MeshNodeInfo[] {
  const result: MeshNodeInfo[] = [];

  function processNode(node: THREE.Object3D): MeshNodeInfo | null {
    let vCount = 0;
    let tCount = 0;
    let materialName: string | undefined;
    let color: string | undefined;
    let roughness: number | undefined;
    let metalness: number | undefined;
    let opacity: number | undefined;

    if (node instanceof THREE.Mesh) {
      const geometry = node.geometry;
      if (geometry && geometry.attributes.position) {
        vCount = geometry.attributes.position.count;
        tCount = geometry.index ? geometry.index.count / 3 : vCount / 3;
      }

      const mat = node.material;
      if (mat) {
        const singleMat = Array.isArray(mat) ? mat[0] : mat;
        materialName = singleMat.name || 'Standard Material';
        if ('color' in singleMat && singleMat.color) {
          color = '#' + (singleMat.color as THREE.Color).getHexString();
        }
        if ('roughness' in singleMat) {
          roughness = singleMat.roughness as number;
        }
        if ('metalness' in singleMat) {
          metalness = singleMat.metalness as number;
        }
        if ('opacity' in singleMat) {
          opacity = singleMat.opacity as number;
        }
      }
    }

    const childNodes: MeshNodeInfo[] = [];
    node.children.forEach((c) => {
      const childInfo = processNode(c);
      if (childInfo) childNodes.push(childInfo);
    });

    return {
      id: node.uuid,
      name: node.name || `${node.type}_${node.id.toString().slice(-4)}`,
      type: node.type,
      vertexCount: Math.round(vCount),
      triangleCount: Math.round(tCount),
      visible: node.visible,
      materialName,
      color,
      roughness,
      metalness,
      opacity,
      children: childNodes.length > 0 ? childNodes : undefined
    };
  }

  object.children.forEach((c) => {
    const info = processNode(c);
    if (info) result.push(info);
  });

  if (result.length === 0 && object instanceof THREE.Mesh) {
    const info = processNode(object);
    if (info) result.push(info);
  }

  return result;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
