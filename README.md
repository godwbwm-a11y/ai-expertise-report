# AI 시대, 전문성의 힘 🧭

Anthropic의 연구 보고서 **["Agentic coding and persistent returns to expertise"](https://www.anthropic.com/research/claude-code-expertise)** 의 내용을 한국어로 쉽게 풀어 소개하는 인터랙티브 웹사이트입니다.

> **핵심 메시지:** AI를 잘 쓰는 사람은 *코딩을 잘하는 사람*이 아니라, *자기 일을 깊이 이해하는 사람*입니다.

## 주요 내용

1. 📊 **데이터로 보는 전문성의 격차** — 성공률·작업량·포기율을 애니메이션 차트로
2. ✅ **AI를 잘 쓰는 사람의 7가지 특징** — 직장인 AX 전환 가이드
3. ✕ **AI를 잘 못 쓰는 사람의 특징과 방향 전환법** — 관리자용 업무 재배치 조언 포함
4. 🌱 **AI 시대 자녀 교육 가이드** — 초·중학생 부모를 위한 연령별 실천법
5. 💬 **보고서 기반 챗봇** — 궁금한 점을 바로 질문 (OpenRouter · `openai/gpt-5.2`)

- 모바일 우선(반응형) · PC 대응 · 스크롤 애니메이션 · 다크/크림 섹션 디자인

## 기술 구성

| 영역 | 내용 |
|---|---|
| 프론트엔드 | 순수 HTML/CSS/JS (프레임워크 없음, 빠른 로딩) |
| 챗봇 백엔드 | Netlify Functions (`netlify/functions/chat.js`) |
| LLM | OpenRouter 경유 `openai/gpt-5.2` |
| 배포 | Netlify |

## 로컬 실행

```bash
npm install -g netlify-cli   # 최초 1회
netlify dev                  # http://localhost:8888
```

## 환경변수 (중요 🔐)

API 키는 **코드에 절대 포함하지 않습니다.** Netlify 환경변수로만 관리합니다.

| 변수명 | 설명 |
|---|---|
| `OPENROUTER_API_KEY` | OpenRouter API 키 (챗봇용) |

설정 방법:
```bash
netlify env:set OPENROUTER_API_KEY "sk-or-..."
```
또는 Netlify 대시보드 → Site settings → Environment variables.

## 폴더 구조

```
.
├── index.html              # 메인 페이지
├── assets/
│   ├── style.css           # 스타일 (반응형)
│   └── app.js              # 인터랙션 + 챗봇 클라이언트
├── netlify/functions/
│   └── chat.js             # 챗봇 서버리스 함수 (OpenRouter 프록시)
├── netlify.toml            # Netlify 빌드/헤더 설정
└── package.json
```

## 면책

본 사이트는 원문 보고서를 쉽게 소개하기 위한 **비공식** 안내 페이지입니다. 모든 수치는 원문을 근거로 하며, 챗봇 답변은 참고용입니다.
