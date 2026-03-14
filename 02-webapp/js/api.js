import { CONFIG } from "./config.js";

const API_BASE_URL = CONFIG.API_BASE_URL;

// -----------------------------------------------------------------------------
// Common request helper
// -----------------------------------------------------------------------------

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  let data = null;

  try {
    data = await response.json();
  } catch (_) {
    data = null;
  }

  if (!response.ok) {
    const message = data?.error || `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return data;
}

// -----------------------------------------------------------------------------
// Jobs API
// -----------------------------------------------------------------------------

export async function listJobs() {
  return apiRequest("/jobs", {
    method: "GET"
  });
}

export async function getJob(jobId) {
  return apiRequest(`/jobs/${jobId}`, {
    method: "GET"
  });
}

export async function createJob(payload) {
  return apiRequest("/jobs", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateJobNotes(jobId, notes) {
  return apiRequest(`/jobs/${jobId}/notes`, {
    method: "PATCH",
    body: JSON.stringify({
      notes: notes
    })
  });
}

export async function deleteJob(jobId) {
  return apiRequest(`/jobs/${jobId}`, {
    method: "DELETE"
  });
}

// -----------------------------------------------------------------------------
// Resumes API
// -----------------------------------------------------------------------------

export async function listResumes() {
  return apiRequest("/resumes", {
    method: "GET"
  });
}

export async function getResume(resumeId) {
  return apiRequest(`/resumes/${resumeId}`, {
    method: "GET"
  });
}

export async function createResume(payload) {
  return apiRequest("/resumes", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateResume(resumeId, payload) {
  return apiRequest(`/resumes/${resumeId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function deleteResume(resumeId) {
  return apiRequest(`/resumes/${resumeId}`, {
    method: "DELETE"
  });
}
