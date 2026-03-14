import { getJob, updateJobNotes } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  const jobId = getJobIdFromUrl();

  if (!jobId) {
    renderError("Missing job ID.");
    return;
  }

  bindNotesHandler(jobId);

  try {
    const job = await getJob(jobId);
    renderJob(job);
  } catch (error) {
    renderError(`Failed to load job: ${error.message}`);
  }
});

function getJobIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id")?.trim() || "";
}

function renderJob(job) {
  setText("job-title", job.job_title || "—");
  setText("job-company", job.company || "—");
  setText("job-score", formatScore(job.score));
  setText("job-scored-at", formatDate(job.updated_at));
  setText("job-source-type", job.source_type || "—");

  renderJobUrl(job.job_url);
  renderJobNotes(job.notes || "");

  document.getElementById("job-detail-loading")?.classList.add("hidden");
  document.getElementById("job-detail-content")?.classList.remove("hidden");
}

function renderJobUrl(value) {
  const element = document.getElementById("job-url");

  if (!element) return;

  if (!value) {
    element.textContent = "—";
    return;
  }

  element.innerHTML = `
    <a
      href="${escapeHtml(value)}"
      target="_blank"
      rel="noopener noreferrer"
    >
      ${escapeHtml(value)}
    </a>
  `;
}

function renderJobNotes(value) {
  const element = document.getElementById("job-notes");

  if (!element) return;

  element.value = value;
}

function bindNotesHandler(jobId) {
  const button = document.getElementById("update-job-notes-btn");
  const textarea = document.getElementById("job-notes");

  if (!button || !textarea) return;

  button.addEventListener("click", async () => {
    clearNotesMessages();

    const notes = textarea.value;

    button.disabled = true;
    button.textContent = "Updating...";

    try {
      await updateJobNotes(jobId, notes);
      showNotesSuccess("Notes updated.");
    } catch (error) {
      showNotesError(`Failed to update notes: ${error.message}`);
    } finally {
      button.disabled = false;
      button.textContent = "Update Notes";
    }
  });
}

function clearNotesMessages() {
  const errorElement = document.getElementById("job-notes-error");
  const successElement = document.getElementById("job-notes-success");

  if (errorElement) {
    errorElement.textContent = "";
    errorElement.classList.add("hidden");
  }

  if (successElement) {
    successElement.textContent = "";
    successElement.classList.add("hidden");
  }
}

function showNotesError(message) {
  const element = document.getElementById("job-notes-error");

  if (!element) {
    window.alert(message);
    return;
  }

  element.textContent = message;
  element.classList.remove("hidden");
}

function showNotesSuccess(message) {
  const element = document.getElementById("job-notes-success");

  if (!element) return;

  element.textContent = message;
  element.classList.remove("hidden");
}

function formatScore(score) {
  return score == null ? "—" : String(score);
}

function setText(elementId, value) {
  const element = document.getElementById(elementId);

  if (!element) return;

  element.textContent = value;
}

function renderError(message) {
  document.getElementById("job-detail-loading")?.classList.add("hidden");

  const errorElement = document.getElementById("job-detail-error");

  if (!errorElement) {
    window.alert(message);
    return;
  }

  errorElement.textContent = message;
  errorElement.classList.remove("hidden");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value) {
  if (!value) return "—";

  try {
    const date = new Date(value);
    return date.toLocaleString();
  } catch {
    return value;
  }
}
