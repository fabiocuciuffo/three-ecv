import { RawShaderMaterial, GLSL3 } from 'three'
import { Clock, Lifecycle } from '~/core'
import vertexShader from '~/shaders/a.vert'
import fragmentShader from '~/shaders/a.frag'

export interface AMaterialParameters {
  clock: Clock
}

export class AMaterial extends RawShaderMaterial implements Lifecycle {
  public constructor({
    clock
  }: AMaterialParameters) {
    super({
      vertexShader,
      fragmentShader,
      glslVersion: GLSL3,
      uniforms: {
        time: { value: 0 },
        noiseMap: { value: null }
      }
    })

    this.clock = clock
  }

  public async load(): Promise<void> {

  }
}
