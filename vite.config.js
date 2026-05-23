import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const isGitHubPages = process.env.GITHUB_ACTIONS === "true" && repoName;

export default defineConfig({
  base: isGitHubPages ? `/${repoName}/` : "/",
  plugins: [react(), tailwindcss()],
});
