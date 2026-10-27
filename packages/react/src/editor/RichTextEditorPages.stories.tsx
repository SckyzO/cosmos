import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Send } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../forms/Input';
import { Select } from '../forms/Select';
import { RichTextEditor } from './RichTextEditor';

// A formatted text field in the two places it earns its place: writing a mail and answering a
// ticket. Composed from existing Cosmos primitives.

const meta = {
  title: 'Pages/Examples/Rich text editor',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const SIGNATURE =
  '<p></p><p>Thanks,<br>Alex Morgan<br><a href="mailto:alex@example.com">alex@example.com</a></p>';

export const MailCompose: Story = {
  render: function Render() {
    const [html, setHtml] = useState(SIGNATURE);
    const [sent, setSent] = useState(false);
    return (
      <Card padding="none" className="mx-auto max-w-3xl">
        <Card.Header>New message</Card.Header>
        <Card.Body>
          <div className="space-y-4">
            <Input label="To" type="email" defaultValue="ops-team@example.com" />
            <Input label="Subject" defaultValue="Maintenance window on Saturday" />
            <RichTextEditor
              label="Message"
              value={html}
              onChange={(next) => {
                setHtml(next);
                setSent(false);
              }}
              rows={10}
              placeholder="Write your message…"
              description="Formatted text. Links open in a new tab."
            />
          </div>
        </Card.Body>
        <Card.Footer>
          <div className="flex items-center justify-end gap-3">
            {sent && <Badge intent="success">Sent</Badge>}
            <Button icon={Send} onClick={() => setSent(true)}>
              Send
            </Button>
          </div>
        </Card.Footer>
      </Card>
    );
  },
};

export const TicketReply: Story = {
  render: function Render() {
    const [html, setHtml] = useState('');
    const [error, setError] = useState<string>();
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Card>
          <Card.Body>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm font-semibold">#4821 Alerts stopped firing</span>
              <Badge intent="warning">Open</Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Since the upgrade on Tuesday no alert has reached our on-call channel. The rules still
              evaluate, the notifications never leave.
            </p>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body>
            <div className="space-y-4">
              <RichTextEditor
                variant="bubble"
                label="Reply"
                required
                value={html}
                onChange={(next) => {
                  setHtml(next);
                  if (next) setError(undefined);
                }}
                error={error}
                maxLength={2000}
                rows={6}
                placeholder="Select text to format it…"
                description="Select text to open the formatting bar."
              />
              <Select
                label="Status after sending"
                defaultValue="pending"
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'solved', label: 'Solved' },
                ]}
              />
              <div className="flex justify-end">
                <Button
                  icon={Send}
                  onClick={() => setError(html ? undefined : 'Write a reply before sending.')}
                >
                  Send reply
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  },
};
