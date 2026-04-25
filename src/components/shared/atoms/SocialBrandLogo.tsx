type SocialBrandLogoProps = {
  className?: string;
};

export function InstagramLogo({ className = "h-[18px] w-[18px]" }: SocialBrandLogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function XLogo({ className = "h-[18px] w-[18px]" }: SocialBrandLogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M18.901 2H22l-6.77 7.737L23.2 22h-6.244l-4.89-7.435L5.56 22H2.46l7.24-8.273L1.8 2h6.402l4.42 6.73L18.901 2Zm-1.097 18.06h1.718L7.268 3.84H5.42l12.384 16.22Z" />
    </svg>
  );
}

export function YouTubeLogo({ className = "h-[18px] w-[18px]" }: SocialBrandLogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12c0 2.5-.3 4.1-.6 5.1-.2.7-.8 1.3-1.5 1.5-1 .3-2.6.6-7.9.6s-6.9-.3-7.9-.6c-.7-.2-1.3-.8-1.5-1.5C2.3 16.1 2 14.5 2 12s.3-4.1.6-5.1c.2-.7.8-1.3 1.5-1.5C5.1 5.1 6.7 4.8 12 4.8s6.9.3 7.9.6c.7.2 1.3.8 1.5 1.5.3 1 .6 2.6.6 5.1Z" />
      <path d="m10 9 5 3-5 3Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
