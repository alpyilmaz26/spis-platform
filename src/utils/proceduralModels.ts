import * as THREE from 'three';
import { SampleModel } from '../types';

export const SAMPLE_MODELS: SampleModel[] = [
  {
    id: 'drone-sci-fi',
    name: 'Sci-Fi Quadcopter Drone',
    category: 'Vehicles & Robotics',
    description: 'High-tech surveillance drone with dual rotors, optical sensor suite, and carbon chassis.',
    thumbnail: '🤖',
    type: 'procedural',
    proceduralType: 'drone',
    format: 'Procedural Mesh'
  },
  {
    id: 'engine-gearbox',
    name: 'Mechanical Gearbox Engine',
    category: 'Engineering & Industrial',
    description: 'Industrial drive shaft assembly with spur gears, bearings, and heavy steel housing.',
    thumbnail: '⚙️',
    type: 'procedural',
    proceduralType: 'engine',
    format: 'Procedural Mesh'
  },
  {
    id: 'rover-mars',
    name: 'Planetary Exploration Rover',
    category: 'Space & Aviation',
    description: 'Six-wheeled rover vehicle equipped with solar panels, robotic arm, and sensor mast.',
    thumbnail: '🛰️',
    type: 'procedural',
    proceduralType: 'rover',
    format: 'Procedural Mesh'
  },
  {
    id: 'pavilion-arch',
    name: 'Modernist Architectural Villa',
    category: 'Architecture',
    description: 'Contemporary minimalist residence featuring glass facade, cantilevered roof, and pool deck.',
    thumbnail: '🏛️',
    type: 'procedural',
    proceduralType: 'pavilion',
    format: 'Procedural Mesh'
  },
  {
    id: 'robot-mech',
    name: 'Articulated Utility Mech',
    category: 'Robotics',
    description: 'Modular industrial biped robot with hydraulic joints and task manipulators.',
    thumbnail: '🦿',
    type: 'procedural',
    proceduralType: 'robot',
    format: 'Procedural Mesh'
  }
];

export function generateProceduralModel(type: string): THREE.Group {
  const root = new THREE.Group();
  root.name = 'ProceduralModelRoot';

  switch (type) {
    case 'drone':
      return createSciFiDrone();
    case 'engine':
      return createMechanicalEngine();
    case 'rover':
      return createMarsRover();
    case 'pavilion':
      return createArchitecturalPavilion();
    case 'robot':
      return createArticulatedRobot();
    default:
      return createSciFiDrone();
  }
}

function createSciFiDrone(): THREE.Group {
  const drone = new THREE.Group();
  drone.name = 'SciFi_Drone_Assembly';

  // Materials
  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.8,
    roughness: 0.2,
    name: 'Carbon_Fiber_Body'
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.95,
    roughness: 0.1,
    name: 'Chrome_Accents'
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.9,
    transparent: true,
    opacity: 0.8,
    name: 'Sensor_Camera_Glass'
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x06b6d4,
    emissiveIntensity: 0.8,
    name: 'Cyan_LED_Glow'
  });
  const propMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.3,
    roughness: 0.4,
    name: 'Rotor_Blades'
  });

  // Main Core Chassis
  const coreGeo = new THREE.CylinderGeometry(0.8, 1.0, 0.4, 12);
  const coreMesh = new THREE.Mesh(coreGeo, carbonMat);
  coreMesh.name = 'Main_Chassis_Core';
  coreMesh.castShadow = true;
  coreMesh.receiveShadow = true;
  drone.add(coreMesh);

  // Top Dome Cover
  const domeGeo = new THREE.SphereGeometry(0.7, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeMesh = new THREE.Mesh(domeGeo, chromeMat);
  domeMesh.position.y = 0.2;
  domeMesh.name = 'Top_Avionics_Dome';
  drone.add(domeMesh);

  // Optical Sensor Pod (Bottom Camera)
  const sensorGroup = new THREE.Group();
  sensorGroup.name = 'Optical_Sensor_Gimba';
  sensorGroup.position.set(0, -0.3, 0.3);

  const sensorGeo = new THREE.SphereGeometry(0.35, 16, 16);
  const sensorMesh = new THREE.Mesh(sensorGeo, carbonMat);
  sensorMesh.name = 'Gimba_Housing';
  sensorGroup.add(sensorMesh);

  const lensGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
  lensGeo.rotateX(Math.PI / 2);
  const lensMesh = new THREE.Mesh(lensGeo, glassMat);
  lensMesh.position.z = 0.25;
  lensMesh.name = 'Main_Camera_Lens';
  sensorGroup.add(lensMesh);

  const glowRingGeo = new THREE.TorusGeometry(0.22, 0.02, 12, 24);
  const glowRingMesh = new THREE.Mesh(glowRingGeo, glowMat);
  glowRingMesh.position.z = 0.26;
  glowRingMesh.name = 'Camera_HUD_Ring';
  sensorGroup.add(glowRingMesh);

  drone.add(sensorGroup);

  // 4 Rotor Arms & Engines
  const armAngles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
  const armGroup = new THREE.Group();
  armGroup.name = 'Rotor_Arms_Group';

  armAngles.forEach((angle, idx) => {
    const singleArm = new THREE.Group();
    singleArm.name = `Arm_Unit_0${idx + 1}`;

    const dist = 1.8;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;

    // Arm Tube
    const tubeGeo = new THREE.CylinderGeometry(0.08, 0.08, dist, 12);
    tubeGeo.rotateZ(Math.PI / 2);
    tubeGeo.rotateY(-angle);
    const tubeMesh = new THREE.Mesh(tubeGeo, carbonMat);
    tubeMesh.position.set(x / 2, 0, z / 2);
    tubeMesh.name = `Carbon_Arm_Strut_0${idx + 1}`;
    singleArm.add(tubeMesh);

    // Motor Pod
    const motorGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.3, 16);
    const motorMesh = new THREE.Mesh(motorGeo, chromeMat);
    motorMesh.position.set(x, 0.1, z);
    motorMesh.name = `Motor_Housing_0${idx + 1}`;
    singleArm.add(motorMesh);

    // Motor LED
    const ledGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const ledMesh = new THREE.Mesh(ledGeo, glowMat);
    ledMesh.position.set(x, -0.1, z);
    ledMesh.name = `Navigation_LED_0${idx + 1}`;
    singleArm.add(ledMesh);

    // Guard Ring
    const guardGeo = new THREE.TorusGeometry(0.7, 0.03, 12, 32);
    const guardMesh = new THREE.Mesh(guardGeo, carbonMat);
    guardMesh.rotation.x = Math.PI / 2;
    guardMesh.position.set(x, 0.2, z);
    guardMesh.name = `Rotor_Guard_0${idx + 1}`;
    singleArm.add(guardMesh);

    // Blades
    const bladeGroup = new THREE.Group();
    bladeGroup.name = `Rotor_Blades_Spin_0${idx + 1}`;
    bladeGroup.position.set(x, 0.22, z);

    const b1Geo = new THREE.BoxGeometry(1.2, 0.02, 0.1);
    const b1Mesh = new THREE.Mesh(b1Geo, propMat);
    b1Mesh.name = `Blade_A_0${idx + 1}`;
    bladeGroup.add(b1Mesh);

    const b2Geo = new THREE.BoxGeometry(0.1, 0.02, 1.2);
    const b2Mesh = new THREE.Mesh(b2Geo, propMat);
    b2Mesh.name = `Blade_B_0${idx + 1}`;
    bladeGroup.add(b2Mesh);

    singleArm.add(bladeGroup);
    armGroup.add(singleArm);
  });

  drone.add(armGroup);

  // Landing Gear Struts
  const gearGroup = new THREE.Group();
  gearGroup.name = 'Landing_Skids_Group';

  const skidMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
  [-0.6, 0.6].forEach((xOffset, i) => {
    const skidBarGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.2, 12);
    skidBarGeo.rotateX(Math.PI / 2);
    const skidBar = new THREE.Mesh(skidBarGeo, skidMat);
    skidBar.position.set(xOffset, -0.7, 0);
    skidBar.name = `Landing_Skid_Rail_${i === 0 ? 'Left' : 'Right'}`;
    gearGroup.add(skidBar);

    [-0.5, 0.5].forEach((zOffset, j) => {
      const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 12);
      const legMesh = new THREE.Mesh(legGeo, skidMat);
      legMesh.position.set(xOffset, -0.4, zOffset);
      legMesh.name = `Skid_Support_Leg_${i}_${j}`;
      gearGroup.add(legMesh);
    });
  });

  drone.add(gearGroup);

  return drone;
}

function createMechanicalEngine(): THREE.Group {
  const engine = new THREE.Group();
  engine.name = 'Engine_Drive_Gearbox';

  const steelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2, name: 'Forged_Steel' });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.25, name: 'Bronze_Bearing' });
  const darkIronMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.5, name: 'Cast_Iron_Block' });
  const redCapMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.5, roughness: 0.3, name: 'Valve_Cover_Accent' });

  // Base Housing Block
  const blockGeo = new THREE.BoxGeometry(3.0, 1.2, 1.8);
  const blockMesh = new THREE.Mesh(blockGeo, darkIronMat);
  blockMesh.position.y = 0;
  blockMesh.name = 'Main_Engine_Crankcase';
  engine.add(blockMesh);

  // Main Driveshaft
  const shaftGeo = new THREE.CylinderGeometry(0.2, 0.2, 4.2, 24);
  shaftGeo.rotateZ(Math.PI / 2);
  const shaftMesh = new THREE.Mesh(shaftGeo, steelMat);
  shaftMesh.name = 'Primary_Driveshaft';
  engine.add(shaftMesh);

  // 3 Spur Gears along shaft
  const gearsGroup = new THREE.Group();
  gearsGroup.name = 'Gear_Train_Assembly';

  const gearPositions = [
    { x: -0.9, radius: 0.9, teeth: 16, width: 0.3, name: 'Drive_Gear_Large' },
    { x: 0.0, radius: 0.6, teeth: 12, width: 0.35, name: 'Intermediate_Gear' },
    { x: 0.9, radius: 1.1, teeth: 20, width: 0.25, name: 'Output_Spur_Gear' }
  ];

  gearPositions.forEach((g) => {
    const gearGeo = new THREE.CylinderGeometry(g.radius, g.radius, g.width, 24);
    gearGeo.rotateZ(Math.PI / 2);
    const gearMesh = new THREE.Mesh(gearGeo, steelMat);
    gearMesh.position.x = g.x;
    gearMesh.name = g.name;

    // Add tooth ridges around rim
    for (let t = 0; t < g.teeth; t++) {
      const angle = (t / g.teeth) * Math.PI * 2;
      const toothGeo = new THREE.BoxGeometry(g.width + 0.02, 0.12, 0.1);
      const tooth = new THREE.Mesh(toothGeo, brassMat);
      tooth.position.set(
        g.x,
        Math.cos(angle) * (g.radius + 0.05),
        Math.sin(angle) * (g.radius + 0.05)
      );
      tooth.rotation.x = angle;
      tooth.name = `${g.name}_Tooth_${t + 1}`;
      gearMesh.add(tooth);
    }
    gearsGroup.add(gearMesh);
  });

  engine.add(gearsGroup);

  // Cylinders & Pistons Header
  const cylindersGroup = new THREE.Group();
  cylindersGroup.name = 'Cylinder_Head_Group';

  [-1.0, -0.33, 0.33, 1.0].forEach((xPos, idx) => {
    const cylGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.4, 16);
    const cylMesh = new THREE.Mesh(cylGeo, steelMat);
    cylMesh.position.set(xPos, 1.1, 0);
    cylMesh.name = `Cylinder_Bore_0${idx + 1}`;
    cylindersGroup.add(cylMesh);

    const capGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.2, 16);
    const capMesh = new THREE.Mesh(capGeo, redCapMat);
    capMesh.position.set(xPos, 1.8, 0);
    capMesh.name = `Valve_Cover_0${idx + 1}`;
    cylindersGroup.add(capMesh);
  });

  engine.add(cylindersGroup);

  // Flywheel
  const flywheelGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.25, 32);
  flywheelGeo.rotateZ(Math.PI / 2);
  const flywheelMesh = new THREE.Mesh(flywheelGeo, brassMat);
  flywheelMesh.position.x = 2.2;
  flywheelMesh.name = 'Heavy_Balance_Flywheel';
  engine.add(flywheelMesh);

  return engine;
}

function createMarsRover(): THREE.Group {
  const rover = new THREE.Group();
  rover.name = 'Mars_Rover_Vehicle';

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.6, roughness: 0.3, name: 'Rover_Chassis_White' });
  const goldFoilMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.9, roughness: 0.1, name: 'Thermal_Gold_Foil' });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.4, name: 'Aluminum_Tread_Wheel' });
  const solarMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.7, roughness: 0.2, name: 'Solar_Cell_Panel' });

  // Main Body Box
  const bodyGeo = new THREE.BoxGeometry(2.2, 0.8, 1.6);
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.position.y = 0.8;
  bodyMesh.name = 'Chassis_Equipment_Bay';
  rover.add(bodyMesh);

  // Gold Thermal Blanket Wrap
  const goldWrapGeo = new THREE.BoxGeometry(2.0, 0.4, 1.4);
  const goldWrapMesh = new THREE.Mesh(goldWrapGeo, goldFoilMat);
  goldWrapMesh.position.y = 1.0;
  goldWrapMesh.name = 'Thermal_Insulation_Core';
  rover.add(goldWrapMesh);

  // Solar Array Wing
  const solarGeo = new THREE.BoxGeometry(2.6, 0.05, 1.8);
  const solarMesh = new THREE.Mesh(solarGeo, solarMat);
  solarMesh.position.y = 1.25;
  solarMesh.name = 'Solar_Panel_Array';
  rover.add(solarMesh);

  // Mast Camera Sensor
  const mastGroup = new THREE.Group();
  mastGroup.name = 'MastCam_Assembly';
  mastGroup.position.set(0.8, 1.3, 0.4);

  const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.0, 12);
  const poleMesh = new THREE.Mesh(poleGeo, bodyMat);
  poleMesh.position.y = 0.5;
  poleMesh.name = 'Mast_Structural_Pole';
  mastGroup.add(poleMesh);

  const headGeo = new THREE.BoxGeometry(0.4, 0.25, 0.3);
  const headMesh = new THREE.Mesh(headGeo, goldFoilMat);
  headMesh.position.y = 1.0;
  headMesh.name = 'Stereo_Panoramic_Head';
  mastGroup.add(headMesh);

  rover.add(mastGroup);

  // 6 Wheels Rocker-Bogie Suspension
  const wheelGroup = new THREE.Group();
  wheelGroup.name = 'Rocker_Bogie_Suspension';

  const wheelPositions = [
    { x: -1.2, z: -1.1, name: 'Wheel_Rear_Left' },
    { x: 0.0, z: -1.2, name: 'Wheel_Mid_Left' },
    { x: 1.2, z: -1.1, name: 'Wheel_Front_Left' },
    { x: -1.2, z: 1.1, name: 'Wheel_Rear_Right' },
    { x: 0.0, z: 1.2, name: 'Wheel_Mid_Right' },
    { x: 1.2, z: 1.1, name: 'Wheel_Front_Right' }
  ];

  wheelPositions.forEach((w) => {
    const wGroup = new THREE.Group();
    wGroup.name = w.name;
    wGroup.position.set(w.x, 0.35, w.z);

    const wGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 20);
    wGeo.rotateX(Math.PI / 2);
    const wMesh = new THREE.Mesh(wGeo, wheelMat);
    wMesh.name = `${w.name}_Tire`;
    wGroup.add(wMesh);

    // Hub
    const hubGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.32, 12);
    hubGeo.rotateX(Math.PI / 2);
    const hubMesh = new THREE.Mesh(hubGeo, goldFoilMat);
    hubMesh.name = `${w.name}_Titanium_Hub`;
    wGroup.add(hubMesh);

    wheelGroup.add(wGroup);
  });

  rover.add(wheelGroup);

  return rover;
}

function createArchitecturalPavilion(): THREE.Group {
  const villa = new THREE.Group();
  villa.name = 'Architectural_Modern_Villa';

  const concreteMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8, name: 'Exposed_Smooth_Concrete' });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6, name: 'Teak_Wood_Decking' });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x93c5fd,
    transmission: 0.9,
    opacity: 0.4,
    transparent: true,
    roughness: 0.05,
    name: 'Glazing_Curtain_Wall'
  });
  const poolWaterMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, name: 'Reflective_Pool_Water' });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3, name: 'Black_Steel_Frame' });

  // Base Deck Platform
  const deckGeo = new THREE.BoxGeometry(6.0, 0.3, 4.0);
  const deckMesh = new THREE.Mesh(deckGeo, woodMat);
  deckMesh.position.y = 0;
  deckMesh.name = 'Outdoor_Teak_Plaza_Deck';
  villa.add(deckMesh);

  // Swimming Pool Cutout
  const poolGeo = new THREE.BoxGeometry(2.5, 0.25, 1.8);
  const poolMesh = new THREE.Mesh(poolGeo, poolWaterMat);
  poolMesh.position.set(1.5, 0.05, 1.0);
  poolMesh.name = 'Infinity_Lap_Pool';
  villa.add(poolMesh);

  // Main Ground Floor Box
  const groundFloorGeo = new THREE.BoxGeometry(3.5, 1.8, 2.5);
  const groundFloorMesh = new THREE.Mesh(groundFloorGeo, glassMat);
  groundFloorMesh.position.set(-1.0, 1.0, -0.5);
  groundFloorMesh.name = 'Living_Room_Glazed_Pavilion';
  villa.add(groundFloorMesh);

  // Ground Columns
  [-2.6, 0.6].forEach((x) => {
    [-1.6, 0.6].forEach((z) => {
      const colGeo = new THREE.BoxGeometry(0.12, 1.8, 0.12);
      const colMesh = new THREE.Mesh(colGeo, steelMat);
      colMesh.position.set(x, 1.0, z);
      colMesh.name = `Steel_Structural_Column_${x}_${z}`;
      villa.add(colMesh);
    });
  });

  // Second Floor Cantilever Slab
  const slabGeo = new THREE.BoxGeometry(4.2, 0.25, 3.0);
  const slabMesh = new THREE.Mesh(slabGeo, concreteMat);
  slabMesh.position.set(-0.8, 2.0, -0.5);
  slabMesh.name = 'Cantilevered_Second_Floor_Slab';
  villa.add(slabMesh);

  // Upper Floor Bedroom Box
  const upperGeo = new THREE.BoxGeometry(3.0, 1.6, 2.2);
  const upperMesh = new THREE.Mesh(upperGeo, concreteMat);
  upperMesh.position.set(-0.5, 2.9, -0.5);
  upperMesh.name = 'Private_Bedroom_Volume';
  villa.add(upperMesh);

  // Upper Glass Window Band
  const windowGeo = new THREE.BoxGeometry(2.8, 0.8, 0.1);
  const windowMesh = new THREE.Mesh(windowGeo, glassMat);
  windowMesh.position.set(-0.5, 2.9, 0.6);
  windowMesh.name = 'Panoramic_Upper_Ribbon_Window';
  villa.add(windowMesh);

  // Roof Overhang Slab
  const roofGeo = new THREE.BoxGeometry(4.8, 0.2, 3.4);
  const roofMesh = new THREE.Mesh(roofGeo, concreteMat);
  roofMesh.position.set(-0.8, 3.8, -0.5);
  roofMesh.name = 'Flat_Roof_Overhang';
  villa.add(roofMesh);

  return villa;
}

function createArticulatedRobot(): THREE.Group {
  const robot = new THREE.Group();
  robot.name = 'Bipedal_Industrial_Mech';

  const armorMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.7, roughness: 0.3, name: 'Cobalt_Armor_Plating' });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.2, name: 'Titanium_Exoskeleton' });
  const visorMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.9, name: 'Red_Optical_Visor' });

  // Pelvis / Waist
  const waistGeo = new THREE.BoxGeometry(1.0, 0.4, 0.6);
  const waistMesh = new THREE.Mesh(waistGeo, frameMat);
  waistMesh.position.y = 1.8;
  waistMesh.name = 'Pelvis_Actuator_Unit';
  robot.add(waistMesh);

  // Torso / Chest
  const chestGeo = new THREE.BoxGeometry(1.4, 1.2, 0.9);
  const chestMesh = new THREE.Mesh(chestGeo, armorMat);
  chestMesh.position.y = 2.6;
  chestMesh.name = 'Upper_Torso_Chassis';
  robot.add(chestMesh);

  // Head
  const headGroup = new THREE.Group();
  headGroup.name = 'Head_Sensors_Module';
  headGroup.position.set(0, 3.4, 0);

  const headGeo = new THREE.BoxGeometry(0.5, 0.4, 0.5);
  const headMesh = new THREE.Mesh(headGeo, frameMat);
  headMesh.name = 'Head_Housing';
  headGroup.add(headMesh);

  const visorGeo = new THREE.BoxGeometry(0.4, 0.12, 0.1);
  const visorMesh = new THREE.Mesh(visorGeo, visorMat);
  visorMesh.position.set(0, 0.05, 0.26);
  visorMesh.name = 'Targeting_Visor';
  headGroup.add(visorMesh);

  robot.add(headGroup);

  // 2 Legs
  [-0.6, 0.6].forEach((x, idx) => {
    const legGroup = new THREE.Group();
    legGroup.name = `Leg_Assembly_${idx === 0 ? 'Left' : 'Right'}`;

    // Thigh
    const thighGeo = new THREE.CylinderGeometry(0.18, 0.15, 0.9, 12);
    const thighMesh = new THREE.Mesh(thighGeo, frameMat);
    thighMesh.position.set(x, 1.2, 0);
    thighMesh.name = `Thigh_Strut_${idx}`;
    legGroup.add(thighMesh);

    // Shin
    const shinGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.9, 12);
    const shinMesh = new THREE.Mesh(shinGeo, armorMat);
    shinMesh.position.set(x, 0.5, 0.05);
    shinMesh.name = `Shin_Guard_${idx}`;
    legGroup.add(shinMesh);

    // Foot
    const footGeo = new THREE.BoxGeometry(0.4, 0.2, 0.7);
    const footMesh = new THREE.Mesh(footGeo, frameMat);
    footMesh.position.set(x, 0.1, 0.15);
    footMesh.name = `Stabilizer_Foot_${idx}`;
    legGroup.add(footMesh);

    robot.add(legGroup);
  });

  // 2 Arms
  [-0.95, 0.95].forEach((x, idx) => {
    const armGroup = new THREE.Group();
    armGroup.name = `Arm_Manipulator_${idx === 0 ? 'Left' : 'Right'}`;

    // Shoulder Pad
    const shoulderGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const shoulderMesh = new THREE.Mesh(shoulderGeo, armorMat);
    shoulderMesh.position.set(x, 2.8, 0);
    shoulderMesh.name = `Shoulder_Pauldrons_${idx}`;
    armGroup.add(shoulderMesh);

    // Bicep
    const bicepGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.7, 12);
    const bicepMesh = new THREE.Mesh(bicepGeo, frameMat);
    bicepMesh.position.set(x, 2.2, 0);
    bicepMesh.name = `Upper_Arm_Piston_${idx}`;
    armGroup.add(bicepMesh);

    // Forearm
    const forearmGeo = new THREE.BoxGeometry(0.35, 0.7, 0.35);
    const forearmMesh = new THREE.Mesh(forearmGeo, armorMat);
    forearmMesh.position.set(x, 1.5, 0.1);
    forearmMesh.name = `Hydraulic_Forearm_${idx}`;
    armGroup.add(forearmMesh);

    robot.add(armGroup);
  });

  return robot;
}
