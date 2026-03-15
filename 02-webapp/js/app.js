import { createJob, listResumes } from "./api.js";
import { loadJobs } from "./jobs.js";
import { bindResumeHandlers, openResumeManager } from "./resumes.js";
import { getLoginUrl, getLogoutUrl, isLoggedIn } from "./auth.js";

let lastSelectedResumeId = "";

document.addEventListener("DOMContentLoaded", async () => {
  updateAuthButtons();
  bindUiHandlers();
  bindResumeHandlers();

  if (!isLoggedIn()) {
    showNotLoggedInMessage();
    return;
  }

  try {
    await refreshApp();
  } catch (error) {
    console.error("Failed to load dashboard:", error);
  }
});

function bindUiHandlers() {
  const newJobModal = document.getElementById("new-job-modal");
  const resumeModal = document.getElementById("resume-modal");

  const btnNewJob = document.getElementById("btn-new-job");
  const btnManageResumes = document.getElementById("btn-manage-resumes");
  const cancelNewJob = document.getElementById("cancel-new-job");
  const btnSignIn = document.getElementById("btn-sign-in");
  const btnSignOut = document.getElementById("btn-sign-out");
  
  const sourceType = document.getElementById("source-type");
  const resumeSelect = document.getElementById("resume-select");
  const newJobForm = document.getElementById("new-job-form");
  
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
      updateNewJobFormValidation();
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

// ---------------------------------------------------------------------------
// Live validation listeners
// ---------------------------------------------------------------------------

resumeSelect?.addEventListener("change", updateNewJobFormValidation);

sourceType?.addEventListener("change", updateNewJobFormValidation);

document
  .getElementById("job-url")
  ?.addEventListener("input", updateNewJobFormValidation);

document
  .getElementById("job-description")
  ?.addEventListener("input", updateNewJobFormValidation);

document
  .getElementById("linkedin-job-ids")
  ?.addEventListener("input", updateNewJobFormValidation);


  newJobForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const validation = validateNewJobForm();

  clearNewJobFormErrors();

  if (!validation.isValid) {
    renderNewJobFormErrors(validation.errors);
    return;
  }

  await submitJobScoringRequest();
  document.getElementById("new-job-modal")?.classList.add("hidden");
  resetNewJobForm();
  await refreshApp();

});

  document.getElementById("btn-refresh")?.addEventListener("click", refreshApp);

  // ---------------------------------------------------------------------------
  // Sign in
  // ---------------------------------------------------------------------------

  btnSignIn?.addEventListener("click", () => {
    window.location.href = getLoginUrl();
  });

  // ---------------------------------------------------------------------------
  // Sign out
  // ---------------------------------------------------------------------------

  btnSignOut?.addEventListener("click", () => {
  localStorage.removeItem("id_token");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");

  window.location.href = getLogoutUrl();
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

function validateNewJobForm() {
  const errors = {};

  const resumeId = document.getElementById("resume-select")?.value.trim() || "";
  const sourceType = document.getElementById("source-type")?.value || "url";
  const jobUrl = document.getElementById("job-url")?.value.trim() || "";
  const jobDescription =
    document.getElementById("job-description")?.value.trim() || "";
  const linkedinRaw =
    document.getElementById("linkedin-job-ids")?.value.trim() || "";

  if (!resumeId) {
    errors.resume = "You must select a resume.";
  }

  if (sourceType === "url") {
  if (!jobUrl) {
    errors.jobUrl = "Job URL is required.";
  } else if (!isValidUrl(jobUrl)) {
    errors.jobUrl = "URL is invalid. Enter a valid http or https URL.";
  }
  }

  if (sourceType === "raw_text") {
    if (!jobDescription) {
      errors.jobDescription = "Job description is required.";
    } else if (jobDescription.length < 100) {
      errors.jobDescription = "Job description is too short.";
    }
  }

 if (sourceType === "linkedin_job_id") {
  const jobIds = parseLinkedInJobIds(linkedinRaw);

  if (jobIds.length === 0) {
    errors.linkedinJobIds = "Enter at least one LinkedIn job ID.";
  } else if (!jobIds.every(isValidLinkedInJobId)) {
    errors.linkedinJobIds =
      "Each LinkedIn Job ID must be numeric and 7 to 12 digits long.";
  }
}

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

function parseLinkedInJobIds(value) {
  return value
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isValidLinkedInJobId(value) {
  return /^\d{7,12}$/.test(value);
}


function renderNewJobFormErrors(errors) {
  setFieldError("resume-error", errors.resume);
  setFieldError("job-url-error", errors.jobUrl);
  setFieldError("job-description-error", errors.jobDescription);
  setFieldError("linkedin-job-ids-error", errors.linkedinJobIds);
}

function clearNewJobFormErrors() {
  renderNewJobFormErrors({});
}

function setFieldError(elementId, message) {
  const element = document.getElementById(elementId);

  if (!element) {
    return;
  }

  if (message) {
    element.textContent = message;
    element.classList.remove("hidden");
  } else {
    element.textContent = "";
    element.classList.add("hidden");
  }
}

function updateNewJobFormValidation() {
  const validation = validateNewJobForm();

  renderNewJobFormErrors(validation.errors);

  const submitButton = document.getElementById("submit-new-job");

  if (submitButton) {
    submitButton.disabled = !validation.isValid;
  }
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function refreshApp() {
  const refreshButton = document.getElementById("btn-refresh");
  const originalText = refreshButton?.textContent || "Refresh";

  try {
    if (refreshButton) {
      refreshButton.disabled = true;
      /*refreshButton.textContent = "Refreshing...";*/
    }

    await loadJobs();
  } catch (error) {
    console.error("Failed to refresh dashboard:", error);
    window.alert(`Failed to refresh jobs: ${error.message}`);
  } finally {
    if (refreshButton) {
      refreshButton.disabled = false;
      /*refreshButton.textContent = originalText;*/
    }
  }
}

async function submitJobScoringRequest() {
  const resumeId = document.getElementById("resume-select")?.value.trim() || "";
  const sourceType = document.getElementById("source-type")?.value || "url";

  // ---------------------------------------------------------------------------
  // URL source
  // ---------------------------------------------------------------------------
  if (sourceType === "url") {
    const jobUrl = document.getElementById("job-url")?.value.trim() || "";

    await createJob({
      resume_id: resumeId,
      source_type: "url",
      job_url: jobUrl
    });

    return;
  }

  // ---------------------------------------------------------------------------
  // Raw job description source
  // ---------------------------------------------------------------------------
  if (sourceType === "raw_text") {
    const jobDescription =
      document.getElementById("job-description")?.value.trim() || "";

    await createJob({
      resume_id: resumeId,
      source_type: "raw_text",
      job_description: jobDescription
    });

    return;
  }

  // ---------------------------------------------------------------------------
  // LinkedIn job IDs
  // ---------------------------------------------------------------------------
  if (sourceType === "linkedin_job_id") {
    const jobIdsText =
      document.getElementById("linkedin-job-ids")?.value.trim() || "";

    const jobIds = jobIdsText
      .split("\n")
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    for (const jobId of jobIds) {
      const jobUrl = `https://www.linkedin.com/jobs/view/${jobId}`;

      await createJob({
        resume_id: resumeId,
        source_type: "url",
        job_url: jobUrl
      });
    }

    return;
  }
}

function updateAuthButtons() {
  const signIn = document.getElementById("btn-sign-in");
  const signOut = document.getElementById("btn-sign-out");

  const refresh = document.getElementById("btn-refresh");
  const scoreJob = document.getElementById("btn-new-job");
  const manageResumes = document.getElementById("btn-manage-resumes");

  const loggedIn = isLoggedIn();

  if (loggedIn) {
    signIn?.classList.add("hidden");
    signOut?.classList.remove("hidden");

    refresh?.removeAttribute("disabled");
    scoreJob?.removeAttribute("disabled");
    manageResumes?.removeAttribute("disabled");

  } else {
    signIn?.classList.remove("hidden");
    signOut?.classList.add("hidden");

    refresh?.setAttribute("disabled", "true");
    scoreJob?.setAttribute("disabled", "true");
    manageResumes?.setAttribute("disabled", "true");
  }
}

function showNotLoggedInMessage() {
  const container = document.getElementById("jobs-container");

  if (container) {
    container.innerHTML = `
      <div class="empty-state">
        Please sign in to use the application.
      </div>
    `;
  }
}
