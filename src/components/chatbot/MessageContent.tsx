"use client";

import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";

type MessageContentProps = {
  content: string;
};

function renderInline(text: string) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded bg-brand-dark px-1 py-0.5 font-mono text-violet-300"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

export default function MessageContent({ content }: MessageContentProps) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (line.startsWith("```")) {
      const language = line.replace("```", "").trim() || "text";
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      elements.push(
        <SyntaxHighlighter
          key={`code-${index}`}
          language={language}
          style={atomDark}
          customStyle={{
            margin: 0,
            borderRadius: "14px",
            background: "#0C0C15",
            border: "1px solid #1C1C2E",
            fontSize: "0.8rem",
          }}
        >
          {codeLines.join("\n")}
        </SyntaxHighlighter>,
      );
      index += 1;
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s/.test(lines[index])) {
        items.push(lines[index].replace(/^\d+\.\s/, ""));
        index += 1;
      }
      elements.push(
        <ol key={`ol-${index}`} className="ml-5 list-decimal space-y-1">
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    if (/^- /.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^- /.test(lines[index])) {
        items.push(lines[index].replace(/^- /, ""));
        index += 1;
      }
      elements.push(
        <ul key={`ul-${index}`} className="ml-5 list-disc space-y-1">
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    if (line.trim() === "") {
      elements.push(<div key={`spacer-${index}`} className="h-2" />);
      index += 1;
      continue;
    }

    elements.push(
      <p key={`p-${index}`} className="whitespace-pre-wrap leading-relaxed">
        {renderInline(line)}
      </p>,
    );
    index += 1;
  }

  return <div className="space-y-3 text-sm text-brand-text">{elements}</div>;
}
