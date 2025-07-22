"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ReadMoreProps {
  text: string;
  collapsedLines?: number;
}

export default function ReadMore({ text, collapsedLines = 4 }: ReadMoreProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div>
      <div
        className={`
          prose prose-slate dark:prose-invert max-w-none 
          text-slate-600 dark:text-slate-200 leading-relaxed
          transition-all duration-300 ease-in-out
        `}
        style={{
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: isExpanded ? "none" : collapsedLines,
          overflow: "hidden",
        }}>
        {text}
      </div>
      <button
        onClick={toggleExpansion}
        className="
          cursor-pointer mt-3 flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400
          hover:text-blue-800 dark:hover:text-blue-300 transition-colors
          focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md
        ">
        {isExpanded ? "Свий" : "Прочети повече"}
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
