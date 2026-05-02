import { useState, useRef, useEffect } from "react";
import { Link, useParams } from "wouter";
import { useGetProject } from "@workspace/api-client-react";
import { getGetProjectQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { usePlan } from "@/hooks/usePlan";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const SUGGESTED_QUESTIONS = [
  "Qual é o maior risco do meu modelo de negócio?",
  "Como eu deveria priorizar o backlog com base nos meus artefatos?",
  "Qual é a hipótese mais fraca do meu produto?",
  "Quem são os concorrentes mais perigosos e por quê?",
  "Como eu chego nos meus primeiros 10 clientes?",
  "Quais gaps de segurança existem na minha arquitetura?",
];

export function AdvisorPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = parseInt(params.projectId ?? "0", 10);
  const { permissions, loading: planLoading } = usePlan();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: project } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || streaming) return;

    const userMsg: Message = { role: "user", content: msg };
    const assistantMsg: Message = { role: "assistant", content: "", streaming: true };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setStreaming(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch(`${basePath}/api/projects/${projectId}/advisor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: msg, history }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro desconhecido" })) as { error?: string };
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: `Erro: ${err.error ?? "Tente novamente"}` };
          return copy;
        });
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) { setStreaming(false); return; }

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6)) as { type: string; content?: string };
              if (event.type === "token" && event.content) {
                setMessages((prev) => {
                  const copy = [...prev];
                  copy[copy.length - 1] = {
                    role: "assistant",
                    content: (copy[copy.length - 1]?.content ?? "") + event.content,
                    streaming: true,
                  };
                  return copy;
                });
              } else if (event.type === "done") {
                setMessages((prev) => {
                  const copy = [...prev];
                  if (copy[copy.length - 1]) {
                    copy[copy.length - 1] = { ...copy[copy.length - 1]!, streaming: false };
                  }
                  return copy;
                });
              }
            } catch { /* ignore */ }
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: "Erro de conexão. Tente novamente." };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (planLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Carregando...</div>
      </div>
    );
  }

  if (!permissions.hasAiAdvisor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-5">🤖</div>
          <h1 className="font-serif text-2xl mb-3">AI Advisor</h1>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            O AI Advisor lê todos os seus artefatos gerados e responde perguntas específicas sobre o seu produto. Disponível apenas no plano <strong>Avançado</strong>.
          </p>
          <Link href="/pricing">
            <Button className="bg-primary hover:bg-primary/90 text-white">Ver plano Avançado</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card/50 flex-shrink-0">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3 text-sm">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">Painel</Link>
          <span className="text-muted-foreground">/</span>
          <Link href={`/projects/${projectId}`} className="text-muted-foreground hover:text-foreground truncate max-w-[120px]">
            {project?.name ?? "Projeto"}
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground font-medium flex items-center gap-1.5">
            <span>🤖</span> AI Advisor
          </span>
        </div>
      </header>

      <div className="flex-1 max-w-3xl w-full mx-auto px-6 flex flex-col py-6 gap-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">🤖</div>
              <h2 className="font-serif text-xl mb-2">AI Advisor — {project?.name}</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Faço perguntas estratégicas, técnicas e de negócio sobre o seu produto. Tenho acesso a todos os artefatos gerados.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="text-left p-3 rounded-xl border border-card-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all text-sm text-foreground leading-snug"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[calc(100vh-240px)] pr-1">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-0.5">🤖</div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-tr-none"
                      : "bg-card border border-card-border rounded-tl-none"
                  }`}
                >
                  {msg.content}
                  {msg.streaming && (
                    <span className="inline-block w-1 h-4 bg-current ml-0.5 animate-pulse align-middle" />
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}

        <div className="border-t border-border pt-4">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte algo sobre seu produto..."
              className="min-h-[60px] max-h-[120px] resize-none text-sm"
              disabled={streaming}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || streaming}
              className="bg-primary hover:bg-primary/90 text-white self-end px-4"
            >
              {streaming ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8h12M10 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">Enter para enviar · Shift+Enter para nova linha</p>
        </div>
      </div>
    </div>
  );
}
