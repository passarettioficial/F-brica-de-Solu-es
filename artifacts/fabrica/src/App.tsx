import { useEffect, useRef, lazy, Suspense, ComponentType } from "react";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { PaywallModal } from "@/components/paywall-modal";
import { CommandPalette } from "@/components/command-palette";
import { ErrorBoundary } from "@/components/error-boundary";

// Every route is its own chunk: nobody pays for the admin panel, the phase canvases, or the
// pitch pages in their initial bundle just because those routes exist in the router.
const NotFound = lazy(() => import("@/pages/not-found"));
const Home = lazy(() => import("@/pages/home").then((m) => ({ default: m.Home })));
const LandingPage = lazy(() => import("@/pages/landing").then((m) => ({ default: m.LandingPage })));
const SignInPage = lazy(() => import("@/pages/sign-in").then((m) => ({ default: m.SignInPage })));
const SignUpPage = lazy(() => import("@/pages/sign-up").then((m) => ({ default: m.SignUpPage })));
const Dashboard = lazy(() => import("@/pages/dashboard").then((m) => ({ default: m.Dashboard })));
const ProjectPage = lazy(() => import("@/pages/project").then((m) => ({ default: m.ProjectPage })));
const PhasePage = lazy(() => import("@/pages/phase").then((m) => ({ default: m.PhasePage })));
const SettingsPage = lazy(() => import("@/pages/settings").then((m) => ({ default: m.SettingsPage })));
const PricingPage = lazy(() => import("@/pages/pricing").then((m) => ({ default: m.PricingPage })));
const BillingPage = lazy(() => import("@/pages/billing").then((m) => ({ default: m.BillingPage })));
const AdvisorPage = lazy(() => import("@/pages/advisor").then((m) => ({ default: m.AdvisorPage })));
const AdminPage = lazy(() => import("@/pages/admin").then((m) => ({ default: m.AdminPage })));
const SupportPage = lazy(() => import("@/pages/support").then((m) => ({ default: m.SupportPage })));
const PrivacyPage = lazy(() => import("@/pages/privacy").then((m) => ({ default: m.PrivacyPage })));
const CompliancePage = lazy(() => import("@/pages/compliance").then((m) => ({ default: m.CompliancePage })));
const MarketAnalysisPage = lazy(() => import("@/pages/market-analysis").then((m) => ({ default: m.MarketAnalysisPage })));
const BrandbookPage = lazy(() => import("@/pages/brandbook").then((m) => ({ default: m.BrandbookPage })));
const SalesVideoPage = lazy(() => import("@/pages/sales-video").then((m) => ({ default: m.SalesVideoPage })));
const ClarezaImediataPage = lazy(() => import("@/pages/clareza-imediata").then((m) => ({ default: m.ClarezaImediataPage })));
const FluxoContinuoPage = lazy(() => import("@/pages/fluxo-continuo").then((m) => ({ default: m.FluxoContinuoPage })));
const ProntoParaVenderPage = lazy(() => import("@/pages/pronto-para-vender").then((m) => ({ default: m.ProntoParaVenderPage })));
const PublicSharePage = lazy(() => import("@/pages/public-share").then((m) => ({ default: m.PublicSharePage })));

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <Spinner className="size-6 text-primary" />
    </div>
  );
}

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
    logoImageUrl: `${window.location.origin}${basePath}/logo.png`,
  },
  variables: {
    colorPrimary: "#1A3FAB",
    colorForeground: "#111827",
    colorMutedForeground: "#6B7280",
    colorDanger: "#dc2626",
    colorBackground: "#F8F9FD",
    colorInput: "#EEF1FB",
    colorInputForeground: "#111827",
    colorNeutral: "#CBD5E1",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#F8F9FD] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-lg border border-[#D6DCF0]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#111827] font-semibold",
    headerSubtitle: "text-[#6B7280]",
    socialButtonsBlockButtonText: "text-[#111827]",
    formFieldLabel: "text-[#111827] font-medium",
    footerActionLink: "text-[#1A3FAB] font-medium",
    footerActionText: "text-[#6B7280]",
    dividerText: "text-[#6B7280]",
    identityPreviewEditButton: "text-[#1A3FAB]",
    formFieldSuccessText: "text-[#1A3FAB]",
    alertText: "text-[#111827]",
    logoBox: "mb-2",
    logoImage: "rounded",
    socialButtonsBlockButton: "border border-[#D6DCF0] bg-white hover:bg-[#EEF1FB]",
    formButtonPrimary: "bg-[#1A3FAB] hover:bg-[#163596] text-white",
    formFieldInput: "bg-[#EEF1FB] border-[#CBD5E1] text-[#111827]",
    footerAction: "bg-[#EEF1FB]",
    dividerLine: "bg-[#CBD5E1]",
    alert: "border-[#CBD5E1]",
    otpCodeFieldInput: "border-[#CBD5E1] text-[#111827]",
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

function ProtectedRoute({ component: Component, routeKey }: { component: ComponentType; routeKey?: string }) {
  return (
    <>
      <Show when="signed-in">
        <Component key={routeKey} />
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

function PageTransition({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function Router() {
  return (
    <PageTransition>
    <Suspense fallback={<RouteFallback />}>
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/landing" component={LandingPage} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/brandbook" component={BrandbookPage} />
      <Route path="/video-vendas" component={SalesVideoPage} />
      <Route path="/privacidade" component={PrivacyPage} />
      <Route path="/compliance" component={CompliancePage} />
      <Route path="/analise-mercado" component={MarketAnalysisPage} />
      <Route path="/clareza-imediata" component={ClarezaImediataPage} />
      <Route path="/fluxo-continuo" component={FluxoContinuoPage} />
      <Route path="/pronto-para-vender" component={ProntoParaVenderPage} />
      <Route path="/p/:shareId" component={PublicSharePage} />
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
        {(params) => <ProtectedRoute component={PhasePage} routeKey={`${params.projectId}-${params.phaseNumber}`} />}
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
    </Suspense>
    </PageTransition>
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
          <PaywallModal />
          <CommandPalette />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <WouterRouter base={basePath}>
          <ClerkProviderWithRoutes />
        </WouterRouter>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
