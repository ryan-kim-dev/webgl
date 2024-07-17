// matrix와 color를 uniform 대신 attribute를 사용해 제공한다.
// 각 인스턴스의 행렬과 색상을 버퍼에 입력하고 해당 버퍼로부터 값을 가져오도록 attribute를 설정
attribute mat4 instanceMatrix;
attribute vec3 instanceColor;
// 색상값을 프래그먼트 셰이더로 전달하기 위해 varying으로 정의
varying vec3 vColor;

void main() {
    vColor = instanceColor;
    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}