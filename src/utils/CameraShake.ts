import { PerspectiveCamera, Vector3 } from "three";

export class CameraShake {
	private readonly camera: PerspectiveCamera;
	private readonly initialPosition: Vector3; // Position initiale de la caméra
	private readonly originalPosition: Vector3; // Position avant le shake
	private shakeIntensity = 0;
	private decayRate = 0.9; // How quickly the shake effect fades
	private maxShakeIntensity = 1.0; // Maximum shake intensity
	private time = 0;
	private isActive = false; // Flag to track if shaking is currently active

	constructor(camera: PerspectiveCamera) {
		this.camera = camera;
		// Stocker la position initiale de la caméra
		this.initialPosition = camera.position.clone();
		this.originalPosition = camera.position.clone();
		console.log("Camera shake initialized with position:", this.initialPosition);
	}

	public trigger(): void {
		// Set shake to maximum when triggered
		this.shakeIntensity = this.maxShakeIntensity;
		// Store current position as original to shake around
		this.originalPosition.copy(this.camera.position);
		this.isActive = true;
		console.log("Camera shake triggered, original position:", this.originalPosition);
	}
	
	public stop(): void {
		// Force immediate stop of shaking effect
		this.shakeIntensity = 0;
		this.isActive = false;
		
		// Restaurer la position initiale de la caméra
		console.log("Restoring camera to initial position:", this.initialPosition);
		this.camera.position.copy(this.initialPosition);
	}

	public update(deltaTime: number): void {
		if (!this.isActive) return; // Ne rien faire si pas actif
		
		this.time += deltaTime;

		if (this.shakeIntensity > 0.001) {
			// Calculate shake offset using sine waves for smooth movement
			const shakeX = Math.sin(this.time * 40) * this.shakeIntensity * 0.05;
			const shakeY = Math.cos(this.time * 35) * this.shakeIntensity * 0.05;

			// Apply shake to camera
			this.camera.position.set(
				this.originalPosition.x + shakeX,
				this.originalPosition.y + shakeY,
				this.originalPosition.z,
			);

			// Decay shake intensity over time
			this.shakeIntensity *= this.decayRate;
		} else {
			// Reset camera position when shake ends
			this.stop();
		}
	}

	public isShaking(): boolean {
		return this.isActive;
	}

	public setMaxIntensity(intensity: number): void {
		this.maxShakeIntensity = intensity;
	}

	public setDecayRate(rate: number): void {
		this.decayRate = rate;
	}
	
	public resetInitialPosition(): void {
		this.initialPosition.copy(this.camera.position);
	}
}
