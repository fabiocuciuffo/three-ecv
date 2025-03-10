import { WebGLRenderer, PerspectiveCamera } from 'three'
import { Clock, Loop, Viewport, type Lifecycle } from '~/core'
import type { GUI } from '~/GUI'
import { Composer } from '~/Composer'
import { ExampleScene } from '~/scenes/ExampleScene'

export interface AppParameters {
  canvas?: HTMLCanvasElement | OffscreenCanvas
  debug?: boolean
}

export class App implements Lifecycle {
  public debug: boolean
  public renderer: WebGLRenderer
  public composer: Composer
  public camera: PerspectiveCamera
  public loop: Loop
  public clock: Clock
  public viewport: Viewport
  public scene: ExampleScene
  public gui?: GUI

  public constructor({
    canvas,
    debug = false
  }: AppParameters = {}) {
    this.debug = debug
    this.clock = new Clock()
    this.camera = new PerspectiveCamera(20, 1, 0.1, 100)
    this.camera.position.set(0, 15, 12)
    this.camera.lookAt(0,0,0)
    console.log("Initial camera position in App:", this.camera.position);

    this.renderer = new WebGLRenderer({
      canvas,
      powerPreference: 'high-performance',
      antialias: false,
      stencil: false,
      depth: true
    })

    this.viewport = new Viewport({
      maximumDpr: 2,
      element: this.renderer.domElement,
      resize: this.resize
    })

    this.scene = new ExampleScene({
      viewport: this.viewport,
      camera: this.camera,
      clock: this.clock
    })

    this.composer = new Composer({
      renderer: this.renderer,
      viewport: this.viewport,
      clock: this.clock,
      scene: this.scene,
      camera: this.camera
    })

    this.loop = new Loop({
      tick: this.tick
    })
  }

  /**
   * Load the app with its components and assets
   */
  public async load(): Promise<void> {
    await Promise.all([
      this.composer.load(),
      this.scene.load()
    ])

    if (this.debug) {
      this.gui = new (await import('./GUI')).GUI(this)
    }
  }

  /**
   * Start the app rendering loop
   */
  public start(): void {
    this.viewport.start()
    this.clock.start()
    this.loop.start()
    this.gui?.start()
  }

  /**
   * Stop the app rendering loop
   */
  public stop(): void {
    this.viewport.stop()
    this.loop.stop()
  }

  /**
   * Update the app state, called each loop tick
   */
  public update(): void {
    this.clock.update()
    this.viewport.update()
    this.scene.update()
    this.composer.update()
  }

  /**
   * Render the app with its current state, called each loop tick
   */
  public render(): void {
    this.composer.render()
  }

  /**
   * Stop the app and dispose of used resourcess
   */
  public dispose(): void {
    this.viewport.dispose()
    this.loop.dispose()
    this.scene.dispose()
    this.composer.dispose()
    this.renderer.dispose()
    this.gui?.dispose()
  }

  /**
   * Tick handler called by the loop
   */
  public tick = (): void => {
    // Debug de la position de la caméra toutes les 60 frames environ
    if (Math.random() < 0.017) { // ~1/60
      console.log("Regular camera position check:", this.camera.position);
    }

    this.update()
    this.render()
  }

  /**
   * Resize handler called by the viewport
   */
  public resize = (): void => {
    this.composer.resize()
    this.scene.resize()
  }

  /**
   * Create, load and start an app instance with the given parameters
   */
  public static async mount(parameters: AppParameters): Promise<App> {
    const app = new this(parameters)
    await app.load()
    app.start()

    return app
  }
}
