// attribute는 정점 셰이더에서만 사용 가능. 따라서 varying으로 정점 셰이더에서 프래그먼트 셰이더로 전달받는다.
varying vec3 vColor;

void main() {
    gl_FragColor = vec4(vColor, 1.0);
}