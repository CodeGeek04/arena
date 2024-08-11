"use server";

import { Result } from "~/types/types";

type LanguageOption = {
  value: string;
  label: string;
  extension: string;
  monacoLanguage: string;
};

export async function executeCodeServer(
  code: string,
  languageInfo: LanguageOption
) {
  console.log("Executing code server");
  const file = new File([code], `code${languageInfo.extension}`, {
    type: "text/plain",
  });
  const formData = new FormData();
  formData.append("file", file);
  try {
    const response = await fetch(process.env.REACT_APP_DOCKER_SERVER!, {
      method: "POST",
      body: formData,
    });
    const result = await response.json();
    console.log(result);
    return result as Result;
  } catch (error) {
    console.error("Error executing code:", error);
    return {
      language: languageInfo.value,
      error: "Failed to execute code",
      output: "",
      success: false,
      compilation_time: 0,
      compilation_memory_bytes: 0,
      execution_time: 0,
      execution_memory_bytes: 0,
    } as Result;
  }
}
