import { loadJobs } from "./jobs.js";
import { bindResumeHandlers, openResumeManager } from "./resumes.js";

document.addEventListener("DOMContentLoaded", async () => {
  bindUiHandlers();
  bindResumeHandlers();

  try {
    await loadJobs();
  } catch (error) {
    console.error("Failed to load dashboard:", error);
    window.alert(`Failed to load jobs: ${error.message}`);
  }
});

function bindUiHandlers() {
  const newJobModal = document.getElementById("new-job-modal");
  const resumeModal = document.getElementById("resume-modal");

  const btnNewJob = document.getElementById("btn-new-job");
  const btnManageResumes = document.getElementById("btn-manage-resumes");
  const cancelNewJob = document.getElementById("cancel-new-job");

  const sourceType = document.getElementById("source-type");
  const urlField = document.getElementById("url-field");
  const textField = document.getElementById("text-field");

  // ---------------------------------------------------------------------------
  // Open "Score New Job"
  // ---------------------------------------------------------------------------

  btnNewJob?.addEventListener("click", () => {
    resumeModal?.classList.add("hidden");
    newJobModal?.classList.remove("hidden");
  });

  // ---------------------------------------------------------------------------
  // Open "Manage Resumes"
  // ---------------------------------------------------------------------------

  btnManageResumes?.addEventListener("click", async () => {
    newJobModal?.classList.add("hidden");
    await openResumeManager();
  });

  // ---------------------------------------------------------------------------
  // Cancel new job modal
  // ---------------------------------------------------------------------------

  cancelNewJob?.addEventListener("click", () => {
    newJobModal?.classList.add("hidden");
  });

  // ---------------------------------------------------------------------------
  // Source type toggle
  // ---------------------------------------------------------------------------

  sourceType?.addEventListener("change", () => {
    if (sourceType.value === "url") {
      urlField?.classList.remove("hidden");
      textField?.classList.add("hidden");
    } else {
      urlField?.classList.add("hidden");
      textField?.classList.remove("hidden");
    }
  });
}