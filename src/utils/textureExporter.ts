import * as THREE from 'three';

export interface ExportedUvTexture {
  meshUuid?: string;
  meshName?: string;
  materialName?: string;
  textureType: 'map' | 'normalMap' | 'roughnessMap' | 'metalnessMap';
  dataUrl: string; // JPEG Data URL (data:image/jpeg;base64,...)
  repeatU?: number;
  repeatV?: number;
  flipY?: boolean;
}

/**
 * Traverses a THREE.Object3D scene, extracts all UV texture maps on mesh materials,
 * renders them onto a canvas and converts them to JPG data URLs.
 */
export function extractSceneUvTextures(scene: THREE.Object3D | null | undefined): ExportedUvTexture[] {
  if (!scene) return [];

  const textures: ExportedUvTexture[] = [];
  const processedTextureUuids = new Set<string>();

  scene.traverse((node) => {
    if (node instanceof THREE.Mesh && node.material) {
      const mats = Array.isArray(node.material) ? node.material : [node.material];

      mats.forEach((mat) => {
        const checkAndExtract = (tex: THREE.Texture | null, type: 'map' | 'normalMap' | 'roughnessMap' | 'metalnessMap') => {
          if (!tex || processedTextureUuids.has(tex.uuid)) return;
          processedTextureUuids.add(tex.uuid);

          try {
            const dataUrl = textureToJpegDataUrl(tex);
            if (dataUrl) {
              textures.push({
                meshUuid: node.uuid,
                meshName: node.name || 'Mesh',
                materialName: mat.name || 'Material',
                textureType: type,
                dataUrl,
                repeatU: tex.repeat?.x || 1,
                repeatV: tex.repeat?.y || 1,
                flipY: tex.flipY
              });
            }
          } catch (e) {
            console.warn('Failed to extract UV texture to JPG:', e);
          }
        };

        if ('map' in mat && mat.map) checkAndExtract(mat.map as THREE.Texture, 'map');
        if ('normalMap' in mat && mat.normalMap) checkAndExtract(mat.normalMap as THREE.Texture, 'normalMap');
        if ('roughnessMap' in mat && mat.roughnessMap) checkAndExtract(mat.roughnessMap as THREE.Texture, 'roughnessMap');
        if ('metalnessMap' in mat && mat.metalnessMap) checkAndExtract(mat.metalnessMap as THREE.Texture, 'metalnessMap');
      });
    }
  });

  return textures;
}

/**
 * Converts a THREE.Texture image or canvas into a JPEG data URL.
 */
export function textureToJpegDataUrl(texture: THREE.Texture, maxDim = 1024): string | null {
  const img = texture.image;
  if (!img) return null;

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;

  if (img instanceof HTMLCanvasElement) {
    canvas = img;
  } else if (img instanceof HTMLImageElement || (typeof ImageBitmap !== 'undefined' && img instanceof ImageBitmap)) {
    canvas = document.createElement('canvas');
    const width = img.width || 512;
    const height = img.height || 512;

    let targetW = width;
    let targetH = height;
    if (targetW > maxDim || targetH > maxDim) {
      if (targetW > targetH) {
        targetH = Math.round((targetH * maxDim) / targetW);
        targetW = maxDim;
      } else {
        targetW = Math.round((targetW * maxDim) / targetH);
        targetH = maxDim;
      }
    }

    canvas.width = Math.max(targetW, 16);
    canvas.height = Math.max(targetH, 16);
    ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Fill white background for JPEG rendering
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  } else if (img && typeof img === 'object' && 'data' in img && 'width' in img && 'height' in img) {
    const rawData = img as { data: ArrayLike<number>; width: number; height: number };
    canvas = document.createElement('canvas');
    canvas.width = rawData.width;
    canvas.height = rawData.height;
    ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const imgData = ctx.createImageData(rawData.width, rawData.height);
    for (let i = 0; i < rawData.data.length; i++) {
      imgData.data[i] = rawData.data[i];
    }
    ctx.putImageData(imgData, 0, 0);
  } else {
    return null;
  }

  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Re-applies exported UV textures back onto a loaded Three.js scene object.
 */
export function reapplyUvTexturesToScene(scene: THREE.Object3D | null | undefined, textures: ExportedUvTexture[]) {
  if (!scene || !textures || textures.length === 0) return;

  const textureLoader = new THREE.TextureLoader();

  textures.forEach((texInfo) => {
    if (!texInfo.dataUrl) return;

    textureLoader.load(
      texInfo.dataUrl,
      (loadedTex) => {
        loadedTex.wrapS = THREE.RepeatWrapping;
        loadedTex.wrapT = THREE.RepeatWrapping;
        if (texInfo.repeatU !== undefined && texInfo.repeatV !== undefined) {
          loadedTex.repeat.set(texInfo.repeatU, texInfo.repeatV);
        }
        if (texInfo.flipY !== undefined) {
          loadedTex.flipY = texInfo.flipY;
        }
        if ('colorSpace' in loadedTex) {
          (loadedTex as any).colorSpace = THREE.SRGBColorSpace;
        }
        loadedTex.needsUpdate = true;

        let matched = false;
        scene.traverse((node) => {
          if (node instanceof THREE.Mesh) {
            if (
              (texInfo.meshUuid && node.uuid === texInfo.meshUuid) ||
              (texInfo.meshName && node.name === texInfo.meshName)
            ) {
              applyTextureToMeshMaterial(node, loadedTex, texInfo.textureType);
              matched = true;
            }
          }
        });

        // Fallback: apply to all meshes with UV coordinates if no named mesh matched
        if (!matched) {
          scene.traverse((node) => {
            if (node instanceof THREE.Mesh && node.geometry && node.geometry.attributes.uv) {
              applyTextureToMeshMaterial(node, loadedTex, texInfo.textureType);
            }
          });
        }
      },
      undefined,
      (err) => console.warn('Error reloading UV texture:', err)
    );
  });
}

function applyTextureToMeshMaterial(mesh: THREE.Mesh, texture: THREE.Texture, type: string) {
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  mats.forEach((m) => {
    if (m instanceof THREE.MeshStandardMaterial || m instanceof THREE.MeshBasicMaterial || m instanceof THREE.MeshPhongMaterial) {
      if (type === 'map') {
        (m as any).map = texture;
      } else if (type === 'normalMap') {
        (m as any).normalMap = texture;
      } else if (type === 'roughnessMap') {
        (m as any).roughnessMap = texture;
      }
      m.needsUpdate = true;
    }
  });
}

/**
 * Triggers a browser download of a JPEG data URL as a .jpg file
 */
export function downloadDataUrlAsJpeg(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename.endsWith('.jpg') || filename.endsWith('.jpeg') ? filename : `${filename}.jpg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
