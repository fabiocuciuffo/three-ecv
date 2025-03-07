import { RawShaderMaterial, GLSL3 } from 'three'
import { Lifecycle } from '~/core'
import vertexShader from '~/shaders/a.vert'
import fragmentShader from '~/shaders/a.frag'

export class AMaterial extends RawShaderMaterial implements Lifecycle {
  public constructor() {
    super({
      vertexShader,
      fragmentShader,
      glslVersion: GLSL3,
      uniforms: {
        time: { value: 0 },
        noiseMap: { value: null }
      }
    })
  }

  // public async load(): Promise<void> {

  // }
}
