import React, { useState } from "react";
import { LabSnapshot } from "../types";

interface AIPanelProps {
  onSendSnapshot: (snapshot: LabSnapshot) => void;
  snapshot: LabSnapshot;
}

const AIPanel: React.FC<AIPanelProps> = ({ onSendSnapshot, snapshot }) => {
  const [messages, setMessages] = useState<string[]>([]);

  const handleButton = (action: string) => {
    setMessages((prev) => [...prev, `User: ${action}`]);
    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [...prev, `AI: Response to ${action}`]);
    }, 1000);
  };

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h2 className="text-xl font-bold mb-4">AI Panel</h2>
      <div className="mb-4 h-40 overflow-y-auto border p-2">
        {messages.map((msg, idx) => (
          <p key={idx}>{msg}</p>
        ))}
      </div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => handleButton("Explain")}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Explain
        </button>
        <button
          onClick={() => handleButton("Why did this happen?")}
          className="bg-yellow-500 text-white px-4 py-2 rounded"
        >
          Why did this happen?
        </button>
        <button
          onClick={() => handleButton("What should I try next?")}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          What should I try next?
        </button>
      </div>
      <button
        onClick={() => onSendSnapshot(snapshot)}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Send Lab Snapshot
      </button>
    </div>
  );
};

export default AIPanel;
