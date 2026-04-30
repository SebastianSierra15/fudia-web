import { PrivacyParagraph } from "../atoms/PrivacyParagraph";

type PrivacyRichTextBlockProps = {
  paragraphs: string[];
  className?: string;
};

export function PrivacyRichTextBlock({
  paragraphs,
  className = "",
}: PrivacyRichTextBlockProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {paragraphs.map((paragraph) => (
        <PrivacyParagraph key={paragraph}>{paragraph}</PrivacyParagraph>
      ))}
    </div>
  );
}

