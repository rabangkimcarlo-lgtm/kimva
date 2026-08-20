/**
 * Website Chat Widget — white-label / demo build
 * Built by Select VA Now (rabangkimcarlo@gmail.com)
 *
 * Drop this in before </body> on any site:
 *   <script src="chat-widget.js"></script>
 *
 * Everything client-specific lives in CONFIG below — no need to touch
 * anything past that block when reusing this for a new client or demo.
 *
 * Sends the full conversation to a Make.com webhook on every message.
 * The webhook is expected to return JSON: { "reply": "..." }
 */
(function () {
  "use strict";

  // ============================================================
  //  CONFIG — edit this block per client / demo. Nothing else
  //  below this needs to change.
  // ============================================================
  const CONFIG = {
    // DEMO MODE: when true, the widget answers from demoResponses below
    // instead of calling a webhook — no Make.com setup needed to try it.
    // Flip to false and set webhookUrl once the real scenario is live.
    demoMode: true,

    // ⚠️ REPLACE with the Make.com custom webhook URL for this client
    webhookUrl: "https://hook.us1.make.com/REPLACE_WITH_YOUR_WEBHOOK_ID",

    businessName: "Harbor & Pine Realty",
    tagline: "Usually replies in a few seconds",

    greeting:
      "Hi! I'm the Harbor & Pine Realty assistant. Ask me about listings, showings, or how offers work here — or tell me what you're looking for.",

    // Shown if the webhook call fails (live mode only)
    fallbackMessage:
      "I'm having trouble connecting right now. You can reach our team directly and we'll get back to you shortly.",

    launcherIcon: "🏡",

    // Brand colors — swap these per client
    colors: {
      ink: "#0f2438",     // deep navy — header bar, user bubble, launcher
      paper: "#ffffff",   // panel background
      accent: "#c9a24b",  // gold — bot bubble border, send button, dot
      line: "#e4e4e4",
      muted: "#6b6b6b",
    },

    // Local canned responses used only when demoMode is true.
    // First keyword match wins; falls back to defaultDemoReply.
    demoResponses: [
      {
        keywords: ["showing", "tour", "see the", "viewing", "visit"],
        reply:
          "Showings run Tuesday–Saturday, 9am–5pm. Tell me which listing you're interested in and I'll have an agent reach out to schedule a time.",
      },
      {
        keywords: ["price", "cost", "how much", "budget"],
        reply:
          "Our current listings range from $350K to $1.2M depending on the neighborhood. What price range are you working with, and I can point you to a few good fits?",
      },
      {
        keywords: ["offer", "bid", "negotiat"],
        reply:
          "Offers go through your agent directly — we'll walk you through comparables and help you land on a number that's competitive without overpaying. Want me to connect you with someone?",
      },
      {
        keywords: ["rent", "tenant", "lease", "landlord"],
        reply:
          "We primarily handle sales, but we do work with a property management partner for rentals. Want me to pass your info along to them?",
      },
      {
        keywords: ["contact", "call", "phone", "email", "reach"],
        reply:
          "Happy to connect you — what's the best name and email to have an agent follow up with you?",
      },
    ],
    defaultDemoReply:
      "Good question — let me get you the exact details. Could you share your name and email so an agent can follow up directly?",
  };
  // ============================================================
  //  End of config
  // ============================================================

  const WEBHOOK_URL = CONFIG.webhookUrl;
  const GREETING = CONFIG.greeting;

  // ---------- Styles ----------
  const style = document.createElement("style");
  style.textContent = `
    :root {
      --svn-ink: ${CONFIG.colors.ink};
      --svn-paper: ${CONFIG.colors.paper};
      --svn-coral: ${CONFIG.colors.accent};
      --svn-line: ${CONFIG.colors.line};
      --svn-muted: ${CONFIG.colors.muted};
    }
    #svn-chat-launcher {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: var(--svn-ink);
      color: var(--svn-paper);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 20px rgba(0,0,0,0.25);
      z-index: 999998;
      transition: transform 0.15s ease;
      font-size: 24px;
    }
    #svn-chat-launcher:hover { transform: scale(1.06); }
    #svn-chat-launcher .svn-dot {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--svn-coral);
      border: 2px solid var(--svn-paper);
    }
    #svn-chat-panel {
      position: fixed;
      bottom: 94px;
      right: 24px;
      width: 340px;
      max-width: calc(100vw - 32px);
      height: 460px;
      max-height: calc(100vh - 140px);
      background: var(--svn-paper);
      border: 1px solid var(--svn-ink);
      display: none;
      flex-direction: column;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      box-shadow: 0 12px 32px rgba(0,0,0,0.22);
    }
    #svn-chat-panel.svn-open { display: flex; }
    #svn-chat-header {
      background: var(--svn-ink);
      color: var(--svn-paper);
      padding: 14px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    #svn-chat-header .svn-title {
      font-size: 13px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-weight: 600;
    }
    #svn-chat-header .svn-sub {
      font-size: 11px;
      color: #bbbbbb;
      margin-top: 2px;
    }
    #svn-chat-close {
      background: none;
      border: none;
      color: var(--svn-paper);
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
      padding: 4px;
    }
    #svn-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: var(--svn-paper);
    }
    .svn-msg {
      max-width: 82%;
      padding: 9px 12px;
      font-size: 13.5px;
      line-height: 1.45;
      border-radius: 2px;
    }
    .svn-msg-bot {
      align-self: flex-start;
      background: #f3f3f3;
      color: var(--svn-ink);
      border-left: 3px solid var(--svn-coral);
    }
    .svn-msg-user {
      align-self: flex-end;
      background: var(--svn-ink);
      color: var(--svn-paper);
    }
    .svn-typing {
      align-self: flex-start;
      font-size: 12px;
      color: var(--svn-muted);
      padding: 4px 12px;
      font-style: italic;
    }
    #svn-chat-form {
      display: flex;
      border-top: 1px solid var(--svn-line);
    }
    #svn-chat-input {
      flex: 1;
      border: none;
      padding: 12px;
      font-size: 13.5px;
      outline: none;
      font-family: inherit;
    }
    #svn-chat-send {
      background: var(--svn-coral);
      color: var(--svn-paper);
      border: none;
      padding: 0 16px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
    }
    #svn-chat-send:disabled { opacity: 0.5; cursor: default; }
  `;
  document.head.appendChild(style);

  // ---------- Markup ----------
  const launcher = document.createElement("button");
  launcher.id = "svn-chat-launcher";
  launcher.setAttribute("aria-label", "Open chat");
  launcher.innerHTML = CONFIG.launcherIcon + '<span class="svn-dot"></span>';

  const panel = document.createElement("div");
  panel.id = "svn-chat-panel";
  panel.innerHTML = `
    <div id="svn-chat-header">
      <div>
        <div class="svn-title">${CONFIG.businessName}</div>
        <div class="svn-sub">${CONFIG.tagline}</div>
      </div>
      <button id="svn-chat-close" aria-label="Close chat">✕</button>
    </div>
    <div id="svn-chat-messages"></div>
    <form id="svn-chat-form">
      <input id="svn-chat-input" type="text" placeholder="Type a message..." autocomplete="off" />
      <button id="svn-chat-send" type="submit">Send</button>
    </form>
  `;

  document.body.appendChild(launcher);
  document.body.appendChild(panel);

  const messagesEl = panel.querySelector("#svn-chat-messages");
  const formEl = panel.querySelector("#svn-chat-form");
  const inputEl = panel.querySelector("#svn-chat-input");
  const sendBtn = panel.querySelector("#svn-chat-send");
  const closeBtn = panel.querySelector("#svn-chat-close");

  // ---------- State ----------
  // Simple session id so Brevo / your logs can group a conversation
  let sessionId = sessionStorage.getItem("svn_chat_session");
  if (!sessionId) {
    sessionId = "svn_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    sessionStorage.setItem("svn_chat_session", sessionId);
  }

  let history = []; // [{role: "user"|"assistant", content: "..."}]
  let opened = false;

  function addMessage(role, text) {
    const div = document.createElement("div");
    div.className = "svn-msg " + (role === "user" ? "svn-msg-user" : "svn-msg-bot");
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    const div = document.createElement("div");
    div.className = "svn-typing";
    div.id = "svn-typing-indicator";
    div.textContent = "Typing...";
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    const el = document.getElementById("svn-typing-indicator");
    if (el) el.remove();
  }

  // ---------- Open/close ----------
  launcher.addEventListener("click", () => {
    panel.classList.add("svn-open");
    launcher.style.display = "none";
    if (!opened) {
      opened = true;
      addMessage("assistant", GREETING);
      history.push({ role: "assistant", content: GREETING });
    }
    inputEl.focus();
  });

  closeBtn.addEventListener("click", () => {
    panel.classList.remove("svn-open");
    launcher.style.display = "flex";
  });

  // ---------- Demo mode reply matching ----------
  function getDemoReply(text) {
    const lower = text.toLowerCase();
    for (const item of CONFIG.demoResponses) {
      if (item.keywords.some((kw) => lower.includes(kw))) {
        return item.reply;
      }
    }
    return CONFIG.defaultDemoReply;
  }

  // ---------- Send message ----------
  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = inputEl.value.trim();
    if (!text) return;

    addMessage("user", text);
    history.push({ role: "user", content: text });
    inputEl.value = "";
    inputEl.disabled = true;
    sendBtn.disabled = true;
    showTyping();

    try {
      let reply;

      if (CONFIG.demoMode) {
        reply = getDemoReply(text);
        await new Promise((r) => setTimeout(r, 500 + Math.random() * 500)); // feel like typing
      } else {
        const res = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            page_url: window.location.href,
            message: text,
            history: history,
          }),
        });
        const data = await res.json();
        reply = data && data.reply ? data.reply : "Sorry, I didn't catch that — could you rephrase?";
      }

      hideTyping();
      addMessage("assistant", reply);
      history.push({ role: "assistant", content: reply });
    } catch (err) {
      hideTyping();
      addMessage("assistant", CONFIG.fallbackMessage);
    } finally {
      inputEl.disabled = false;
      sendBtn.disabled = false;
      inputEl.focus();
    }
  });
})();
