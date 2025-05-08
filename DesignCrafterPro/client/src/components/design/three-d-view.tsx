import { useEffect, useRef, useState, useCallback } from 'react';
import { RoomDimensions, FurnitureItem } from '@/types/design';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Button } from '@/components/ui/button';
import { RefreshCw, Sun, Moon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface ThreeDViewProps {
  roomDimensions: RoomDimensions;
  furnitureItems: FurnitureItem[];
  selectedItemId: string | undefined;
  onSelectFurniture: (itemId: string | null) => void;
  onUpdateFurniture: (item: FurnitureItem) => void;
}

export default function ThreeDView({
  roomDimensions,
  furnitureItems,
  selectedItemId,
  onSelectFurniture,
  onUpdateFurniture
}: ThreeDViewProps) {
  const [nightMode, setNightMode] = useState(false);
  const [highQuality, setHighQuality] = useState(true);
  
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  // Update furniture objects ref to accept both Mesh and Group
  const furnitureObjectsRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const lightsRef = useRef<{
    ambient: THREE.AmbientLight | null,
    directional: THREE.DirectionalLight | null,
    pointLights: THREE.PointLight[]
  }>({ ambient: null, directional: null, pointLights: [] });
  
  // State for dragging furniture
  const [isDragging, setIsDragging] = useState(false);
  const [isDragStarted, setIsDragStarted] = useState(false);
  const [draggedFurnitureId, setDraggedFurnitureId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{x: number, z: number}>({x: 0, z: 0});
  
  // References for mouse interaction
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const dragPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  
  // Texture loaders
  const textureLoader = useRef(new THREE.TextureLoader());
  
  // Utility functions for converting between 2D and 3D coordinates
  const convertTo3DCoordinates = useCallback((x: number, y: number) => {
    // Convert from 0-100% (2D coordinates) to 3D world coordinates
    const xPos = (x / 100) * roomDimensions.length - (roomDimensions.length / 2);
    const zPos = (y / 100) * roomDimensions.width - (roomDimensions.width / 2);
    return { x: xPos, z: zPos };
  }, [roomDimensions.length, roomDimensions.width]);
  
  const convertTo2DCoordinates = useCallback((x: number, z: number) => {
    // Convert from 3D world coordinates to 0-100% (2D coordinates)
    const xPercent = ((x + (roomDimensions.length / 2)) / roomDimensions.length) * 100;
    const yPercent = ((z + (roomDimensions.width / 2)) / roomDimensions.width) * 100;
    return { x: Math.max(0, Math.min(100, xPercent)), y: Math.max(0, Math.min(100, yPercent)) };
  }, [roomDimensions.length, roomDimensions.width]);

  // Initialize and set up the scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Create the scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Create the camera
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 10);
    cameraRef.current = camera;

    // Create the renderer with advanced features
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      precision: "highp",
      powerPreference: "high-performance"
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    
    // Enable high-quality rendering
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setClearColor(0xf0f0f0);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minDistance = 3;
    controls.maxDistance = 50;
    controlsRef.current = controls;

    // Set up lighting
    // Ambient light (base illumination)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    lightsRef.current.ambient = ambientLight;

    // Main directional light (sun/ceiling light)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    
    // Improve shadow quality
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.bias = -0.0001;
    
    scene.add(directionalLight);
    lightsRef.current.directional = directionalLight;
    
    // Add point lights for more realistic interior lighting
    const createPointLight = (x: number, y: number, z: number, color: number = 0xffffff, intensity: number = 0.5) => {
      const light = new THREE.PointLight(color, intensity);
      light.position.set(x, y, z);
      light.castShadow = true;
      light.shadow.mapSize.width = 512;
      light.shadow.mapSize.height = 512;
      scene.add(light);
      return light;
    };
    
    // Add corner lights for more balanced illumination
    const cornerLight1 = createPointLight(5, roomDimensions.height - 1, 5, 0xffedd8, 0.7);
    const cornerLight2 = createPointLight(-5, roomDimensions.height - 1, 5, 0xffedd8, 0.7);
    const cornerLight3 = createPointLight(5, roomDimensions.height - 1, -5, 0xffedd8, 0.7);
    const cornerLight4 = createPointLight(-5, roomDimensions.height - 1, -5, 0xffedd8, 0.7);
    
    lightsRef.current.pointLights = [cornerLight1, cornerLight2, cornerLight3, cornerLight4];

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      renderer.render(scene, camera);
    };
    
    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      
      cameraRef.current.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      
      rendererRef.current?.dispose();
    };
  }, []);

  // Create textures
  const createTextures = useCallback(() => {
    // Load textures once and reuse
    const woodTexture = textureLoader.current.load('https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/wood_floor_deck/wood_floor_deck_diff_1k.jpg');
    woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
    woodTexture.repeat.set(4, 4);
    
    const woodNormalMap = textureLoader.current.load('https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/wood_floor_deck/wood_floor_deck_nor_gl_1k.jpg');
    woodNormalMap.wrapS = woodNormalMap.wrapT = THREE.RepeatWrapping;
    woodNormalMap.repeat.set(4, 4);
    
    const wallTexture = textureLoader.current.load('https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/plaster_wall/plaster_wall_diff_1k.jpg');
    wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(2, 2);
    
    const wallNormalMap = textureLoader.current.load('https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/plaster_wall/plaster_wall_nor_gl_1k.jpg');
    wallNormalMap.wrapS = wallNormalMap.wrapT = THREE.RepeatWrapping; 
    wallNormalMap.repeat.set(2, 2);
    
    return { woodTexture, woodNormalMap, wallTexture, wallNormalMap };
  }, []);

  // Update lighting based on night mode
  useEffect(() => {
    if (!sceneRef.current) return;
    
    if (lightsRef.current.ambient) {
      lightsRef.current.ambient.intensity = nightMode ? 0.15 : 0.4;
    }
    
    if (lightsRef.current.directional) {
      lightsRef.current.directional.intensity = nightMode ? 0.2 : 0.8;
      lightsRef.current.directional.color.set(nightMode ? 0x90a0ff : 0xffffff);
    }
    
    // Adjust point lights
    lightsRef.current.pointLights.forEach(light => {
      light.intensity = nightMode ? 1.2 : 0.5;
      light.color.set(nightMode ? 0xffb74d : 0xffedd8);
    });
    
    // Change scene background color
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(nightMode ? 0x0a1929 : 0xf0f0f0);
    }
    
  }, [nightMode]);

  // Update room dimensions with textures
  useEffect(() => {
    if (!sceneRef.current) return;

    // Clear existing room
    const existingRoom = sceneRef.current.getObjectByName('room');
    if (existingRoom) {
      sceneRef.current.remove(existingRoom);
    }

    const roomGroup = new THREE.Group();
    roomGroup.name = 'room';
    
    // Load textures
    const { woodTexture, woodNormalMap, wallTexture, wallNormalMap } = createTextures();

    // Floor with wood texture
    const floorGeometry = new THREE.PlaneGeometry(
      roomDimensions.length,
      roomDimensions.width,
      32,
      32
    );
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: woodTexture,
      normalMap: woodNormalMap,
      normalScale: new THREE.Vector2(0.5, 0.5),
      roughness: 0.7,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    roomGroup.add(floor);

    // Apply wall texture but tint it with wall color
    const wallColor = new THREE.Color(roomDimensions.wallColor);
    const wallMaterial = new THREE.MeshStandardMaterial({
      map: wallTexture,
      normalMap: wallNormalMap,
      normalScale: new THREE.Vector2(0.5, 0.5),
      color: wallColor,
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.0
    });

    // Back Wall
    const backWallGeometry = new THREE.PlaneGeometry(
      roomDimensions.length,
      roomDimensions.height,
      32,
      32
    );
    const backWall = new THREE.Mesh(backWallGeometry, wallMaterial.clone());
    backWall.position.set(0, roomDimensions.height / 2, -roomDimensions.width / 2);
    backWall.receiveShadow = true;
    roomGroup.add(backWall);

    // Left Wall
    const leftWallGeometry = new THREE.PlaneGeometry(
      roomDimensions.width,
      roomDimensions.height,
      32,
      32
    );
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial.clone());
    leftWall.position.set(-roomDimensions.length / 2, roomDimensions.height / 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    roomGroup.add(leftWall);

    // Right Wall
    const rightWallGeometry = new THREE.PlaneGeometry(
      roomDimensions.width,
      roomDimensions.height,
      32,
      32
    );
    const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial.clone());
    rightWall.position.set(roomDimensions.length / 2, roomDimensions.height / 2, 0);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    roomGroup.add(rightWall);
    
    // Add ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(
      roomDimensions.length,
      roomDimensions.width,
      32,
      32
    );
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8f9fa,
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.DoubleSide
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, roomDimensions.height, 0);
    ceiling.receiveShadow = true;
    roomGroup.add(ceiling);

    // Center the room
    roomGroup.position.set(0, 0, 0);
    sceneRef.current.add(roomGroup);

    // Adjust camera position
    if (cameraRef.current) {
      const maxDimension = Math.max(roomDimensions.length, roomDimensions.width);
      cameraRef.current.position.set(maxDimension, maxDimension / 2, maxDimension);
      cameraRef.current.lookAt(0, 0, 0);
    }

  }, [roomDimensions]);


  
  // Create furniture textures
  const createFurnitureTextures = useCallback(() => {
    // Load furniture textures
    const fabricTexture = textureLoader.current.load('https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/fabric_pattern/fabric_pattern_diff_1k.jpg');
    fabricTexture.wrapS = fabricTexture.wrapT = THREE.RepeatWrapping;
    
    const leatherTexture = textureLoader.current.load('https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/leather_red/leather_red_diff_1k.jpg');
    leatherTexture.wrapS = leatherTexture.wrapT = THREE.RepeatWrapping;
    
    const woodTexture = textureLoader.current.load('https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/wood_table_top/wood_table_top_diff_1k.jpg');
    woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
    woodTexture.repeat.set(1, 1);
    
    const metalTexture = textureLoader.current.load('https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/metal_plate/metal_plate_diff_1k.jpg');
    metalTexture.wrapS = metalTexture.wrapT = THREE.RepeatWrapping;
    
    return { fabricTexture, leatherTexture, woodTexture, metalTexture };
  }, []);

  // Create a realistic sofa model
  const createSofaModel = useCallback((width: number, height: number, depth: number, color: string) => {
    const group = new THREE.Group();
    const { fabricTexture } = createFurnitureTextures();
    
    // Base / frame
    const baseGeometry = new THREE.BoxGeometry(width, height / 4, depth);
    const baseMaterial = new THREE.MeshStandardMaterial({ 
      color: new THREE.Color(color).multiplyScalar(0.8), 
      roughness: 0.7,
      metalness: 0.1
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = height / 8;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);
    
    // Cushions with texture
    const cushionMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.8,
      metalness: 0.0,
      map: fabricTexture
    });
    
    // Multiple seat cushions
    const numCushions = 3;
    const cushionWidth = width / (numCushions + 0.5);
    
    for (let i = 0; i < numCushions; i++) {
      // Create a rounded seat cushion using BufferGeometry
      const seatGeometry = new THREE.BoxGeometry(cushionWidth, height / 10, depth / 1.5, 6, 6, 6);
      // Round the geometry vertices slightly
      const seatPositions = seatGeometry.attributes.position;
      
      for (let j = 0; j < seatPositions.count; j++) {
        const x = seatPositions.getX(j);
        const y = seatPositions.getY(j);
        const z = seatPositions.getZ(j);
        
        // Apply a slight rounding to the top surface
        if (y > 0) {
          const distFromCenter = Math.sqrt(x * x + z * z) / (cushionWidth / 2);
          seatPositions.setY(j, y - Math.sin(distFromCenter * Math.PI / 4) * height / 50);
        }
      }
      
      const cushion = new THREE.Mesh(seatGeometry, cushionMaterial.clone());
      cushion.position.set((i - numCushions / 2 + 0.5) * cushionWidth, height / 3.2, depth / 6);
      cushion.castShadow = true;
      cushion.receiveShadow = true;
      group.add(cushion);
    }
    
    // Create a curved backrest
    const backWidth = width;
    const backHeight = height / 1.5;
    const backDepth = depth / 4;
    
    // Main backrest using a cylinder segment
    const backGeometry = new THREE.CylinderGeometry(
      backWidth / 2, // radius top
      backWidth / 2, // radius bottom
      backHeight, // height
      16, // radial segments
      4, // height segments
      true, // open ended
      Math.PI / 8, // theta start
      Math.PI - Math.PI / 4 // theta length
    );
    
    const backMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.7,
      metalness: 0.0,
      map: fabricTexture,
      side: THREE.DoubleSide
    });
    
    const backrest = new THREE.Mesh(backGeometry, backMaterial);
    backrest.rotation.x = Math.PI / 2;
    backrest.rotation.z = Math.PI / 2;
    backrest.position.set(0, height / 2, -depth / 2 + backDepth / 2);
    backrest.castShadow = true;
    backrest.receiveShadow = true;
    group.add(backrest);
    
    // Create sofa arms with rounded tops
    const createSofaArm = (side: 'left' | 'right') => {
      const armGroup = new THREE.Group();
      
      // Main arm block
      const armWidth = width / 8;
      const armHeight = height / 2;
      const armDepth = depth;
      
      const armGeometry = new THREE.BoxGeometry(armWidth, armHeight, armDepth);
      const armMaterial = cushionMaterial.clone();
      
      const arm = new THREE.Mesh(armGeometry, armMaterial);
      arm.position.y = armHeight / 2;
      arm.castShadow = true;
      arm.receiveShadow = true;
      armGroup.add(arm);
      
      // Rounded top for the arm
      const roundTopRadius = armWidth / 2;
      const roundTopGeometry = new THREE.CylinderGeometry(
        roundTopRadius,
        roundTopRadius,
        armDepth - armWidth / 3,
        16,
        2
      );
      
      const roundTop = new THREE.Mesh(roundTopGeometry, armMaterial);
      roundTop.rotation.x = Math.PI / 2;
      roundTop.position.set(0, armHeight - 2, 0);
      roundTop.castShadow = true;
      roundTop.receiveShadow = true;
      armGroup.add(roundTop);
      
      // Position the entire arm group
      const sideMultiplier = side === 'left' ? -1 : 1;
      armGroup.position.x = sideMultiplier * (width / 2 - armWidth / 2);
      
      return armGroup;
    };
    
    // Add both arms
    group.add(createSofaArm('left'));
    group.add(createSofaArm('right'));
    
    // Add decorative wooden feet
    const feetMaterial = new THREE.MeshStandardMaterial({
      color: 0x5D4037, // Dark brown
      roughness: 0.5,
      metalness: 0.2
    });
    
    const feetPositions = [
      [-width / 2 + width / 10, 0, -depth / 2 + depth / 10],
      [width / 2 - width / 10, 0, -depth / 2 + depth / 10],
      [-width / 2 + width / 10, 0, depth / 2 - depth / 10],
      [width / 2 - width / 10, 0, depth / 2 - depth / 10]
    ];
    
    feetPositions.forEach(pos => {
      const footGeometry = new THREE.CylinderGeometry(width / 40, width / 50, height / 10, 8);
      const foot = new THREE.Mesh(footGeometry, feetMaterial);
      foot.position.set(pos[0], pos[1], pos[2]);
      foot.castShadow = true;
      foot.receiveShadow = true;
      group.add(foot);
    });
    
    // Scale the whole group to fit within the expected dimensions
    group.scale.set(0.5, 0.5, 0.5);
    
    return group;
  }, [createFurnitureTextures]);
  
  // Create a realistic chair model
  const createChairModel = useCallback((width: number, height: number, depth: number, color: string) => {
    const group = new THREE.Group();
    const { fabricTexture, woodTexture } = createFurnitureTextures();
    
    // Wood material for frame
    const woodMaterial = new THREE.MeshStandardMaterial({
      color: 0x5D4037, // Dark brown
      roughness: 0.6,
      metalness: 0.1,
      map: woodTexture
    });
    
    // Upholstery material
    const fabricMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.8,
      metalness: 0.0,
      map: fabricTexture
    });
    
    // Create a wooden frame
    // Back frame
    const backFrameGeo = new THREE.BoxGeometry(width / 1.2, height / 1.5, width / 20);
    const backFrame = new THREE.Mesh(backFrameGeo, woodMaterial);
    backFrame.position.set(0, height / 2.5, -depth / 2 + depth / 20);
    backFrame.castShadow = true;
    backFrame.receiveShadow = true;
    group.add(backFrame);
    
    // Create curved back support slats
    const numSlats = 5;
    const slatWidth = width / 1.3 / numSlats;
    const slatHeight = height / 1.8;
    
    for (let i = 0; i < numSlats; i++) {
      // Shape the slat with a slight curve
      const points = [];
      const numPoints = 20;
      
      for (let j = 0; j < numPoints; j++) {
        const y = j / (numPoints - 1) * slatHeight;
        // Create a slight curve - the slat bends backward at the top
        const z = Math.pow(y / slatHeight, 2) * (depth / 5);
        points.push(new THREE.Vector3(0, y, -z));
      }
      
      const slatCurve = new THREE.CatmullRomCurve3(points);
      const slatGeometry = new THREE.TubeGeometry(slatCurve, 20, slatWidth / 4, 8, false);
      const slat = new THREE.Mesh(slatGeometry, woodMaterial);
      
      // Position the slat horizontally across the chair back
      slat.position.set(
        -width / 2.6 + i * (width / (numSlats - 0.5)),
        height / 6,
        -depth / 2 + depth / 40
      );
      slat.castShadow = true;
      slat.receiveShadow = true;
      group.add(slat);
    }
    
    // Chair seat - slightly curved for comfort
    const seatGroup = new THREE.Group();
    
    // Create a curved seat surface
    const seatGeometry = new THREE.BoxGeometry(width, height / 15, depth * 0.8, 10, 1, 10);
    // Add a subtle curve to the top of the seat
    const seatPositions = seatGeometry.attributes.position;
    
    for (let i = 0; i < seatPositions.count; i++) {
      const x = seatPositions.getX(i);
      const y = seatPositions.getY(i);
      const z = seatPositions.getZ(i);
      
      // Only curve the top surface
      if (y > 0) {
        // Distance from center
        const distX = x / (width / 2);
        const distZ = z / (depth * 0.4);
        const dist = Math.sqrt(distX * distX + distZ * distZ);
        
        // Apply a slight dip in the middle
        seatPositions.setY(i, y - Math.sin(dist * Math.PI / 3) * height / 60);
      }
    }
    
    const seat = new THREE.Mesh(seatGeometry, fabricMaterial);
    seat.position.set(0, height / 3, 0);
    seat.castShadow = true;
    seat.receiveShadow = true;
    seatGroup.add(seat);
    
    // Optional: Add some cushion details like buttons or stitching
    // Buttons 
    const buttonRadius = width / 40;
    const buttonGeometry = new THREE.CircleGeometry(buttonRadius, 16);
    const buttonMaterial = new THREE.MeshStandardMaterial({ 
      color: new THREE.Color(color).multiplyScalar(0.8),
      roughness: 0.7 
    });
    
    // Add a few decorative buttons to the seat
    const buttonPositions = [
      [-width / 4, 0, -depth / 4],
      [width / 4, 0, -depth / 4],
      [-width / 4, 0, depth / 4],
      [width / 4, 0, depth / 4]
    ];
    
    buttonPositions.forEach(pos => {
      const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
      button.position.set(pos[0], height / 3 + height / 200, pos[2]);
      button.rotation.x = -Math.PI / 2; // Lay flat
      button.castShadow = false;
      button.receiveShadow = true;
      seatGroup.add(button);
    });
    
    group.add(seatGroup);
    
    // Legs - make them more elegant
    const legMaterial = woodMaterial.clone();
    legMaterial.color.set(0x4E342E); // Slightly darker brown
    
    const createLeg = (x: number, z: number) => {
      const legGroup = new THREE.Group();
      
      // Main leg cylinder
      const mainLegGeo = new THREE.CylinderGeometry(width / 30, width / 35, height / 2.5, 8);
      const mainLeg = new THREE.Mesh(mainLegGeo, legMaterial);
      mainLeg.position.y = -height / 5;
      mainLeg.castShadow = true;
      mainLeg.receiveShadow = true;
      legGroup.add(mainLeg);
      
      // Decorative ring near the bottom of the leg
      const ringGeo = new THREE.TorusGeometry(width / 25, width / 100, 8, 16);
      const ring = new THREE.Mesh(ringGeo, legMaterial);
      ring.position.y = -height / 3;
      ring.rotation.x = Math.PI / 2;
      ring.castShadow = true;
      ring.receiveShadow = true;
      legGroup.add(ring);
      
      // Position the leg group
      legGroup.position.set(x, height / 3, z);
      
      return legGroup;
    };
    
    // Add four legs
    const legSpacing = width / 2.4;
    group.add(createLeg(-legSpacing, -legSpacing));
    group.add(createLeg(legSpacing, -legSpacing));
    group.add(createLeg(-legSpacing, legSpacing));
    group.add(createLeg(legSpacing, legSpacing));
    
    // Scale the chair to fit the expected dimensions
    group.scale.set(0.5, 0.5, 0.5);
    
    return group;
  }, [createFurnitureTextures]);
  
  // Create a realistic table model
  const createTableModel = useCallback((width: number, height: number, depth: number, color: string) => {
    const group = new THREE.Group();
    const { woodTexture } = createFurnitureTextures();
    
    // Table dimensions - make these more substantial
    const tableWidth = width;
    const tableDepth = depth;
    const tableThickness = height / 15;
    const tableHeight = height / 2;
    
    // Table top with beveled edges
    // Create a slightly more complex shape for the table top with a beveled edge
    const topShape = new THREE.Shape();
    topShape.moveTo(-tableWidth / 2, -tableDepth / 2);
    topShape.lineTo(tableWidth / 2, -tableDepth / 2);
    topShape.lineTo(tableWidth / 2, tableDepth / 2);
    topShape.lineTo(-tableWidth / 2, tableDepth / 2);
    topShape.lineTo(-tableWidth / 2, -tableDepth / 2);
    
    // Create a hole for a beveled inner edge
    const bevelSize = tableWidth / 40; // Size of the bevel
    const holeShape = new THREE.Shape();
    holeShape.moveTo(-tableWidth / 2 + bevelSize, -tableDepth / 2 + bevelSize);
    holeShape.lineTo(tableWidth / 2 - bevelSize, -tableDepth / 2 + bevelSize);
    holeShape.lineTo(tableWidth / 2 - bevelSize, tableDepth / 2 - bevelSize);
    holeShape.lineTo(-tableWidth / 2 + bevelSize, tableDepth / 2 - bevelSize);
    holeShape.lineTo(-tableWidth / 2 + bevelSize, -tableDepth / 2 + bevelSize);
    
    topShape.holes.push(holeShape);
    
    // Extrude the shape to create the table top
    const extrudeSettings = {
      steps: 1,
      depth: tableThickness,
      bevelEnabled: true,
      bevelThickness: tableThickness / 3,
      bevelSize: bevelSize,
      bevelOffset: 0,
      bevelSegments: 3
    };
    
    const topGeometry = new THREE.ExtrudeGeometry(topShape, extrudeSettings);
    
    // Material with wood texture
    const topMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      map: woodTexture,
      roughness: 0.4,
      metalness: 0.1,
      bumpMap: woodTexture,
      bumpScale: 0.02
    });
    
    const tableTop = new THREE.Mesh(topGeometry, topMaterial);
    tableTop.rotation.x = Math.PI / 2; // Rotate to lay flat
    tableTop.position.y = tableHeight - tableThickness / 2;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    group.add(tableTop);
    
    // Create table base and legs - different for different table types
    if (depth > width * 1.5) {
      // This is a long table (dining table) - use a central pedestal with fancy feet
      
      // Central pedestal
      const pedestalHeight = tableHeight * 0.8;
      const pedestalRadius = tableWidth / 8;
      
      const pedestalGeometry = new THREE.CylinderGeometry(
        pedestalRadius, // top radius
        pedestalRadius * 1.2, // bottom radius (slightly wider)
        pedestalHeight, // height
        12, // radial segments
        3, // height segments
        false // open ended
      );
      
      const pedestalMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color).multiplyScalar(0.85),
        roughness: 0.6,
        metalness: 0.2,
        map: woodTexture
      });
      
      const pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
      pedestal.position.y = tableHeight / 2 - pedestalHeight / 2;
      pedestal.castShadow = true;
      pedestal.receiveShadow = true;
      group.add(pedestal);
      
      // Base for stability
      const baseHeight = tableHeight * 0.05;
      const baseWidth = tableWidth * 0.6;
      const baseDepth = tableDepth * 0.4;
      
      const baseGeometry = new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth);
      const baseMaterial = pedestalMaterial.clone();
      
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.y = baseHeight / 2;
      base.castShadow = true;
      base.receiveShadow = true;
      group.add(base);
      
      // Decorative feet
      const footRadius = pedestalRadius / 2;
      const footPositions = [
        [-baseWidth / 2 + footRadius, 0, -baseDepth / 2 + footRadius],
        [baseWidth / 2 - footRadius, 0, -baseDepth / 2 + footRadius],
        [-baseWidth / 2 + footRadius, 0, baseDepth / 2 - footRadius],
        [baseWidth / 2 - footRadius, 0, baseDepth / 2 - footRadius]
      ];
      
      footPositions.forEach(pos => {
        const footGeometry = new THREE.SphereGeometry(footRadius, 12, 12);
        const foot = new THREE.Mesh(footGeometry, baseMaterial);
        foot.position.set(pos[0], footRadius / 2, pos[2]);
        foot.castShadow = true;
        foot.receiveShadow = true;
        group.add(foot);
      });
      
    } else {
      // This is a regular table (coffee table, desk) - use four legs with a support frame
      
      // Support frame/apron just below the table top
      const frameWidth = tableWidth * 0.9;
      const frameDepth = tableDepth * 0.9;
      const frameHeight = tableHeight * 0.08;
      const frameThickness = tableWidth / 30;
      
      // Create four sides of the apron
      const frameMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color).multiplyScalar(0.8),
        roughness: 0.6,
        metalness: 0.1,
        map: woodTexture
      });
      
      // Front apron
      const frontGeometry = new THREE.BoxGeometry(frameWidth - frameThickness * 2, frameHeight, frameThickness);
      const frontApron = new THREE.Mesh(frontGeometry, frameMaterial);
      frontApron.position.set(0, tableHeight - tableThickness - frameHeight / 2, -frameDepth / 2 + frameThickness / 2);
      frontApron.castShadow = true;
      frontApron.receiveShadow = true;
      group.add(frontApron);
      
      // Back apron
      const backApron = frontApron.clone();
      backApron.position.z = frameDepth / 2 - frameThickness / 2;
      group.add(backApron);
      
      // Left apron
      const sideGeometry = new THREE.BoxGeometry(frameThickness, frameHeight, frameDepth);
      const leftApron = new THREE.Mesh(sideGeometry, frameMaterial);
      leftApron.position.set(-frameWidth / 2 + frameThickness / 2, tableHeight - tableThickness - frameHeight / 2, 0);
      leftApron.castShadow = true;
      leftApron.receiveShadow = true;
      group.add(leftApron);
      
      // Right apron
      const rightApron = leftApron.clone();
      rightApron.position.x = frameWidth / 2 - frameThickness / 2;
      group.add(rightApron);
      
      // Create legs
      const legHeight = tableHeight - tableThickness - frameHeight;
      const legWidth = frameThickness * 1.2;
      
      const legPositions = [
        [-frameWidth / 2 + legWidth / 2, 0, -frameDepth / 2 + legWidth / 2],
        [frameWidth / 2 - legWidth / 2, 0, -frameDepth / 2 + legWidth / 2],
        [-frameWidth / 2 + legWidth / 2, 0, frameDepth / 2 - legWidth / 2],
        [frameWidth / 2 - legWidth / 2, 0, frameDepth / 2 - legWidth / 2]
      ];
      
      legPositions.forEach(pos => {
        // Create a tapered leg that's thicker at the top
        const legGeometry = new THREE.BoxGeometry(legWidth, legHeight, legWidth);
        // Apply tapering by adjusting vertices
        const legPositions = legGeometry.attributes.position;
        const tapering = 0.7; // How much to taper (0.7 = 70% of original width at bottom)
        
        for (let i = 0; i < legPositions.count; i++) {
          const y = legPositions.getY(i);
          
          // Only adjust the bottom vertices
          if (y < -legHeight / 4) {
            const factor = 1 - (1 - tapering) * (-y) / (legHeight / 2);
            const x = legPositions.getX(i);
            const z = legPositions.getZ(i);
            
            legPositions.setX(i, x * factor);
            legPositions.setZ(i, z * factor);
          }
        }
        
        const legMaterial = frameMaterial.clone();
        legMaterial.color.multiplyScalar(0.95); // Slightly different shade
        
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(pos[0], legHeight / 2, pos[2]);
        leg.castShadow = true;
        leg.receiveShadow = true;
        group.add(leg);
      });
    }
    
    // Scale the whole group to fit within expected dimensions
    group.scale.set(0.5, 0.5, 0.5);
    
    return group;
  }, [createFurnitureTextures]);
  
  // Create a realistic bookshelf model
  const createBookshelfModel = useCallback((width: number, height: number, depth: number, color: string) => {
    const group = new THREE.Group();
    const { woodTexture } = createFurnitureTextures();
    
    // Bookshelf dimensions
    const shelfWidth = width;
    const shelfHeight = height;
    const shelfDepth = depth;
    
    // Material for the bookshelf frame
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.6,
      metalness: 0.1,
      map: woodTexture
    });
    
    // Create the main bookshelf structure
    // Back panel
    const backPanelGeometry = new THREE.BoxGeometry(shelfWidth, shelfHeight, shelfDepth / 20);
    const backPanel = new THREE.Mesh(backPanelGeometry, frameMaterial);
    backPanel.position.z = -shelfDepth / 2 + shelfDepth / 40;
    backPanel.castShadow = true;
    backPanel.receiveShadow = true;
    group.add(backPanel);
    
    // Side panels
    const sidePanelGeometry = new THREE.BoxGeometry(shelfWidth / 20, shelfHeight, shelfDepth);
    
    // Left side panel
    const leftPanel = new THREE.Mesh(sidePanelGeometry, frameMaterial);
    leftPanel.position.set(-shelfWidth / 2 + shelfWidth / 40, 0, 0);
    leftPanel.castShadow = true;
    leftPanel.receiveShadow = true;
    group.add(leftPanel);
    
    // Right side panel
    const rightPanel = new THREE.Mesh(sidePanelGeometry, frameMaterial);
    rightPanel.position.set(shelfWidth / 2 - shelfWidth / 40, 0, 0);
    rightPanel.castShadow = true;
    rightPanel.receiveShadow = true;
    group.add(rightPanel);
    
    // Top and bottom panels
    const topBottomPanelGeometry = new THREE.BoxGeometry(shelfWidth, shelfHeight / 20, shelfDepth);
    
    // Top panel
    const topPanel = new THREE.Mesh(topBottomPanelGeometry, frameMaterial);
    topPanel.position.set(0, shelfHeight / 2 - shelfHeight / 40, 0);
    topPanel.castShadow = true;
    topPanel.receiveShadow = true;
    group.add(topPanel);
    
    // Bottom panel
    const bottomPanel = new THREE.Mesh(topBottomPanelGeometry, frameMaterial);
    bottomPanel.position.set(0, -shelfHeight / 2 + shelfHeight / 40, 0);
    bottomPanel.castShadow = true;
    bottomPanel.receiveShadow = true;
    group.add(bottomPanel);
    
    // Create shelves
    const numShelves = 4; // Number of shelves (excluding top and bottom)
    const shelfThickness = shelfHeight / 40;
    const shelfSpacing = (shelfHeight - 2 * (shelfHeight / 20) - numShelves * shelfThickness) / (numShelves + 1);
    
    const internalShelfGeometry = new THREE.BoxGeometry(shelfWidth - shelfWidth / 10, shelfThickness, shelfDepth - shelfDepth / 20);
    
    for (let i = 0; i < numShelves; i++) {
      const yPos = -shelfHeight / 2 + shelfHeight / 20 + shelfSpacing * (i + 1) + shelfThickness * i + shelfThickness / 2;
      
      const shelf = new THREE.Mesh(internalShelfGeometry, frameMaterial.clone());
      shelf.position.set(0, yPos, 0);
      shelf.castShadow = true;
      shelf.receiveShadow = true;
      group.add(shelf);
    }
    
    // Add decorative molding at the top
    const moldingDepth = shelfDepth / 10;
    const moldingHeight = shelfHeight / 30;
    
    const moldingGeometry = new THREE.BoxGeometry(shelfWidth + moldingDepth, moldingHeight, shelfDepth + moldingDepth);
    const moldingMaterial = frameMaterial.clone();
    moldingMaterial.color.multiplyScalar(0.9); // Slightly darker
    
    const molding = new THREE.Mesh(moldingGeometry, moldingMaterial);
    molding.position.y = shelfHeight / 2 + moldingHeight / 2;
    molding.castShadow = true;
    molding.receiveShadow = true;
    group.add(molding);
    
    // Add books and decorative items
    const bookColors = [
      0x8b4513, // Saddle brown
      0xa52a2a, // Brown
      0x800000, // Maroon
      0x556b2f, // Dark olive green
      0x191970, // Midnight blue
      0x2f4f4f, // Dark slate gray
      0x483d8b  // Dark slate blue
    ];
    
    // Add books to each shelf
    for (let i = 0; i < numShelves; i++) {
      const shelfYPos = -shelfHeight / 2 + shelfHeight / 20 + shelfSpacing * (i + 1) + shelfThickness * i + shelfThickness;
      
      // Decide on a pattern for this shelf
      const shelfStyle = Math.floor(Math.random() * 3); // 0 = all books, 1 = books with gap, 2 = books with decorative item
      
      let availableWidth = shelfWidth - shelfWidth / 10 - shelfWidth / 40; // Width minus margins
      let currentX = -availableWidth / 2;
      
      // If we're adding a decorative item, reserve some space for it
      let decorativeItemWidth = 0;
      if (shelfStyle === 2) {
        decorativeItemWidth = availableWidth / 5;
        availableWidth -= decorativeItemWidth;
      }
      
      // Create variable width books
      while (currentX < availableWidth / 2 - shelfWidth / 40) {
        // Create a group of books
        const numBooksInGroup = 3 + Math.floor(Math.random() * 5); // 3-7 books in a group
        const groupWidth = availableWidth / 8 + (Math.random() * availableWidth / 10);
        
        // Create a slightly random height for this group of books
        const bookHeight = shelfSpacing * (0.7 + Math.random() * 0.25);
        
        // Book depth is less than shelf depth
        const bookDepth = shelfDepth * (0.65 + Math.random() * 0.25);
        
        // Create individual books in the group
        for (let j = 0; j < numBooksInGroup; j++) {
          const bookWidth = groupWidth / numBooksInGroup;
          
          const bookGeometry = new THREE.BoxGeometry(bookWidth * 0.9, bookHeight, bookDepth);
          const bookMaterial = new THREE.MeshStandardMaterial({
            color: bookColors[Math.floor(Math.random() * bookColors.length)],
            roughness: 0.8,
            metalness: 0.0
          });
          
          const book = new THREE.Mesh(bookGeometry, bookMaterial);
          
          // Position the book
          const bookX = currentX + (j + 0.5) * bookWidth;
          const bookY = shelfYPos + bookHeight / 2;
          const bookZ = -shelfDepth / 2 + bookDepth / 2 + shelfDepth / 40;
          
          book.position.set(bookX, bookY, bookZ);
          
          // Add a slight random rotation to make it look more natural
          const randomTilt = (Math.random() - 0.5) * 0.05;
          book.rotation.z = randomTilt;
          
          book.castShadow = true;
          book.receiveShadow = true;
          group.add(book);
        }
        
        currentX += groupWidth + shelfWidth / 80; // Small gap between groups
        
        // Add a larger gap if this is a shelf with a gap
        if (shelfStyle === 1 && currentX < 0) {
          currentX += availableWidth / 6; // Add a gap in the middle
        }
      }
      
      // Add a decorative item if this is the decorative shelf style
      if (shelfStyle === 2) {
        // Choose a decorative item (vase, picture frame, small statue, etc.)
        const itemType = Math.floor(Math.random() * 3); // 0 = vase, 1 = frame, 2 = statue
        
        if (itemType === 0) {
          // Create a vase
          const vaseHeight = shelfSpacing * 0.7;
          const vaseRadius = decorativeItemWidth / 4;
          
          // Create a shape for the vase profile
          const points = [];
          const resolution = 10;
          
          for (let j = 0; j <= resolution; j++) {
            const t = j / resolution;
            // Create a nice vase shape - wider in the middle
            const radius = vaseRadius * (0.5 + Math.sin(t * Math.PI) * 0.5);
            points.push(new THREE.Vector2(radius, vaseHeight * t));
          }
          
          const vaseGeometry = new THREE.LatheGeometry(points, 16);
          const vaseMaterial = new THREE.MeshStandardMaterial({
            color: 0x2196f3, // Blue
            roughness: 0.2,
            metalness: 0.8
          });
          
          const vase = new THREE.Mesh(vaseGeometry, vaseMaterial);
          vase.position.set(availableWidth / 4, shelfYPos + vaseHeight / 2, 0);
          vase.castShadow = true;
          vase.receiveShadow = true;
          group.add(vase);
        } else if (itemType === 1) {
          // Create a picture frame
          const frameWidth = decorativeItemWidth * 0.7;
          const frameHeight = shelfSpacing * 0.6;
          const frameDepth = shelfDepth / 10;
          
          const frameGeometry = new THREE.BoxGeometry(frameWidth, frameHeight, frameDepth);
          const frameMat = new THREE.MeshStandardMaterial({
            color: 0x8B4513, // Brown
            roughness: 0.6,
            metalness: 0.2
          });
          
          const frame = new THREE.Mesh(frameGeometry, frameMat);
          frame.position.set(availableWidth / 4, shelfYPos + frameHeight / 2, -shelfDepth / 4);
          frame.castShadow = true;
          frame.receiveShadow = true;
          group.add(frame);
          
          // Add the picture inside the frame
          const pictureGeometry = new THREE.PlaneGeometry(frameWidth * 0.8, frameHeight * 0.8);
          const pictureMaterial = new THREE.MeshStandardMaterial({
            color: Math.random() > 0.5 ? 0xEEEEEE : 0xCCCCCC, // Light gray or white
            roughness: 0.5,
            metalness: 0.0
          });
          
          const picture = new THREE.Mesh(pictureGeometry, pictureMaterial);
          picture.position.set(0, 0, frameDepth / 2 + 0.001); // Slightly in front of the frame
          picture.castShadow = false;
          picture.receiveShadow = true;
          frame.add(picture);
        } else {
          // Create a small statue/sculpture
          const statueHeight = shelfSpacing * 0.65;
          
          // Create a shape for the statue - abstract shape made of spheres
          const statueGroup = new THREE.Group();
          
          const baseSphere = new THREE.SphereGeometry(decorativeItemWidth / 6, 8, 8);
          const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x9E9E9E, // Gray
            roughness: 0.2,
            metalness: 0.9
          });
          
          const base = new THREE.Mesh(baseSphere, baseMaterial);
          statueGroup.add(base);
          
          // Add some smaller spheres on top
          for (let j = 0; j < 2; j++) {
            const smallerSphere = new THREE.SphereGeometry(decorativeItemWidth / 12, 8, 8);
            const smallerMat = baseMaterial.clone();
            smallerMat.color.setHex(0xE0E0E0); // Lighter gray
            
            const smallSphere = new THREE.Mesh(smallerSphere, smallerMat);
            smallSphere.position.set(
              (Math.random() - 0.5) * decorativeItemWidth / 8,
              decorativeItemWidth / 6 + decorativeItemWidth / 12,
              (Math.random() - 0.5) * decorativeItemWidth / 8
            );
            statueGroup.add(smallSphere);
          }
          
          statueGroup.position.set(availableWidth / 4, shelfYPos + statueHeight / 3, 0);
          statueGroup.castShadow = true;
          statueGroup.receiveShadow = true;
          group.add(statueGroup);
        }
      }
    }
    
    // Scale the whole group to fit within expected dimensions
    group.scale.set(0.5, 0.5, 0.5);
    
    return group;
  }, [createFurnitureTextures]);
  
  // Update furniture items with more detailed models
  useEffect(() => {
    if (!sceneRef.current) return;

    // Clear existing furniture objects in the ref
    const existingFurnitureIds = new Set(furnitureObjectsRef.current.keys());
    
    // Create or update furniture meshes
    furnitureItems.forEach(item => {
      existingFurnitureIds.delete(item.id);
      
      let mesh = furnitureObjectsRef.current.get(item.id);
      
      if (!mesh) {
        // Create new furniture mesh based on type
        let newMesh: THREE.Object3D;
        
        switch (item.type) {
          case 'sofa':
            newMesh = createSofaModel(item.width, item.height, item.depth, item.color);
            break;
          case 'chair':
          case 'dining_chair':
            newMesh = createChairModel(item.width, item.height, item.depth, item.color);
            break;
          case 'table':
          case 'coffee_table':
          case 'dining_table':
          case 'desk':
            newMesh = createTableModel(item.width, item.height, item.depth, item.color);
            break;
          case 'bookshelf':
          case 'cabinet':
            newMesh = createBookshelfModel(item.width, item.height, item.depth, item.color);
            break;
          default:
            // Fallback to simple geometry for unknown types
            const geometry = new THREE.BoxGeometry(item.width / 6, item.height / 12, item.depth / 6);
            const material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(item.color),
              roughness: 0.7,
              metalness: 0.1
            });
            newMesh = new THREE.Mesh(geometry, material);
            break;
        }
        
        // Set common properties for the new mesh
        newMesh.castShadow = true;
        newMesh.receiveShadow = true;
        newMesh.name = `furniture-${item.id}`;
        
        if (sceneRef.current) {
          sceneRef.current.add(newMesh);
          furnitureObjectsRef.current.set(item.id, newMesh);
          mesh = newMesh; // Assign to mesh so we can use it below
        }
      }
      
      // If we have a mesh to work with (either existing or newly created)
      if (mesh) {
        // Position and rotate the furniture
        // Convert from 2D coordinates (0-100%) to 3D world coordinates
        const x = (item.x / 100 * roomDimensions.length) - (roomDimensions.length / 2);
        const z = (item.y / 100 * roomDimensions.width) - (roomDimensions.width / 2);
        
        mesh.position.set(x, 0, z);
        mesh.rotation.y = THREE.MathUtils.degToRad(item.rotation);
        
        // Highlight selected item by making it slightly hover
        if (item.id === selectedItemId) {
          mesh.position.y = 0.05;
          // Add a highlight effect - this depends on the mesh structure
          if (mesh instanceof THREE.Group) {
            mesh.traverse((child: THREE.Object3D) => {
              if (child instanceof THREE.Mesh) {
                const material = child.material as THREE.MeshStandardMaterial;
                if (material.isMeshStandardMaterial) {
                  material.emissive = new THREE.Color(0x333333);
                }
              }
            });
          } else if (mesh instanceof THREE.Mesh) {
            const material = mesh.material as THREE.MeshStandardMaterial;
            if (material.isMeshStandardMaterial) {
              material.emissive = new THREE.Color(0x333333);
            }
          }
        } else {
          mesh.position.y = 0;
          // Reset highlight
          if (mesh instanceof THREE.Group) {
            mesh.traverse((child: THREE.Object3D) => {
              if (child instanceof THREE.Mesh) {
                const material = child.material as THREE.MeshStandardMaterial;
                if (material.isMeshStandardMaterial) {
                  material.emissive = new THREE.Color(0x000000);
                }
              }
            });
          } else if (mesh instanceof THREE.Mesh) {
            const material = mesh.material as THREE.MeshStandardMaterial;
            if (material.isMeshStandardMaterial) {
              material.emissive = new THREE.Color(0x000000);
            }
          }
        }
      }
    });
    
    // Remove furniture items that no longer exist
    existingFurnitureIds.forEach(id => {
      const mesh = furnitureObjectsRef.current.get(id);
      if (mesh && sceneRef.current) {
        sceneRef.current.remove(mesh);
        
        // Dispose geometry and materials for Three.Mesh objects
        if (mesh instanceof THREE.Mesh) {
          mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m => m.dispose());
          } else {
            mesh.material.dispose();
          }
        } else if (mesh instanceof THREE.Group) {
          // For groups, we need to traverse and dispose each child's resources
          mesh.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose();
              if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose());
              } else {
                child.material.dispose();
              }
            }
          });
        }
        furnitureObjectsRef.current.delete(id);
      }
    });
    
  }, [furnitureItems, selectedItemId, roomDimensions, createSofaModel, createChairModel, createTableModel, createBookshelfModel]);

  const handleResetView = () => {
    if (controlsRef.current && cameraRef.current) {
      const maxDimension = Math.max(roomDimensions.length, roomDimensions.width);
      cameraRef.current.position.set(maxDimension, maxDimension / 2, maxDimension);
      cameraRef.current.lookAt(0, 0, 0);
      controlsRef.current.update();
    }
  };

  // Toggle night mode
  const toggleNightMode = () => {
    setNightMode(!nightMode);
  };
  
  // Toggle rendering quality
  const toggleQuality = () => {
    setHighQuality(!highQuality);
    
    // Update renderer settings based on quality
    if (rendererRef.current) {
      rendererRef.current.setPixelRatio(highQuality ? window.devicePixelRatio : 1);
      if (highQuality) {
        rendererRef.current.shadowMap.type = THREE.PCFSoftShadowMap;
      } else {
        rendererRef.current.shadowMap.type = THREE.BasicShadowMap;
      }
    }
  };
  
  // Set up mouse and keyboard event handlers for manipulating furniture
  useEffect(() => {
    if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
    
    const canvas = rendererRef.current.domElement;
    
    // Mouse event handlers
    const handleMouseDown = (event: MouseEvent) => {
      if (!sceneRef.current || !cameraRef.current || controlsRef.current?.enabled === false) return;
      
      // Calculate mouse position in normalized device coordinates (-1 to +1) for raycaster
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      mouseRef.current.set(x, y);
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      
      // Find intersections with furniture objects
      const furnitureObjects = Array.from(furnitureObjectsRef.current.entries())
        .map(([id, object]) => ({ id, object }));
        
      // Check for intersections with furniture items
      for (const { id, object } of furnitureObjects) {
        let intersected = false;
        
        if (object instanceof THREE.Mesh) {
          const intersects = raycasterRef.current.intersectObject(object, false);
          intersected = intersects.length > 0;
        } else if (object instanceof THREE.Group) {
          const intersects = raycasterRef.current.intersectObject(object, true);
          intersected = intersects.length > 0;
        }
        
        if (intersected) {
          setDraggedFurnitureId(id);
          setIsDragStarted(true);
          
          // Calculate drag offset to prevent item from jumping to cursor position
          if (cameraRef.current) {
            const intersection = raycasterRef.current.ray.intersectPlane(
              dragPlaneRef.current,
              new THREE.Vector3()
            );
            
            if (intersection && object) {
              const offset = {
                x: object.position.x - intersection.x,
                z: object.position.z - intersection.z
              };
              setDragOffset(offset);
            }
          }
          
          // Select the furniture item
          if (id !== selectedItemId) {
            onSelectFurniture(id);
          }
          
          // Disable orbit controls while dragging
          if (controlsRef.current) {
            controlsRef.current.enabled = false;
          }
          
          break;
        }
      }
    };
    
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragStarted || !draggedFurnitureId || !cameraRef.current || !sceneRef.current) return;
      
      setIsDragging(true);
      
      // Calculate mouse position for raycaster
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      mouseRef.current.set(x, y);
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      
      // Find intersection with the drag plane
      const intersection = raycasterRef.current.ray.intersectPlane(
        dragPlaneRef.current,
        new THREE.Vector3()
      );
      
      if (intersection) {
        // Get the furniture mesh
        const mesh = furnitureObjectsRef.current.get(draggedFurnitureId);
        
        if (mesh) {
          // Apply the offset to get the new position
          const newX = intersection.x + dragOffset.x;
          const newZ = intersection.z + dragOffset.z;
          
          // Update the mesh position
          mesh.position.x = newX;
          mesh.position.z = newZ;
          
          // Find the item in the furniture items array
          const furnitureItem = furnitureItems.find(item => item.id === draggedFurnitureId);
          
          if (furnitureItem) {
            // Convert 3D coordinates back to 2D (0-100%)
            const coords2D = convertTo2DCoordinates(newX, newZ);
            
            // Notify parent component of the update
            const updatedItem: FurnitureItem = {
              ...furnitureItem,
              x: coords2D.x,
              y: coords2D.y
            };
            
            onUpdateFurniture(updatedItem);
          }
        }
      }
    };
    
    const handleMouseUp = () => {
      if (isDragStarted) {
        setIsDragStarted(false);
        setIsDragging(false);
        setDraggedFurnitureId(null);
        
        // Re-enable orbit controls
        if (controlsRef.current) {
          controlsRef.current.enabled = true;
        }
      }
    };
    
    // Keyboard event handlers for moving furniture with arrow keys
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedItemId) return;
      
      const STEP = 1; // Step size in 3D units
      const ROTATION_STEP = 5; // Rotation step in degrees
      
      const furnitureItem = furnitureItems.find(item => item.id === selectedItemId);
      if (!furnitureItem) return;
      
      // Get current 3D position
      const { x, z } = convertTo3DCoordinates(furnitureItem.x, furnitureItem.y);
      
      let newX = x;
      let newZ = z;
      let newRotation = furnitureItem.rotation;
      
      switch (event.key) {
        case 'ArrowLeft':
          newX -= STEP;
          break;
        case 'ArrowRight':
          newX += STEP;
          break;
        case 'ArrowUp':
          newZ -= STEP;
          break;
        case 'ArrowDown':
          newZ += STEP;
          break;
        case 'q': // Rotate counterclockwise
          newRotation = (furnitureItem.rotation - ROTATION_STEP + 360) % 360;
          break;
        case 'e': // Rotate clockwise
          newRotation = (furnitureItem.rotation + ROTATION_STEP) % 360;
          break;
        default:
          return; // Exit if not a relevant key
      }
      
      // Convert back to 2D coordinates
      const coords2D = convertTo2DCoordinates(newX, newZ);
      
      // Update furniture item
      const updatedItem: FurnitureItem = {
        ...furnitureItem,
        x: coords2D.x,
        y: coords2D.y,
        rotation: newRotation
      };
      
      onUpdateFurniture(updatedItem);
      
      // Prevent default browser scrolling behavior
      event.preventDefault();
    };
    
    // Add event listeners
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [convertTo2DCoordinates, convertTo3DCoordinates, dragOffset, draggedFurnitureId, furnitureItems, isDragStarted, onSelectFurniture, onUpdateFurniture, selectedItemId]);
  
  return (
    <div className="relative h-full">
      <div ref={mountRef} className="w-full h-full" />
      
      {/* View controls */}
      <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
        <Button variant="outline" size="sm" onClick={handleResetView}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset View
        </Button>
      </div>
      
      {/* Light mode toggle */}
      <div className="absolute top-4 right-4 space-y-4">
        <div className="flex items-center space-x-2 bg-background/80 backdrop-blur-sm p-2 rounded-md shadow-sm">
          <Sun className="h-4 w-4 text-amber-500" />
          <Switch
            checked={nightMode}
            onCheckedChange={toggleNightMode}
            aria-label="Toggle night mode"
          />
          <Moon className="h-4 w-4 text-indigo-400" />
        </div>
        
        {/* Quality toggle */}
        <div className="flex items-center space-x-2 bg-background/80 backdrop-blur-sm p-2 rounded-md shadow-sm">
          <span className="text-xs font-medium">Quality:</span>
          <Switch
            checked={highQuality}
            onCheckedChange={toggleQuality}
            aria-label="Toggle rendering quality"
          />
          <span className="text-xs">{highQuality ? "High" : "Standard"}</span>
        </div>
      </div>
    </div>
  );
}
