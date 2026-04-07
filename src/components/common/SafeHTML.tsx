import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = ["b", "i", "em", "strong", "p", "ul", "ol", "li", "br", "span"];
const ALLOWED_ATTR: string[] = [];

interface SafeHTMLProps {
  content: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export default function SafeHTML({
  content,
  className,
  as: Tag = "div",
}: SafeHTMLProps) {
  // Cast to string: dompurify 3.x returns string | TrustedHTML, __html requires string
  const clean = DOMPurify.sanitize(content ?? "", {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_TAGS: ["iframe", "object", "embed", "script", "style"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "srcdoc"],
  }) as string;

  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
