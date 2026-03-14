import {
  createResume,
  deleteResume,
  getResume,
  listResumes,
  updateResume
} from "./api.js";

let resumes = [];
let selectedResumeId = null;
let handlersBound = false;

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

export function bindResumeHandlers() {
  if (handlersBound) {
    return;
  }

  const form = document.getElementById("resume-form");
  const newButton = document.getElementById("btn-new-resume");
  const closeButton = document.getElementById("close-resume-modal");
  const deleteButton = document.getElementById("delete-resume-btn");

  newButton?.addEventListener("click", () => {
    resetResumeForm();
  });

  closeButton?.addEventListener("click", () => {
    closeResumeManager();
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveResume();
  });

  deleteButton?.addEventListener("click", async () => {
    await handleDeleteResume();
  });

  handlersBound = true;
}

export async function openResumeManager() {
  await refreshResumeList();
  resetResumeForm();
  document.getElementById("resume-modal")?.classList.remove("hidden");
}

export function closeResumeManager() {
  document.getElementById("resume-modal")?.classList.add("hidden");
}

// -----------------------------------------------------------------------------
// Data loading
// -----------------------------------------------------------------------------

async function refreshResumeList() {
  resumes = await listResumes();
  renderResumeList();
}

async function saveResume() {
  const nameInput = document.getElementById("resume-name");
  const textInput = document.getElementById("resume-text");
  const saveButton = document.getElementById("save-resume-btn");

  const resumeName = nameInput?.value.trim() || "";
  const resumeText = textInput?.value.trim() || "";

  if (!resumeName) {
    window.alert("Resume name is required.");
    return;
  }

  if (!resumeText) {
    window.alert("Resume text is required.");
    return;
  }

  const originalButtonText = saveButton?.textContent || "Save";

  try {
    if (saveButton) {
      saveButton.disabled = true;
      saveButton.textContent = selectedResumeId
        ? "Updating..."
        : "Creating...";
    }

    if (selectedResumeId) {
      await updateResume(selectedResumeId, {
        resume_name: resumeName,
        resume_text: resumeText
      });
    } else {
      await createResume({
        resume_name: resumeName,
        resume_text: resumeText
      });
    }

    await refreshResumeList();
    resetResumeForm();
  } catch (error) {
    console.error("Resume save failed:", error);
    window.alert(`Resume save failed: ${error.message}`);
  } finally {
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = selectedResumeId
        ? "Update Resume"
        : "Create Resume";
    }
  }
}

async function handleDeleteResume() {
  if (!selectedResumeId) {
    return;
  }

  const deleteButton = document.getElementById("delete-resume-btn");
  const originalButtonText = deleteButton?.textContent || "Delete";

  const confirmed = window.confirm("Delete this resume?");

  if (!confirmed) {
    return;
  }

  try {
    if (deleteButton) {
      deleteButton.disabled = true;
      deleteButton.textContent = "Deleting...";
    }

    await deleteResume(selectedResumeId);

    await refreshResumeList();
    resetResumeForm();
  } catch (error) {
    console.error("Resume delete failed:", error);
    window.alert(`Resume delete failed: ${error.message}`);
  } finally {
    if (deleteButton) {
      deleteButton.disabled = false;
      deleteButton.textContent = "Delete";
    }
  }
}

// -----------------------------------------------------------------------------
// Rendering
// -----------------------------------------------------------------------------

function renderResumeList() {
  const container = document.getElementById("resume-list");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (!resumes.length) {
    container.innerHTML = "<p>No resumes saved yet.</p>";
    return;
  }

  resumes.forEach((resume) => {
    const item = document.createElement("div");
    const isActive = resume.resume_id === selectedResumeId;

    item.className = `resume-list-item${isActive ? " active" : ""}`;
    item.innerHTML = `
      <div class="resume-list-name">
        ${escapeHtml(resume.resume_name || "Untitled Resume")}
      </div>
      <div class="resume-list-meta">
        ${formatDate(resume.updated_at || resume.created_at)}
      </div>
    `;

    item.addEventListener("click", async () => {
      await selectResume(resume.resume_id);
    });

    container.appendChild(item);
  });
}

async function selectResume(resumeId) {
  try {
    const resume = await getResume(resumeId);

    selectedResumeId = resume.resume_id;

    document.getElementById("resume-name").value = resume.resume_name || "";
    document.getElementById("resume-text").value = resume.resume_text || "";

    document.getElementById("resume-form-title").textContent = "Edit Resume";
    document.getElementById("save-resume-btn").textContent = "Update Resume";
    document.getElementById("delete-resume-btn").classList.remove("hidden");

    renderResumeList();
  } catch (error) {
    console.error("Failed to load resume:", error);
    window.alert(`Failed to load resume: ${error.message}`);
  }
}

function resetResumeForm() {
  selectedResumeId = null;

  document.getElementById("resume-form")?.reset();
  document.getElementById("resume-form-title").textContent = "Create Resume";
  document.getElementById("save-resume-btn").textContent = "Create Resume";
  document.getElementById("delete-resume-btn").classList.add("hidden");

  renderResumeList();
}

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

function formatDate(value) {
  if (!value) {
    return "No date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}