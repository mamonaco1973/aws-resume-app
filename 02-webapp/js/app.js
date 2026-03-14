import { loadJobs } from "./jobs.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadJobs();
  } catch (error) {
    console.error("Failed to load dashboard:", error);
    window.alert(`Failed to load jobs: ${error.message}`);
  }
});