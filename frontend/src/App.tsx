"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import Editor from "react-simple-code-editor";
import { Highlight, themes } from "prism-react-renderer";
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

const languageOptions = [
  {
    value: "python",
    label: "Python",
    extension: ".py",
    prismLanguage: "python",
  },
  {
    value: "javascript",
    label: "JavaScript",
    extension: ".js",
    prismLanguage: "javascript",
  },
  {
    value: "cpp",
    label: "C++",
    extension: ".cpp",
    prismLanguage: "cpp",
  },
  {
    value: "rust",
    label: "Rust",
    extension: ".rs",
    prismLanguage: "rust",
  },
];

export default function App() {
  const [code1, setCode1] = useState("");
  const [code2, setCode2] = useState("");
  const [language1, setLanguage1] = useState("");
  const [language2, setLanguage2] = useState("");
  const [results, setResults] = useState({ code1: null, code2: null });
  const [executing, setExecuting] = useState(false);
  const editorRef1 = useRef(null);
  const editorRef2 = useRef(null);

  const executeCode = async () => {
    setExecuting(true);
    setResults({ code1: null, code2: null });

    if (code1 === "" || code2 === "") {
      setExecuting(false);
      return;
    }

    const executeFile = async (code, language, index) => {
      const languageInfo = languageOptions.find(
        (lang) => lang.value === language
      );
      if (!languageInfo) {
        setResults((prev) => ({
          ...prev,
          [`code${index}`]: { error: "Invalid language selected" },
        }));
        return;
      }

      const file = new File([code], `code${languageInfo.extension}`, {
        type: "text/plain",
      });
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("http://localhost:8000/execute", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        setResults((prev) => ({ ...prev, [`code${index}`]: data }));
      } catch (error) {
        console.error("Error executing code:", error);
        setResults((prev) => ({
          ...prev,
          [`code${index}`]: { error: "Failed to execute code" },
        }));
      }
    };

    await Promise.all([
      executeFile(code1, language1, 1),
      executeFile(code2, language2, 2),
    ]);

    setExecuting(false);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const roundTime = (time) => {
    return time.toFixed(2);
  };

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
              <strong>Compilation time:</strong>{" "}
              {roundTime(result.compilation_time)}s
            </p>
            <p>
              <strong>Execution time:</strong>{" "}
              {roundTime(result.execution_time)}s
            </p>
            <p>
              <strong>Compilation memory:</strong>{" "}
              {formatBytes(result.compilation_memory_bytes)}
            </p>
            <p>
              <strong>Execution memory:</strong>{" "}
              {formatBytes(result.execution_memory_bytes)}
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

  const CodeEditor = ({ code, setCode, language, editorRef }) => {
    const [isFocused, setIsFocused] = useState(false);
    const internalEditorRef = useRef(null);

    const handleEditorMount = useCallback(
      (editor) => {
        if (editor) {
          internalEditorRef.current = editor;
          if (editorRef) {
            editorRef.current = editor;
          }
        }
      },
      [editorRef]
    );

    useEffect(() => {
      if (isFocused && internalEditorRef.current) {
        const textarea = internalEditorRef.current._input;
        if (textarea) {
          textarea.focus();
        }
      }
    }, [isFocused]);

    const handleFocus = () => {
      setIsFocused(true);
    };

    const handleBlur = () => {
      setIsFocused(false);
    };

    const handleKeyDown = (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const start = e.target.selectionStart;
        const end = e.target.selectionEnd;
        setCode(code.substring(0, start) + "  " + code.substring(end));
        setTimeout(() => {
          e.target.selectionStart = e.target.selectionEnd = start + 2;
        }, 0);
      }
    };

    return (
      <div
        className="border border-gray-700 rounded-md overflow-hidden"
        style={{ height: "400px" }}
      >
        <Editor
          ref={handleEditorMount}
          value={code}
          onValueChange={setCode}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          highlight={(code) =>
            language ? (
              <Highlight
                theme={themes.vsDark}
                code={code}
                language={
                  languageOptions.find((l) => l.value === language)
                    ?.prismLanguage || "text"
                }
              >
                {({
                  className,
                  style,
                  tokens,
                  getLineProps,
                  getTokenProps,
                }) => (
                  <>
                    {tokens.map((line, i) => (
                      <div {...getLineProps({ line, key: i })}>
                        {line.map((token, key) => (
                          <span {...getTokenProps({ token, key })} />
                        ))}
                      </div>
                    ))}
                  </>
                )}
              </Highlight>
            ) : (
              <pre>{code}</pre>
            )
          }
          padding={10}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 14,
            backgroundColor: "#1e1e1e",
            color: "#d4d4d4",
            height: "100%",
            overflow: "auto",
          }}
        />
      </div>
    );
  };

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
                      index === 1 ? setLanguage1(value) : setLanguage2(value)
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
                  <div className="mt-4">
                    <CodeEditor
                      code={index === 1 ? code1 : code2}
                      setCode={index === 1 ? setCode1 : setCode2}
                      language={index === 1 ? language1 : language2}
                      editorRef={index === 1 ? editorRef1 : editorRef2}
                    />
                  </div>
                </CardContent>
              </Card>
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
