import React, { useState, useCallback, useRef } from "react";
import Editor from "@monaco-editor/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Loader2 } from "lucide-react";

const url = process.env.REACT_APP_DOCKER_SERVER;

type LanguageOption = {
  value: string;
  label: string;
  extension: string;
  monacoLanguage: string;
};

const languageOptions: LanguageOption[] = [
  {
    value: "python",
    label: "Python",
    extension: ".py",
    monacoLanguage: "python",
  },
  {
    value: "javascript",
    label: "JavaScript",
    extension: ".js",
    monacoLanguage: "javascript",
  },
  { value: "cpp", label: "C++", extension: ".cpp", monacoLanguage: "cpp" },
  { value: "rust", label: "Rust", extension: ".rs", monacoLanguage: "rust" },
];

export default function App() {
  const [language1, setLanguage1] = useState("javascript");
  const [language2, setLanguage2] = useState("javascript");
  const [results, setResults] = useState({ code1: null, code2: null });
  const [executing, setExecuting] = useState(false);

  const editorRef1 = useRef(null);
  const editorRef2 = useRef(null);

  const executeCode = useCallback(async () => {
    setExecuting(true);
    setResults({ code1: null, code2: null });

    const executeFile = async (
      code: string,
      language: string,
      index: 1 | 2
    ) => {
      const languageInfo = languageOptions.find(
        (lang) => lang.value === language
      );
      if (!languageInfo) {
        return { error: "Invalid language selected" };
      }

      const file = new File([code], `code${languageInfo.extension}`, {
        type: "text/plain",
      });
      const formData = new FormData();
      formData.append("file", file);
      try {
        const response = await fetch(url, {
          method: "POST",
          body: formData,
        });
        return await response.json();
      } catch (error) {
        console.error("Error executing code:", error);
        return { error: "Failed to execute code" };
      }
    };

    const [result1, result2] = await Promise.all([
      executeFile(editorRef1.current?.getValue(), language1, 1),
      executeFile(editorRef2.current?.getValue(), language2, 2),
    ]);

    setResults({ code1: result1, code2: result2 });
    setExecuting(false);
  }, [language1, language2]);

  const ResultCard = ({ title, result }) => (
    <Card className="mt-4 bg-gray-800 text-white">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {result ? (
          <div>
            <p>
              <strong>Output:</strong>
            </p>
            <pre className="bg-gray-700 p-2 rounded mt-2 overflow-x-auto text-green-400">
              {result.output}
            </pre>
            <p>
              <strong>Compilation time:</strong> {result.compilation_time}s
            </p>
            <p>
              <strong>Execution time:</strong> {result.execution_time}s
            </p>
            <p>
              <strong>Success:</strong> {result.success ? "Yes" : "No"}
            </p>
          </div>
        ) : (
          <p>No results yet.</p>
        )}
      </CardContent>
    </Card>
  );

  const CodeEditor = React.memo(
    ({ editorIndex, language }: { editorIndex: 1 | 2; language: string }) => {
      const handleEditorDidMount = (editor) => {
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
    }
  );

  const handleLanguageChange = useCallback(
    (editorIndex: 1 | 2, value: string) => {
      if (editorIndex === 1) {
        setLanguage1(value);
      } else {
        setLanguage2(value);
      }
    },
    []
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-4 max-w-6xl">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Language Comparison Tool
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((index) => (
            <div key={index} className="space-y-4">
              <Card className="bg-gray-800">
                <CardHeader>
                  <CardTitle>Language {index}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={index === 1 ? language1 : language2}
                    onValueChange={(value) =>
                      handleLanguageChange(index as 1 | 2, value)
                    }
                  >
                    <SelectTrigger className="w-full bg-gray-700 text-white">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 text-white">
                      {languageOptions.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
              <div className="mt-4 border border-gray-700 rounded-md overflow-hidden">
                <CodeEditor
                  editorIndex={index as 1 | 2}
                  language={index === 1 ? language1 : language2}
                />
              </div>
              <ResultCard
                title={`Results for Language ${index}`}
                result={results[`code${index}`]}
              />
            </div>
          ))}
        </div>
        <Button
          onClick={executeCode}
          disabled={executing || !language1 || !language2}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700"
        >
          {executing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Executing...
            </>
          ) : (
            "Compare Languages"
          )}
        </Button>
      </div>
    </div>
  );
}
