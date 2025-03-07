uniform float uTime;
uniform float uShakeStrength;

varying vec2 vUv;

void main() {
  vUv = uv;
  
  // Original position
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  
  // Apply shake effect when strength > 0
  if (uShakeStrength > 0.0) {
    float shakeX = sin(uTime * 40.0) * uShakeStrength * 0.01;
    float shakeY = cos(uTime * 35.0) * uShakeStrength * 0.01;
    
    projectedPosition.x += shakeX;
    projectedPosition.y += shakeY;
  }
  
  gl_Position = projectedPosition;
}
