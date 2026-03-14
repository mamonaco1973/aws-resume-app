import { getJob } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  const jobId = getJobIdFromUrl();

  if (!jobId) {
    renderError("Missing job ID.");
    return;
  }

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
  setText("job-source-type", job.source_type || "—");
  renderJobUrl(job.job_url);

  document.getElementById("job-detail-loading")?.classList.add("hidden");
  document.getElementById("job-detail-content")?.classList.remove("hidden");
}

function renderJobUrl(value) {
  const element = document.getElementById("job-url");

  if (!element) {
    return;
  }

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

function formatScore(score) {
  return score == null ? "—" : String(score);
}

function setText(elementId, value) {
  const element = document.getElementById(elementId);

  if (!element) {
    return;
  }

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
