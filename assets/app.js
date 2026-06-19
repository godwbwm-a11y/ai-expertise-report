/* ===== 전문성의 힘 — 인터랙션 ===== */
(function () {
  "use strict";

  /* 진행 바 + 내비 그림자 */
  var progress = document.getElementById("progressBar");
  var topnav = document.getElementById("topnav");
  function onScroll() {
    var h = document.documentElement;
    var scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight);
    progress.style.width = (scrolled * 100).toFixed(1) + "%";
    topnav.classList.toggle("scrolled", h.scrollTop > 20);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* 모바일 메뉴 */
  var navToggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");
  function closeNav() {
    navLinks.classList.remove("open");
    navToggle.classList.remove("active");
    navToggle.setAttribute("aria-expanded", "false");
  }
  navToggle.addEventListener("click", function () {
    var open = navLinks.classList.toggle("open");
    navToggle.classList.toggle("active", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  navLinks.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", closeNav);
  });

  /* reveal on scroll */
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("show");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  document.querySelectorAll(".reveal").forEach(function (el) {
    io.observe(el);
  });

  /* 숫자 카운터 */
  function animateCount(el) {
    var card = el;
    var target = parseFloat(card.dataset.target);
    var prefix = card.dataset.prefix || "";
    var suffix = card.dataset.suffix || "";
    var numEl = card.querySelector(".stat-num");
    var dur = 1600;
    var start = null;
    function fmt(n) {
      if (target >= 1000) return Math.floor(n).toLocaleString("ko-KR");
      return Math.floor(n).toString();
    }
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      numEl.textContent = prefix + fmt(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else numEl.textContent = prefix + fmt(target) + suffix;
    }
    requestAnimationFrame(step);
  }
  var statIO = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          animateCount(e.target);
          statIO.unobserve(e.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  document.querySelectorAll(".stat-card").forEach(function (el) {
    statIO.observe(el);
  });

  /* 막대 차트 애니메이션 */
  var barIO = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var rows = e.target.querySelectorAll(".bar-row");
          rows.forEach(function (r, i) {
            setTimeout(function () {
              r.classList.add("show");
            }, i * 220);
          });
          barIO.unobserve(e.target);
        }
      });
    },
    { threshold: 0.4 }
  );
  var chart = document.getElementById("successChart");
  if (chart) barIO.observe(chart);

  /* ===== 챗봇 ===== */
  var fab = document.getElementById("chatFab");
  var panel = document.getElementById("chatPanel");
  var closeBtn = document.getElementById("chatClose");
  var openBtn = document.getElementById("openChatBtn");
  var messages = document.getElementById("chatMessages");
  var input = document.getElementById("chatInput");
  var sendBtn = document.getElementById("chatSend");

  // 대화 이력 (서버에 전달)
  var history = [];

  function openChat() {
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    fab.style.display = "none";
    setTimeout(function () {
      input.focus();
    }, 300);
  }
  function closeChat() {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    fab.style.display = "flex";
  }
  fab.addEventListener("click", openChat);
  closeBtn.addEventListener("click", closeChat);
  if (openBtn) openBtn.addEventListener("click", openChat);

  /* 추천 질문 칩 */
  document.querySelectorAll(".chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      openChat();
      var q = chip.dataset.q;
      setTimeout(function () {
        sendMessage(q);
      }, 350);
    });
  });

  /* textarea 자동 높이 */
  input.addEventListener("input", function () {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
  });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  sendBtn.addEventListener("click", function () {
    sendMessage();
  });

  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  // 아주 가벼운 마크다운(굵게/줄바꿈/리스트) → HTML
  function renderText(s) {
    var html = escapeHtml(s);
    html = html.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    html = html.replace(/^\s*[-*]\s+(.*)$/gm, "• $1");
    html = html.replace(/\n/g, "<br />");
    return html;
  }

  function addMessage(role, text) {
    var wrap = document.createElement("div");
    wrap.className = "msg " + role;
    var bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerHTML = renderText(text);
    wrap.appendChild(bubble);
    messages.appendChild(wrap);
    messages.scrollTop = messages.scrollHeight;
    return bubble;
  }

  function addTyping() {
    var wrap = document.createElement("div");
    wrap.className = "msg bot";
    wrap.id = "typingMsg";
    wrap.innerHTML =
      '<div class="bubble"><div class="typing"><span></span><span></span><span></span></div></div>';
    messages.appendChild(wrap);
    messages.scrollTop = messages.scrollHeight;
  }
  function removeTyping() {
    var t = document.getElementById("typingMsg");
    if (t) t.remove();
  }

  var busy = false;
  function sendMessage(forced) {
    var text = (forced || input.value).trim();
    if (!text || busy) return;
    busy = true;
    sendBtn.disabled = true;

    addMessage("user", text);
    history.push({ role: "user", content: text });
    input.value = "";
    input.style.height = "auto";
    addTyping();

    fetch("/.netlify/functions/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (r) {
        removeTyping();
        if (r.ok && r.data && r.data.reply) {
          addMessage("bot", r.data.reply);
          history.push({ role: "assistant", content: r.data.reply });
          // 이력이 너무 길어지지 않게 최근 12개만 유지
          if (history.length > 12) history = history.slice(history.length - 12);
        } else {
          var msg =
            (r.data && r.data.error) ||
            "죄송해요, 지금은 답변을 가져오지 못했어요. 잠시 후 다시 시도해 주세요. 🙏";
          addMessage("bot", msg);
        }
      })
      .catch(function () {
        removeTyping();
        addMessage(
          "bot",
          "앗, 연결에 문제가 생겼어요. 네트워크를 확인하고 다시 시도해 주세요. 🙏"
        );
      })
      .finally(function () {
        busy = false;
        sendBtn.disabled = false;
        input.focus();
      });
  }
})();
