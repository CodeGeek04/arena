"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Button } from "./components/ui/button";
import { Textarea } from "./components/ui/textarea";

function App() {
  const [code1, setCode1] = useState("");
  const [code2, setCode2] = useState("");
  const [language1, setLanguage1] = useState("");
  const [language2, setLanguage2] = useState("");
  const [results, setResults] = useState({ code1: null, code2: null });
  const [executing, setExecuting] = useState(false);

  const languages = [
    { value: "python", label: "Python", extension: ".py" },
    { value: "javascript", label: "JavaScript", extension: ".js" },
    { value: "cpp", label: "C++", extension: ".cpp" },
    { value: "rust", label: "Rust", extension: ".rs" },
  ];

  const executeCode = async () => {
    setExecuting(true);
    setResults({ code1: null, code2: null });

    if (code1 === "" || code2 === "") {
      setExecuting(false);
      return;
    }

    const executeFile = async (
      code: string,
      language: string,
      index: 1 | 2
    ) => {
      const languageInfo = languages.find((lang) => lang.value === language);
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
        console.log(data);
        setResults((prev) => ({ ...prev, [`code${index}`]: data }));
      } catch (error) {
        console.error("Error executing code:", error);
        setResults((prev) => ({
          ...prev,
          [`code${index}`]: { error: "Failed to execute code" },
        }));
      }
    };

    // Execute both files concurrently
    await Promise.all([
      executeFile(code1, language1, 1),
      executeFile(code2, language2, 2),
    ]);

    setExecuting(false);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Dual Code Execution Interface</h1>

      <div className="grid grid-cols-2 gap-4">
        {[1, 2].map((index) => (
          <div key={index} className="space-y-2">
            <Select
              value={index === 1 ? language1 : language2}
              onValueChange={(value: string) =>
                index === 1 ? setLanguage1(value) : setLanguage2(value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Textarea
              value={index === 1 ? code1 : code2}
              onChange={(e) =>
                index === 1
                  ? setCode1(e.target.value)
                  : setCode2(e.target.value)
              }
              placeholder={`Enter ${
                index === 1 ? "first" : "second"
              } code snippet here`}
              className="h-60"
            />

            {results[`code${index}` as keyof typeof results] && (
              <div className="mt-2 p-2 bg-gray-100 rounded">
                <h3 className="font-semibold">Results:</h3>
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(
                    results[`code${index}` as keyof typeof results],
                    null,
                    2
                  )}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      <Button
        disabled={executing}
        onClick={executeCode}
        className={`mt-4 w-full ${
          executing ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        Execute Both
      </Button>
    </div>
  );
}

export default App;
