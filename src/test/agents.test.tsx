import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock motion/react and PageHeader for jsdom
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...rest}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../components/ui/PageHeader', () => ({
  default: ({
    title,
    description,
    actions,
  }: {
    title: string;
    description?: string;
    actions?: React.ReactNode;
  }) => (
    <header>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
      {actions}
    </header>
  ),
}));

const {
  mockNavigate,
  mockAuthState,
  mockAgentApi,
  mockSkillApi,
  mockKbApi,
  mockConnectorCatalogApi,
  mockConnectionApi,
  mockRunApi,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockAuthState: {
    isLoaded: true,
    isSignedIn: true,
    hasPendingSession: false,
    sessionStatus: null,
    userId: 'user_1',
    orgId: 'org_1',
    orgRole: 'org:admin',
    orgPermissions: [],
    isOrganization: true,
    user: null,
    token: 'tok',
    getToken: vi.fn().mockResolvedValue('tok'),
    signOut: vi.fn(),
    openUserProfile: vi.fn(),
  },
  mockAgentApi: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
    duplicate: vi.fn(),
    validate: vi.fn(),
    publish: vi.fn(),
    rollback: vi.fn(),
    revokeVersion: vi.fn(),
    listVersions: vi.fn(),
    listKnowledgeBases: vi.fn(),
    attachKnowledgeBase: vi.fn(),
    detachKnowledgeBase: vi.fn(),
    listSkills: vi.fn(),
    attachSkill: vi.fn(),
    detachSkill: vi.fn(),
    listToolGrants: vi.fn(),
    createToolGrant: vi.fn(),
    updateToolGrant: vi.fn(),
    deleteToolGrant: vi.fn(),
  },
  mockSkillApi: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
    listVersions: vi.fn(),
    validate: vi.fn(),
    publish: vi.fn(),
    test: vi.fn(),
  },
  mockKbApi: {
    list: vi.fn(),
  },
  mockConnectorCatalogApi: {
    getCatalog: vi.fn(),
  },
  mockConnectionApi: {
    list: vi.fn(),
  },
  mockRunApi: {
    listAgentRuns: vi.fn(),
    inspectRun: vi.fn(),
    streamAgent: vi.fn(),
    resolveApprovalStream: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../context/AuthContext', () => ({
  useAuthContext: () => mockAuthState,
}));

vi.mock('../api', () => ({
  agentApi: mockAgentApi,
  skillApi: mockSkillApi,
  kbApi: mockKbApi,
  connectorCatalogApi: mockConnectorCatalogApi,
  connectionApi: mockConnectionApi,
  runApi: mockRunApi,
}));

vi.mock('../api/connector', () => ({
  connectorCatalogApi: mockConnectorCatalogApi,
  connectionApi: mockConnectionApi,
}));

import AgentsPage from '../pages/AgentsPage';
import AgentBuilderPage from '../pages/AgentBuilderPage';
import AgentPlaygroundPage from '../pages/AgentPlaygroundPage';
import type { AgentDTO, KnowledgeBaseDTO, SkillDTO } from '../types';

const sampleAgent: AgentDTO = {
  id: 'agent_1',
  workspaceId: 'org_1',
  createdByUserId: 'user_1',
  ownerUserId: 'user_1',
  visibility: 'WORKSPACE',
  name: 'Support Specialist',
  description: 'Handles customer inquiries',
  slug: 'support-specialist',
  status: 'ACTIVE',
  activeVersionId: 'ver_1',
  versions: [
    {
      id: 'ver_1',
      agentId: 'agent_1',
      versionNumber: 1,
      status: 'PUBLISHED',
      configHash: 'abc',
      systemInstructions: 'Be helpful and concise.',
      provider: 'google',
      model: 'gemini-2.5-flash',
      temperature: 0.5,
      maxTokens: 2048,
      maxIterations: 10,
      timeoutMs: 60000,
      memoryConfig: { withinThreadEnabled: true, longTermMemoryEnabled: false },
      executionPolicy: { requireApprovalForAllTools: false, allowWebSearchFallback: false },
      publishedAt: '2026-01-01T00:00:00Z',
      publishedByUserId: 'user_1',
      revokedAt: null,
      revokedReason: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-02T00:00:00Z',
};

const sampleKbs: KnowledgeBaseDTO[] = [
  {
    id: 'kb_1',
    scope: 'WORKSPACE',
    workspaceId: 'org_1',
    ownerUserId: 'user_1',
    name: 'Product Docs',
    description: 'Official product documentation',
    qdrantCollection: 'ws_org_1_docs',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'kb_2',
    scope: 'PLATFORM',
    workspaceId: null,
    ownerUserId: 'sys',
    name: 'Security Guidelines',
    description: 'Platform security standards',
    qdrantCollection: 'plat_sec',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

const sampleSkills: SkillDTO[] = [
  {
    id: 'skill_1',
    scope: 'PLATFORM',
    workspaceId: null,
    createdByUserId: 'sys',
    ownerUserId: 'sys',
    key: 'code_reviewer',
    name: 'Code Reviewer',
    description: 'Reviews pull requests for quality',
    category: 'INSTRUCTION',
    activeVersionId: 'sv_1',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

function renderWithQuery(ui: React.ReactElement, route = '/') {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Agent Management & Builder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState.orgRole = 'org:admin';
    mockAuthState.userId = 'user_1';
    mockAgentApi.list.mockResolvedValue([sampleAgent]);
    mockAgentApi.getById.mockResolvedValue(sampleAgent);
    mockAgentApi.listKnowledgeBases.mockResolvedValue([]);
    mockAgentApi.listSkills.mockResolvedValue([]);
    mockAgentApi.listToolGrants.mockResolvedValue([]);
    mockAgentApi.listVersions.mockResolvedValue(sampleAgent.versions);
    mockKbApi.list.mockResolvedValue(sampleKbs);
    mockSkillApi.list.mockResolvedValue(sampleSkills);
    mockConnectorCatalogApi.getCatalog.mockResolvedValue([
      {
        id: 'conn_def_1',
        key: 'gmail',
        name: 'Gmail',
        description: 'Send and read emails',
        type: 'NATIVE',
        supportedAuth: ['OAUTH2_AUTHORIZATION_CODE'],
      },
    ]);
    mockConnectionApi.list.mockResolvedValue([]);
  });

  it('renders AgentsPage with agents list and supports search and archive', async () => {
    const user = userEvent.setup();
    mockAgentApi.archive.mockResolvedValue({ ...sampleAgent, status: 'ARCHIVED' });

    renderWithQuery(<AgentsPage />, '/agents');

    expect(await screen.findByText('Support Specialist')).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
    expect(screen.getByText('WORKSPACE')).toBeInTheDocument();

    // Search filter hides non-matching
    await user.type(screen.getByLabelText('Search agents'), 'nonexistent');
    expect(screen.getByText('No matching agents found')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Search agents'));
    expect(await screen.findByText('Support Specialist')).toBeInTheDocument();

    // Archive confirmation
    await user.click(screen.getByLabelText('Archive Support Specialist'));
    expect(screen.getByText('Archive Agent', { selector: 'h2' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Archive Agent' }));
    await waitFor(() => expect(mockAgentApi.archive).toHaveBeenCalledWith('agent_1'));
  });

  it('hides edit/archive actions for workspace members without admin/editor role', async () => {
    mockAuthState.orgRole = 'org:member';
    mockAuthState.userId = 'user_2';

    renderWithQuery(<AgentsPage />, '/agents');
    expect(await screen.findByText('Support Specialist')).toBeInTheDocument();
    expect(screen.queryByLabelText('Edit Support Specialist')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Open Support Specialist in Playground')).toBeInTheDocument();
  });

  it('creates a knowledge-free agent and supports connecting multiple knowledge bases', async () => {
    const user = userEvent.setup();
    mockAgentApi.create.mockResolvedValue({
      agent: { ...sampleAgent, id: 'agent_new', name: 'New Helper' },
      draftVersion: sampleAgent.versions![0],
    });
    mockAgentApi.attachKnowledgeBase.mockResolvedValue({
      id: 'akb_1',
      agentId: 'agent_new',
      agentVersionId: null,
      knowledgeBaseId: 'kb_1',
      isEnabled: true,
      createdAt: '',
      updatedAt: '',
    });

    renderWithQuery(
      <Routes>
        <Route path="/agents/new" element={<AgentBuilderPage />} />
      </Routes>,
      '/agents/new'
    );

    await user.type(screen.getByLabelText(/Agent Name/i), 'New Helper');

    // Check Knowledge empty state
    await user.click(screen.getByRole('button', { name: /Knowledge/i }));
    expect(
      screen.getByText(/No knowledge base connected\. Your agent can still answer/i)
    ).toBeInTheDocument();

    // Connect two knowledge bases
    await user.click(screen.getAllByRole('button', { name: /Connect Knowledge Base/i })[0]);
    const connectBtns = await screen.findAllByRole('button', { name: /^Connect$/i });
    await user.click(connectBtns[0]);
    await user.click(connectBtns[1]);

    // Save draft
    await user.click(screen.getByRole('button', { name: /Save Draft/i }));
    await waitFor(() =>
      expect(mockAgentApi.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Helper', visibility: 'PERSONAL' })
      )
    );
    await waitFor(() => expect(mockAgentApi.attachKnowledgeBase).toHaveBeenCalledTimes(2));
  });

  it('supports skill selection, custom skill creation, tool grants, validation, and publishing', async () => {
    const user = userEvent.setup();
    mockSkillApi.create.mockResolvedValue({
      skill: {
        id: 'skill_custom',
        scope: 'PERSONAL',
        workspaceId: 'org_1',
        createdByUserId: 'user_1',
        ownerUserId: 'user_1',
        key: 'seo_writer',
        name: 'SEO Writer',
        description: 'Writes SEO articles',
        category: 'INSTRUCTION',
        activeVersionId: null,
        status: 'ACTIVE',
        createdAt: '',
        updatedAt: '',
      },
      draftVersion: {} as any,
    });
    mockSkillApi.publish.mockResolvedValue({
      skill: {
        id: 'skill_custom',
        scope: 'PERSONAL',
        workspaceId: 'org_1',
        createdByUserId: 'user_1',
        ownerUserId: 'user_1',
        key: 'seo_writer',
        name: 'SEO Writer',
        description: 'Writes SEO articles',
        category: 'INSTRUCTION',
        activeVersionId: 'sv_custom',
        status: 'ACTIVE',
        createdAt: '',
        updatedAt: '',
      },
      publishedVersion: {} as any,
    });
    mockAgentApi.createToolGrant.mockResolvedValue({
      id: 'grant_1',
      agentId: 'agent_1',
      agentVersionId: null,
      workspaceId: 'org_1',
      capabilityType: 'CONNECTOR',
      toolKey: 'gmail',
      connectionScope: 'WORKSPACE_SHARED',
      connectionId: null,
      allowedToolNames: [],
      requiresApproval: false,
      isEnabled: true,
      createdAt: '',
      updatedAt: '',
    });
    mockAgentApi.validate.mockResolvedValue({
      valid: true,
      versionId: 'ver_1',
      errors: [],
      warnings: [],
    });
    mockAgentApi.publish.mockResolvedValue({
      agent: sampleAgent,
      publishedVersion: { ...sampleAgent.versions![0], versionNumber: 2 },
    });

    renderWithQuery(
      <Routes>
        <Route path="/agents/:agentId" element={<AgentBuilderPage />} />
      </Routes>,
      '/agents/agent_1'
    );

    expect(await screen.findByText('Support Specialist')).toBeInTheDocument();

    // Skills section + Custom skill creation
    await user.click(screen.getByRole('button', { name: /^Skills$/i }));
    expect(await screen.findByText('Code Reviewer')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Create Custom Skill/i }));
    await user.type(screen.getByLabelText(/Skill Name/i), 'SEO Writer');
    await user.type(screen.getByLabelText(/Skill Instructions/i), 'Write clear headings.');
    await user.click(screen.getByRole('button', { name: /Save & Publish/i }));

    await waitFor(() => expect(mockSkillApi.create).toHaveBeenCalled());
    await waitFor(() => expect(mockSkillApi.publish).toHaveBeenCalledWith('skill_custom'));

    // Tools section
    await user.click(screen.getByRole('button', { name: /^Tools$/i }));
    expect(await screen.findByText('Gmail')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Enable$/i }));
    await waitFor(() =>
      expect(mockAgentApi.createToolGrant).toHaveBeenCalledWith(
        'agent_1',
        expect.objectContaining({ toolKey: 'gmail', connectionScope: 'WORKSPACE_SHARED' })
      )
    );

    // Version history
    await user.click(screen.getByRole('button', { name: /^Versions$/i }));
    expect(await screen.findByText('v1')).toBeInTheDocument();

    // Validate & Publish
    await user.click(screen.getByRole('button', { name: /Validate & Publish/i }));
    expect(await screen.findByText(/Validation passed/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Confirm Publish/i }));
    await waitFor(() => expect(mockAgentApi.publish).toHaveBeenCalledWith('agent_1'));
  });

  it('streams agent responses and activity in AgentPlaygroundPage', async () => {
    const user = userEvent.setup();
    mockRunApi.streamAgent.mockImplementation(async (_agentId, _body, callbacks) => {
      callbacks.onInit?.({ chatId: 'chat_1', runId: 'run_1' });
      callbacks.onSkillLoad?.({ skillKey: 'code_reviewer', skillName: 'Code Reviewer' });
      callbacks.onToken?.('Hello from agent!');
      callbacks.onDone?.({ chatId: 'chat_1', runId: 'run_1', message: 'Hello from agent!' });
    });

    renderWithQuery(
      <Routes>
        <Route path="/agents/:agentId/playground" element={<AgentPlaygroundPage />} />
      </Routes>,
      '/agents/agent_1/playground'
    );

    expect(await screen.findByText(/Support Specialist — Playground/i)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/Message Support Specialist/i), 'Hi there');
    await user.click(screen.getByLabelText('Send message'));

    expect(await screen.findByText('Hello from agent!')).toBeInTheDocument();
    expect(screen.getByText('Loaded skill: Code Reviewer')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });
});
