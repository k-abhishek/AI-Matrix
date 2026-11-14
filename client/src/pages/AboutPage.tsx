import React from 'react';
import Card from '../components/ui/Card';
import ApiStatus from '../components/ApiStatus';

const techDetails = [
  {
    name: 'React 18',
    tag: 'Frontend',
    icon: '⚛️',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    description:
      'Modern UI library with concurrent features, hooks, and a component-based architecture for building interactive interfaces.',
  },
  {
    name: 'TypeScript 5',
    tag: 'Language',
    icon: '📘',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    description:
      'Strongly-typed JavaScript that catches bugs at compile time and improves developer experience with rich IDE support.',
  },
  {
    name: 'Fastify 5',
    tag: 'Backend',
    icon: '⚡',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    description:
      'High-performance, low-overhead web framework powering the REST API and hosting Vite dev middleware in development.',
  },
  {
    name: 'Tailwind CSS',
    tag: 'Styling',
    icon: '🎨',
    badgeColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
    description:
      'Utility-first CSS framework enabling rapid, consistent, and responsive design without leaving your markup.',
  },
  {
    name: 'Vite 5',
    tag: 'Tooling',
    icon: '⚡',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    description:
      'Next-generation build tool with instant HMR. Runs in middleware mode inside Fastify so no second port is needed.',
  },
  {
    name: 'React Router 6',
    tag: 'Routing',
    icon: '🧭',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    description:
      'Declarative client-side routing with nested routes, layouts, and loader support via createBrowserRouter.',
  },
];

const AboutPage: React.FC = () => {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto w-full space-y-10">
      {/* Hero Header */}
      <section className="rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 px-8 py-10 md:py-12 text-white shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">About AI Platform</h1>
        <p className="mt-3 max-w-2xl text-base sm:text-lg text-primary-100 leading-relaxed">
          A modern full-stack application built with <span className="font-semibold text-white">React</span>,{' '}
          <span className="font-semibold text-white">TypeScript</span>, and{' '}
          <span className="font-semibold text-white">Fastify</span> — unified under a single-port architecture with integrated knowledge base and AI capabilities.
        </p>
      </section>

      {/* API Health Status */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">API Health & System Status</h2>
          <p className="text-sm text-muted-foreground">Live health telemetry from the Fastify backend server.</p>
        </div>
        <ApiStatus />
      </section>

      {/* Single-Port Architecture */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">System Architecture</h2>
          <p className="text-sm text-muted-foreground">Unified full-stack architecture design and routing flow.</p>
        </div>
        <Card title="Single-Port Architecture">
          <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
            <p>
              This app uses a <strong className="text-foreground">single-port design</strong>: Fastify listens on port{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">5000</code> and
              handles everything — API routes and the React frontend — from one process.
            </p>
            <p>
              In <strong className="text-foreground">development</strong>, Vite runs in{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">middlewareMode: true</code>,
              attaching its dev server (with HMR) directly to Fastify. No separate Vite port, no proxy
              configuration.
            </p>
            <p>
              In <strong className="text-foreground">production</strong>, Fastify serves the static files from Vite's build output
              (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">client/dist</code>
              ) and falls back to <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">index.html</code>{' '}
              for client-side routing.
            </p>
            <div className="mt-4 rounded-lg bg-primary/5 border border-primary/20 p-4">
              <p className="font-medium text-sm text-primary">Architecture flow</p>
              <pre className="mt-2 text-xs font-mono text-muted-foreground whitespace-pre-wrap">
{`Browser → :5000
  ├── /api/*          → Fastify API routes
  ├── /documentation  → Swagger UI (/docs)
  └── /*              → Vite (dev) or static files (prod)`}
              </pre>
            </div>
          </div>
        </Card>
      </section>

      {/* Tech Stack */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Tech Stack</h2>
          <p className="text-sm text-muted-foreground">Key frameworks and libraries powering the frontend, backend, and build pipeline.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {techDetails.map((tech) => (
            <Card key={tech.name} className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <span className="text-base" role="img" aria-label={tech.name}>{tech.icon}</span>
                  {tech.name}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium border ${tech.badgeColor}`}>
                  {tech.tag}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{tech.description}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
