import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import HomePage from "../pages/HomePage";

const AboutPage = lazy(() => import("../pages/AboutPage"));
const OrgPage = lazy(() => import("../pages/OrgPage"));
const KnowledgeBasePage = lazy(() => import("../pages/KnowledgeBasePage"));
const CrawlerDetailPage = lazy(() => import("../pages/CrawlerDetailPage"));
const ChatPage = lazy(() => import("../pages/ChatPage"));
const SearchPage = lazy(() => import("../pages/SearchPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "/chat", element: <ChatPage /> },
      { path: "/chat/:chatId", element: <ChatPage /> },
      { path: "/search", element: <SearchPage /> },
      { path: "/knowledge-base", element: <KnowledgeBasePage /> },
      { path: "/knowledge-base/:crawlerId", element: <CrawlerDetailPage /> },
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
