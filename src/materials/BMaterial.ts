import { MeshStandardMaterial, TextureLoader, RepeatWrapping } from 'three'
import { Clock, Lifecycle } from '~/core'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import vertexShader from '~/shaders/b.vert'
import fragmentShader from '~/shaders/b.frag'
import noiseMapSrc from '~~/assets/textures/texturegna-2.png'

export interface BMaterialParameters {
  clock: Clock
}

export class BMaterial extends CustomShaderMaterial {
  public constructor({
    clock
  }: BMaterialParameters) {
    super({
      vertexShader,
      fragmentShader,
      baseMaterial: MeshStandardMaterial,
      metalness: 0,
      roughness: 0,
      uniforms: {
        noiseMap: { value: null },
        time: { value: 0 }
      }
    })

    console.log(this)

    this.clock = clock
  }

  public async load(): Promise<void> {
    const [noiseMap] = await Promise.all([
      new Promise((resolve, reject) => {
        new TextureLoader().load(noiseMapSrc, resolve, undefined, reject)
      })
    ])

    noiseMap.wrapS = RepeatWrapping
    noiseMap.wrapT = RepeatWrapping

    this.uniforms.noiseMap.value = noiseMap
  }
}
