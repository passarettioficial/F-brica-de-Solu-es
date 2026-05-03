import { useEffect, useRef, ComponentType } from "react";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Home } from "@/pages/home";
import { SignInPage } from "@/pages/sign-in";
import { SignUpPage } from "@/pages/sign-up";
import { Dashboard } from "@/pages/dashboard";
import { ProjectPage } from "@/pages/project";
import { PhasePage } from "@/pages/phase";
import { SettingsPage } from "@/pages/settings";
import { PricingPage } from "@/pages/pricing";
import { BillingPage } from "@/pages/billing";
import { AdvisorPage } from "@/pages/advisor";
import { AdminPage } from "@/pages/admin";
import { SupportPage } from "@/pages/support";
import { PrivacyPage } from "@/pages/privacy";
import { WhatsAppButton } from "@/components/whatsapp-button";

const queryClient = new QueryClient();

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#b8461e",
    colorForeground: "#1a1a1a",
    colorMutedForeground: "#737373",
    colorDanger: "#dc2626",
    colorBackground: "#fdfcfa",
    colorInput: "#f5f4f2",
    colorInputForeground: "#1a1a1a",
    colorNeutral: "#d4cfca",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#fdfcfa] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-lg border border-[#e8e4df]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#1a1a1a] font-semibold",
    headerSubtitle: "text-[#737373]",
    socialButtonsBlockButtonText: "text-[#1a1a1a]",
    formFieldLabel: "text-[#1a1a1a] font-medium",
    footerActionLink: "text-[#b8461e] font-medium",
    footerActionText: "text-[#737373]",
    dividerText: "text-[#737373]",
    identityPreviewEditButton: "text-[#b8461e]",
    formFieldSuccessText: "text-[#b8461e]",
    alertText: "text-[#1a1a1a]",
    logoBox: "mb-2",
    logoImage: "rounded",
    socialButtonsBlockButton: "border border-[#d4cfca] bg-white hover:bg-[#f5f4f2]",
    formButtonPrimary: "bg-[#b8461e] hover:bg-[#9a3b18] text-white",
    formFieldInput: "bg-[#f5f4f2] border-[#d4cfca] text-[#1a1a1a]",
    footerAction: "bg-[#f5f4f2]",
    dividerLine: "bg-[#d4cfca]",
    alert: "border-[#d4cfca]",
    otpCodeFieldInput: "border-[#d4cfca] text-[#1a1a1a]",
    formFieldRow: "",
    main: "",
  },
};

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <Component />
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/privacidade" component={PrivacyPage} />
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/billing">
        {() => <ProtectedRoute component={BillingPage} />}
      </Route>
      <Route path="/atendimento">
        {() => <ProtectedRoute component={SupportPage} />}
      </Route>
      <Route path="/projects/:id">
        {() => <ProtectedRoute component={ProjectPage} />}
      </Route>
      <Route path="/projects/:projectId/phases/:phaseNumber">
        {() => <ProtectedRoute component={PhasePage} />}
      </Route>
      <Route path="/projects/:projectId/advisor">
        {() => <ProtectedRoute component={AdvisorPage} />}
      </Route>
      <Route path="/settings">
        {() => <ProtectedRoute component={SettingsPage} />}
      </Route>
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminPage} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Bem-vindo de volta",
            subtitle: "Entre para continuar construindo",
          },
        },
        signUp: {
          start: {
            title: "Crie sua conta",
            subtitle: "Comece a construir produtos com IA",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Router />
          <Toaster />
          <WhatsAppButton />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
