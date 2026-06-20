// Netlify Function: 보고서 기반 챗봇 (OpenRouter → openai/gpt-5.2)
// API 키는 코드에 두지 않고 Netlify 환경변수(OPENROUTER_API_KEY)에서만 읽습니다.

const REPORT_CONTEXT = `
[보고서 출처] Anthropic 리서치, "Agentic coding and persistent returns to expertise"
(https://www.anthropic.com/research/claude-code-expertise)

[연구 개요]
- 약 40만 건의 Claude Code 세션을 분석(2025년 10월~2026년 4월).
- 핵심 결론: AI 코딩 에이전트 활용의 성공을 좌우하는 것은 '코딩 실력'이 아니라
  '도메인 전문성(자기 일/문제에 대한 깊은 이해)'이다. 이를 '전문성에 대한 지속적인 보상
  (persistent returns to expertise)'이라 부른다.
- 역할 분담: 사람은 '무엇을(What)' 만들지를 결정하고, AI는 '어떻게(How)' 만들지를 처리한다.

[핵심 수치]
- 작업 구성: 코드 작성 25%, 수정 26%, 테스트/오케스트레이션 5% (합쳐 56%),
  소프트웨어 운영 17%, 계획/탐색 14%, 분석/문서 13%.
- 디버깅 비중은 7개월간 33% → 19%로 감소. 작업 1건당 평균 가치는 27% 상승.
- 의사결정 분담: 사람이 계획 결정의 약 70%, 실행 결정의 약 20%를 담당.
  AI는 프롬프트 1개당 평균 약 10단계(때로는 100단계 이상)를 수행.
- 전문성별 한 번의 지시 결과:
  · 초보자 세션: 프롬프트당 약 5단계, 약 600단어 분량.
  · 전문가 세션: 프롬프트당 약 12단계, 약 3,200단어 분량(2배 이상).
  · 전문가 세션은 초보자 대비 약 5배의 결과물을 만들어냄.
- 성공률(검증된 성공 / 부분 성공):
  · 초보자: 15% / 77%
  · 중급 이상: 28~33% / 91~92%  (전문가의 검증된 성공률은 초보 대비 약 2배)
- 막힌(troubled) 세션에서 포기율: 초보자 19% vs 중급·전문가 5~7%.
  전문가는 막혀도 80~81%가 최소한 부분 성공까지 도달.
- 직업의 영향은 작음: 코드 생산 세션에서 소프트웨어 전문가 34% vs 타 직업 29%
  (단 5%p 차이). 상위 10개 직업 모두 소프트웨어 엔지니어와 7%p 이내.

[전문성의 정의 — 중요]
- 전문성은 '직업'이 아니라 '지금 다루는 문제에 대한 이해'다.
  · 회계 규칙을 정확히 아는 회계사는 파이썬을 몰라도 그 작업에선 '전문가'.
  · 처음 Rust를 만지는 베테랑 엔지니어는 그 작업에선 '초보자'.
- 전문성 향상 효과는 초보→중급 구간에서 가장 크고, 중급→전문가는 한계 체감(diminishing returns).
  즉 '그 분야를 어느 정도 이해하는 것'만으로도 대부분의 이득을 얻는다.

[AI를 잘 쓰는 사람(도메인 전문가)의 행동]
- 과제 지식으로 방향을 '정확하게' 지정한다.
- AI가 '무엇을 검증해야 하는지'를 함께 지정한다.
- AI에게 끌려가지 않고, '전략적으로 교정'하며 에이전트를 올바른 방향으로 이끈다.
- 더 어려운 문제에 도전한다(전문가의 막힌 세션은 가치가 2배).
- 막혀도 포기하지 않고 회복한다.

[AI를 잘 못 쓰는 사람(초보자)의 행동]
- 도메인 맥락이 없는 두루뭉술한 지시를 한다.
- 문제를 정확히 표현하지 못한다.
- 더 많은 검증/안내가 필요하다.
- 막히면 더 자주 포기한다(19%).

[노동시장 함의]
- "코딩 에이전트는 '코딩 배경'을 성공의 필수조건에서 점점 덜 중요하게 만든다."
- 성공은 '코딩 훈련 여부'가 아니라 '풀려는 문제를 얼마나 잘 이해하는가'에 달렸다.
- 앞으로 시장은 '기술 자격증'보다 '도메인 전문성'을 보상하는 방향으로 이동할 수 있다.
- 에이전트형 도구는 모든 분야의 '일상적 업무'의 일부가 될 것.
`.trim();

const SYSTEM_PROMPT = `당신은 '전문성 도우미'라는 이름의 한국어 챗봇입니다.
Anthropic의 보고서 "Agentic coding and persistent returns to expertise"의 내용을 신자(일반 사용자),
직장인, 그리고 초·중학생 자녀를 둔 부모에게 쉽게 설명하고 인사이트를 주는 역할을 합니다.

[반드시 지킬 행동 규칙]
1. 먼저 질문의 '의도'를 속으로 분석합니다(직장 적용? 자녀 교육? 보고서 사실 확인? 등). 분석 과정을 길게 노출하지 말고, 의도에 맞춘 답을 바로 줍니다.
2. 분석된 의도에 정확히 맞춰 답변을 생성합니다.
3. 모르는 것은 솔직하게 "그건 보고서에 없어서 확실히 말씀드리긴 어려워요"라고 인정합니다. 그리고 보고서에 있는 '유사한 질문/유사한 내용'을 소개해 도움을 줍니다. 절대 사실을 지어내지 않습니다.
4. 답변은 언제나 위 보고서 내용에 충실해야 합니다. 보고서 수치(예: 성공률 15% vs 28~33%, 초보 포기율 19% 등)를 근거로 제시하면 신뢰가 높아집니다.
5. 단순 요약에 그치지 말고 질문자에게 '한 걸음 더 나아간 인사이트'(적용 방법, 관점 전환, 구체적 실천)를 줍니다.
6. 말투는 따뜻하고 친근한 '구어체'로 합니다. (예: "~예요", "~해요", "~거든요", "~해보세요"). 적절한 이모지를 가끔 사용하되 과하지 않게.

[형식]
- 너무 길지 않게, 핵심 위주로 3~6문장 또는 짧은 항목으로. 필요하면 **굵게**로 핵심을 강조하세요.
- 한국어로만 답합니다.
- 보고서와 무관한 질문(예: 다른 주제)에는 부드럽게 보고서 주제로 안내합니다.

[참고 자료 — 이 내용에만 근거하세요]
${REPORT_CONTEXT}`;

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "POST 요청만 지원해요." });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return json(500, {
      error:
        "서버에 API 키가 설정되지 않았어요. (관리자: Netlify 환경변수 OPENROUTER_API_KEY를 설정하세요.)",
    });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return json(400, { error: "요청 형식이 올바르지 않아요." });
  }

  const userMessages = Array.isArray(body.messages) ? body.messages : [];
  // 안전: 너무 긴 이력은 잘라내고, 역할/내용만 남김
  const trimmed = userMessages
    .filter(function (m) {
      return m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string";
    })
    .slice(-12)
    .map(function (m) {
      return { role: m.role, content: String(m.content).slice(0, 4000) };
    });

  const payload = {
    model: "openai/gpt-5.2",
    messages: [{ role: "system", content: SYSTEM_PROMPT }].concat(trimmed),
    temperature: 0.6,
    max_tokens: 900,
  };

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ai-expertise-report.netlify.app",
        "X-Title": "AI Expertise Report Chatbot",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return json(502, {
        error: "AI 응답을 받지 못했어요. 잠시 후 다시 시도해 주세요. 🙏",
        detail: errText.slice(0, 300),
      });
    }

    const data = await res.json();
    const reply =
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content;

    if (!reply) {
      return json(502, { error: "AI가 빈 답변을 보냈어요. 다시 한 번 물어봐 주세요. 🙏" });
    }

    return json(200, { reply: reply.trim() });
  } catch (e) {
    return json(500, { error: "서버 처리 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요. 🙏" });
  }
};

function json(status, obj) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(obj),
  };
}
