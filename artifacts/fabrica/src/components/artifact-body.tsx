import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  content: string;
  className?: string;
  protect?: boolean;
};

export const ArtifactBody = memo(function ArtifactBody({ content, className = "", protect = false }: Props) {
  const protectStyle = protect
    ? ({ userSelect: "none", WebkitUserSelect: "none", pointerEvents: "none" } as const)
    : undefined;
  const protectHandlers = protect
    ? {
        onCopy: (e: React.SyntheticEvent) => e.preventDefault(),
        onCut: (e: React.SyntheticEvent) => e.preventDefault(),
        onContextMenu: (e: React.SyntheticEvent) => e.preventDefault(),
      }
    : {};

  return (
    <div
      className={`artifact-prose ${className}`}
      style={protectStyle}
      {...protectHandlers}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => <h2 className="font-serif text-xl mt-6 mb-3 text-foreground first:mt-0" {...props} />,
          h2: (props) => <h3 className="font-serif text-lg mt-6 mb-2 text-foreground first:mt-0" {...props} />,
          h3: (props) => <h4 className="font-semibold text-[15px] mt-5 mb-2 text-foreground first:mt-0" {...props} />,
          h4: (props) => <h5 className="font-semibold text-sm mt-4 mb-1.5 text-foreground uppercase tracking-wide first:mt-0" {...props} />,
          p: (props) => <p className="text-[15px] leading-relaxed text-foreground my-3" {...props} />,
          ul: (props) => <ul className="list-disc pl-5 my-3 space-y-1.5 text-[15px] text-foreground marker:text-primary/60" {...props} />,
          ol: (props) => <ol className="list-decimal pl-5 my-3 space-y-1.5 text-[15px] text-foreground marker:text-primary/70 marker:font-semibold" {...props} />,
          li: (props) => <li className="leading-relaxed pl-1" {...props} />,
          strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
          em: (props) => <em className="italic text-foreground/90" {...props} />,
          blockquote: (props) => (
            <blockquote className="border-l-4 border-primary/40 bg-primary/5 pl-4 pr-3 py-2 my-4 rounded-r-md text-[15px] text-foreground/90 italic" {...props} />
          ),
          code: (props) => {
            const { children, className: cn } = props as { children?: React.ReactNode; className?: string };
            const isBlock = (cn ?? "").includes("language-");
            if (isBlock) {
              return (
                <pre className="bg-muted/60 border border-border rounded-lg p-3 my-3 overflow-x-auto">
                  <code className="text-[13px] font-mono text-foreground">{children}</code>
                </pre>
              );
            }
            return <code className="bg-muted/60 px-1.5 py-0.5 rounded text-[13px] font-mono text-primary">{children}</code>;
          },
          hr: () => <hr className="my-5 border-border" />,
          a: (props) => <a className="text-primary underline underline-offset-2 hover:text-primary/80" target="_blank" rel="noopener noreferrer" {...props} />,
          table: (props) => (
            <div className="my-4 overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm" {...props} />
            </div>
          ),
          thead: (props) => <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground" {...props} />,
          th: (props) => <th className="text-left font-semibold px-3 py-2 border-b border-border" {...props} />,
          td: (props) => <td className="px-3 py-2 border-b border-border/60 text-foreground align-top" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
