export type LanguageOption = {
  value: string;
  label: string;
  extension: string;
  monacoLanguage: string;
};

export type Result = {
  language: string;
  output: string;
  compilation_time: number;
  compilation_memory_bytes: number;
  execution_time: number;
  execution_memory_bytes: number;
  success: boolean;
};
