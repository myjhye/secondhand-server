# Secondhand App Service (React Native + Node.js)

<br>

<p align="center">
  <img src="https://img.shields.io/badge/ReactNative-61DAFB?style=for-the-badge&logo=React&logoColor=black">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=Node.js&logoColor=white">
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white">
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white">
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white">
  <img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white">
</p>

<br>

**중고 상품 등록·검색·거래**, **JWT 기반 사용자 인증**, **AI 챗봇 상담** 기능을 제공하는 풀스택 모바일 앱 서비스입니다.  
**React Native + Node.js + MongoDB**로 구현되었으며, AI 챗봇을 통해 사용자에게 스마트하고 차별화된 거래 경험을 제공합니다.

<br><br>

<img width="1280" height="911" alt="image" src="https://github.com/user-attachments/assets/e9d71cb1-eafb-4aca-babd-d068a4c59593" />


<br><br>

## 목차
- [주요 기능 (Features)](#주요-기능-features)
- [개발 환경 및 실행 구조 (Development Environment & Execution)](#개발-환경-및-실행-구조-development-environment--execution)
- [기술 스택 (Tech Stack)](#기술-스택-tech-stack)
- [문제 해결 및 학습 경험 (Troubleshooting & Learnings)](#문제-해결-및-학습-경험-troubleshooting--learnings)

<br>

## 주요 기능 (Features)

### 사용자 & 인증
- 회원가입, 로그인, 비밀번호 찾기
- JWT 기반 사용자 인증
- 프로필 관리 기능

### 상품 관리
- 상품 등록/조회/수정/삭제 (CRUD)
- 카테고리별 필터링 및 검색
- 최신순/조건별 정렬

### AI 챗봇
- OpenAI API 기반 GPT 챗봇
- 상품 관련 자동 상담 기능 제공

<br>

## 개발 환경 및 실행 구조 (Development Environment & Execution)
- **모바일 앱 개발**  
  - React Native + Expo 기반으로 iOS/Android 크로스플랫폼 앱 개발
  - TypeScript 적용으로 코드 안정성과 유지보수성 강화

- **백엔드 서버**  
  - Node.js + Express.js 기반 REST API 서버 구축
  - JWT를 통한 인증/인가 처리
  - Mongoose를 활용한 MongoDB ODM 모델링

- **데이터베이스**  
  - MongoDB Atlas 클라우드 환경에서 데이터 관리
  - 스키마 설계를 통한 구조화된 데이터 저장

- **개발 및 협업 도구**  
  - Postman을 통한 API 테스트 및 협업
  - VSCode를 중심으로 한 개발 환경 구성

<br>

## 기술 스택 (Tech Stack)

| 구분 | 기술 | 설명 |
|---|---|---|
| **Frontend** | `React Native` | 크로스플랫폼 모바일 앱 개발 |
| | `TypeScript` | 정적 타이핑으로 코드 안정성 확보 |
| | `Expo` | React Native 빌드/런타임 환경 |
| **Backend** | `Node.js`, `Express` | REST API 서버 |
| | `Mongoose` | MongoDB ODM |
| **Database** | `MongoDB` | NoSQL 데이터베이스 |
| **Authentication** | `JWT` | 토큰 기반 인증/인가 |
| **AI** | `OpenAI API` | GPT 챗봇 기능 구현 |
| **Dev Tools** | `VSCode`, `Postman` | 코드 에디터 및 API 테스트 |

<br>

## 문제 해결 및 학습 경험 (Troubleshooting & Learnings)
- **JWT 인증 적용**  
  - 클라이언트-서버 간 안전한 인증/인가 구현
- **MongoDB ODM 사용 경험**  
  - Mongoose를 통한 스키마 설계 및 데이터 유효성 검증 학습
- **AI 챗봇 연동**  
  - OpenAI API를 활용한 대화형 상담 기능 구현
- **Expo 활용 경험**  
  - 모바일 앱 개발과 배포 과정을 간소화
