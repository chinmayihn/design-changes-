// @ts-nocheck
/**
 * ProblemNetwork3D - 3D elliptical orbital visualization of problem relationships
 * Shows problems in fixed elliptical orbits around a central problem
 */
import React, { useRef, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import ProblemOrbitModal from '../organisms/ProblemOrbitModal';

interface ProblemNode {
  id: string;
  name: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  category?: string;
  solved?: boolean;
  url?: string;
}

interface ProblemNetwork3DProps {
  centerProblem: ProblemNode;
  innerCircleProblems: ProblemNode[];
  middleCircleProblems: ProblemNode[];
  outerCircleProblems: ProblemNode[];
  onNodeClick?: (node: ProblemNode) => void;
  onNodeHover?: (node: ProblemNode | null) => void;
}

const ProblemNetwork3D: React.FC<ProblemNetwork3DProps> = ({
  centerProblem,
  innerCircleProblems = [],
  middleCircleProblems = [],
  outerCircleProblems = [],
  onNodeClick,
  onNodeHover,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const animationIdRef = useRef<number>();

  // Orbital parameters
  const SUN_RADIUS = 0; // Center star
  const INNER_PLANET_RADIUS = 200; // Inner planets
  const MIDDLE_PLANET_RADIUS = 350; // Middle planets
  const OUTER_ASTEROID_RADIUS = 500; // Outer asteroids

  // Elliptical orbit parameters (more elliptical for outer orbits)
  const INNER_ECCENTRICITY = 0.3; // Elliptical
  const MIDDLE_ECCENTRICITY = 0.4; // More elliptical
  const OUTER_ECCENTRICITY = 0.5; // Most elliptical

  const [hoveredNode, setHoveredNode] = useState<ProblemNode | null>(null);
  const [clickedNode, setClickedNode] = useState<ProblemNode | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [hoveredOrbit, setHoveredOrbit] = useState<'inner' | 'middle' | 'outer' | null>(null);
  const [clickedOrbit, setClickedOrbit] = useState<'inner' | 'middle' | 'outer' | null>(null);
  const [isHudCollapsed, setIsHudCollapsed] = useState(false);

  // Calculate elliptical position for orbits
  const getEllipticalPosition = (index: number, total: number, radius: number, eccentricity: number, time: number) => {
    const angle = (index / total) * 2 * Math.PI + time * 0.002; // Slower orbital motion
    // Elliptical orbit: x = a*cos(θ), y = b*sin(θ) where b = a*sqrt(1-e²)
    const a = radius; // Semi-major axis
    const b = radius * Math.sqrt(1 - eccentricity * eccentricity); // Semi-minor axis

    const x = a * Math.cos(angle);
    const y = b * Math.sin(angle) * 0.3; // Flatten the ellipse
    const z = Math.sin(angle) * radius * 0.2; // Add some 3D depth
    return { x, y, z, angle };
  };

  // Enhanced color system: circle-based gradients with difficulty influence
  const getNodeColor = (circleType: 'inner' | 'middle' | 'outer', difficulty?: string, solved?: boolean): THREE.Color => {
    if (solved) return new THREE.Color('#22c55e'); // Green for solved

    const baseColors = {
      inner: { primary: '#3b82f6', secondary: '#1d4ed8' }, // Blue theme for inner planets
      middle: { primary: '#f59e0b', secondary: '#d97706' }, // Orange theme for middle planets
      outer: { primary: '#8b5cf6', secondary: '#7c3aed' }, // Purple theme for outer asteroids
    };

    const colors = baseColors[circleType];

    // Difficulty influence
    switch (difficulty) {
      case 'Easy': return new THREE.Color(colors.primary);
      case 'Medium': return new THREE.Color(colors.primary).lerp(new THREE.Color(colors.secondary), 0.3);
      case 'Hard': return new THREE.Color(colors.secondary);
      default: return new THREE.Color(colors.primary);
    }
  };

  // Create orbital paths
  const createOrbitalPaths = (scene: THREE.Scene) => {
    const pathMaterial = new THREE.LineBasicMaterial({
      color: 0x444444,
      transparent: true,
      opacity: 0.3,
    });

    // Inner orbit
    const innerGeometry = new THREE.BufferGeometry();
    const innerPoints = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      const a = INNER_PLANET_RADIUS;
      const b = INNER_PLANET_RADIUS * Math.sqrt(1 - INNER_ECCENTRICITY * INNER_ECCENTRICITY);
      const x = a * Math.cos(angle);
      const y = b * Math.sin(angle) * 0.3;
      const z = Math.sin(angle) * INNER_PLANET_RADIUS * 0.2;
      innerPoints.push(new THREE.Vector3(x, y, z));
    }
    innerGeometry.setFromPoints(innerPoints);
    const innerPath = new THREE.Line(innerGeometry, pathMaterial);
    scene.add(innerPath);

    // Middle orbit
    const middleGeometry = new THREE.BufferGeometry();
    const middlePoints = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      const a = MIDDLE_PLANET_RADIUS;
      const b = MIDDLE_PLANET_RADIUS * Math.sqrt(1 - MIDDLE_ECCENTRICITY * MIDDLE_ECCENTRICITY);
      const x = a * Math.cos(angle);
      const y = b * Math.sin(angle) * 0.3;
      const z = Math.sin(angle) * MIDDLE_PLANET_RADIUS * 0.2;
      middlePoints.push(new THREE.Vector3(x, y, z));
    }
    middleGeometry.setFromPoints(middlePoints);
    const middlePath = new THREE.Line(middleGeometry, pathMaterial);
    scene.add(middlePath);

    // Outer orbit
    const outerGeometry = new THREE.BufferGeometry();
    const outerPoints = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      const a = OUTER_ASTEROID_RADIUS;
      const b = OUTER_ASTEROID_RADIUS * Math.sqrt(1 - OUTER_ECCENTRICITY * OUTER_ECCENTRICITY);
      const x = a * Math.cos(angle);
      const y = b * Math.sin(angle) * 0.3;
      const z = Math.sin(angle) * OUTER_ASTEROID_RADIUS * 0.2;
      outerPoints.push(new THREE.Vector3(x, y, z));
    }
    outerGeometry.setFromPoints(outerPoints);
    const outerPath = new THREE.Line(outerGeometry, pathMaterial);
    scene.add(outerPath);
  };

  // Create elliptical area fills for hover detection
  const createEllipticalAreas = (scene: THREE.Scene) => {
    // Inner orbit fill - from center to inner orbit
    const innerGeometry = new THREE.RingGeometry(
      0, // inner radius (center)
      INNER_PLANET_RADIUS * 0.95, // outer radius (just inside inner orbit path)
      32, // theta segments
      8, // phi segments (more for smoother shape)
      0, // theta start
      Math.PI * 2 // theta length
    );

    // Transform the ring to match the elliptical shape
    const innerPositions = innerGeometry.attributes.position.array as Float32Array;
    for (let i = 0; i < innerPositions.length; i += 3) {
      const x = innerPositions[i];
      const y = innerPositions[i + 1];

      const angle = Math.atan2(y, x);
      const a = INNER_PLANET_RADIUS;
      const b = INNER_PLANET_RADIUS * Math.sqrt(1 - INNER_ECCENTRICITY * INNER_ECCENTRICITY);

      // Scale to elliptical shape - use ellipse equation
      const ellipseRadius = (a * b) / Math.sqrt((b * Math.cos(angle)) ** 2 + (a * Math.sin(angle)) ** 2);
      const scale = ellipseRadius / INNER_PLANET_RADIUS;

      innerPositions[i] = x * scale;
      innerPositions[i + 1] = y * scale * 0.3; // Match the flattening
      innerPositions[i + 2] = Math.sin(angle) * (Math.sqrt(x * x + y * y) / INNER_PLANET_RADIUS) * INNER_PLANET_RADIUS * 0.2;
    }
    innerGeometry.attributes.position.needsUpdate = true;
    innerGeometry.computeVertexNormals();

    const innerAreaMaterial = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.01,
      side: THREE.DoubleSide,
      emissive: 0x3b82f6,
      emissiveIntensity: 0,
    });
    const innerArea = new THREE.Mesh(innerGeometry, innerAreaMaterial);
    innerArea.userData = { type: 'orbit-area', orbit: 'inner' };
    innerArea.raycastable = true;
    scene.add(innerArea);

    // Middle orbit fill - between inner and middle orbits
    const middleGeometry = new THREE.RingGeometry(
      INNER_PLANET_RADIUS * 0.95, // inner radius (just outside inner orbit)
      MIDDLE_PLANET_RADIUS * 0.95, // outer radius (just inside middle orbit)
      32, 8, 0, Math.PI * 2
    );
    const middlePositions = middleGeometry.attributes.position.array as Float32Array;
    for (let i = 0; i < middlePositions.length; i += 3) {
      const x = middlePositions[i];
      const y = middlePositions[i + 1];

      const angle = Math.atan2(y, x);
      const radius = Math.sqrt(x * x + y * y);

      // Interpolate between inner and middle orbit shapes
      const innerA = INNER_PLANET_RADIUS;
      const innerB = INNER_PLANET_RADIUS * Math.sqrt(1 - INNER_ECCENTRICITY * INNER_ECCENTRICITY);
      const middleA = MIDDLE_PLANET_RADIUS;
      const middleB = MIDDLE_PLANET_RADIUS * Math.sqrt(1 - MIDDLE_ECCENTRICITY * MIDDLE_ECCENTRICITY);

      // Calculate the ellipse radius at this angle for both orbits
      const innerEllipseRadius = (innerA * innerB) / Math.sqrt((innerB * Math.cos(angle)) ** 2 + (innerA * Math.sin(angle)) ** 2);
      const middleEllipseRadius = (middleA * middleB) / Math.sqrt((middleB * Math.cos(angle)) ** 2 + (middleA * Math.sin(angle)) ** 2);

      // Normalize: what fraction of the ring's width is this vertex at?
      const linearInnerRadius = INNER_PLANET_RADIUS * 0.95;
      const linearOuterRadius = MIDDLE_PLANET_RADIUS * 0.95;
      const t = (radius - linearInnerRadius) / (linearOuterRadius - linearInnerRadius);

      // Apply that same fraction to the elliptical ring
      const ellipticalRadius = innerEllipseRadius + t * (middleEllipseRadius - innerEllipseRadius);
      const scale = ellipticalRadius / radius;

      middlePositions[i] = x * scale;
      middlePositions[i + 1] = y * scale * 0.3;
      middlePositions[i + 2] = Math.sin(angle) * ellipticalRadius * 0.2;
    }
    middleGeometry.attributes.position.needsUpdate = true;
    middleGeometry.computeVertexNormals();

    const middleAreaMaterial = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.01,
      side: THREE.DoubleSide,
      emissive: 0xf59e0b,
      emissiveIntensity: 0,
    });
    const middleArea = new THREE.Mesh(middleGeometry, middleAreaMaterial);
    middleArea.userData = { type: 'orbit-area', orbit: 'middle' };
    middleArea.raycastable = true;
    scene.add(middleArea);

    // Outer orbit fill - between middle and outer orbits
    const outerGeometry = new THREE.RingGeometry(
      MIDDLE_PLANET_RADIUS * 0.95, // inner radius (just outside middle orbit)
      OUTER_ASTEROID_RADIUS * 0.95, // outer radius (just inside outer orbit)
      32, 8, 0, Math.PI * 2
    );
    const outerPositions = outerGeometry.attributes.position.array as Float32Array;
    for (let i = 0; i < outerPositions.length; i += 3) {
      const x = outerPositions[i];
      const y = outerPositions[i + 1];

      const angle = Math.atan2(y, x);
      const radius = Math.sqrt(x * x + y * y);

      // Interpolate between middle and outer orbit shapes
      const middleA = MIDDLE_PLANET_RADIUS;
      const middleB = MIDDLE_PLANET_RADIUS * Math.sqrt(1 - MIDDLE_ECCENTRICITY * MIDDLE_ECCENTRICITY);
      const outerA = OUTER_ASTEROID_RADIUS;
      const outerB = OUTER_ASTEROID_RADIUS * Math.sqrt(1 - OUTER_ECCENTRICITY * OUTER_ECCENTRICITY);

      // Calculate the ellipse radius at this angle for both orbits
      const middleEllipseRadius = (middleA * middleB) / Math.sqrt((middleB * Math.cos(angle)) ** 2 + (middleA * Math.sin(angle)) ** 2);
      const outerEllipseRadius = (outerA * outerB) / Math.sqrt((outerB * Math.cos(angle)) ** 2 + (outerA * Math.sin(angle)) ** 2);

      // Normalize: what fraction of the ring's width is this vertex at?
      const linearInnerRadius = MIDDLE_PLANET_RADIUS * 0.95;
      const linearOuterRadius = OUTER_ASTEROID_RADIUS * 0.95;
      const t = (radius - linearInnerRadius) / (linearOuterRadius - linearInnerRadius);

      // Apply that same fraction to the elliptical ring
      const ellipticalRadius = middleEllipseRadius + t * (outerEllipseRadius - middleEllipseRadius);
      const scale = ellipticalRadius / radius;

      outerPositions[i] = x * scale;
      outerPositions[i + 1] = y * scale * 0.3;
      outerPositions[i + 2] = Math.sin(angle) * ellipticalRadius * 0.2;
    }
    outerGeometry.attributes.position.needsUpdate = true;
    outerGeometry.computeVertexNormals();

    const outerAreaMaterial = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.01,
      side: THREE.DoubleSide,
      emissive: 0x8b5cf6,
      emissiveIntensity: 0,
    });
    const outerArea = new THREE.Mesh(outerGeometry, outerAreaMaterial);
    outerArea.userData = { type: 'orbit-area', orbit: 'outer' };
    outerArea.raycastable = true;
    scene.add(outerArea);
  };

  // Create planet meshes (called once during initialization)
  const createPlanetMeshes = (scene: THREE.Scene) => {
    // Inner planets
    innerCircleProblems.forEach((problem, index) => {
      const planetGroup = new THREE.Group();
      planetGroup.userData = { type: 'planet', problem, circle: 'inner', index };

      // Planet geometry
      const planetGeometry = new THREE.SphereGeometry(8, 16, 16);
      const planetMaterial = new THREE.MeshPhongMaterial({
        color: getNodeColor('inner', problem.difficulty, problem.solved),
        shininess: 30,
      });
      const planet = new THREE.Mesh(planetGeometry, planetMaterial);
      planetGroup.add(planet);

      // Atmosphere
      const atmosphereGeometry = new THREE.SphereGeometry(9, 16, 16);
      const atmosphereMaterial = new THREE.MeshBasicMaterial({
        color: getNodeColor('inner', problem.difficulty, problem.solved),
        transparent: true,
        opacity: 0.2,
      });
      const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      planetGroup.add(atmosphere);

      scene.add(planetGroup);
    });

    // Middle planets
    middleCircleProblems.forEach((problem, index) => {
      const planetGroup = new THREE.Group();
      planetGroup.userData = { type: 'planet', problem, circle: 'middle', index };

      // Planet geometry
      const planetGeometry = new THREE.SphereGeometry(12, 20, 20);
      const planetMaterial = new THREE.MeshPhongMaterial({
        color: getNodeColor('middle', problem.difficulty, problem.solved),
        shininess: 50,
      });
      const planet = new THREE.Mesh(planetGeometry, planetMaterial);
      planetGroup.add(planet);

      // Rings
      const ringGeometry = new THREE.RingGeometry(15, 20, 16);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: getNodeColor('middle', problem.difficulty, problem.solved),
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });
      const rings = new THREE.Mesh(ringGeometry, ringMaterial);
      rings.rotation.x = Math.PI / 2;
      planetGroup.add(rings);

      scene.add(planetGroup);
    });

    // Outer asteroids
    outerCircleProblems.forEach((problem, index) => {
      const asteroidGroup = new THREE.Group();
      asteroidGroup.userData = { type: 'planet', problem, circle: 'outer', index };

      // Asteroid geometry (irregular shape)
      const asteroidGeometry = new THREE.DodecahedronGeometry(6, 0);
      const asteroidMaterial = new THREE.MeshPhongMaterial({
        color: getNodeColor('outer', problem.difficulty, problem.solved),
        shininess: 10,
      });
      const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
      asteroidGroup.add(asteroid);

      // Particle trail
      const trailGeometry = new THREE.CylinderGeometry(0.5, 2, 10, 8);
      const trailMaterial = new THREE.MeshBasicMaterial({
        color: getNodeColor('outer', problem.difficulty, problem.solved),
        transparent: true,
        opacity: 0.4,
      });
      const trail = new THREE.Mesh(trailGeometry, trailMaterial);
      trail.position.x = -8;
      asteroidGroup.add(trail);

      scene.add(asteroidGroup);
    });
  };

  // Update planet positions (called every frame)
  const updatePlanetPositions = (scene: THREE.Scene, time: number) => {
    scene.children.forEach((child) => {
      if (child.userData.type === 'planet') {
        const { circle, index } = child.userData;
        let radius: number, eccentricity: number, total: number;

        switch (circle) {
          case 'inner':
            radius = INNER_PLANET_RADIUS;
            eccentricity = INNER_ECCENTRICITY;
            total = innerCircleProblems.length;
            break;
          case 'middle':
            radius = MIDDLE_PLANET_RADIUS;
            eccentricity = MIDDLE_ECCENTRICITY;
            total = middleCircleProblems.length;
            break;
          case 'outer':
            radius = OUTER_ASTEROID_RADIUS;
            eccentricity = OUTER_ECCENTRICITY;
            total = outerCircleProblems.length;
            break;
          default:
            return;
        }

        const position = getEllipticalPosition(index, total, radius, eccentricity, time);
        child.position.set(position.x, position.y, position.z);
      }
    });
  };

  // Create sun/star
  const createSun = (scene: THREE.Scene) => {
    const sunGroup = new THREE.Group();
    sunGroup.position.set(0, 0, 0);
    sunGroup.userData = { type: 'sun', problem: centerProblem };

    // Sun core
    const sunGeometry = new THREE.SphereGeometry(15, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: getNodeColor('inner', centerProblem.difficulty, centerProblem.solved),
      transparent: true,
      opacity: 0.9,
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sunGroup.add(sun);

    // Corona
    const coronaGeometry = new THREE.SphereGeometry(25, 32, 32);
    const coronaMaterial = new THREE.MeshBasicMaterial({
      color: getNodeColor('inner', centerProblem.difficulty, centerProblem.solved),
      transparent: true,
      opacity: 0.3,
    });
    const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
    sunGroup.add(corona);

    // Flares
    const flareGeometry = new THREE.RingGeometry(20, 30, 16);
    const flareMaterial = new THREE.MeshBasicMaterial({
      color: getNodeColor('inner', centerProblem.difficulty, centerProblem.solved),
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
    });
    const flares = new THREE.Mesh(flareGeometry, flareMaterial);
    sunGroup.add(flares);

    scene.add(sunGroup);
    return sunGroup;
  };

  // Raycasting for mouse interactions
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const onMouseMove = (event: MouseEvent) => {
    if (!containerRef.current || !cameraRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, cameraRef.current);

    const intersects = raycaster.intersectObjects(sceneRef.current!.children, true);

    let foundHover = false;
    let foundOrbitHover = false;
    let currentHoveredOrbit: 'inner' | 'middle' | 'outer' | null = null;

    // First check for planet hovers
    for (const intersect of intersects) {
      let obj = intersect.object;

      // Check if this object or any of its parents has planet userData
      let currentObj = obj;
      while (currentObj) {
        if (currentObj.userData && currentObj.userData.type === 'planet') {
          setHoveredNode(currentObj.userData.problem);
          onNodeHover?.(currentObj.userData.problem);

          // Calculate screen position for hover text
          const worldPosition = new THREE.Vector3();
          currentObj.getWorldPosition(worldPosition);

          // Project 3D world position to 2D screen coordinates
          const screenPosition = worldPosition.clone();
          screenPosition.project(cameraRef.current!);

          // Convert to pixel coordinates relative to container
          const x = (screenPosition.x * 0.5 + 0.5) * rect.width;
          const y = (-screenPosition.y * 0.5 + 0.5) * rect.height;

          setHoverPosition({ x, y });
          foundHover = true;
          break;
        }
        currentObj = currentObj.parent;
      }

      if (foundHover) break;
    }

    // Then check for orbit area hovers (only if no planet is hovered)
    if (!foundHover) {
      for (const intersect of intersects) {
        if (intersect.object.userData && intersect.object.userData.type === 'orbit-area') {
          const orbitType = intersect.object.userData.orbit as 'inner' | 'middle' | 'outer';
          currentHoveredOrbit = orbitType;
          setHoveredOrbit(orbitType);
          foundOrbitHover = true;
          break;
        }
      }
    }

    // Update orbit area opacities using the LOCAL currentHoveredOrbit variable, not state
    sceneRef.current!.children.forEach((child) => {
      if (child.userData && child.userData.type === 'orbit-area') {
        const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        if (foundOrbitHover && child.userData.orbit === currentHoveredOrbit) {
          material.opacity = 0.1; // Mildly visible on hover
          material.emissiveIntensity = 0.6; // Increase glow on hover
        } else {
          material.opacity = 0.01; // Nearly invisible by default (still raycastable)
          material.emissiveIntensity = 0; // No glow when not hovered
        }
      }
    });

    if (!foundHover) {
      setHoveredNode(null);
      setHoverPosition(null);
      onNodeHover?.(null);
    }

    if (!foundOrbitHover) {
      setHoveredOrbit(null);
    }
  };

  const onMouseClick = (event: MouseEvent) => {
    if (!containerRef.current || !cameraRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, cameraRef.current);
    const intersects = raycaster.intersectObjects(sceneRef.current!.children, true);

    let clickedOnPlanet = false;
    let clickedOnOrbit = false;

    for (const intersect of intersects) {
      let obj = intersect.object;

      // Check if this object or any of its parents has planet userData
      let currentObj = obj;
      while (currentObj) {
        if (currentObj.userData && currentObj.userData.type === 'planet') {
          setClickedNode(currentObj.userData.problem);
          setClickedOrbit(null); // Clear orbit selection when clicking on a planet
          onNodeClick?.(currentObj.userData.problem);
          clickedOnPlanet = true;
          break;
        }
        currentObj = currentObj.parent;
      }

      // Check for orbit area clicks (only if no planet was clicked)
      if (!clickedOnPlanet && intersect.object.userData && intersect.object.userData.type === 'orbit-area') {
        const orbitType = intersect.object.userData.orbit as 'inner' | 'middle' | 'outer';
        setClickedOrbit(orbitType);
        setClickedNode(null); // Clear planet selection when clicking on orbit
        clickedOnOrbit = true;
        break;
      }
    }

    // If clicked on empty space, clear selections
    if (!clickedOnPlanet && !clickedOnOrbit) {
      setClickedNode(null);
      setClickedOrbit(null);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#000011');
    sceneRef.current = scene;

    // Camera setup - Higher top-down view
    const camera = new THREE.PerspectiveCamera(50, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 2000);
    camera.position.set(0, 600, -400); // Higher top-down view position
    camera.lookAt(0, 50, 0); // Look at the center
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Ensure canvas allows pointer events
    renderer.domElement.style.pointerEvents = 'auto';

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffaa00, 2, 800);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // Create orbital paths
    createOrbitalPaths(scene);

    // Create elliptical area fills for hover detection
    createEllipticalAreas(scene);

    // Create sun
    const sunGroup = createSun(scene);

    // Create initial planet meshes (not every frame)
    createPlanetMeshes(scene);

    // Animation loop
    let time = 0;
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      time += 1;

      // Rotate sun elements
      if (sunGroup) {
        sunGroup.children[0].rotation.y += 0.01; // Sun core
        sunGroup.children[1].rotation.y -= 0.005; // Corona
        sunGroup.children[2].rotation.z += 0.008; // Flares
      }

      // Update planet positions (more efficiently - just update positions, don't recreate meshes)
      updatePlanetPositions(scene, time);

      renderer.render(scene, camera);
    };
    animate();

    // Event listeners
    containerRef.current.addEventListener('mousemove', onMouseMove);
    containerRef.current.addEventListener('click', onMouseClick);

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', onMouseMove);
        containerRef.current.removeEventListener('click', onMouseClick);
      }
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && containerRef.current && containerRef.current.contains(rendererRef.current.domElement)) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, [centerProblem, innerCircleProblems, middleCircleProblems, outerCircleProblems, onNodeClick, onNodeHover]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#000011',
      }}
    >
      {/* Hover Text */}
      {hoveredNode && hoverPosition && (
        <div
          style={{
            position: 'absolute',
            left: `${hoverPosition.x}px`,
            top: `${hoverPosition.y + 15}px`, // Position below the planet
            transform: 'translateX(-50%)', // Center horizontally on the planet
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '6px 10px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            border: '1px solid #444',
            zIndex: 1000,
            pointerEvents: 'none', // Don't interfere with mouse events
            whiteSpace: 'nowrap',
          }}
        >
          {hoveredNode.name}
        </div>
      )}

      {/* Vertical Interaction Guide - Bottom Right (Collapsible) */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          backgroundColor: 'rgba(10, 14, 39, 0.9)',
          color: 'white',
          padding: isHudCollapsed ? '10px 16px' : '16px',
          borderRadius: '8px',
          fontSize: '11px',
          fontWeight: '500',
          border: '1px solid rgba(21, 170, 191, 0.4)',
          zIndex: 1000,
          pointerEvents: 'auto',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          textAlign: 'left',
          width: isHudCollapsed ? '140px' : '220px',
          display: 'flex',
          flexDirection: 'column',
          gap: isHudCollapsed ? '0' : '12px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: isHudCollapsed ? 'pointer' : 'default',
        }}
        onClick={(e) => {
          if (isHudCollapsed) {
            setIsHudCollapsed(false);
            e.stopPropagation();
          }
        }}
      >
        <div 
          style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer'
          }}
          onClick={(e) => {
            setIsHudCollapsed(!isHudCollapsed);
            e.stopPropagation();
          }}
        >
          <div style={{ 
            fontWeight: '700', 
            color: '#15AABF', 
            textTransform: 'uppercase', 
            letterSpacing: '2px',
            fontFamily: "'Orbitron', sans-serif",
            whiteSpace: 'nowrap'
          }}>
            HUD Control
          </div>
          <div style={{ 
            color: '#15AABF', 
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center'
          }}>
            {isHudCollapsed ? '+' : '−'}
          </div>
        </div>

        {!isHudCollapsed && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '10px', 
            opacity: 0.9,
            borderTop: '1px solid rgba(21, 170, 191, 0.2)',
            paddingTop: '12px'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ color: '#15AABF' }}>•</span>
              <span>Click planets to view details</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ color: '#15AABF' }}>•</span>
              <span>Hover zones to highlight patterns</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ color: '#15AABF' }}>•</span>
              <span>Click areas to view all sector problems</span>
            </div>
          </div>
        )}
      </div>

      {/* Click Card Overlay */}
      {clickedNode && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
          }}
          onClick={() => setClickedNode(null)} // Close on overlay click
        >
          <div
            style={{
              backgroundColor: '#1a1a2e',
              border: '2px solid #444',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              color: 'white',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking card
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#3b82f6', fontSize: '18px' }}>{clickedNode.name}</h3>
              <button
                onClick={() => setClickedNode(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <span style={{
                display: 'inline-block',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold',
                backgroundColor: clickedNode.difficulty === 'Easy' ? '#22c55e' :
                               clickedNode.difficulty === 'Medium' ? '#f59e0b' : '#ef4444',
                color: 'white',
              }}>
                {clickedNode.difficulty || 'Unknown'}
              </span>
            </div>

            {clickedNode.category && (
              <div style={{ marginBottom: '12px', color: '#ccc' }}>
                <strong>Category:</strong> {clickedNode.category}
              </div>
            )}

            <div style={{ marginBottom: '16px', color: '#ccc' }}>
              <strong>Status:</strong> {clickedNode.solved ? '✅ Solved' : '⏳ Not Solved'}
            </div>

            {clickedNode.url && (
              <div style={{ textAlign: 'center' }}>
                <a
                  href={clickedNode.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                  }}
                >
                  View Problem
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Orbit Area Problems List */}
      {clickedOrbit && (
        <ProblemOrbitModal
          orbitType={clickedOrbit}
          problems={
            clickedOrbit === 'inner' ? innerCircleProblems :
            clickedOrbit === 'middle' ? middleCircleProblems :
            outerCircleProblems
          }
          onClose={() => setClickedOrbit(null)}
        />
      )}
    </div>
  );
};

export default ProblemNetwork3D;
