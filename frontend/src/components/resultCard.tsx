import { Result } from "~/types/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const ResultCard = ({
  title,
  result,
  executing,
}: {
  title: string;
  result: Result;
  executing: boolean;
}) => {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const roundTime = (time: number) => {
    return typeof time === "number" ? time.toFixed(2) : "N/A";
  };

  return (
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
              {executing
                ? "Executing..."
                : result.output ?? "Please run the code to see the output"}
            </pre>
            <p>
              <strong>Compilation time:</strong>{" "}
              {executing
                ? "Executing..."
                : result.compilation_time
                ? `${roundTime(result.compilation_time)}s`
                : "NA"}
            </p>
            <p>
              <strong>Execution time:</strong>{" "}
              {executing
                ? "Executing..."
                : result.execution_time
                ? `${roundTime(result.execution_time)}s`
                : "NA"}
            </p>
            <p>
              <strong>Compilation memory:</strong>{" "}
              {executing
                ? "Executing..."
                : result.compilation_memory_bytes
                ? `${formatBytes(result.compilation_memory_bytes)}`
                : "NA"}
            </p>
            <p>
              <strong>Execution memory:</strong>{" "}
              {executing
                ? "Executing..."
                : result.execution_memory_bytes
                ? `${formatBytes(result.execution_memory_bytes)}`
                : "NA"}
            </p>
            <p>
              <strong>Success:</strong>{" "}
              {executing ? "Executing..." : result.success ? "Yes" : "No"}
            </p>
          </div>
        ) : (
          <p>No results yet.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ResultCard;
