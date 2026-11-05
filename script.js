document.addEventListener("DOMContentLoaded", () => {
  let allItems = [];
  let currentCategory = "ALL";
  let searchQuery = "";

  const cardsGrid = document.getElementById("cardsGrid");
  const searchInput = document.getElementById("searchInput");
  const categoryFilters = document.getElementById("categoryFilters");
  const authActionBox = document.getElementById("authActionBox");
  const inquiryForm = document.getElementById("inquiryForm");
  const inquiryAlert = document.getElementById("inquiryAlert");

  // Check auth state & load profile
  fetch("/api/auth/me")
    .then((res) => {
      if (res.ok) return res.json();
      return null;
    })
    .then((data) => {
      if (data && data.user) {
        updateProfileUI(data.user);
        authActionBox.innerHTML = `
          <button class="nav-btn" id="logoutBtn" type="button">Logout</button>
        `;
        document.getElementById("logoutBtn").addEventListener("click", handleLogout);
      }
    })
    .catch(() => {});

  function handleLogout() {
    fetch("/api/auth/logout", { method: "POST" }).then(() => {
      window.location.reload();
    });
  }

  function updateProfileUI(u) {
    if (u.name) {
      document.getElementById("dispName").textContent = u.name;
      document.getElementById("footName").textContent = u.name;
      const initials = u.name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      document.getElementById("avatarBadge").textContent = initials || "ST";
    }
    if (u.rollNo) {
      document.getElementById("dispRoll").textContent = u.rollNo;
      document.getElementById("footRoll").textContent = u.rollNo;
    }
    if (u.course) document.getElementById("dispCourse").textContent = u.course;
    if (u.institution) document.getElementById("dispInstitution").textContent = u.institution;
    if (u.email) document.getElementById("dispEmail").textContent = u.email;
    if (u.bio) document.getElementById("dispBio").textContent = u.bio;
  }

  // Fetch portfolio items
  fetchItems();

  function fetchItems() {
    fetch("/api/portfolio/items")
      .then((res) => res.json())
      .then((data) => {
        allItems = data.items || [];
        updateMetrics();
        renderCards();
      })
      .catch((err) => {
        cardsGrid.innerHTML = `
          <div class="empty-state">
            <h3>Unable to load entries</h3>
            <p>${err.message}</p>
          </div>
        `;
      });
  }

  function updateMetrics() {
    const projCount = allItems.filter((i) => i.category === "Project").length;
    const skillCount = allItems.filter((i) => i.category === "Skill").length;
    const acadCount = allItems.filter((i) => i.category === "Academic").length;
    const certCount = allItems.filter((i) => i.category === "Certification").length;

    document.getElementById("statProjects").textContent = projCount;
    document.getElementById("statSkills").textContent = skillCount;
    document.getElementById("statAcademic").textContent = acadCount;
    document.getElementById("statCerts").textContent = certCount;

    document.getElementById("countAll").textContent = allItems.length;
    document.getElementById("countProj").textContent = projCount;
    document.getElementById("countSkill").textContent = skillCount;
    document.getElementById("countAcad").textContent = acadCount;
    document.getElementById("countCert").textContent = certCount;
  }

  function renderCards() {
    let filtered = allItems;

    if (currentCategory !== "ALL") {
      filtered = filtered.filter((i) => i.category === currentCategory);
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.subtitle && i.subtitle.toLowerCase().includes(q)) ||
          i.description.toLowerCase().includes(q)
      );
    }

    if (filtered.length === 0) {
      cardsGrid.innerHTML = `
        <div class="empty-state">
          <h3>No records found</h3>
          <p>No portfolio entries currently match the selected criteria. Navigate to the Console to publish new records.</p>
        </div>
      `;
      return;
    }

    cardsGrid.innerHTML = filtered
      .map((item) => {
        const extBtn = item.link
          ? `<a href="${item.link}" target="_blank" rel="noopener" class="ext-link-btn">View Resource ↗</a>`
          : `<span style="font-size:0.78rem;color:var(--text-muted);">Verified Academic Record</span>`;

        return `
          <div class="item-card">
            <div>
              <div class="item-top">
                <span class="cat-tag cat-${item.category}">${item.category}</span>
                <span class="item-date">${item.date || ""}</span>
              </div>
              <h3 class="item-title">${escapeHTML(item.title)}</h3>
              <div class="item-sub">${escapeHTML(item.subtitle || "")}</div>
              <p class="item-desc">${escapeHTML(item.description)}</p>
            </div>
            <div class="item-footer">
              ${extBtn}
            </div>
          </div>
        `;
      })
      .join("");
  }

  // Filter pills
  categoryFilters.addEventListener("click", (e) => {
    const btn = e.target.closest(".pill-btn");
    if (!btn) return;
    document.querySelectorAll(".pill-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentCategory = btn.dataset.cat;
    renderCards();
  });

  // Search input
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    renderCards();
  });

  // Handle Inquiry Form Submission
  inquiryForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById("inqName").value,
      email: document.getElementById("inqEmail").value,
      subject: document.getElementById("inqSubject").value,
      message: document.getElementById("inqMessage").value
    };

    fetch("/api/portfolio/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Inquiry submission failed");
        showInquiryAlert(data.message, "success");
        inquiryForm.reset();
      })
      .catch((err) => {
        showInquiryAlert(err.message, "error");
      });
  });

  function showInquiryAlert(msg, type) {
    inquiryAlert.className = `alert alert-${type}`;
    inquiryAlert.textContent = msg;
    inquiryAlert.style.display = "block";
    setTimeout(() => {
      inquiryAlert.style.display = "none";
    }, 5000);
  }

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
});
