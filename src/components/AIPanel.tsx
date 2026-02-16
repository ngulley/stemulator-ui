import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, Bot, User, AlertCircle } from "lucide-react";
import { SimulationState } from "../types";
import {
  chatWithCoach,
  isOpenAIConfigured,
  SimContext,
} from "../services/openai";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

interface AIPanelProps {
  simState: SimulationState;
  labTitle: string;
  discipline: string;
  topic: string;
  subTopic: string;
}

const QUICK_ACTIONS = [
  {
    label: "Explain what's happening",
    prompt:
      "Explain what's currently happening in the simulation and why the population is changing this way.",
    color:
      "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  },
  {
    label: "Why did this happen?",
    prompt:
      "Why did the population change this way? What biological mechanisms are driving these results?",
    color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  },
  {
    label: "What should I try next?",
    prompt:
      "What parameters should I change next to explore different outcomes? What hypothesis could I test?",
    color: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
  },
];

function buildContext(props: AIPanelProps, state: SimulationState): SimContext {
  const prey = state.organisms.filter((o) => o.role !== "predator");
  const preds = state.organisms.filter((o) => o.role === "predator");
  const avg = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  return {
    labTitle: props.labTitle,
    discipline: props.discipline,
    topic: props.topic,
    subTopic: props.subTopic,
    environment: state.environment,
    predation: state.predation,
    foodAvailability: state.foodAvailability,
    mutationRate: state.mutationRate,
    generation: state.generation,
    populationSize: state.organisms.length,
    preyCount: prey.length,
    predatorCount: preds.length,
    survivalRate: state.survivalRate,
    avgSpeed: avg(prey.map((o) => o.speed)),
    avgCamouflage: avg(prey.map((o) => o.camouflage)),
    avgSize: avg(prey.map((o) => o.size)),
  };
}

const AIPanel: React.FC<AIPanelProps> = (props) => {
  const { simState } = props;
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const configured = isOpenAIConfigured();

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMsg = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const ctx = buildContext(props, simState);
      // Build history for multi-turn context (last 10 messages)
      const history = [...messages, userMsg]
        .slice(-10)
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
      // Remove the last user message since chatWithCoach adds it
      history.pop();

      const reply = await chatWithCoach(text.trim(), ctx, history);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      const errMsg =
        err instanceof Error ? err.message : "Something went wrong";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ ${errMsg}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!configured) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <div className="p-3 bg-amber-100 rounded-full mb-3">
          <AlertCircle className="w-6 h-6 text-amber-600" />
        </div>
        <h3 className="font-bold text-slate-900 mb-1">
          AI Coach Not Configured
        </h3>
        <p className="text-sm text-slate-600 mb-3 max-w-xs">
          Add your OpenAI API key to enable the AI Science Coach.
        </p>
        <code className="text-xs bg-slate-100 px-3 py-2 rounded-lg text-slate-700 font-mono">
          VITE_OPENAI_API_KEY=sk-...
        </code>
        <p className="text-xs text-slate-500 mt-2">
          Add this to your <span className="font-medium">.env</span> file and
          restart the dev server.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-3">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="font-semibold text-slate-700 text-sm">
              AI Science Coach
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Ask questions about your simulation or use a quick action below.
            </p>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {QUICK_ACTIONS.map((qa) => (
                <button
                  key={qa.label}
                  onClick={() => send(qa.prompt)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${qa.color}`}
                >
                  {qa.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-purple-600" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              {msg.content.split("\n").map((line, i) => (
                <p key={i} className={i > 0 ? "mt-1.5" : ""}>
                  {line}
                </p>
              ))}
            </div>
            {msg.role === "user" && (
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 items-center">
            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="bg-slate-100 rounded-lg px-3 py-2 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" />
              <span className="text-xs text-slate-500">Thinking…</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick actions (shown when there are messages) */}
      {messages.length > 0 && (
        <div className="flex gap-1.5 mb-2 flex-wrap">
          {QUICK_ACTIONS.map((qa) => (
            <button
              key={qa.label}
              onClick={() => send(qa.prompt)}
              disabled={loading}
              className={`text-[10px] font-medium px-2 py-1 rounded-full border transition-colors disabled:opacity-50 ${qa.color}`}
            >
              {qa.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the simulation…"
          disabled={loading}
          className="flex-1 text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default AIPanel;
