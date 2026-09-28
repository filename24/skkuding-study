# skkuding-study

스터디용 프로젝트입니다. 각 스터디는 별도의 브랜치에서 진행됩니다.

> 이 `stable` 브랜치에는 스터디 코드가 없습니다. 아래 브랜치로 이동해주세요.

## 스터디 브랜치

- 브랜치 이름 규칙: `day-n-스터디이름` (필요시 `-v2`, `-backend` 처럼 세부 주제 추가)

- [day-2-nestjs](https://github.com/filename24/skkuding-study/tree/day-2-nestjs) — NestJS 백엔드 스터디 (치킨집 CRUD API)
- [day-2-nestjs-frontend](https://github.com/filename24/skkuding-study/tree/day-2-nestjs-frontend) — NestJS API 실습용 교육 사이트 (Vite + React)
- [day-3-nestjs](https://github.com/filename24/skkuding-study/tree/day-3-nestjs) — NestJS 백엔드 스터디 (Guard, Pipe, DTO 검증, 예외, 테스트)
- [day-3-nestjs-frontend](https://github.com/filename24/skkuding-study/tree/day-3-nestjs-frontend) — Day 3 실습용 교육 사이트 (Guard·Pipe 흐름을 직접 재현)

## 프론트엔드 스터디 실행 방법 (day-3-nestjs-frontend)

```bash
git checkout day-3-nestjs-frontend
pnpm install
pnpm dev        # http://localhost:5173
```

서버 없이도 목 데이터로 동작합니다. 실제 응답을 보려면 백엔드를 먼저 켜 두세요.

```bash
git checkout day-3-nestjs
cd chicken-project
pnpm install
pnpm run start:dev    # http://localhost:3000
```

## 브랜치 이동 방법

```bash
git checkout day-n-스터디이름
```
