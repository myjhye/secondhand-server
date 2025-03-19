// 1. HTML 요소 선택 - 필요한 요소들의 참조 가져오기
const form = document.getElementById("form");
const messageTag = document.getElementById("message");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirm-password");
const notification = document.getElementById("notification");
const submitBtn = document.getElementById("submit");

// 2. 비밀번호 규칙을 위한 정규식 정의 (영문자, 숫자, 특수문자 포함)
const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#\$%\^&\*])[a-zA-Z\d!@#\$%\^&\*]+$/;

// 3. 초기에는 폼을 숨김 (토큰 검증 후 표시)
form.style.display = "none";

// 4. URL 파라미터에서 추출할 토큰과 사용자 ID를 저장할 변수
let token, id;


// 5. 페이지가 완전히 로드된 후 실행될 함수
window.addEventListener("DOMContentLoaded", async () => {
  
  // 6. URL 파라미터를 쉽게 추출하기 위한 Proxy 객체 생성
  // 예: example.com?token=abc&id=123 에서 params.token은 "abc", params.id는 "123" 반환
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => {
      return searchParams.get(prop);
    },
  });
  
  // 7. URL에서 토큰과 ID 파라미터 추출하여 변수에 저장
  token = params.token;
  id = params.id;

  
  // 8. 서버에 토큰 유효성 검증 요청
  const res = await fetch("/auth/verify-pass-reset-token", {
    method: "POST",
    body: JSON.stringify({ token, id }), // 토큰과 ID를 JSON 형식으로 전송
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
  });


  // 9. 토큰 검증 실패 시 오류 메시지 표시
  if (!res.ok) {
    const { message } = await res.json(); // 응답에서 오류 메시지 추출
    messageTag.innerText = message; // 오류 메시지 화면에 표시
    messageTag.classList.add("error"); // 오류 스타일 적용
    return;
  }

  // 10. 토큰 검증 성공 시(valid: true) 메시지 숨기고 비밀번호 변경 폼 표시
  messageTag.style.display = "none";
  form.style.display = "block";
});

// 11. 알림 메시지 표시 함수 (오류 또는 성공 메시지)
const displayNotification = (message, type) => {
  notification.style.display = "block";
  notification.innerText = message;
  notification.classList.add(type); // type은 'error' 또는 'success'
};

// 12. 폼 제출 처리 함수
const handleSubmit = async (evt) => {
  evt.preventDefault();

  // 13. 비밀번호 유효성 검사 (정규식에 맞는지 확인)
  if (!passwordRegex.test(password.value)) {
    return displayNotification(
      "Invalid password use alpha numeric and special chars!",
      "error"
    );
  }

  // 14. 비밀번호와 확인 비밀번호 일치 여부 확인
  if (password.value !== confirmPassword.value) {
    return displayNotification("Password do not match!", "error");
  }

  // 15. 제출 버튼 비활성화 및 로딩 상태 표시
  submitBtn.disabled = true;
  submitBtn.innerText = "Please wait...";

  // 16. 서버에 비밀번호 재설정 요청 전송
  const res = await fetch("/auth/reset-pass", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
    body: JSON.stringify({ // ID, 토큰, 새 비밀번호 전송
        id, token, 
        password: password.value 
    }),
  });

  // 17. 제출 버튼 상태 복원
  submitBtn.disabled = false;
  submitBtn.innerText = "Update Password";

  // 18. 비밀번호 재설정 실패 시 오류 메시지 표시
  if (!res.ok) {
    const { message } = await res.json();
    return displayNotification(message, "error");
  }

  // 19. 비밀번호 재설정 성공 시 성공 메시지 표시 및 폼 숨김
  messageTag.style.display = "block";
  messageTag.innerText = "Your password updated successfully!";
  form.style.display = "none";
};

// 20. 폼 제출 이벤트에 핸들러 연결
form.addEventListener("submit", handleSubmit);