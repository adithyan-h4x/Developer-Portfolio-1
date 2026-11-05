document.addEventListener("DOMContentLoaded", () => {
  let records = [];

  const recordForm = document.getElementById("recordForm");
  const editItemId = document.getElementById("editItemId");
  const formTitle = document.getElementById("formTitle");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const submitRecordBtn = document.getElementById("submitRecordBtn");
  const recordsTableBody = document.getElementById("recordsTableBody");
  const profileForm = document.getElementById("profileForm");
  const inquiriesTableBody = document.getElementById("inquiriesTableBody");
  const consoleAlert = document.getElementById("consoleAlert");
  const logoutBtn = document.getElementById("logoutBtn");

  // Tab switching
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      const targetPanel = document.getElementById(btn.dataset.tab);
      if (targetPanel) targetPanel.classList.add("active");
    });
  });

  // Logout handler
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      fetch("/api/auth/logout", { method: "POST" }).then(() => {
        window.location.href = "/auth.html";
      });
    });
  }

  // Initial loads
  loadProfile();
  loadRecords();
  loadInquiries();

  // Load User Profile
  function loadProfile() {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        const u = data.user;
        document.getElementById("profName").value = u.name || "";
        document.getElementById("profRoll").value = u.rollNo || "";
        document.getElementById("profCourse").value = u.course || "";
        document.getElementById("profInstitution").value = u.institution || "";
        document.getElementById("profEmail").value = u.email || "";
        document.getElementById("profBio").value = u.bio || "";
      })
      .catch(() => {
        window.location.href = "/auth.html";
      });
  }

  // Save Profile Form
  profileForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById("profName").value,
      rollNo: document.getElementById("profRoll").value,
      course: document.getElementById("profCourse").value,
      institution: document.getElementById("profInstitution").value,
      email: document.getElementById("profEmail").value,
      bio: document.getElementById("profBio").value
    };

    fetch("/api/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Profile update failed");
        showAlert("Profile credentials updated successfully", "success");
      })
      .catch((err) => {
        showAlert(err.message, "error");
      });
  });

  // Load Portfolio Records
  function loadRecords() {
    fetch("/api/portfolio/items")
      .then((res) => res.json())
      .then((data) => {
        records = data.items || [];
        document.getElementById("tabCountRecords").textContent = records.length;
        renderRecordsTable();
      })
      .catch((err) => {
        recordsTableBody.innerHTML = `<tr><td colspan="5" style="color:var(--danger);">${err.message}</td></tr>`;
      });
  }

  function renderRecordsTable() {
    if (records.length === 0) {
      recordsTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center;color:var(--text-muted);padding:24px;">
            No portfolio items stored. Click 'Publish Entry' above to add your first record.
          </td>
        </tr>
      `;
      return;
    }

    recordsTableBody.innerHTML = records
      .map(
        (item) => `
        <tr>
          <td><span class="cat-tag cat-${item.category}">${item.category}</span></td>
          <td><strong>${escapeHTML(item.title)}</strong></td>
          <td>${escapeHTML(item.subtitle || "-")}</td>
          <td>${escapeHTML(item.date || "-")}</td>
          <td>
            <button class="btn-sm btn-edit" onclick="startEdit('${item._id}')">Edit</button>
            <button class="btn-sm btn-delete" onclick="deleteItem('${item._id}')">Delete</button>
          </td>
        </tr>
      `
      )
      .join("");
  }

  // Publish / Update Record Form
  recordForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = editItemId.value;
    const payload = {
      category: document.getElementById("itemCategory").value,
      title: document.getElementById("itemTitle").value,
      subtitle: document.getElementById("itemSubtitle").value,
      date: document.getElementById("itemDate").value,
      link: document.getElementById("itemLink").value,
      description: document.getElementById("itemDescription").value
    };

    const url = id ? `/api/portfolio/items/${id}` : "/api/portfolio/items";
    const method = id ? "PUT" : "POST";

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Save operation failed");
        showAlert(data.message, "success");
        resetRecordForm();
        loadRecords();
        // Switch to records list to view result
        switchTab("tabRecords");
      })
      .catch((err) => {
        showAlert(err.message, "error");
      });
  });

  window.startEdit = function (id) {
    const item = records.find((r) => r._id === id);
    if (!item) return;

    editItemId.value = item._id;
    document.getElementById("itemCategory").value = item.category;
    document.getElementById("itemTitle").value = item.title;
    document.getElementById("itemSubtitle").value = item.subtitle || "";
    document.getElementById("itemDate").value = item.date || "";
    document.getElementById("itemLink").value = item.link || "";
    document.getElementById("itemDescription").value = item.description;

    formTitle.textContent = "Edit Portfolio Record";
    submitRecordBtn.textContent = "Save Changes to Record ➔";
    cancelEditBtn.style.display = "inline-block";

    switchTab("tabPublish");
  };

  cancelEditBtn.addEventListener("click", resetRecordForm);

  function resetRecordForm() {
    recordForm.reset();
    editItemId.value = "";
    formTitle.textContent = "Publish Portfolio Record";
    submitRecordBtn.textContent = "Publish Record to Portfolio ➔";
    cancelEditBtn.style.display = "none";
  }

  window.deleteItem = function (id) {
    if (!confirm("Are you sure you want to permanently delete this portfolio record?")) return;

    fetch(`/api/portfolio/items/${id}`, { method: "DELETE" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Delete failed");
        showAlert("Portfolio record deleted successfully", "success");
        loadRecords();
      })
      .catch((err) => {
        showAlert(err.message, "error");
      });
  };

  // Load Inquiries
  function loadInquiries() {
    fetch("/api/portfolio/inquiries")
      .then((res) => res.json())
      .then((data) => {
        const inqs = data.inquiries || [];
        document.getElementById("tabCountInquiries").textContent = inqs.length;
        renderInquiriesTable(inqs);
      })
      .catch(() => {});
  }

  function renderInquiriesTable(inqs) {
    if (inqs.length === 0) {
      inquiriesTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center;color:var(--text-muted);padding:24px;">
            No messages in inbox. Visitor inquiries submitted via the home page will appear here.
          </td>
        </tr>
      `;
      return;
    }

    inquiriesTableBody.innerHTML = inqs
      .map(
        (inq) => `
        <tr>
          <td style="font-family:var(--font-mono);font-size:0.78rem;">${new Date(inq.date).toLocaleString()}</td>
          <td><strong>${escapeHTML(inq.name)}</strong></td>
          <td><a href="mailto:${inq.email}">${escapeHTML(inq.email)}</a></td>
          <td><span style="color:var(--accent-cyan);">${escapeHTML(inq.subject)}</span></td>
          <td style="max-width:320px;line-height:1.4;">${escapeHTML(inq.message)}</td>
        </tr>
      `
      )
      .join("");
  }

  function switchTab(tabId) {
    document.querySelectorAll(".tab-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.tab === tabId);
    });
    document.querySelectorAll(".tab-panel").forEach((p) => {
      p.classList.toggle("active", p.id === tabId);
    });
  }

  function showAlert(msg, type) {
    consoleAlert.className = `alert alert-${type}`;
    consoleAlert.textContent = msg;
    consoleAlert.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      consoleAlert.style.display = "none";
    }, 5000);
  }

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
});
