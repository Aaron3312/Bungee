import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const useThreeJS = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const roofMeshRef = useRef<THREE.Mesh | null>(null);
  const supportGroupRef = useRef<THREE.Group | null>(null);
  const churchGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Obtener el tamaño del contenedor
    const container = canvasRef.current.parentElement;
    const isDesktop = window.innerWidth >= 768;
    const containerWidth = isDesktop ? window.innerWidth * 0.95 : container!.offsetWidth;
    const containerHeight = isDesktop ? window.innerHeight * 0.6 : Math.min(600, containerWidth * 0.75);

    // Configuración inicial
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, containerWidth/containerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      antialias: true 
    });
    
    renderer.setSize(containerWidth, containerHeight);
    renderer.setClearColor(0x87CEEB);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Iluminación mejorada
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -40;
    directionalLight.shadow.camera.right = 40;
    directionalLight.shadow.camera.top = 40;
    directionalLight.shadow.camera.bottom = -40;
    scene.add(directionalLight);

    // Luz adicional para el altar
    const altarLight = new THREE.PointLight(0xffd700, 0.5, 100);
    altarLight.position.set(0, 15, 25);
    scene.add(altarLight);

    // Función de la ecuación corregida: z = 8 - 0.078125·x² + 0.0064·y²
    const heightFunction = (x: number, y: number) => {
      return Math.max(0, 8 - 0.078125 * x * x + 0.0064 * y * y);
    };

    // Crear el paraboloide hiperbólico con la ecuación correcta
    const createParaboloidGeometry = (widthSegments = 60, heightSegments = 120) => {
      const geometry = new THREE.BufferGeometry();
      const vertices: number[] = [];
      const indices: number[] = [];
      const uvs: number[] = [];
      const normals: number[] = [];
      
      for (let i = 0; i <= heightSegments; i++) {
        for (let j = 0; j <= widthSegments; j++) {
          const u = j / widthSegments;
          const v = i / heightSegments;
          
          // Dominio: -8 ≤ x ≤ 8, -25 ≤ y ≤ 25
          const x = (u - 0.5) * 16; // de -8 a 8
          const y = (v - 0.5) * 50; // de -25 a 25
          const z = heightFunction(x, y);
          
          vertices.push(x, z, y);
          uvs.push(u, v);

          // Calcular normales usando las derivadas parciales
          const dzdx = -0.078125 * 2 * x;
          const dzdy = 0.0064 * 2 * y;
          const normal = new THREE.Vector3(-dzdx, 1, -dzdy).normalize();
          normals.push(normal.x, normal.y, normal.z);
        }
      }
      
      for (let i = 0; i < heightSegments; i++) {
        for (let j = 0; j < widthSegments; j++) {
          const a = i * (widthSegments + 1) + j;
          const b = a + widthSegments + 1;
          const c = a + 1;
          const d = b + 1;
          
          indices.push(a, b, c);
          indices.push(b, d, c);
        }
      }
      
      geometry.setIndex(indices);
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      
      return geometry;
    };

    const geometry = createParaboloidGeometry(60, 120);

    // Material mejorado para la capilla
    const material = new THREE.MeshLambertMaterial({ 
      color: 0xD2691E, // Color tierra/adobe para capilla
      side: THREE.DoubleSide,
      transparent: false,
      wireframe: false
    });

    const roofMesh = new THREE.Mesh(geometry, material);
    roofMesh.receiveShadow = true;
    roofMesh.castShadow = true;
    scene.add(roofMesh);

    // Crear soportes estructurales (polines) según los cálculos
    const supportGroup = new THREE.Group();
    const supportPositions: Array<{x: number; y: number; height: number}> = [];
    
    // Generar polines en una cuadrícula de 9x11 (2m x 5m de separación)
    // Dirección X: -8 a 8, cada 2m (9 polines)
    // Dirección Y: -25 a 25, cada 5m (11 polines)
    for (let x = -8; x <= 8; x += 2) {
      for (let y = -25; y <= 25; y += 5) {
        const height = heightFunction(x, y);
        // Crear polín rectangular (20cm x 30cm según cálculos)
        const supportGeometry = new THREE.BoxGeometry(0.2, height, 0.3);
        const supportMaterial = new THREE.MeshLambertMaterial({ 
          color: 0x8B4513, // Color madera
          transparent: false
        });
        const support = new THREE.Mesh(supportGeometry, supportMaterial);
        support.position.set(x, height/2, y);
        support.castShadow = true;
        supportGroup.add(support);
        supportPositions.push({x, y, height});
      }
    }
    scene.add(supportGroup);
    supportGroup.visible = false;

    // Crear elementos de la iglesia construida
    const churchGroup = new THREE.Group();
    
    // Crear muros laterales de la iglesia
    const createWalls = () => {
      const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xDEB887 }); // Beige claro
      
      // Muro lateral izquierdo
      const leftWallGeometry = new THREE.BoxGeometry(0.3, 4, 50);
      const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
      leftWall.position.set(-8.5, 2, 0);
      leftWall.castShadow = true;
      churchGroup.add(leftWall);
      
      // Muro lateral derecho
      const rightWallGeometry = new THREE.BoxGeometry(0.3, 4, 50);
      const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
      rightWall.position.set(8.5, 2, 0);
      rightWall.castShadow = true;
      churchGroup.add(rightWall);
      
      // Muro frontal (entrada)
      const frontWallGeometry = new THREE.BoxGeometry(17, 4, 0.3);
      const frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
      frontWall.position.set(0, 2, -25.5);
      frontWall.castShadow = true;
      churchGroup.add(frontWall);
      
      // Arco de entrada
      const archGeometry = new THREE.BoxGeometry(3, 5, 0.5);
      const archMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
      const arch = new THREE.Mesh(archGeometry, archMaterial);
      arch.position.set(0, 2.5, -25.2);
      churchGroup.add(arch);
    };
    
    // Crear altar y cruz
    const createAltar = () => {
      // Base del altar
      const altarGeometry = new THREE.BoxGeometry(6, 1, 3);
      const altarMaterial = new THREE.MeshLambertMaterial({ color: 0xF5DEB3 });
      const altar = new THREE.Mesh(altarGeometry, altarMaterial);
      altar.position.set(0, 0.5, 22);
      altar.castShadow = true;
      churchGroup.add(altar);
      
      // Mesa del altar
      const tableGeometry = new THREE.BoxGeometry(4, 0.2, 2);
      const tableMaterial = new THREE.MeshLambertMaterial({ color: 0xD2691E });
      const table = new THREE.Mesh(tableGeometry, tableMaterial);
      table.position.set(0, 1.1, 22);
      table.castShadow = true;
      churchGroup.add(table);
      
      // Cruz vertical
      const crossVerticalGeometry = new THREE.BoxGeometry(0.3, 4, 0.3);
      const crossMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
      const crossVertical = new THREE.Mesh(crossVerticalGeometry, crossMaterial);
      crossVertical.position.set(0, 3, 24);
      crossVertical.castShadow = true;
      churchGroup.add(crossVertical);
      
      // Cruz horizontal
      const crossHorizontalGeometry = new THREE.BoxGeometry(2, 0.3, 0.3);
      const crossHorizontal = new THREE.Mesh(crossHorizontalGeometry, crossMaterial);
      crossHorizontal.position.set(0, 3.5, 24);
      crossHorizontal.castShadow = true;
      churchGroup.add(crossHorizontal);
    };
    
    // Crear bancas
    const createBenches = () => {
      const benchMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
      
      for (let row = 0; row < 8; row++) {
        for (let side = -1; side <= 1; side += 2) {
          // Asiento de la banca
          const seatGeometry = new THREE.BoxGeometry(1.5, 0.1, 6);
          const seat = new THREE.Mesh(seatGeometry, benchMaterial);
          seat.position.set(side * 3, 0.45, -18 + row * 4);
          seat.castShadow = true;
          churchGroup.add(seat);
          
          // Respaldo de la banca
          const backGeometry = new THREE.BoxGeometry(1.5, 1, 0.1);
          const back = new THREE.Mesh(backGeometry, benchMaterial);
          back.position.set(side * 3, 0.95, -18 + row * 4 + 2.95);
          back.castShadow = true;
          churchGroup.add(back);
          
          // Patas de la banca
          for (let i = 0; i < 4; i++) {
            const legGeometry = new THREE.BoxGeometry(0.1, 0.4, 0.1);
            const leg = new THREE.Mesh(legGeometry, benchMaterial);
            const xOffset = i < 2 ? -0.7 : 0.7;
            const zOffset = i % 2 === 0 ? -2.9 : 2.9;
            leg.position.set(side * 3 + xOffset, 0.2, -18 + row * 4 + zOffset);
            leg.castShadow = true;
            churchGroup.add(leg);
          }
        }
      }
    };
    
    // Crear figura del sacerdote
    const createPriest = () => {
      const priestGroup = new THREE.Group();
      
      // Cuerpo
      const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.5, 1.5, 8);
      const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 }); // Negro
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(0, 0.75, 20);
      body.castShadow = true;
      priestGroup.add(body);
      
      // Cabeza
      const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
      const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBCA }); // Piel
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.set(0, 1.75, 20);
      head.castShadow = true;
      priestGroup.add(head);
      
      // Brazos
      const armGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1, 6);
      const armMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
      
      const leftArm = new THREE.Mesh(armGeometry, armMaterial);
      leftArm.position.set(-0.6, 1.2, 20);
      leftArm.rotation.z = Math.PI / 6;
      leftArm.castShadow = true;
      priestGroup.add(leftArm);
      
      const rightArm = new THREE.Mesh(armGeometry, armMaterial);
      rightArm.position.set(0.6, 1.2, 20);
      rightArm.rotation.z = -Math.PI / 6;
      rightArm.castShadow = true;
      priestGroup.add(rightArm);
      
      churchGroup.add(priestGroup);
    };
    
    // Crear todos los elementos de la iglesia
    createWalls();
    createAltar();
    createBenches();
    createPriest();
    
    scene.add(churchGroup);
    churchGroup.visible = false;

    // Crear marcadores para puntos de verificación
    const createMarker = (x: number, y: number, z: number, color: number, label: string) => {
      const markerGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      const markerMaterial = new THREE.MeshBasicMaterial({ color });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(x, z + 0.5, y);
      scene.add(marker);
      
      // Agregar línea vertical de referencia
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0, y),
        new THREE.Vector3(x, z, y)
      ]);
      const lineMaterial = new THREE.LineBasicMaterial({ color, opacity: 0.7, transparent: true });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
    };

    // Agregar marcadores de verificación
    createMarker(0, 0, 8, 0x00ff00, 'Centro'); // Verde
    createMarker(8, 0, 3, 0x0000ff, 'Borde ancho'); // Azul
    createMarker(-8, 0, 3, 0x0000ff, 'Borde ancho'); // Azul
    createMarker(0, 25, 12, 0xff00ff, 'Borde largo'); // Magenta
    createMarker(0, -25, 12, 0xff00ff, 'Borde largo'); // Magenta
    createMarker(8, 25, 7, 0xff8800, 'Esquina'); // Naranja
    createMarker(-8, 25, 7, 0xff8800, 'Esquina'); // Naranja
    createMarker(8, -25, 7, 0xff8800, 'Esquina'); // Naranja
    createMarker(-8, -25, 7, 0xff8800, 'Esquina'); // Naranja

    // Crear el suelo con las dimensiones exactas
    const groundGeometry = new THREE.PlaneGeometry(20, 55);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);

    // Agregar líneas de cuadrícula para referencia
    const gridHelper = new THREE.GridHelper(60, 24, 0x888888, 0xcccccc);
    gridHelper.position.y = -0.05;
    scene.add(gridHelper);

    // Posición inicial de la cámara optimizada
    camera.position.set(35, 25, 35);
    camera.lookAt(0, 6, 0);

    // Función para manejar el resize
    const handleResize = () => {
      const container = canvasRef.current?.parentElement;
      if (!container) return;
      
      const isDesktop = window.innerWidth >= 768;
      const containerWidth = isDesktop ? window.innerWidth * 0.95 : container.offsetWidth;
      const containerHeight = isDesktop ? window.innerHeight * 0.6 : Math.min(600, containerWidth * 0.75);
      
      camera.aspect = containerWidth / containerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerWidth, containerHeight);
    };

    // Agregar listener para resize
    window.addEventListener('resize', handleResize);

    // Guardar referencias
    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;
    roofMeshRef.current = roofMesh;
    supportGroupRef.current = supportGroup;
    churchGroupRef.current = churchGroup;

    // Render inicial
    renderer.render(scene, camera);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  return {
    scene: sceneRef.current,
    renderer: rendererRef.current,
    camera: cameraRef.current,
    roofMesh: roofMeshRef.current,
    supportGroup: supportGroupRef.current,
    churchGroup: churchGroupRef.current
  };
};