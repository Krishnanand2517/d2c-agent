import { useState, useRef, useEffect } from "react";
import { ArrowUp, MessageSquare } from "lucide-react";
import { api, type ChatMessage } from "../lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: Array<{ tool: string; result_summary: string }>;
  loading?: boolean;
}

function renderContent(text: string) {
  const CITATION_RE = /(\[(?:shopify|shiprocket|google_sheets):[^\]]+\])/g;
  const sourceColor: Record<string, string> = {
    shopify: "text-emerald-400 border-emerald-800 bg-emerald-950",
    shiprocket: "text-orange-400 border-orange-800 bg-orange-950",
    google_sheets: "text-blue-400 border-blue-800 bg-blue-950",
  };

  return text.split(CITATION_RE).map((part, i) => {
    if (CITATION_RE.test(part)) {
      CITATION_RE.lastIndex = 0;
      const src = part.includes("shopify")
        ? "shopify"
        : part.includes("shiprocket")
          ? "shiprocket"
          : "google_sheets";
      return (
        <span
          key={i}
          className={`citation border ${sourceColor[src]}`}
          title="Source citation"
        >
          {part}
        </span>
      );
    }
    return (
      <span key={i}>
        {part
          .split("\n")
          .flatMap((line, j) => (j === 0 ? [line] : [<br key={j} />, line]))}
      </span>
    );
  });
}

const SUGGESTIONS = [
  "Give me a business overview",
  "What is my shipping spend as % of revenue?",
  "Break down expenses by category",
  "Which courier has the highest RTO rate?",
  "Show me my top orders by value",
  "What are the latest agent recommendations?",
];

const ChatWindow = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    setInput("");

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };
    const loadingMsg: Message = {
      id: `a-${Date.now()}`,
      role: "assistant",
      content: "",
      loading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setLoading(true);

    try {
      const history: ChatMessage[] = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const res = await api.chat(history);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? {
                ...m,
                content: res.message,
                toolCalls: res.tool_calls,
                loading: false,
              }
            : m,
        ),
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? { ...m, content: `Error: ${String(err)}`, loading: false }
            : m,
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-16 px-6">
            <div className="w-12 h-12 rounded-2xl bg-ink-800 border border-ink-700 flex items-center justify-center mb-4 text-2xl">
              <MessageSquare size={12} />
            </div>
            <h2 className="font-display font-bold text-xl mb-1">
              Ask your data anything
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-left px-3 py-2 rounded-lg bg-ink-900 border border-ink-700 hover:border-ink-500 text-sm text-ink-300 hover:text-ink-100 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex animate-slide-up ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className="max-w-[82%] space-y-1.5">
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-linear-to-br from-signal-green to-signal-blue" />
                  <span className="text-xs text-ink-400 font-mono">
                    D2C Agent
                  </span>
                </div>
              )}

              <div
                className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-ink-700 text-ink-100"
                    : "card text-ink-100"
                }`}
              >
                {msg.loading ? (
                  <div className="flex gap-1 py-1">
                    {[0, 200, 400].map((d) => (
                      <span
                        key={d}
                        className="w-1.5 h-1.5 rounded-full bg-signal-green animate-blink"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">
                    {renderContent(msg.content)}
                  </div>
                )}
              </div>

              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="space-y-1 pl-1">
                  {msg.toolCalls.map((tc, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-2 py-1 rounded bg-ink-950 border border-ink-800"
                    >
                      <span className="text-xs font-mono text-signal-blue">
                        ⚙ {tc.tool}
                      </span>
                      <span className="text-xs text-ink-500">
                        {tc.result_summary}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-ink-800 p-4">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask about your orders, shipments, or expenses..."
            rows={1}
            className="flex-1 bg-ink-900 border border-ink-700 rounded-xl px-4 py-3 text-sm text-ink-100 placeholder-ink-500 resize-none focus:outline-none focus:border-ink-500 font-sans"
            style={{ maxHeight: 120 }}
          />

          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl bg-signal-green text-ink-950 font-bold flex items-center justify-center disabled:opacity-30 hover:opacity-90 transition-opacity shrink-0"
          >
            <ArrowUp size={18} />
          </button>
        </div>

        <p className="mt-1.5 text-xs text-ink-500">Shift+Enter for newline</p>
      </div>
    </div>
  );
};

export default ChatWindow;
