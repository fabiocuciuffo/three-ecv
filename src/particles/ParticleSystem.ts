import * as CANNON from "cannon"
import {
    Scene,
    Vector3,
    InstancedMesh,
    SphereGeometry,
    MeshBasicMaterial,
    Matrix4,
} from "three"

import SkibidiAudio from "../audio/diarhee.mp3"
import ScreamAudio from "../audio/scream.mp3" // Importer le nouveau son de cri

export class ParticleSystem {
    private readonly world: CANNON.World
    private readonly scene: Scene
    private particles: Particle[] = []
    private readonly diarrheaAudio: HTMLAudioElement // Renommé pour clarité
    private readonly screamAudio: HTMLAudioElement // Nouveau son de cri
    private readonly instancedMesh: InstancedMesh
    private readonly particleCount: number = 1000
    private currentParticleIndex: number = 0

    public constructor(world: CANNON.World, scene: Scene) {
        this.world = world
        this.scene = scene
        
        // Initialiser les deux sons
        this.diarrheaAudio = new Audio(SkibidiAudio)
        this.diarrheaAudio.loop = true
        
        this.screamAudio = new Audio(ScreamAudio)
        this.screamAudio.loop = true // Changé à true pour permettre la lecture en boucle
        
        this.setupEventListeners()
        this.startParticleCheck()

        const radius = 0.1 * (1 / 3) // Reduce radius by 2/3
        const geometry = new SphereGeometry(radius, 8, 8)
        const material = new MeshBasicMaterial({ color: 0x8b4513 })
        this.instancedMesh = new InstancedMesh(
            geometry,
            material,
            this.particleCount
        )
        this.instancedMesh.visible = false // Hide the instanced mesh initially
        this.scene.add(this.instancedMesh)
    }

    private setupEventListeners(): void {
        window.addEventListener("keydown", this.onKeyDown.bind(this))
        window.addEventListener("keyup", this.onKeyUp.bind(this))
    }

    private startParticleCheck(): void {
        setInterval(() => {
            this.update()
        }, 200)
    }

    private onKeyDown(event: KeyboardEvent): void {
        if (event.code === "Space" && event.shiftKey) {
            this.instancedMesh.visible = true // Show the instanced mesh when space and shift are pressed
            const modelPosition = this.getModelPosition()
            if (modelPosition) {
                // Jouer les deux sons
                this.playDiarrhea()
                this.playScream()
                
                this.emitParticlesUnderModel(modelPosition)
            }
        } else if (event.code === "Space" && !event.shiftKey) {
            this.instancedMesh.visible = true // Show the instanced mesh when space is pressed
            const modelPosition = this.getModelPosition()
            if (modelPosition) {
                // Jouer seulement le son de diarrhée
                this.playDiarrhea()
                
                this.emitParticles(modelPosition)
            }
        }
    }
    
    // Méthode pour jouer le son de diarrhée
    private playDiarrhea(): void {
        if (this.diarrheaAudio.paused) {
            this.diarrheaAudio.currentTime = 0
            this.diarrheaAudio.play().catch((error) => {
                console.error("Diarrhea audio playback failed:", error)
            })
        }
    }
    
    // Méthode pour jouer le son de cri
    private playScream(): void {
        if (this.screamAudio.paused) {  // Ajouté une vérification comme pour diarrheaAudio
            this.screamAudio.currentTime = 0
            this.screamAudio.play().catch((error) => {
                console.error("Scream audio playback failed:", error)
            })
        }
    }

    private getModelPosition(): Vector3 | null {
        const model = this.scene.getObjectByName("toiletModel")
        if (model) {
            return model.position.clone()
        }
        return null // Return null if model is not found
    }

    private onKeyUp(event: KeyboardEvent): void {
        if (event.code === "Space") {
            // Arrêter les deux sons
            this.diarrheaAudio.pause()
            this.screamAudio.pause()  // Ajouter cette ligne pour arrêter le son de cri
            
            if (this.particles.length === 0) {
                this.instancedMesh.visible = false // Hide the instanced mesh if no particles are present
            }
        }
    }

    public emitParticles(position: Vector3): void {
        if (!position) return // Ensure position is valid
        const newPosition = position.clone()
        for (let i = 0; i < 10; i++) {
            const particle = new Particle(this.world, newPosition, this.getFirstUnusedIndex(), 1)
            this.particles.push(particle)
            this.updateInstancedMesh(particle, this.currentParticleIndex)
            this.currentParticleIndex =
                (this.currentParticleIndex + 1) % this.particleCount
        }
        this.removeOldParticles()
    }

    public emitParticlesUnderModel(position: Vector3): void {
        if (!position) return // Ensure position is valid
        const underPosition = position.clone() // Adjust the position to be under the model
        for (let i = 0; i < 10; i++) {
            const particle = new Particle(this.world, underPosition, this.getFirstUnusedIndex(), -1.5)
            this.particles.push(particle)
            this.updateInstancedMesh(particle, this.currentParticleIndex)
            this.currentParticleIndex =
                (this.currentParticleIndex + 1) % this.particleCount
        }
        this.removeOldParticles()
    }

    private getFirstUnusedIndex(): number {
      for (let index = 0; index < this.particles.length; index++) {
        if(!this.particles[index]){
          return index
        }
      }
      return 0
    }

    private updateInstancedMesh(particle: Particle, index: number): void {
        const matrix = new Matrix4().makeTranslation(
            particle.body.position.x,
            particle.body.position.y,
            particle.body.position.z
        )
        this.instancedMesh.setMatrixAt(index, matrix)
        this.instancedMesh.instanceMatrix.needsUpdate = true
    }

    private removeOldParticles(): void {
        while (this.particles.length > this.particleCount) {
            const oldestParticle = this.particles.shift()
            if (oldestParticle) {
                this.world.remove(oldestParticle.body)
            }
        }
    }

    public update(): void {
        const deltaTime = 1 / 60
        this.particles = this.particles.filter((particle, index) => {
          particle.lifetime -= deltaTime
          if (particle.isExpired()) {
            this.world.remove(particle.body)
            this.instancedMesh.setMatrixAt(particle.index, new Matrix4()) // Clear the matrix of the expired particle
            this.instancedMesh.instanceMatrix.needsUpdate = true
            return false
          }
          this.updateInstancedMesh(particle, index)
            return true
        })
    }

    public dispose(): void {
        this.particles.forEach((particle) => {
            this.world.remove(particle.body)
        })
        this.particles = []
        
        // S'assurer que les deux sons sont arrêtés et déchargés
        this.diarrheaAudio.pause()
        this.diarrheaAudio.src = ""
        
        this.screamAudio.pause()
        this.screamAudio.src = ""
        
        window.removeEventListener("keydown", this.onKeyDown.bind(this))
        window.removeEventListener("keyup", this.onKeyUp.bind(this))
    }
}

export class Particle {
    public body: CANNON.Body
    public lifetime: number = 5 // Set lifetime to 5 seconds
    private age: number = 0
    public index : number

    public constructor(world: CANNON.World, position: Vector3, index: number, directionY:number = 1) {
      this.index = index
        const radius = 0.1 * (1 / 3) // Reduce radius by 2/3
        const sphereShape = new CANNON.Sphere(radius)
        this.body = new CANNON.Body({
            mass: 0.2,
            shape: sphereShape,
            position: new CANNON.Vec3(position.x, position.y, position.z),
        })
        this.body.velocity.set(
            (Math.random() - 0.5) * 2,
            Math.random() * 5 * directionY,
            (Math.random() - 0.5) * 2
        )
        world.addBody(this.body)
    }

    public update(): void {
        this.age += 1 / 60
    }

    public isExpired(): boolean {
        return this.age > this.lifetime
    }

    public dispose(): void {
        this.body.world?.remove(this.body)
    }
}
