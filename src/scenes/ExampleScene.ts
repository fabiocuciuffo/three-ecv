import {
  Scene,
  PerspectiveCamera,
  AmbientLight,
  PlaneGeometry,
  MeshBasicMaterial,
  DoubleSide,
  Vector3,
  Mesh,
  DirectionalLight,
  Box3,
  Group,
  Quaternion,
  BoxGeometry,
  BackSide
} from 'three'
import SkibidiToilet from '../../assets/models/toilet.glb'
import * as CANNON from 'cannon'

import type {
  Viewport,
  Clock,
  Lifecycle
} from '~/core'

import { GLTFLoader } from 'three/examples/jsm/Addons.js'
import { ParticleSystem } from '../particles/ParticleSystem' // Import particle system

export interface MainSceneParamaters {
  clock: Clock
  camera: PerspectiveCamera
  viewport: Viewport
}

export class ExampleScene extends Scene implements Lifecycle {
  public clock: Clock
  public camera: PerspectiveCamera
  public viewport: Viewport
  public light1: AmbientLight
  public light2: DirectionalLight
  public gltf: GLTFLoader

  // Three.js objects
  public plane1: Mesh
  public wall1: Mesh
  public wall2: Mesh
  public wall3: Mesh
  public wall4: Mesh
  
  // Cannon.js physics world
  private readonly world: CANNON.World
  
  // Physics bodies
  private readonly planeBody: CANNON.Body
  private readonly wallBodies: CANNON.Body[] = []
  private modelBody: CANNON.Body | null = null
  
  // Model and movement properties
  private loadedModel: Group | null = null
  private readonly moveSpeed: number = 0.2
  private keyState: { [key: string]: boolean } = {
    KeyW: false,
    KeyA: false,
    KeyS: false,
    KeyD: false,
    Space: false
  }

  // Particle system
  private readonly particleSystem: ParticleSystem

  public constructor({
    clock,
    camera,
    viewport
  }: MainSceneParamaters) {
    super()
    this.camera = camera
    this.clock = clock
    this.viewport = viewport
    this.gltf = new GLTFLoader()
    
    // Initialize physics world
    this.world = new CANNON.World()
    this.world.gravity.set(0, -9.82, 0) // Standard gravity

    const planeGeometry = new PlaneGeometry(5, 5)
    const wallGeometry = new BoxGeometry(5, 5, 0.1)
    
    // Plane (floor)
    this.plane1 = new Mesh(
      planeGeometry, 
      new MeshBasicMaterial({ color: 0xffffff, side: DoubleSide })
    )
    this.plane1.position.set(0, 0, 0)
    this.plane1.rotateX(Math.PI / 2)

    // Create floor physics body
    this.planeBody = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Plane()
    })
    this.planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
    this.world.addBody(this.planeBody)

    // Wall 1 (left wall)
    this.wall1 = new Mesh(
      wallGeometry, 
      new MeshBasicMaterial({ color: 0x808080 })
    )
    this.wall1.position.set(-2.5, 2.5, 0)
    this.wall1.rotateY(Math.PI / 2)

    // Wall 1 physics body
    const wall1Body = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Box(new CANNON.Vec3(2.5, 2.5, 0.05))
    })
    wall1Body.position.set(-2.5, 2.5, 0)
    wall1Body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2)
    this.world.addBody(wall1Body)
    this.wallBodies.push(wall1Body)

    // Wall 2 (right wall)
    this.wall2 = new Mesh(
      wallGeometry, 
      new MeshBasicMaterial({ color: 0x808080 })
    )
    this.wall2.position.set(2.5, 2.5, 0)
    this.wall2.rotateY(-Math.PI / 2)

    // Wall 2 physics body
    const wall2Body = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Box(new CANNON.Vec3(2.5, 2.5, 0.05))
    })
    wall2Body.position.set(2.5, 2.5, 0)
    wall2Body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2)
    this.world.addBody(wall2Body)
    this.wallBodies.push(wall2Body)

    // Wall 3 (back wall)
    this.wall3 = new Mesh(
      wallGeometry, 
      new MeshBasicMaterial({ color: 0x808080 })
    )
    this.wall3.position.set(0, 2.5, -2.5)
    this.wall3.rotateY(Math.PI)

    // Wall 3 physics body
    const wall3Body = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Box(new CANNON.Vec3(2.5, 2.5, 0.05))
    })
    wall3Body.position.set(0, 2.5, -2.5)
    wall3Body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI)
    this.world.addBody(wall3Body)
    this.wallBodies.push(wall3Body)

    // Wall 4 (front transparent wall)
    this.wall4 = new Mesh(
      wallGeometry, 
      new MeshBasicMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.2,
        side: BackSide
      })
    )
    this.wall4.position.set(0, 2.5, 2.5)
    this.wall4.rotateY(0)

    // Wall 4 physics body
    const wall4Body = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Box(new CANNON.Vec3(2.5, 2.5, 0.05))
    })
    wall4Body.position.set(0, 2.5, 2.5)
    this.world.addBody(wall4Body)
    this.wallBodies.push(wall4Body)

    this.light1 = new AmbientLight(0xffffff, 5)
    this.light1.position.set(0, 0, 4)

    this.light2 = new DirectionalLight(0xffffff, 6)
    this.light2.position.set(0, 4, 0)

    this.add(
      this.light1,
      this.light2,
      this.plane1,
      this.wall1,
      this.wall2,
      this.wall3,
      this.wall4
    )

    this.particleSystem = new ParticleSystem(this.world, this)

    // Add event listeners for keyboard controls
    window.addEventListener('keydown', this.handleKeyDown.bind(this))
    window.addEventListener('keyup', this.handleKeyUp.bind(this))
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.code === 'KeyW' || event.code === 'KeyA' || 
        event.code === 'KeyS' || event.code === 'KeyD' ||
        event.code === 'Space') {
      this.keyState[event.code] = true
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    if (event.code === 'KeyW' || event.code === 'KeyA' || 
        event.code === 'KeyS' || event.code === 'KeyD' ||
        event.code === 'Space') {
      this.keyState[event.code] = false
    }
  }

  public async load(): Promise<void> {
    this.gltf.load(
      SkibidiToilet,
      (gltf) => {
        const box = new Box3().setFromObject(gltf.scene)
        const height = box.max.y - box.min.y
        const scaleFactor = 1 / height
        
        gltf.scene.scale.set(scaleFactor, scaleFactor, scaleFactor)
        gltf.scene.name = "toiletModel"
        this.loadedModel = gltf.scene
        
        this.add(gltf.scene)

        // Create physics body for the model
        const modelShape = new CANNON.Box(new CANNON.Vec3(0.2, 0.5, 1))
        this.modelBody = new CANNON.Body({
          mass: 10,
          shape: modelShape,
          material: new CANNON.Material('modelMaterial')
        })
        this.modelBody.position.set(0, 1, 0)
        this.world.addBody(this.modelBody)
      },
      (xhr) => {
        console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`)
      },
      (error) => {
        console.error("An error happened", error)
      }
    )
  }

  public update(): void {
    // Step the physics world
    this.world.step(1/60)

    // Update model position and rotation based on physics
    if (this.loadedModel && this.modelBody) {
      // Physics-based movement
      const movement = new Vector3(0, 0, 0)
      
      if (this.keyState['KeyW']) movement.z -= 1
      if (this.keyState['KeyS']) movement.z += 1
      if (this.keyState['KeyA']) movement.x -= 1
      if (this.keyState['KeyD']) movement.x += 1

      // Normalize the movement vector to prevent faster diagonal movement
      if (movement.length() > 0) {
        movement.normalize().multiplyScalar(this.moveSpeed)
        
        // Apply movement to physics body
        this.modelBody.velocity.x = movement.x * 5
        this.modelBody.velocity.z = movement.z * 5

        // Calculate target rotation based on movement
        const targetAngle = Math.atan2(movement.x, movement.z)
        
        // Create a quaternion for the target rotation
        const targetQuaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), targetAngle)
        
        // Smoothly interpolate current rotation to target rotation
        this.loadedModel.quaternion.slerp(targetQuaternion, 0.2)
      } else {
        // Stop the model when no keys are pressed
        this.modelBody.velocity.x = 0
        this.modelBody.velocity.z = 0
      }

      // Sync Three.js model position with physics body
      this.loadedModel.position.copy(this.modelBody.position)
      
      // Space bar animation placeholder
      if (this.keyState['Space']) {
        this.particleSystem.emitParticles(this.loadedModel.position.clone())
      }
    }

    this.particleSystem.update()
  }

  public resize(): void {
    this.camera.aspect = this.viewport.ratio
    this.camera.updateProjectionMatrix()
  }

  public dispose(): void {
    // Clean up event listeners
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)

    // Remove physics bodies
    if (this.modelBody) {
      this.world.remove(this.modelBody)
    }
    this.wallBodies.forEach(body => this.world.remove(body))
    this.world.remove(this.planeBody)

    this.particleSystem.dispose()
  }
}