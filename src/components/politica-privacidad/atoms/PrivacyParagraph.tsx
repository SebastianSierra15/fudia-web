type PrivacyParagraphProps = {
  children: string;
};

export function PrivacyParagraph({ children }: PrivacyParagraphProps) {
  return <p className="text-base leading-8 text-(--color-muted) md:text-lg">{children}</p>;
}

