import { LoginCallbackTemplate } from "@/src/components/login/templates/LoginCallbackTemplate";

type LoginCallbackPageProps = {
  searchParams?: Promise<{
    next?: string | string[];
  }>;
};

function getFirstParamValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default async function LoginCallbackPage({
  searchParams,
}: LoginCallbackPageProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <LoginCallbackTemplate
      initialNext={getFirstParamValue(resolvedSearchParams?.next)}
    />
  );
}
