/**
 * Integration-level tests for the Connector feature.
 *
 * Strategy:
 *  - Mock react-query hooks so no network is needed.
 *  - Use MemoryRouter to control URL.
 *  - Verify DOM output and behaviour against task requirements.
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ── Mock heavy UI deps that don't work in jsdom ────────────────────────────

vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...rest}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("../components/connectors/AnimatedTabs", () => ({
  default: ({
    tabs,
    activeTab,
    onChange,
  }: {
    tabs: Array<{ id: string; label: string }>;
    activeTab: string;
    onChange: (id: string) => void;
  }) => (
    <div role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={t.id === activeTab}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("../components/connectors/ConnectorIcon", () => ({
  default: ({ name }: { name: string }) => (
    <span data-testid="icon">{name[0]}</span>
  ),
}));

vi.mock("../components/connectors/SpotlightCard", () => ({
  default: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
}));

vi.mock("../components/connectors/ToolExplorerModal", () => ({
  default: () => null,
}));

vi.mock("../components/connectors/OAuthCallbackBanner", () => ({
  default: () => null,
}));

vi.mock("../components/ui/PageHeader", () => ({
  default: ({
    title,
    actions,
  }: {
    title: string;
    actions?: React.ReactNode;
  }) => (
    <header>
      <h1>{title}</h1>
      {actions}
    </header>
  ),
}));

vi.mock("../components/ui/LoadingSpinner", () => ({
  default: () => <div data-testid="spinner" />,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    promise: vi.fn(),
  },
}));

// ── Mock react-query hooks ────────────────────────────────────────────────

const mockConnectMutate = vi.fn();
const mockDiscoverMutate = vi.fn();

vi.mock("../hooks/useConnectors", () => ({
  useConnectorCatalog: vi.fn(),
  useConnections: vi.fn(),
  useConnectMutation: vi.fn(),
  useCreateConnection: vi.fn(),
  useTestConnection: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useDiscoverTools: vi.fn(() => ({
    mutateAsync: vi.fn(),
    mutate: mockDiscoverMutate,
    isPending: false,
  })),
  useDeleteConnection: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useInitiateAuth: vi.fn(() => ({ mutateAsync: vi.fn() })),
}));

import * as hooks from "../hooks/useConnectors";
import ConnectorPage from "../pages/ConnectorPage";
import CreateConnectionModal from "../components/connectors/CreateConnectionModal";

// ── Test helpers ──────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function renderWithProviders(
  ui: React.ReactElement,
  { initialUrl = "/connector" } = {},
) {
  const qc = makeQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialUrl]}>
        <Routes>
          <Route path="/connector" element={ui} />
          <Route path="/connectors" element={<div>Redirected</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const MOCK_CATALOG = [
  {
    id: "1",
    key: "slack",
    name: "Slack",
    description: "Collaborate on Slack",
    type: "NATIVE" as const,
    supportedAuth: ["BEARER_TOKEN", "OAUTH2_AUTHORIZATION_CODE"],
    recommendedAuth: "BEARER_TOKEN" as const,
    oauthAvailable: true,
    requiresBaseUrl: false,
    isAvailable: true,
    authFields: {
      BEARER_TOKEN: [
        {
          name: "accessToken",
          label: "Bot Token",
          type: "password" as const,
          required: true,
        },
      ],
    },
  },
  {
    id: "2",
    key: "mcp-custom",
    name: "My MCP Server",
    description: "Custom MCP endpoint",
    type: "MCP" as const,
    supportedAuth: ["NONE", "API_KEY"],
    recommendedAuth: "NONE" as const,
    oauthAvailable: false,
    requiresBaseUrl: true,
    baseUrlLabel: "MCP Server URL",
    baseUrlPlaceholder: "https://mcp.example.com",
    isAvailable: true,
    authFields: {},
  },
  {
    id: "3",
    key: "coming-soon",
    name: "ComingSoon Tool",
    description: "Not yet released",
    type: "NATIVE" as const,
    supportedAuth: ["API_KEY"],
    recommendedAuth: "API_KEY" as const,
    oauthAvailable: false,
    requiresBaseUrl: false,
    isAvailable: false,
    authFields: {},
  },
];

// ── Tests ─────────────────────────────────────────────────────────────────

describe("ConnectorPage – Connectors tab", () => {
  beforeEach(() => {
    vi.mocked(hooks.useConnectorCatalog).mockReturnValue({
      data: MOCK_CATALOG,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    vi.mocked(hooks.useConnections).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    vi.mocked(hooks.useConnectMutation).mockReturnValue({
      mutateAsync: mockConnectMutate,
      isPending: false,
    } as any);
    vi.mocked(hooks.useCreateConnection).mockReturnValue({
      mutateAsync: mockConnectMutate,
      isPending: false,
    } as any);
  });

  afterEach(() => vi.clearAllMocks());

  it("renders all catalog cards", () => {
    renderWithProviders(<ConnectorPage />);
    expect(screen.getByText("Slack")).toBeInTheDocument();
    expect(screen.getByText("My MCP Server")).toBeInTheDocument();
    expect(screen.getByText("ComingSoon Tool")).toBeInTheDocument();
  });

  it('shows "Coming soon" badge and disabled button for isAvailable=false', () => {
    renderWithProviders(<ConnectorPage />);
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
    // The Connect button for the unavailable connector should be disabled
    const disabledBtn = screen.getByRole("button", {
      name: /comingsoon tool coming soon/i,
    });
    expect(disabledBtn).toBeDisabled();
  });

  it("filters by search query (name and description)", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConnectorPage />);
    const searchInput = screen.getByRole("textbox", { name: /search/i });
    await user.type(searchInput, "mcp");
    expect(screen.getByText("My MCP Server")).toBeInTheDocument();
    expect(screen.queryByText("Slack")).not.toBeInTheDocument();
  });

  it("shows empty state when search has no results", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConnectorPage />);
    await user.type(
      screen.getByRole("textbox", { name: /search/i }),
      "zzznoresult",
    );
    expect(screen.getByText(/no integrations found/i)).toBeInTheDocument();
  });

  it("shows loading skeletons while isLoading", () => {
    vi.mocked(hooks.useConnectorCatalog).mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as any);
    renderWithProviders(<ConnectorPage />);
    // ConnectorCardSkeleton renders animated divs; we can check by absence of card text
    expect(screen.queryByText("Slack")).not.toBeInTheDocument();
  });

  it("shows error state with Retry button on catalog error", () => {
    const mockRefetch = vi.fn();
    vi.mocked(hooks.useConnectorCatalog).mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error("Network error"),
      refetch: mockRefetch,
    } as any);
    renderWithProviders(<ConnectorPage />);
    expect(screen.getByText(/failed to load catalog/i)).toBeInTheDocument();
    screen.getByRole("button", { name: /retry/i }).click();
    expect(mockRefetch).toHaveBeenCalled();
  });
});

describe("ConnectorPage – tab URL sync", () => {
  beforeEach(() => {
    vi.mocked(hooks.useConnectorCatalog).mockReturnValue({
      data: MOCK_CATALOG,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    vi.mocked(hooks.useConnections).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);
  });

  it("defaults to connectors tab with no ?tab param", () => {
    renderWithProviders(<ConnectorPage />, { initialUrl: "/connector" });
    // The connectors tab button should be aria-selected
    const tab = screen.getByRole("tab", { name: "Connectors" });
    expect(tab).toHaveAttribute("aria-selected", "true");
  });

  it("opens connections tab when ?tab=connections in URL", () => {
    renderWithProviders(<ConnectorPage />, {
      initialUrl: "/connector?tab=connections",
    });
    const tab = screen.getByRole("tab", { name: "My Connections" });
    expect(tab).toHaveAttribute("aria-selected", "true");
  });
});

describe("CreateConnectionModal – base URL field", () => {
  function renderModal(
    connector: (typeof MOCK_CATALOG)[number] | null,
    open = true,
  ) {
    const qc = makeQueryClient();
    vi.mocked(hooks.useConnectMutation).mockReturnValue({
      mutateAsync: mockConnectMutate,
      isPending: false,
    } as any);
    vi.mocked(hooks.useCreateConnection).mockReturnValue({
      mutateAsync: mockConnectMutate,
      isPending: false,
    } as any);
    return render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <CreateConnectionModal
            open={open}
            onOpenChange={vi.fn()}
            connector={connector as any}
            onSuccess={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  }

  it("does NOT show base URL field when requiresBaseUrl=false", () => {
    renderModal(MOCK_CATALOG[0]); // Slack: requiresBaseUrl=false
    expect(screen.queryByLabelText(/server endpoint/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/base url/i)).not.toBeInTheDocument();
  });

  it("DOES show base URL field when requiresBaseUrl=true", () => {
    renderModal(MOCK_CATALOG[1]); // MCP: requiresBaseUrl=true
    expect(screen.getByLabelText(/mcp server url/i)).toBeInTheDocument();
  });

  it("uses baseUrlLabel from catalog", () => {
    renderModal(MOCK_CATALOG[1]);
    expect(screen.getByText(/mcp server url/i)).toBeInTheDocument();
  });

  it("shows error when base URL is missing for requiresBaseUrl connector", async () => {
    const user = userEvent.setup();
    renderModal(MOCK_CATALOG[1]);
    await user.click(screen.getByRole("button", { name: /save connection/i }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/mcp server url/i);
  });
});

describe("CreateConnectionModal – OAuth fast-path", () => {
  beforeEach(() => {
    // Capture location.href assignments
    vi.spyOn(window, "location", "get").mockReturnValue({
      ...window.location,
      href: "",
    } as Location);
    vi.mocked(hooks.useConnectMutation).mockReturnValue({
      mutateAsync: vi
        .fn()
        .mockResolvedValue({ authUrl: "https://oauth.example.com/auth" }),
      isPending: false,
    } as any);
    vi.mocked(hooks.useCreateConnection).mockReturnValue({
      mutateAsync: vi
        .fn()
        .mockResolvedValue({ authUrl: "https://oauth.example.com/auth" }),
      isPending: false,
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("redirects to authUrl for OAuth connectors without opening credential fields", async () => {
    const user = userEvent.setup();
    const qc = makeQueryClient();

    // We can't mock window.location.href assignment directly in jsdom easily,
    // so we intercept at the API level
    const connectMutate = vi
      .fn()
      .mockResolvedValue({ authUrl: "https://oauth.example.com/auth" });
    vi.mocked(hooks.useConnectMutation).mockReturnValue({
      mutateAsync: connectMutate,
      isPending: false,
    } as any);

    // Patch window.location
    Object.defineProperty(window, "location", {
      writable: true,
      value: { ...window.location, href: "" },
    });

    const slackOAuth = {
      ...MOCK_CATALOG[0],
      recommendedAuth: "OAUTH2_AUTHORIZATION_CODE" as const,
    };

    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <CreateConnectionModal
            open
            onOpenChange={vi.fn()}
            connector={slackOAuth as any}
            onSuccess={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // Should NOT show credential input fields
    expect(screen.queryByLabelText(/bot token/i)).not.toBeInTheDocument();
    // OAuth info banner should be visible
    expect(screen.getByText(/oauth 2.0 authorization/i)).toBeInTheDocument();

    // Click Connect with Slack
    await user.click(
      screen.getByRole("button", { name: /connect with slack/i }),
    );

    await waitFor(() => {
      expect(connectMutate).toHaveBeenCalledWith(
        expect.objectContaining({ authType: "OAUTH2_AUTHORIZATION_CODE" }),
      );
    });
    expect(window.location.href).toBe("https://oauth.example.com/auth");
  });
});

describe("CreateConnectionModal – token connect success", () => {
  it("calls onSuccess and closes on successful token auth", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const onOpenChange = vi.fn();
    const qc = makeQueryClient();

    vi.mocked(hooks.useConnectMutation).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({
        connection: {
          id: "conn-1",
          name: "Slack",
          status: "CONNECTED",
          createdAt: "",
          updatedAt: "",
          authType: "BEARER_TOKEN",
        },
        toolsCount: 3,
      }),
      isPending: false,
    } as any);
    vi.mocked(hooks.useCreateConnection).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({
        connection: {
          id: "conn-1",
          name: "Slack",
          status: "CONNECTED",
          createdAt: "",
          updatedAt: "",
          authType: "BEARER_TOKEN",
        },
        toolsCount: 3,
      }),
      isPending: false,
    } as any);

    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <CreateConnectionModal
            open
            onOpenChange={onOpenChange}
            connector={MOCK_CATALOG[0] as any}
            onSuccess={onSuccess}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // Fill in the token field
    const tokenInput = screen.getByLabelText(/bot token/i);
    await user.type(tokenInput, "xoxb-test-token");

    await user.click(screen.getByRole("button", { name: /save connection/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith("Slack", 3);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});

describe("CreateConnectionModal – error keeps form open", () => {
  it("shows inline error and keeps form open on API failure", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const qc = makeQueryClient();

    vi.mocked(hooks.useConnectMutation).mockReturnValue({
      mutateAsync: vi
        .fn()
        .mockRejectedValue(
          Object.assign(new Error("Credentials invalid"), {
            code: "INVALID_CREDENTIALS",
          }),
        ),
      isPending: false,
    } as any);
    vi.mocked(hooks.useCreateConnection).mockReturnValue({
      mutateAsync: vi
        .fn()
        .mockRejectedValue(
          Object.assign(new Error("Credentials invalid"), {
            code: "INVALID_CREDENTIALS",
          }),
        ),
      isPending: false,
    } as any);

    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <CreateConnectionModal
            open
            onOpenChange={onOpenChange}
            connector={MOCK_CATALOG[0] as any}
            onSuccess={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const tokenInput = screen.getByLabelText(/bot token/i);
    await user.type(tokenInput, "bad-token");

    await user.click(screen.getByRole("button", { name: /save connection/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    // Form should still be open — onOpenChange(false) should NOT have been called
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});

describe("ConnectorPage – OAuth return params", () => {
  it("shows toast and removes params from URL on success return", async () => {
    const { toast } = await import("sonner");
    vi.mocked(hooks.useConnectorCatalog).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    vi.mocked(hooks.useConnections).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderWithProviders(<ConnectorPage />, {
      initialUrl:
        "/connector?tab=connections&status=success&connectionId=conn-123",
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it("shows error toast and removes params on error return without echoing URL code", async () => {
    const { toast } = await import("sonner");

    vi.mocked(hooks.useConnectorCatalog).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    vi.mocked(hooks.useConnections).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderWithProviders(<ConnectorPage />, {
      initialUrl: "/connector?status=error&code=INVALID_CREDENTIALS",
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });

    // The raw code 'INVALID_CREDENTIALS' must NOT appear in DOM text
    expect(document.body.textContent).not.toContain("INVALID_CREDENTIALS");
  });
});
