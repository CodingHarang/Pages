const posts = [
  {
    id: "welcome",
    title: "블로그를 시작하며",
    date: "2026-08-29",
    excerpt: "작은 기록을 차곡차곡 남기기 위한 공간을 열었습니다.",
    content: [
      "이곳은 생각과 작업의 흐름을 간단히 기록하는 블로그입니다.",
      "새로운 글은 목록에서 편하게 찾아볼 수 있습니다."
    ]
  },
  {
    id: "notes",
    title: "기록의 작은 습관",
    date: "2026-08-22",
    excerpt: "짧은 메모도 다음 작업을 위한 좋은 출발점이 됩니다.",
    content: [
      "작업을 마친 뒤 핵심을 짧게 정리하면 나중에 맥락을 다시 찾기 쉽습니다.",
      "완성된 결과뿐 아니라 진행 중의 생각도 차분히 남겨 보려 합니다."
    ]
  },
  {
    id: "next",
    title: "다음 글을 준비합니다",
    date: "2026-08-15",
    excerpt: "이 공간에 이어질 이야기를 준비하고 있습니다.",
    content: [
      "블로그에는 가볍게 읽을 수 있는 기록을 계속 추가할 예정입니다.",
      "GitHub 프로필에서는 저장소와 최근 활동을 확인할 수 있습니다."
    ]
  },
  {
    id: "ghost-fibers-playground",
    title: "Ghost Fibers 플레이그라운드",
    date: "2026-08-30",
    excerpt: "움직이는 섬유 배경의 설정을 직접 조절해 보세요.",
    content: [
      "각 설정을 바꾸면 아래 배경에 바로 반영됩니다.",
      "움직임을 줄이도록 설정한 경우에는 정적인 화면으로 표시됩니다."
    ],
    playground: true
  }
];

function formatDate(date) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(`${date}T00:00:00`));
}

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (text) {
    element.textContent = text;
  }
  return element;
}

function renderPostList() {
  const postList = document.querySelector("#post-list");

  posts.forEach((post) => {
    const article = createElement("article", "post-card");
    const heading = createElement("h3");
    const link = createElement("a", "post-title", post.title);
    const date = createElement("time", "post-date", formatDate(post.date));
    const excerpt = createElement("p", "post-excerpt", post.excerpt);

    link.href = `post.html?id=${encodeURIComponent(post.id)}`;
    date.dateTime = post.date;
    heading.append(link);
    article.append(heading, date, excerpt);
    postList.append(article);
  });
}

function renderPostDetail() {
  const detail = document.querySelector("#post-detail");
  const postId = new URLSearchParams(window.location.search).get("id");
  const post = posts.find((item) => item.id === postId);

  if (!post) {
    const title = createElement("h1", null, "글을 찾을 수 없습니다");
    const message = createElement("p", null, "요청한 게시글이 없거나 주소가 올바르지 않습니다.");
    detail.className = "not-found";
    detail.append(title, message);
    return;
  }

  const title = createElement("h1", null, post.title);
  const date = createElement("time", "post-date", formatDate(post.date));
  const content = createElement("div", "post-content");

  date.dateTime = post.date;
  post.content.forEach((paragraph) => {
    content.append(createElement("p", null, paragraph));
  });
  detail.append(title, date, content);

  if (post.playground) {
    detail.append(createGhostFibersPlayground());
  }
}

function createControl(control) {
  const wrapper = createElement("div", "playground-control");
  const label = createElement("label", null, control.label);
  const input = document.createElement(control.type === "select" ? "select" : "input");

  label.htmlFor = `control-${control.name}`;
  input.id = label.htmlFor;
  input.name = control.name;

  if (control.type === "select") {
    control.options.forEach((option) => {
      const optionElement = createElement("option", null, option.label);
      optionElement.value = option.value;
      input.append(optionElement);
    });
    input.value = control.default;
  } else {
    input.type = control.type;

    if (control.type === "checkbox") {
      input.checked = control.default;
    } else {
      input.min = control.min;
      input.max = control.max;
      input.step = control.step;
      input.value = control.default;
    }
  }

  wrapper.append(label, input);
  return wrapper;
}

function createGhostFibersPlayground() {
  const section = createElement("section", "ghost-playground");
  const heading = createElement("h2", null, "Ghost Fibers 설정");
  const description = createElement("p", "playground-description", "설정을 조절해 배경의 움직임과 분위기를 살펴보세요.");
  const canvas = document.createElement("canvas");
  const form = document.createElement("form");
  const fieldset = document.createElement("fieldset");
  const legend = createElement("legend", null, "배경 제어");
  const controls = [
    { name: "lineColor", label: "선 색상", type: "color", default: "#140E35" },
    { name: "glowColor", label: "광원 색상", type: "color", default: "#3437A0" },
    { name: "speed", label: "속도", type: "range", min: 0, max: 2, step: 0.01, default: 0.2 },
    { name: "scale", label: "크기", type: "range", min: 0.4, max: 2, step: 0.01, default: 2 },
    { name: "rotation", label: "회전", type: "range", min: -180, max: 180, step: 1, default: 0 },
    { name: "rotationSpeed", label: "회전 속도", type: "range", min: -0.4, max: 0.4, step: 0.01, default: 0.25 },
    { name: "layers", label: "레이어", type: "range", min: 1, max: 10, step: 1, default: 4 },
    { name: "waveAmplitude", label: "파동 진폭", type: "range", min: 0, max: 0.3, step: 0.005, default: 0.015 },
    { name: "waveFrequency", label: "파동 주파수", type: "range", min: 0.5, max: 6, step: 0.05, default: 3 },
    { name: "waveSpeed", label: "파동 속도", type: "range", min: -2, max: 2, step: 0.05, default: 0.15 },
    { name: "layerSpeed", label: "레이어 속도", type: "range", min: -0.3, max: 0.3, step: 0.01, default: 0.08 },
    { name: "twist", label: "비틀기", type: "range", min: 0, max: 0.5, step: 0.005, default: 0.1 },
    { name: "twistFrequency", label: "비틀기 주파수", type: "range", min: 0.5, max: 12, step: 0.1, default: 5 },
    { name: "twistSpeed", label: "비틀기 속도", type: "range", min: -3, max: 3, step: 0.05, default: 1.2 },
    { name: "lineFrequency", label: "선 주파수", type: "range", min: 1, max: 10, step: 0.1, default: 5 },
    { name: "lineSpacing", label: "선 간격", type: "range", min: 0, max: 4, step: 0.05, default: 2 },
    { name: "lineSharpness", label: "선 선명도", type: "range", min: 1, max: 16, step: 0.25, default: 16 },
    { name: "glowFalloff", label: "광원 감쇠", type: "range", min: 1, max: 16, step: 0.25, default: 10 },
    { name: "glowIntensity", label: "광원 강도", type: "range", min: 0, max: 3, step: 0.05, default: 1.6 },
    { name: "brightness", label: "밝기", type: "range", min: 0.2, max: 4, step: 0.05, default: 2 },
    { name: "blueBoost", label: "파란색 강조", type: "range", min: 0.5, max: 2, step: 0.01, default: 1.25 },
    { name: "vignette", label: "비네트", type: "range", min: 0, max: 1, step: 0.01, default: 0.8 },
    { name: "grain", label: "그레인", type: "range", min: 0, max: 0.12, step: 0.0025, default: 0.05 },
    { name: "lightMode", label: "라이트 렌더링", type: "checkbox", default: false },
    { name: "dpr", label: "렌더 품질", type: "select", default: 1, options: [{ label: "Performance", value: 0.75 }, { label: "Balanced", value: 1 }, { label: "Crisp", value: 1.25 }, { label: "Sharp", value: 1.5 }, { label: "Ultra", value: 2 }] },
    { name: "fps", label: "프레임 레이트", type: "select", default: 60, options: [{ label: "24", value: 24 }, { label: "30", value: 30 }, { label: "45", value: 45 }, { label: "60", value: 60 }] },
    { name: "paused", label: "일시 정지", type: "checkbox", default: false }
  ];
  const reset = createElement("button", "playground-reset", "기본값으로 재설정");

  canvas.className = "ghost-fibers-playground-canvas";
  canvas.dataset.ghostFibersPlayground = "";
  canvas.setAttribute("aria-hidden", "true");
  form.className = "ghost-playground-controls";
  fieldset.append(legend);
  controls.forEach((control) => fieldset.append(createControl(control)));
  reset.type = "reset";
  fieldset.append(reset);
  form.append(fieldset);
  section.append(canvas, heading, description, form);
  return section;
}

if (document.body.dataset.page === "list") {
  renderPostList();
}

if (document.body.dataset.page === "detail") {
  renderPostDetail();
}
