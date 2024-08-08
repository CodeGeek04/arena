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
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Loader2 } from "lucide-react";

const languages = [
  { value: "python", label: "Python", extension: ".py" },
  { value: "javascript", label: "JavaScript", extension: ".js" },
  { value: "cpp", label: "C++", extension: ".cpp" },
  { value: "rust", label: "Rust", extension: ".rs" },
];

export default function App() {
  const [code1, setCode1] = useState("");
  const [code2, setCode2] = useState("");
  const [language1, setLanguage1] = useState("");
  const [language2, setLanguage2] = useState("");
  const [results, setResults] = useState({ code1: null, code2: null });
  const [executing, setExecuting] = useState(false);

  const executeCode = async () => {
    setExecuting(true);
    setResults({ code1: null, code2: null });

    if (code1 === "" || code2 === "") {
      setExecuting(false);
      return;
    }

    const executeFile = async (code, language, index) => {
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

  const ResultCard = ({ title, result }) => (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {result ? (
          <div>
            <p>
              <strong>Output:</strong>
            </p>
            <pre className="bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
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

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Language Comparison Tool
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((index) => (
          <div key={index} className="space-y-4">
            <Card>
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
                  placeholder={`Enter code for Language ${index}`}
                  className="mt-4 h-64"
                />
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
        disabled={executing}
        className="mt-6 w-full"
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
  );
}
