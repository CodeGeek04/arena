"use client";

import React, { useState, useCallback, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Loader2 } from "lucide-react";
import { executeCodeServer } from "~/server/executeCode";
import ResultCard from "~/components/resultCard";
import { LanguageOption, Result } from "~/types/types";
import CodeEditor from "~/components/codeEditor";

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
  const [language1, setLanguage1] = useState<string>("javascript");
  const [language2, setLanguage2] = useState<string>("javascript");
  const [results, setResults] = useState<{
    1: Result | {};
    2: Result | {};
  }>({
    1: {},
    2: {},
  });
  const [executing, setExecuting] = useState<boolean>(false);

  const editorRef1 = useRef<any>(null);
  const editorRef2 = useRef<any>(null);

  const executeCode = useCallback(async () => {
    setExecuting(true);
    setResults({ 1: {}, 2: {} });

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

      const response = await executeCodeServer(code, languageInfo);
      console.log("Response: ", response);

      // Update the results state immediately for this index
      setResults((prevResults) => ({
        ...prevResults,
        [index]: response,
      }));

      return response;
    };

    // Execute both in parallel, but don't wait for both to complete
    executeFile(editorRef1.current?.getValue(), language1, 1);
    executeFile(editorRef2.current?.getValue(), language2, 2);

    // Set executing to false after both have started
    setExecuting(false);
  }, [language1, language2]);

  const handleLanguageChange = (editorIndex: 1 | 2, value: string) => {
    if (editorIndex === 1) {
      setLanguage1(value);
    } else {
      setLanguage2(value);
    }
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
                    onValueChange={(value: string) =>
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
                  editorRef1={editorRef1}
                  editorRef2={editorRef2}
                  languageOptions={languageOptions}
                />
              </div>
              <ResultCard
                title={`Results for Language ${index}`}
                result={results[index as 1 | 2] as Result}
                executing={executing}
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
