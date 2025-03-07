precision mediump float;

in vec2 vUv;

out vec4 fragColor;

void main() {
  fragColor = vec4(vUv, 1., 1.);
}
