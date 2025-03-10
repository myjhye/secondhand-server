import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// 1. 이메일 발송을 위한 전송자(transporter) 설정 (Mailtrap은 실제 이메일을 보내지 않고 개발 환경에서 테스트하기 위한 서비스)
const transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: process.env.MAIL_TRAP_USER,
        pass: process.env.MAIL_TRAP_PASS,
    },
});
  

// 2.  계정 인증 이메일 발송 함수 (사용자가 회원가입 후 이메일 인증을 위한 링크 전송)
const sendVerification = async (email: string, link: string) => {
    await transport.sendMail({
        from: "verification@myapp.com",
        to: email,
        html: `<h1>Please click on <a href="${link}">this link</a> to verify your account.</h1>`,
    });
};


// 3. 비밀번호 재설정 링크 이메일 발송  (사용자가 비밀번호를 잊어버렸을 때 재설정 링크 전송)
const sendPasswordResetLink = async (email: string, link: string) => {
    await transport.sendMail({
        from: "security@myapp.com",
        to: email,
        html: `<h1>Please click on <a href="${link}">this link</a> to update your password.</h1>`,
    });
};

// 4. 비밀번호 변경 완료 알림 이메일 발송 함수 (비밀번호 변경이 성공적으로 완료되었음을 알리기)
const sendPasswordUpdateMessage = async (email: string) => {
    await transport.sendMail({
        from: "security@myapp.com",
        to: email,
        html: `<h1>Your password is updated, you can now use your new password.</h1>`,
    });
};

const mail = {
    sendVerification,
    sendPasswordResetLink,
    sendPasswordUpdateMessage,
};

export default mail;