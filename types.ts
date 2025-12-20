export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Particle extends Point3D {
  color: string;
  size: number;
  originalX: number;
  originalY: number;
  originalZ: number;
  type: 'needle' | 'light' | 'ornament' | 'star';
  phase: number; // For animation (twinkling)
  alpha: number;
}

export interface TreeSettings {
  rotationSpeed: number;
  lightColor: 'warm' | 'cool' | 'multicolor';
  snowDensity: number;
  musicEnabled: boolean;
  isAutoRotating: boolean;
}
