import { Editor } from "@monaco-editor/react";
import { LanguageOption } from "~/types/types";

const CodeEditor = ({
  editorIndex,
  language,
  editorRef1,
  editorRef2,
  languageOptions,
}: {
  editorIndex: number;
  language: string;
  editorRef1: any;
  editorRef2: any;
  languageOptions: LanguageOption[];
}) => {
  const handleEditorDidMount = (editor: any) => {
    if (editorIndex === 1) {
      editorRef1.current = editor;
    } else {
      editorRef2.current = editor;
    }
  };

  return (
    <Editor
      height="400px"
      defaultLanguage={language}
      language={
        languageOptions.find((lang) => lang.value === language)
          ?.monacoLanguage || "plaintext"
      }
      defaultValue="// Enter your code here"
      onMount={handleEditorDidMount}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 14,
        fontFamily: '"Fira Code", "Fira Mono", monospace',
        lineNumbers: "on",
        roundedSelection: false,
        automaticLayout: true,
      }}
    />
  );
};

export default CodeEditor;
