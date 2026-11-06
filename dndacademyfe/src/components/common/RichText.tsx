import ReactMarkdown from "react-markdown"
import remarkBreaks from "remark-breaks"

export default function RichText({
  children,
  className = "",
  reading = false,
}: {
  children: string
  className?: string
  reading?: boolean
}) {
  return (
    <div
      className={`rich-text ${reading ? "rich-text-reading" : ""} ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkBreaks]}
        allowedElements={[
          "p",
          "strong",
          "em",
          "br",
          "ul",
          "ol",
          "li",
          "h2",
          "h3",
        ]}
        unwrapDisallowed
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
