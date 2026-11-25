import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import HomePage from "../pages/HomePage";
import ProtectedRoute from "../components/auth/ProtectedRoute";

const LoginPage = lazy(() => import("../pages/LoginPage"));
const SSOCallbackPage = lazy(() => import("../pages/SSOCallbackPage"));
const AboutPage = lazy(() => import("../pages/AboutPage"));
const OrgPage = lazy(() => import("../pages/OrgPage"));
const KnowledgeBasePage = lazy(() => import("../pages/KnowledgeBasePage"));
const CrawlerDetailPage = lazy(() => import("../pages/CrawlerDetailPage"));
const ConnectorPage = lazy(() => import("../pages/ConnectorPage"));
const ChatPage = lazy(() => import("../pages/ChatPage"));
const SearchPage = lazy(() => import("../pages/SearchPage"));
const AgentsPage = lazy(() => import("../pages/AgentsPage"));
const AgentBuilderPage = lazy(() => import("../pages/AgentBuilderPage"));
const AgentPlaygroundPage = lazy(() => import("../pages/AgentPlaygroundPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/sso-callback",
    element: <SSOCallbackPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: "/chat", element: <ChatPage /> },
      { path: "/chat/:chatId", element: <ChatPage /> },
      { path: "/agents", element: <AgentsPage /> },
      { path: "/agents/new", element: <AgentBuilderPage /> },
      { path: "/agents/:agentId", element: <AgentBuilderPage /> },
      { path: "/agents/:agentId/playground", element: <AgentPlaygroundPage /> },
      { path: "/search", element: <SearchPage /> },
      { path: "/knowledge-base", element: <KnowledgeBasePage /> },
      { path: "/knowledge-base/:crawlerId", element: <CrawlerDetailPage /> },
      { path: "/connectors", element: <Navigate to="/connector" replace /> },
      { path: "/connector", element: <ConnectorPage /> },
      { path: "/org", element: <OrgPage /> },
      { path: "/org/:id", element: <OrgPage /> },
      { path: "/about", element: <AboutPage /> },
      { path: "/not-found", element: <NotFoundPage /> },
      { path: "*", element: <Navigate to="/not-found" replace /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/not-found" replace />,
  },
]);

export default router;
