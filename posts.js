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
}

if (document.body.dataset.page === "list") {
  renderPostList();
}

if (document.body.dataset.page === "detail") {
  renderPostDetail();
}
