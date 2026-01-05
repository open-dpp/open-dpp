import { defineStore } from "pinia";
import apiClient from "../lib/api-client.ts";

export const useTemplatesStore = defineStore("templates", () => {
  const createTemplate = async () => {
    const response = await apiClient.dpp.templates.create();
    return response.data;
  };
  return { createTemplate };
});
