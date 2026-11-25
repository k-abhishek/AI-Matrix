import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import VerticalStepper, { type VerticalStepItem } from '../components/ui/vertical-stepper';
import { AssistantMessage } from '../components/chat/AssistantMessage';

vi.mock('../components/chat/MarkdownRenderer', () => ({
  MarkdownRenderer: ({ content }: { content: string }) => (
    <div data-testid="markdown-content">{content}</div>
  ),
}));

describe('VerticalStepper & AssistantMessage statusSteps', () => {
  const steps: VerticalStepItem[] = [
    { id: '1', taskName: 'Thinking...', status: 'completed' },
    { id: '2', taskName: 'Searching knowledge base...', status: 'completed' },
    { id: '3', taskName: 'Drafting response', status: 'in_progress' },
  ];

  it('renders all steps with taskName and active/completed states', () => {
    render(<VerticalStepper steps={steps} />);

    expect(screen.getAllByText('Drafting response').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Thinking...')).toBeInTheDocument();
    expect(screen.getByText('Searching knowledge base...')).toBeInTheDocument();
  });

  it('toggles collapse when header is clicked', async () => {
    const user = userEvent.setup();
    const completedSteps: VerticalStepItem[] = [
      { id: '1', taskName: 'Thinking...', status: 'completed' },
      { id: '2', taskName: 'Searching knowledge base...', status: 'completed' },
    ];

    render(<VerticalStepper steps={completedSteps} />);

    expect(screen.getByText('Completed 2 steps')).toBeInTheDocument();
    expect(screen.getByText('Thinking...')).toBeInTheDocument();

    await user.click(screen.getByRole('button'));
    expect(screen.queryByText('Thinking...')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Thinking...')).toBeInTheDocument();
  });

  it('renders VerticalStepper inside AssistantMessage above the streamed content', () => {
    render(
      <MemoryRouter>
        <AssistantMessage
          message={{
            role: 'assistant',
            content: 'Here is the final answer.',
            statusSteps: [
              { id: '1', taskName: 'Analyzing query', status: 'completed' },
              { id: '2', taskName: 'Synthesizing answer', status: 'completed' },
            ],
          }}
        />
      </MemoryRouter>
    );

    const stepperHeader = screen.getByText('Completed 2 steps');
    const markdown = screen.getByTestId('markdown-content');

    // Verify stepper appears before markdown content in DOM order
    expect(
      Boolean(stepperHeader.compareDocumentPosition(markdown) & Node.DOCUMENT_POSITION_FOLLOWING)
    ).toBe(true);
  });

  it('maps active step to ThinkingOrb state and pauses when all steps complete', () => {
    const { container, rerender } = render(
      <MemoryRouter>
        <AssistantMessage
          message={{
            role: 'assistant',
            content: '',
            statusSteps: [
              { id: '1', taskName: 'Thinking...', status: 'completed' },
              { id: '2', taskName: 'Searching knowledge base...', status: 'in_progress' },
            ],
          }}
        />
      </MemoryRouter>
    );

    const orb = container.querySelector('[data-orb-state]');
    expect(orb).toHaveAttribute('data-orb-state', 'searching');
    expect(orb).toHaveAttribute('data-orb-paused', 'false');

    rerender(
      <MemoryRouter>
        <AssistantMessage
          message={{
            role: 'assistant',
            content: 'Done!',
            statusSteps: [
              { id: '1', taskName: 'Thinking...', status: 'completed' },
              { id: '2', taskName: 'Searching knowledge base...', status: 'completed' },
            ],
          }}
        />
      </MemoryRouter>
    );

    const pausedOrb = container.querySelector('[data-orb-state]');
    expect(pausedOrb).toHaveAttribute('data-orb-paused', 'true');
  });
});
