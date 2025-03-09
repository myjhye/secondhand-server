## Auth Routes

```
authRouter.post("/sign-up");
authRouter.post("/verify");
authRouter.post("/sign-in");
authRouter.post("/refresh-token");
authRouter.post("/sign-out");
authRouter.get("/profile");
authRouter.get("/profile/:id");
authRouter.post("/verify-token");
authRouter.post("/update-avatar");
authRouter.post("/update-profile");
authRouter.post("/forget-pass");
authRouter.post("/verify-pass-reset-token");
authRouter.post("/reset-pass");
```

- `/sign-up`

1. 입력 데이터(이름, 이메일, 비밀번호) 조회
2. 데이터가 유효한지 검증
3. 유효하지 않으면 오류 메시지 전송
4. 동일한 사용자의 계정이 이미 존재하는지 확인
5. 계정이 존재하면 오류를 보내고, 그렇지 않으면 새 계정을 생성하여 DB에 저장
6. 인증 토큰을 생성하고 저장
7. 등록된 이메일로 토큰이 포함된 인증 링크 전송
8. 이메일 받은편지함을 확인하라는 메시지 전송