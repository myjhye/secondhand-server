// 1. HTML에서 "message"라는 ID를 가진 요소를 찾아서 변수에 저장
const messageTag = document.getElementById("message");


// 2. 페이지의 DOM이 완전히 로드된 후 실행될 이벤트 리스너를 등록
window.addEventListener("DOMContentLoaded", async () => {
  
  // URLSearchParams(window.location.search)
  // 예: example.com?token=abc&id=123 에서 params.token은 "abc"를, params.id는 "123"을 반환
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => {
      return searchParams.get(prop);
    },
  });


  // 3. URL에서 token과 id 파라미터 값을 추출
  const token = params.token;
  const id = params.id;


  // 4. 서버의 "/auth/verify" 엔드포인트로 POST 요청 전송
  const res = await fetch("/auth/verify", {
    method: "POST",
    body: JSON.stringify({ token, id }), // token과 id를 JSON 형식으로 전송
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
  });



  // 5. 서버 응답이 성공적이지 않은 경우(HTTP 상태 코드가 200-299 범위가 아닌 경우)
  if (!res.ok) {
    const { message } = await res.json(); // 응답 본문에서 오류 메시지를 추출
    messageTag.innerText = message; // 오류 메시지를 화면에 표시
    messageTag.classList.add("error"); // 오류 스타일을 적용하기 위해 CSS 클래스 추가
    return;
  }

  // 6. 서버 응답이 성공적인 경우, 응답 본문에서 메시지를 추출
  const { message } = await res.json();
  // 성공 메시지를 화면에 표시
  messageTag.innerText = message;
});