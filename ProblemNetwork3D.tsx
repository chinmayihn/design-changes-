// @ts-nocheck
/**
 * ProblemNetwork3D - 3D elliptical orbital visualization of problem relationships
 * Shows problems in fixed elliptical orbits around a central problem
 */
import React, { useRef, useEffect, useState } from 'react';
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
  highlightedOrbit?: 'inner' | 'middle' | 'outer' | null;
  onNodeClick?: (node: ProblemNode) => void;
  onNodeHover?: (node: ProblemNode | null) => void;
}

const ProblemNetwork3D: React.FC<ProblemNetwork3DProps> = ({
  centerProblem,
  innerCircleProblems = [],
  middleCircleProblems = [],
  outerCircleProblems = [],
  highlightedOrbit,
  onNodeClick,
  onNodeHover,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const animationIdRef = useRef<number>();

  const INNER_PLANET_RADIUS = 200;
  const MIDDLE_PLANET_RADIUS = 350;
  const OUTER_ASTEROID_RADIUS = 500;

  const INNER_ECCENTRICITY = 0.3;
  const MIDDLE_ECCENTRICITY = 0.4;
  const OUTER_ECCENTRICITY = 0.5;

  const [hoveredNode, setHoveredNode] = useState<ProblemNode | null>(null);
  const [clickedNode, setClickedNode] = useState<ProblemNode | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [hoveredOrbit, setHoveredOrbit] = useState<'inner' | 'middle' | 'outer' | null>(null);
  const [clickedOrbit, setClickedOrbit] = useState<'inner' | 'middle' | 'outer' | null>(null);

  // React to sidebar hover — scale up matching planets
  useEffect(() => {
  if (!sceneRef.current) return;
  sceneRef.current.children.forEach((child) => {
    // Highlight planets
    if (child.userData?.type === 'planet') {
      const circle = child.userData.circle;
      const isHighlighted = highlightedOrbit === circle;
      child.scale.setScalar(isHighlighted ? 1.5 : 1.0);
      const atmos = child.children[1];
      if (atmos) {
        const mat = atmos.material as THREE.MeshBasicMaterial;
        mat.opacity = isHighlighted ? 0.6 : 0.2;
      }
    }

    // Highlight orbit areas
    if (child.userData?.type === 'orbit-area') {
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (highlightedOrbit === child.userData.orbit) {
        mat.opacity = 0.12;
      } else {
        mat.opacity = 0.01;
      }
    }
  });
}, [highlightedOrbit]);

  const getEllipticalPosition = (index: number, total: number, radius: number, eccentricity: number, time: number) => {
    const angle = (index / total) * 2 * Math.PI + time * 0.002;
    const a = radius;
    const b = radius * Math.sqrt(1 - eccentricity * eccentricity);
    return {
      x: a * Math.cos(angle),
      y: b * Math.sin(angle) * 0.3,
      z: Math.sin(angle) * radius * 0.2,
    };
  };

  const getNodeColor = (circleType: 'inner' | 'middle' | 'outer', difficulty?: string, solved?: boolean): THREE.Color => {
    if (solved) return new THREE.Color('#22c55e');
    const baseColors = {
      inner:  { primary: '#3b82f6', secondary: '#1d4ed8' },
      middle: { primary: '#f59e0b', secondary: '#d97706' },
      outer:  { primary: '#8b5cf6', secondary: '#7c3aed' },
    };
    const colors = baseColors[circleType];
    switch (difficulty) {
      case 'Easy':   return new THREE.Color(colors.primary);
      case 'Medium': return new THREE.Color(colors.primary).lerp(new THREE.Color(colors.secondary), 0.3);
      case 'Hard':   return new THREE.Color(colors.secondary);
      default:       return new THREE.Color(colors.primary);
    }
  };

  const createOrbitalPaths = (scene: THREE.Scene) => {
    const pathMaterial = new THREE.LineBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.3 });
    const drawOrbit = (radius: number, eccentricity: number) => {
      const points = [];
      for (let i = 0; i <= 64; i++) {
        const angle = (i / 64) * Math.PI * 2;
        const a = radius;
        const b = radius * Math.sqrt(1 - eccentricity * eccentricity);
        points.push(new THREE.Vector3(a * Math.cos(angle), b * Math.sin(angle) * 0.3, Math.sin(angle) * radius * 0.2));
      }
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), pathMaterial));
    };
    drawOrbit(INNER_PLANET_RADIUS, INNER_ECCENTRICITY);
    drawOrbit(MIDDLE_PLANET_RADIUS, MIDDLE_ECCENTRICITY);
    drawOrbit(OUTER_ASTEROID_RADIUS, OUTER_ECCENTRICITY);
  };

  const createEllipticalAreas = (scene: THREE.Scene) => {
    const innerGeometry = new THREE.RingGeometry(0, INNER_PLANET_RADIUS * 0.95, 32, 8, 0, Math.PI * 2);
    const innerPositions = innerGeometry.attributes.position.array as Float32Array;
    for (let i = 0; i < innerPositions.length; i += 3) {
      const x = innerPositions[i], y = innerPositions[i + 1];
      const angle = Math.atan2(y, x);
      const a = INNER_PLANET_RADIUS, b = INNER_PLANET_RADIUS * Math.sqrt(1 - INNER_ECCENTRICITY * INNER_ECCENTRICITY);
      const ellipseRadius = (a * b) / Math.sqrt((b * Math.cos(angle)) ** 2 + (a * Math.sin(angle)) ** 2);
      const scale = ellipseRadius / INNER_PLANET_RADIUS;
      innerPositions[i] = x * scale;
      innerPositions[i + 1] = y * scale * 0.3;
      innerPositions[i + 2] = Math.sin(angle) * (Math.sqrt(x * x + y * y) / INNER_PLANET_RADIUS) * INNER_PLANET_RADIUS * 0.2;
    }
    innerGeometry.attributes.position.needsUpdate = true;
    innerGeometry.computeVertexNormals();
    const innerArea = new THREE.Mesh(innerGeometry, new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.01, side: THREE.DoubleSide }));
    innerArea.userData = { type: 'orbit-area', orbit: 'inner' };
    scene.add(innerArea);

    const middleGeometry = new THREE.RingGeometry(INNER_PLANET_RADIUS * 0.95, MIDDLE_PLANET_RADIUS * 0.95, 32, 8, 0, Math.PI * 2);
    const middlePositions = middleGeometry.attributes.position.array as Float32Array;
    for (let i = 0; i < middlePositions.length; i += 3) {
      const x = middlePositions[i], y = middlePositions[i + 1];
      const angle = Math.atan2(y, x), radius = Math.sqrt(x * x + y * y);
      const iA = INNER_PLANET_RADIUS, iB = INNER_PLANET_RADIUS * Math.sqrt(1 - INNER_ECCENTRICITY * INNER_ECCENTRICITY);
      const mA = MIDDLE_PLANET_RADIUS, mB = MIDDLE_PLANET_RADIUS * Math.sqrt(1 - MIDDLE_ECCENTRICITY * MIDDLE_ECCENTRICITY);
      const iER = (iA * iB) / Math.sqrt((iB * Math.cos(angle)) ** 2 + (iA * Math.sin(angle)) ** 2);
      const mER = (mA * mB) / Math.sqrt((mB * Math.cos(angle)) ** 2 + (mA * Math.sin(angle)) ** 2);
      const t = (radius - INNER_PLANET_RADIUS * 0.95) / (MIDDLE_PLANET_RADIUS * 0.95 - INNER_PLANET_RADIUS * 0.95);
      const eR = iER + t * (mER - iER), scale = eR / radius;
      middlePositions[i] = x * scale;
      middlePositions[i + 1] = y * scale * 0.3;
      middlePositions[i + 2] = Math.sin(angle) * eR * 0.2;
    }
    middleGeometry.attributes.position.needsUpdate = true;
    middleGeometry.computeVertexNormals();
    const middleArea = new THREE.Mesh(middleGeometry, new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.01, side: THREE.DoubleSide }));
    middleArea.userData = { type: 'orbit-area', orbit: 'middle' };
    scene.add(middleArea);

    const outerGeometry = new THREE.RingGeometry(MIDDLE_PLANET_RADIUS * 0.95, OUTER_ASTEROID_RADIUS * 0.95, 32, 8, 0, Math.PI * 2);
    const outerPositions = outerGeometry.attributes.position.array as Float32Array;
    for (let i = 0; i < outerPositions.length; i += 3) {
      const x = outerPositions[i], y = outerPositions[i + 1];
      const angle = Math.atan2(y, x), radius = Math.sqrt(x * x + y * y);
      const mA = MIDDLE_PLANET_RADIUS, mB = MIDDLE_PLANET_RADIUS * Math.sqrt(1 - MIDDLE_ECCENTRICITY * MIDDLE_ECCENTRICITY);
      const oA = OUTER_ASTEROID_RADIUS, oB = OUTER_ASTEROID_RADIUS * Math.sqrt(1 - OUTER_ECCENTRICITY * OUTER_ECCENTRICITY);
      const mER = (mA * mB) / Math.sqrt((mB * Math.cos(angle)) ** 2 + (mA * Math.sin(angle)) ** 2);
      const oER = (oA * oB) / Math.sqrt((oB * Math.cos(angle)) ** 2 + (oA * Math.sin(angle)) ** 2);
      const t = (radius - MIDDLE_PLANET_RADIUS * 0.95) / (OUTER_ASTEROID_RADIUS * 0.95 - MIDDLE_PLANET_RADIUS * 0.95);
      const eR = mER + t * (oER - mER), scale = eR / radius;
      outerPositions[i] = x * scale;
      outerPositions[i + 1] = y * scale * 0.3;
      outerPositions[i + 2] = Math.sin(angle) * eR * 0.2;
    }
    outerGeometry.attributes.position.needsUpdate = true;
    outerGeometry.computeVertexNormals();
    const outerArea = new THREE.Mesh(outerGeometry, new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.01, side: THREE.DoubleSide }));
    outerArea.userData = { type: 'orbit-area', orbit: 'outer' };
    scene.add(outerArea);
  };

  const createPlanetMeshes = (scene: THREE.Scene) => {
    innerCircleProblems.forEach((problem, index) => {
      const g = new THREE.Group();
      g.userData = { type: 'planet', problem, circle: 'inner', index };
      g.add(new THREE.Mesh(new THREE.SphereGeometry(8, 16, 16), new THREE.MeshPhongMaterial({ color: getNodeColor('inner', problem.difficulty, problem.solved), shininess: 30 })));
      g.add(new THREE.Mesh(new THREE.SphereGeometry(9, 16, 16), new THREE.MeshBasicMaterial({ color: getNodeColor('inner', problem.difficulty, problem.solved), transparent: true, opacity: 0.2 })));
      scene.add(g);
    });

    middleCircleProblems.forEach((problem, index) => {
      const g = new THREE.Group();
      g.userData = { type: 'planet', problem, circle: 'middle', index };
      g.add(new THREE.Mesh(new THREE.SphereGeometry(12, 20, 20), new THREE.MeshPhongMaterial({ color: getNodeColor('middle', problem.difficulty, problem.solved), shininess: 50 })));
      const rings = new THREE.Mesh(new THREE.RingGeometry(15, 20, 16), new THREE.MeshBasicMaterial({ color: getNodeColor('middle', problem.difficulty, problem.solved), transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
      rings.rotation.x = Math.PI / 2;
      g.add(rings);
      scene.add(g);
    });

    outerCircleProblems.forEach((problem, index) => {
      const g = new THREE.Group();
      g.userData = { type: 'planet', problem, circle: 'outer', index };
      g.add(new THREE.Mesh(new THREE.DodecahedronGeometry(6, 0), new THREE.MeshPhongMaterial({ color: getNodeColor('outer', problem.difficulty, problem.solved), shininess: 10 })));
      const trail = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 2, 10, 8), new THREE.MeshBasicMaterial({ color: getNodeColor('outer', problem.difficulty, problem.solved), transparent: true, opacity: 0.4 }));
      trail.position.x = -8;
      g.add(trail);
      scene.add(g);
    });
  };

  const updatePlanetPositions = (scene: THREE.Scene, time: number) => {
    scene.children.forEach((child) => {
      if (child.userData.type === 'planet') {
        const { circle, index } = child.userData;
        let radius: number, eccentricity: number, total: number;
        switch (circle) {
          case 'inner':  radius = INNER_PLANET_RADIUS;   eccentricity = INNER_ECCENTRICITY;  total = innerCircleProblems.length;  break;
          case 'middle': radius = MIDDLE_PLANET_RADIUS;  eccentricity = MIDDLE_ECCENTRICITY; total = middleCircleProblems.length; break;
          case 'outer':  radius = OUTER_ASTEROID_RADIUS; eccentricity = OUTER_ECCENTRICITY;  total = outerCircleProblems.length;  break;
          default: return;
        }
        const pos = getEllipticalPosition(index, total, radius, eccentricity, time);
        child.position.set(pos.x, pos.y, pos.z);
      }
    });
  };

  const createSun = (scene: THREE.Scene) => {
    const sunGroup = new THREE.Group();
    sunGroup.position.set(0, 0, 0);
    sunGroup.userData = { type: 'sun', problem: centerProblem };

    // index 0 — Planet core
    sunGroup.add(new THREE.Mesh(
      new THREE.SphereGeometry(15, 32, 32),
      new THREE.MeshPhongMaterial({
        color: new THREE.Color('#ff2200'),
        emissive: new THREE.Color('#cc1100'),
        emissiveIntensity: 0.4,
        shininess: 60,
      })
    ));

    // index 1 — Inner halo
    sunGroup.add(new THREE.Mesh(
      new THREE.SphereGeometry(32, 32, 32),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#ff2200'),
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
      })
    ));

    // index 2 — Outer halo
    sunGroup.add(new THREE.Mesh(
      new THREE.SphereGeometry(55, 32, 32),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#ff1100'),
        transparent: true,
        opacity: 0.10,
        depthWrite: false,
      })
    ));

    // index 3 — Flares ring
    sunGroup.add(new THREE.Mesh(
      new THREE.RingGeometry(18, 22, 32),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#ff3300'),
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    ));

    scene.add(sunGroup);
    return sunGroup;
  };

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

    for (const intersect of intersects) {
      let currentObj = intersect.object;
      while (currentObj) {
        if (currentObj.userData?.type === 'planet') {
          setHoveredNode(currentObj.userData.problem);
          onNodeHover?.(currentObj.userData.problem);
          const worldPosition = new THREE.Vector3();
          currentObj.getWorldPosition(worldPosition);
          const screenPosition = worldPosition.clone().project(cameraRef.current!);
          setHoverPosition({
            x: (screenPosition.x * 0.5 + 0.5) * rect.width,
            y: (-screenPosition.y * 0.5 + 0.5) * rect.height,
          });
          foundHover = true;
          break;
        }
        currentObj = currentObj.parent;
      }
      if (foundHover) break;
    }

    if (!foundHover) {
      for (const intersect of intersects) {
        if (intersect.object.userData?.type === 'orbit-area') {
          currentHoveredOrbit = intersect.object.userData.orbit;
          setHoveredOrbit(currentHoveredOrbit);
          foundOrbitHover = true;
          break;
        }
      }
    }

    sceneRef.current!.children.forEach((child) => {
      if (child.userData?.type === 'orbit-area') {
        const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        mat.opacity = (foundOrbitHover && child.userData.orbit === currentHoveredOrbit) ? 0.1 : 0.01;
      }
    });

    if (!foundHover) { setHoveredNode(null); setHoverPosition(null); onNodeHover?.(null); }
    if (!foundOrbitHover) setHoveredOrbit(null);
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
      let currentObj = intersect.object;
      while (currentObj) {
        if (currentObj.userData?.type === 'planet') {
          setClickedNode(currentObj.userData.problem);
          setClickedOrbit(null);
          onNodeClick?.(currentObj.userData.problem);
          clickedOnPlanet = true;
          break;
        }
        currentObj = currentObj.parent;
      }
      if (!clickedOnPlanet && intersect.object.userData?.type === 'orbit-area') {
        setClickedOrbit(intersect.object.userData.orbit);
        setClickedNode(null);
        clickedOnOrbit = true;
        break;
      }
    }

    if (!clickedOnPlanet && !clickedOnOrbit) { setClickedNode(null); setClickedOrbit(null); }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#000011');
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 2000);
    camera.position.set(0, 600, -400);
    camera.lookAt(0, 50, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    renderer.domElement.style.pointerEvents = 'auto';

    scene.add(new THREE.AmbientLight(0x404040, 0.6));

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(100, 100, 50);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xff2200, 5, 1000);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    createOrbitalPaths(scene);
    createEllipticalAreas(scene);
    const sunGroup = createSun(scene);
    createPlanetMeshes(scene);

    let time = 0;
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      time += 1;
      if (sunGroup) {
        sunGroup.children[0].rotation.y += 0.005;
        sunGroup.children[3].rotation.z += 0.008;
      }
      updatePlanetPositions(scene, time);
      renderer.render(scene, camera);
    };
    animate();

    containerRef.current.addEventListener('mousemove', onMouseMove);
    containerRef.current.addEventListener('click', onMouseClick);

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', onMouseMove);
        containerRef.current.removeEventListener('click', onMouseClick);
      }
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && containerRef.current?.contains(rendererRef.current.domElement)) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, [centerProblem, innerCircleProblems, middleCircleProblems, outerCircleProblems, onNodeClick, onNodeHover]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#000011' }}>

      {/* Hover Text */}
      {hoveredNode && hoverPosition && (
        <div style={{ position: 'absolute', left: `${hoverPosition.x}px`, top: `${hoverPosition.y + 15}px`, transform: 'translateX(-50%)', backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', padding: '6px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #444', zIndex: 1000, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
          {hoveredNode.name}
        </div>
      )}

      {/* Click Card Overlay */}
      {clickedNode && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }} onClick={() => setClickedNode(null)}>
          <div style={{ backgroundColor: '#1a1a2e', border: '2px solid #444', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '90%', color: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#3b82f6', fontSize: '18px' }}>{clickedNode.name}</h3>
              <button onClick={() => setClickedNode(null)} style={{ background: 'none', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer', padding: '4px' }}>×</button>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', backgroundColor: clickedNode.difficulty === 'Easy' ? '#22c55e' : clickedNode.difficulty === 'Medium' ? '#f59e0b' : '#ef4444', color: 'white' }}>
                {clickedNode.difficulty || 'Unknown'}
              </span>
            </div>
            {clickedNode.category && <div style={{ marginBottom: '12px', color: '#ccc' }}><strong>Category:</strong> {clickedNode.category}</div>}
            <div style={{ marginBottom: '16px', color: '#ccc' }}><strong>Status:</strong> {clickedNode.solved ? '✅ Solved' : '⏳ Not Solved'}</div>
            {clickedNode.url && (
              <div style={{ textAlign: 'center' }}>
                <a href={clickedNode.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', backgroundColor: '#3b82f6', color: 'white', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}>
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
          problems={clickedOrbit === 'inner' ? innerCircleProblems : clickedOrbit === 'middle' ? middleCircleProblems : outerCircleProblems}
          onClose={() => setClickedOrbit(null)}
        />
      )}
    </div>
  );
};

export default ProblemNetwork3D;