import { listResumes } from "./api.js";
import { loadJobs } from "./jobs.js";
import { bindResumeHandlers, openResumeManager } from "./resumes.js";

let lastSelectedResumeId = "";

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
  const resumeSelect = document.getElementById("resume-select");

  // ---------------------------------------------------------------------------
  // Track last selected resume
  // ---------------------------------------------------------------------------

  resumeSelect?.addEventListener("change", () => {
    lastSelectedResumeId = resumeSelect.value;
  });

  // ---------------------------------------------------------------------------
  // Open "Score New Job"
  // ---------------------------------------------------------------------------

  btnNewJob?.addEventListener("click", async () => {
    try {
      resumeModal?.classList.add("hidden");
      resetNewJobForm();
      await populateResumeSelect();
      updateSourceFields();
      newJobModal?.classList.remove("hidden");
    } catch (error) {
      console.error("Failed to load resumes:", error);
      window.alert(`Failed to load resumes: ${error.message}`);
    }
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
    updateSourceFields();
  });
}

function updateSourceFields() {
  const sourceType = document.getElementById("source-type");
  const urlField = document.getElementById("url-field");
  const textField = document.getElementById("text-field");
  const linkedinField = document.getElementById("linkedin-field");

  if (!sourceType) {
    return;
  }

  urlField?.classList.add("hidden");
  textField?.classList.add("hidden");
  linkedinField?.classList.add("hidden");

  if (sourceType.value === "url") {
    urlField?.classList.remove("hidden");
    return;
  }

  if (sourceType.value === "raw_text") {
    textField?.classList.remove("hidden");
    return;
  }

  if (sourceType.value === "linkedin_job_id") {
    linkedinField?.classList.remove("hidden");
  }
}

async function populateResumeSelect() {
  const resumeSelect = document.getElementById("resume-select");

  if (!resumeSelect) {
    return;
  }

  const resumes = await listResumes();

  resumeSelect.innerHTML = "";

  if (!Array.isArray(resumes) || resumes.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No resumes available";
    option.disabled = true;
    option.selected = true;
    resumeSelect.appendChild(option);
    return;
  }

  resumes.forEach((resume) => {
    const option = document.createElement("option");
    option.value = resume.resume_id;
    option.textContent = resume.name || "Untitled Resume";
    resumeSelect.appendChild(option);
  });

  const hasSavedSelection = resumes.some(
    (resume) => resume.resume_id === lastSelectedResumeId
  );

  if (hasSavedSelection) {
    resumeSelect.value = lastSelectedResumeId;
  } else {
    resumeSelect.value = resumes[0].resume_id;
    lastSelectedResumeId = resumes[0].resume_id;
  }
}

function resetNewJobForm() {
  document.getElementById("new-job-form")?.reset();

  document.getElementById("source-type").value = "url";
  document.getElementById("job-url").value = "";
  document.getElementById("job-description").value = "";
  document.getElementById("linkedin-job-ids").value = "";

  updateSourceFields();
}
