import { loadJobs } from "./jobs.js";

document.addEventListener("DOMContentLoaded", async () => {
  bindUiHandlers();

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
  const closeResumeModal = document.getElementById("close-resume-modal");

  const sourceType = document.getElementById("source-type");
  const urlField = document.getElementById("url-field");
  const textField = document.getElementById("text-field");

  btnNewJob?.addEventListener("click", () => {
    resumeModal.classList.add("hidden");
    newJobModal.classList.remove("hidden");
  });

  btnManageResumes?.addEventListener("click", () => {
    newJobModal.classList.add("hidden");
    resumeModal.classList.remove("hidden");
  });

  cancelNewJob?.addEventListener("click", () => {
    newJobModal.classList.add("hidden");
  });

  closeResumeModal?.addEventListener("click", () => {
    resumeModal.classList.add("hidden");
  });

  sourceType?.addEventListener("change", () => {
    if (sourceType.value === "url") {
      urlField.classList.remove("hidden");
      textField.classList.add("hidden");
    } else {
      urlField.classList.add("hidden");
      textField.classList.remove("hidden");
    }
  });
}