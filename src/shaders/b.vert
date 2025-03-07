precision highp float;

#define NOISE_SCALE vec2(.75, .75)
#define NOISE_SPEED .05
#define NOISE_AMPLITUDE .2

uniform float time;
uniform sampler2D noiseMap;

out vec2 vUv;

void main() {
  vec4 noiseSampleA = texture(noiseMap, uv * NOISE_SCALE + time * NOISE_SPEED);
  vec4 noiseSampleB = texture(noiseMap, uv * NOISE_SCALE - time * NOISE_SPEED);
  vec4 noiseSample = noiseSampleA + noiseSampleB;
  noiseSample.rgb /= 2.;

  vec3 noiseNormal = normalize(noiseSample.xyz);

  vUv = uv;

  // csm_Position += csm_Normal * (noiseSample.a * 2. - 1.) * NOISE_AMPLITUDE;
  // csm_Normal = normalize(csm_Normal + noiseNormal);
}
