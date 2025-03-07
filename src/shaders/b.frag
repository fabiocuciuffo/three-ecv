precision highp float;

uniform float time;
uniform sampler2D noiseMap;

in vec2 vUv;

void main() {
  csm_DiffuseColor = vec4(sin(vUv.x * 10. + time / 1.) * cos(vUv.y * 10. + time / 2.), 0., 0., 1.);
}
