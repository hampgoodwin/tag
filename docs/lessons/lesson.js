(function () {
  const THEME_KEY = "tag_docs_theme";
  const DONE_KEY = "tag_lessons_done_v1";

  // 1. Apply saved theme immediately
  function getSavedTheme() {
    try {
      return localStorage.getItem(THEME_KEY) || "dark";
    } catch (_) {
      return "dark";
    }
  }

  function applyTheme(theme) {
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    const btn = document.getElementById("themeToggle");
    if (btn) {
      btn.textContent = theme === "light" ? "Dark theme" : "Light theme";
    }
  }

  applyTheme(getSavedTheme());

  // 2. Progress helpers
  function getDoneSet() {
    try {
      const raw = localStorage.getItem(DONE_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch (_) {
      return new Set();
    }
  }

  function saveDoneSet(set) {
    try {
      localStorage.setItem(DONE_KEY, JSON.stringify(Array.from(set)));
    } catch (_) {}
  }

  // 3. Lightweight deterministic Rust/TOML syntax highlighter
  const RUST_KW = new Set([
    "use", "pub", "mod", "fn", "let", "mut", "const", "struct", "enum", "impl",
    "for", "in", "if", "else", "match", "return", "break", "continue", "loop",
    "while", "where", "type", "trait", "as", "ref", "move", "self", "Self",
    "super", "crate", "true", "false", "dyn"
  ]);

  const RUST_TYPES = new Set([
    "App", "Plugin", "DefaultPlugins", "Startup", "Update", "FixedUpdate",
    "OnEnter", "OnExit", "Commands", "Query", "Res", "ResMut", "With", "Without",
    "Or", "Added", "Changed", "Entity", "Component", "Resource", "States",
    "SubStates", "State", "NextState", "DespawnOnExit", "Message", "MessageReader",
    "MessageWriter", "AppExit", "On", "PointerClick", "PointerEnter", "PointerLeave",
    "Camera2d", "Sprite", "Transform", "Visibility", "Color", "Vec2", "Vec3",
    "Time", "Fixed", "Timer", "TimerMode", "ButtonInput", "KeyCode",
    "Node", "Text", "TextFont", "FontSize", "TextColor", "BackgroundColor",
    "BorderColor", "BorderRadius", "Val", "UiRect", "FlexDirection",
    "JustifyContent", "AlignItems", "PositionType", "Option", "Some", "None",
    "Result", "Ok", "Err", "String", "Vec", "f32", "usize", "u32", "i32", "bool",
    "Clone", "Copy", "Debug", "Default", "PartialEq", "Eq", "Hash", "Deref", "DerefMut"
  ]);

  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function highlightRust(src) {
    // Single-pass tokenizer over raw source text so we never corrupt generated HTML tags
    const tokenRe = /(\/\/[^\n]*)|("(?:\\.|[^"\\])*")|(#\[[^\]]*\])|\b([a-zA-Z_][a-zA-Z0-9_]*!)|\b(\d+(?:\.\d+)?(?:f32|usize|u32|i32)?)\b|\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
    let out = "";
    let last = 0;
    let m;
    while ((m = tokenRe.exec(src)) !== null) {
      out += escapeHtml(src.slice(last, m.index));
      const [full, comment, str, attr, macro, num, ident] = m;
      if (comment !== undefined) {
        out += `<span class="cmt">${escapeHtml(comment)}</span>`;
      } else if (str !== undefined) {
        out += `<span class="str">${escapeHtml(str)}</span>`;
      } else if (attr !== undefined) {
        out += `<span class="attr">${escapeHtml(attr)}</span>`;
      } else if (macro !== undefined) {
        out += `<span class="mac">${escapeHtml(macro)}</span>`;
      } else if (num !== undefined) {
        out += `<span class="num">${escapeHtml(num)}</span>`;
      } else if (ident !== undefined) {
        if (RUST_KW.has(ident)) {
          out += `<span class="kw">${ident}</span>`;
        } else if (RUST_TYPES.has(ident) || /^[A-Z]/.test(ident)) {
          out += `<span class="ty">${ident}</span>`;
        } else if (src[tokenRe.lastIndex] === "(") {
          out += `<span class="fn">${ident}</span>`;
        } else {
          out += ident;
        }
      } else {
        out += escapeHtml(full);
      }
      last = tokenRe.lastIndex;
    }
    out += escapeHtml(src.slice(last));
    return out;
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyTheme(getSavedTheme());

    // Theme toggle click
    const themeBtn = document.getElementById("themeToggle");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
        try {
          localStorage.setItem(THEME_KEY, next);
        } catch (_) {}
        applyTheme(next);
        window.dispatchEvent(new CustomEvent("tag-theme-change", { detail: { theme: next } }));
      });
    }

    // Highlight code blocks & attach copy buttons
    document.querySelectorAll("pre > code").forEach((codeEl) => {
      const raw = codeEl.textContent;
      if (codeEl.classList.contains("language-rust") || codeEl.classList.contains("language-toml")) {
        codeEl.innerHTML = highlightRust(raw);
      }
      const pre = codeEl.parentElement;
      if (pre && !pre.parentElement.classList.contains("code-wrapper")) {
        const wrapper = document.createElement("div");
        wrapper.className = "code-wrapper";
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        const copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.className = "copy-btn";
        copyBtn.textContent = "Copy";
        copyBtn.addEventListener("click", () => {
          navigator.clipboard?.writeText(raw).then(() => {
            copyBtn.textContent = "Copied!";
            setTimeout(() => { copyBtn.textContent = "Copy"; }, 1400);
          });
        });
        wrapper.appendChild(copyBtn);
      }
    });

    // Expand / Collapse all solutions button (synced dynamically with actual open state)
    const toggleAllBtn = document.getElementById("toggleSolutionsBtn");
    if (toggleAllBtn) {
      const detailsList = () => Array.from(document.querySelectorAll("details.solution"));
      const syncToggleLabel = () => {
        const list = detailsList();
        const allOpen = list.length > 0 && list.every((d) => d.open);
        toggleAllBtn.textContent = allOpen ? "Collapse Solutions" : "Expand Solutions";
      };
      toggleAllBtn.addEventListener("click", () => {
        const list = detailsList();
        const shouldOpen = !list.every((d) => d.open);
        list.forEach((d) => { d.open = shouldOpen; });
        syncToggleLabel();
      });
      detailsList().forEach((d) => d.addEventListener("toggle", syncToggleLabel));
      syncToggleLabel();
    }

    // Progress tracking on nav pills, index cards, and current lesson button
    function syncProgressUI() {
      const done = getDoneSet();

      document.querySelectorAll("[data-lesson-pill]").forEach((el) => {
        const id = el.getAttribute("data-lesson-pill");
        el.classList.toggle("done", done.has(id));
      });

      document.querySelectorAll("[data-lesson-card]").forEach((el) => {
        const id = el.getAttribute("data-lesson-card");
        el.classList.toggle("done", done.has(id));
      });

      const currentLesson = document.body.getAttribute("data-lesson-id");
      const markBtn = document.getElementById("markDoneBtn");
      if (currentLesson && markBtn) {
        const isDone = done.has(currentLesson);
        markBtn.classList.toggle("completed", isDone);
        markBtn.textContent = isDone ? "✓ Completed" : "Mark Complete";
      }

      const fill = document.getElementById("courseProgressFill");
      const label = document.getElementById("courseProgressLabel");
      if (fill && label) {
        const total = 7;
        const count = ["01", "02", "03", "04", "05", "06", "07"].filter((k) => done.has(k)).length;
        const pct = Math.round((count / total) * 100);
        fill.style.width = pct + "%";
        label.textContent = `${count} / ${total} lessons completed (${pct}%)`;
      }
    }

    const markBtn = document.getElementById("markDoneBtn");
    const currentLesson = document.body.getAttribute("data-lesson-id");
    if (markBtn && currentLesson) {
      markBtn.addEventListener("click", () => {
        const done = getDoneSet();
        if (done.has(currentLesson)) {
          done.delete(currentLesson);
        } else {
          done.add(currentLesson);
        }
        saveDoneSet(done);
        syncProgressUI();
      });
    }

    syncProgressUI();
  });
})();
