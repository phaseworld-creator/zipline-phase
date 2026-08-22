import {
  Accordion,
  Badge,
  Box,
  Code,
  CopyButton,
  Divider,
  Group,
  ScrollArea,
  Stack,
  Table,
  Tabs,
  Text,
  Title,
  Tooltip,
  ActionIcon,
} from '@mantine/core';
import {
  IconApi,
  IconCheck,
  IconCopy,
  IconFileUpload,
  IconFolder,
  IconGhost2Filled,
  IconKey,
  IconLink,
  IconLock,
  IconUser,
} from '@tabler/icons-react';

/* ─── Types ──────────────────────────────────────────────────── */
type Param = { name: string; type: string; required: boolean; description: string };
type ApiEndpoint = {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  path: string;
  description: string;
  auth: boolean;
  adminOnly?: boolean;
  params?: Param[];
  body?: Param[];
  response?: string;
  example?: string;
};
type ApiGroup = { id: string; label: string; icon: React.ReactNode; color: string; endpoints: ApiEndpoint[] };

/* ─── Method badge colors ────────────────────────────────────── */
const METHOD_COLOR: Record<ApiEndpoint['method'], string> = {
  GET: 'teal',
  POST: 'blue',
  PATCH: 'yellow',
  DELETE: 'red',
  PUT: 'orange',
};

/* ─── API Reference Data ─────────────────────────────────────── */
const API_GROUPS: ApiGroup[] = [
  {
    id: 'auth',
    label: 'Auth',
    icon: <IconKey size='1rem' />,
    color: 'yellow',
    endpoints: [
      {
        method: 'POST',
        path: '/api/auth/login',
        description: 'Login with username and password. Returns session cookie.',
        auth: false,
        body: [
          { name: 'username', type: 'string', required: true, description: 'Your username' },
          { name: 'password', type: 'string', required: true, description: 'Your password' },
          { name: 'code', type: 'string', required: false, description: 'TOTP code if 2FA is enabled' },
        ],
        response: '{ user: User }',
        example: `curl -X POST /api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"admin","password":"secret"}'`,
      },
      {
        method: 'GET',
        path: '/api/auth/logout',
        description: 'Logout and clear session cookie.',
        auth: true,
        response: '{ success: true }',
      },
      {
        method: 'POST',
        path: '/api/auth/register',
        description: 'Register a new account (requires registration enabled or invite code).',
        auth: false,
        body: [
          { name: 'username', type: 'string', required: true, description: 'Desired username' },
          { name: 'password', type: 'string', required: true, description: 'Password' },
          { name: 'code', type: 'string', required: false, description: 'Invite code if required' },
        ],
        response: '{ user: User }',
      },
    ],
  },
  {
    id: 'user',
    label: 'User',
    icon: <IconUser size='1rem' />,
    color: 'blue',
    endpoints: [
      {
        method: 'GET',
        path: '/api/user',
        description: 'Get the currently authenticated user.',
        auth: true,
        response: '{ user: User }',
        example: `curl /api/user -H "Authorization: Bearer <token>"`,
      },
      {
        method: 'PATCH',
        path: '/api/user',
        description: 'Update the current user profile.',
        auth: true,
        body: [
          { name: 'username', type: 'string', required: false, description: 'New username' },
          { name: 'password', type: 'string', required: false, description: 'New password' },
          { name: 'avatar', type: 'string', required: false, description: 'Base64 avatar image' },
        ],
        response: '{ user: User }',
      },
      {
        method: 'GET',
        path: '/api/user/stats',
        description: 'Get upload and usage statistics for the current user.',
        auth: true,
        response: '{ filesUploaded, storageUsed, views, urlsCreated, ... }',
      },
      {
        method: 'GET',
        path: '/api/user/token',
        description: 'Get the current API token.',
        auth: true,
        response: '{ token: string }',
      },
      {
        method: 'PATCH',
        path: '/api/user/token',
        description: 'Regenerate the API token.',
        auth: true,
        response: '{ token: string }',
      },
    ],
  },
  {
    id: 'files',
    label: 'Files',
    icon: <IconFileUpload size='1rem' />,
    color: 'violet',
    endpoints: [
      {
        method: 'POST',
        path: '/api/upload',
        description: 'Upload one or more files. Attach files as multipart/form-data.',
        auth: true,
        body: [
          { name: 'file', type: 'File (multipart)', required: true, description: 'The file(s) to upload' },
        ],
        response: '{ files: [{ id, name, url, mimetype, size }] }',
        example: `curl -X POST /api/upload \\
  -H "Authorization: Bearer <token>" \\
  -F "file=@photo.png"`,
      },
      {
        method: 'GET',
        path: '/api/user/files',
        description: 'List all files for the current user.',
        auth: true,
        params: [
          { name: 'page', type: 'number', required: false, description: 'Page number (default 1)' },
          { name: 'perpage', type: 'number', required: false, description: 'Items per page (default 20)' },
          { name: 'filter', type: 'string', required: false, description: 'Filter by name' },
        ],
        response: '{ files: File[], total: number, page: number }',
      },
      {
        method: 'GET',
        path: '/api/user/files/:id',
        description: 'Get metadata for a specific file.',
        auth: true,
        params: [{ name: 'id', type: 'string', required: true, description: 'File ID' }],
        response: '{ file: File }',
      },
      {
        method: 'PATCH',
        path: '/api/user/files/:id',
        description: 'Update file metadata (name, favorite, password, expiry).',
        auth: true,
        params: [{ name: 'id', type: 'string', required: true, description: 'File ID' }],
        body: [
          { name: 'name', type: 'string', required: false, description: 'New display name' },
          { name: 'favorite', type: 'boolean', required: false, description: 'Toggle favorite' },
          { name: 'password', type: 'string', required: false, description: 'Set a download password' },
          { name: 'expiresAt', type: 'string (ISO date)', required: false, description: 'Expiry timestamp' },
        ],
        response: '{ file: File }',
      },
      {
        method: 'DELETE',
        path: '/api/user/files/:id',
        description: 'Delete a file permanently.',
        auth: true,
        params: [{ name: 'id', type: 'string', required: true, description: 'File ID' }],
        response: '204 No Content',
      },
    ],
  },
  {
    id: 'urls',
    label: 'URLs',
    icon: <IconLink size='1rem' />,
    color: 'cyan',
    endpoints: [
      {
        method: 'POST',
        path: '/api/user/urls',
        description: 'Create a shortened URL.',
        auth: true,
        body: [
          { name: 'destination', type: 'string', required: true, description: 'The destination URL to shorten' },
          { name: 'vanity', type: 'string', required: false, description: 'Custom slug (vanity URL)' },
          { name: 'maxViews', type: 'number', required: false, description: 'Auto-delete after N views' },
          { name: 'password', type: 'string', required: false, description: 'Password-protect the link' },
        ],
        response: '{ url: { id, code, vanity, destination, views, enabled } }',
        example: `curl -X POST /api/user/urls \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"destination":"https://example.com","vanity":"my-link"}'`,
      },
      {
        method: 'GET',
        path: '/api/user/urls',
        description: 'List all shortened URLs for the current user.',
        auth: true,
        response: '{ urls: Url[] }',
      },
      {
        method: 'DELETE',
        path: '/api/user/urls/:id',
        description: 'Delete a shortened URL.',
        auth: true,
        params: [{ name: 'id', type: 'string', required: true, description: 'URL ID' }],
        response: '204 No Content',
      },
    ],
  },
  {
    id: 'folders',
    label: 'Folders',
    icon: <IconFolder size='1rem' />,
    color: 'orange',
    endpoints: [
      {
        method: 'GET',
        path: '/api/user/folders',
        description: 'List all folders for the current user.',
        auth: true,
        response: '{ folders: Folder[] }',
      },
      {
        method: 'POST',
        path: '/api/user/folders',
        description: 'Create a new folder.',
        auth: true,
        body: [
          { name: 'name', type: 'string', required: true, description: 'Folder name' },
          { name: 'public', type: 'boolean', required: false, description: 'Make folder publicly viewable' },
        ],
        response: '{ folder: Folder }',
      },
      {
        method: 'PATCH',
        path: '/api/user/folders/:id',
        description: 'Update folder name or visibility.',
        auth: true,
        params: [{ name: 'id', type: 'string', required: true, description: 'Folder ID' }],
        body: [
          { name: 'name', type: 'string', required: false, description: 'New folder name' },
          { name: 'public', type: 'boolean', required: false, description: 'Toggle public access' },
        ],
        response: '{ folder: Folder }',
      },
      {
        method: 'DELETE',
        path: '/api/user/folders/:id',
        description: 'Delete a folder (files are not deleted).',
        auth: true,
        params: [{ name: 'id', type: 'string', required: true, description: 'Folder ID' }],
        response: '204 No Content',
      },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: <IconLock size='1rem' />,
    color: 'red',
    endpoints: [
      {
        method: 'GET',
        path: '/api/users',
        description: 'List all users on the instance.',
        auth: true,
        adminOnly: true,
        response: '{ users: User[] }',
      },
      {
        method: 'POST',
        path: '/api/users',
        description: 'Create a new user account.',
        auth: true,
        adminOnly: true,
        body: [
          { name: 'username', type: 'string', required: true, description: 'Username' },
          { name: 'password', type: 'string', required: true, description: 'Password' },
          { name: 'role', type: 'USER | ADMIN', required: false, description: 'User role' },
        ],
        response: '{ user: User }',
      },
      {
        method: 'GET',
        path: '/api/server/status',
        description: 'Get server storage status and usage.',
        auth: true,
        adminOnly: true,
        response: '{ used: number, total: number, unit: string }',
      },
    ],
  },
  {
    id: 'troll',
    label: 'Troll',
    icon: <IconGhost2Filled size='1rem' />,
    color: 'grape',
    endpoints: [
      {
        method: 'GET',
        path: '/api/troll',
        description: 'List all active troll links.',
        auth: true,
        adminOnly: true,
        response: 'TrollLink[]',
      },
      {
        method: 'POST',
        path: '/api/troll',
        description: 'Create a new troll link. Visitors to /troll/:alias see the configured media full-screen.',
        auth: true,
        adminOnly: true,
        body: [
          { name: 'alias', type: 'string', required: true, description: 'URL slug (letters, numbers, - _)' },
          { name: 'mediaUrl', type: 'string (URL)', required: true, description: 'Direct media URL or YouTube watch link' },
          { name: 'mediaType', type: 'image | gif | video | youtube', required: true, description: 'How to render the media' },
          { name: 'label', type: 'string', required: false, description: 'Friendly label for admin UI' },
        ],
        response: '{ id, alias, mediaUrl, mediaType, label, createdAt }',
        example: `curl -X POST /api/troll \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"alias":"watch73h","mediaUrl":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","mediaType":"youtube","label":"Rickroll"}'`,
      },
      {
        method: 'DELETE',
        path: '/api/troll/:alias',
        description: 'Delete a troll link by alias.',
        auth: true,
        adminOnly: true,
        params: [{ name: 'alias', type: 'string', required: true, description: 'The troll link alias' }],
        response: '204 No Content',
      },
    ],
  },
];

/* ─── Auth section ───────────────────────────────────────────── */
function AuthInfo() {
  return (
    <Box
      p='md'
      style={{
        background: 'rgba(129,140,248,0.06)',
        border: '1px solid rgba(129,140,248,0.2)',
        borderRadius: 12,
        marginBottom: 24,
      }}
    >
      <Title order={4} mb='xs'>
        Authentication
      </Title>
      <Text size='sm' c='dimmed' mb='sm'>
        All protected endpoints accept authentication via one of two methods:
      </Text>
      <Stack gap='xs'>
        <Group gap='sm'>
          <Badge color='violet' variant='light' size='sm'>
            Session Cookie
          </Badge>
          <Text size='sm' c='dimmed'>
            Automatically set on login. Used by the dashboard.
          </Text>
        </Group>
        <Group gap='sm'>
          <Badge color='blue' variant='light' size='sm'>
            Bearer Token
          </Badge>
          <Text size='sm' c='dimmed'>
            Pass your token via{' '}
            <Code>Authorization: Bearer {'<token>'}</Code> header. Get your token from Dashboard → Settings.
          </Text>
        </Group>
      </Stack>
    </Box>
  );
}

/* ─── Endpoint row ───────────────────────────────────────────── */
function EndpointBlock({ ep }: { ep: ApiEndpoint }) {
  return (
    <Accordion.Item value={ep.method + ep.path}>
      <Accordion.Control>
        <Group gap='sm' wrap='nowrap'>
          <Badge color={METHOD_COLOR[ep.method]} variant='filled' size='sm' w={56} ta='center'>
            {ep.method}
          </Badge>
          <Code style={{ fontSize: '0.85rem', flex: 1 }}>{ep.path}</Code>
          {ep.adminOnly && (
            <Badge color='red' variant='dot' size='xs'>
              admin
            </Badge>
          )}
          {ep.auth && !ep.adminOnly && (
            <Badge color='yellow' variant='dot' size='xs'>
              auth
            </Badge>
          )}
          <Text size='sm' c='dimmed' lineClamp={1} style={{ flex: 2 }}>
            {ep.description}
          </Text>
        </Group>
      </Accordion.Control>
      <Accordion.Panel>
        <Stack gap='md' pl='xs'>
          {/* Path params */}
          {ep.params && ep.params.length > 0 && (
            <Box>
              <Text size='xs' fw={700} tt='uppercase' c='dimmed' mb={6}>
                Path Parameters
              </Text>
              <Table striped highlightOnHover fz='sm'>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Required</Table.Th>
                    <Table.Th>Description</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {ep.params.map((p) => (
                    <Table.Tr key={p.name}>
                      <Table.Td>
                        <Code>{p.name}</Code>
                      </Table.Td>
                      <Table.Td c='dimmed'>{p.type}</Table.Td>
                      <Table.Td>{p.required ? <Badge color='red' size='xs'>yes</Badge> : <Badge color='gray' size='xs'>no</Badge>}</Table.Td>
                      <Table.Td c='dimmed'>{p.description}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>
          )}

          {/* Body */}
          {ep.body && ep.body.length > 0 && (
            <Box>
              <Text size='xs' fw={700} tt='uppercase' c='dimmed' mb={6}>
                Request Body (JSON)
              </Text>
              <Table striped highlightOnHover fz='sm'>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Field</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Required</Table.Th>
                    <Table.Th>Description</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {ep.body.map((b) => (
                    <Table.Tr key={b.name}>
                      <Table.Td>
                        <Code>{b.name}</Code>
                      </Table.Td>
                      <Table.Td c='dimmed'>{b.type}</Table.Td>
                      <Table.Td>{b.required ? <Badge color='red' size='xs'>yes</Badge> : <Badge color='gray' size='xs'>no</Badge>}</Table.Td>
                      <Table.Td c='dimmed'>{b.description}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>
          )}

          {/* Response */}
          {ep.response && (
            <Box>
              <Text size='xs' fw={700} tt='uppercase' c='dimmed' mb={6}>
                Response
              </Text>
              <Code block>{ep.response}</Code>
            </Box>
          )}

          {/* Example */}
          {ep.example && (
            <Box>
              <Group gap='xs' mb={6}>
                <Text size='xs' fw={700} tt='uppercase' c='dimmed'>
                  Example
                </Text>
                <CopyButton value={ep.example} timeout={2000}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? 'Copied!' : 'Copy'}>
                      <ActionIcon size='xs' variant='subtle' color={copied ? 'teal' : 'gray'} onClick={copy}>
                        {copied ? <IconCheck size='0.7rem' /> : <IconCopy size='0.7rem' />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
              <Code block style={{ fontSize: '0.8rem' }}>
                {ep.example}
              </Code>
            </Box>
          )}
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
export default function DashboardApiDocs() {
  const baseUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : 'https://your-instance.com';

  return (
    <Box>
      {/* Header */}
      <Group gap='sm' mb='xs'>
        <IconApi size='1.5rem' style={{ color: 'var(--mantine-color-violet-4)' }} />
        <Title order={1}>API Reference</Title>
        <Badge color='violet' variant='light'>
          Zipline
        </Badge>
      </Group>
      <Text c='dimmed' mb='lg'>
        Full reference for the Zipline HTTP API. Base URL:{' '}
        <Code>{baseUrl}</Code>
      </Text>

      <AuthInfo />

      <Tabs defaultValue='auth' variant='pills'>
        <ScrollArea type='hover'>
          <Tabs.List mb='md' style={{ flexWrap: 'nowrap' }}>
            {API_GROUPS.map((g) => (
              <Tabs.Tab key={g.id} value={g.id} leftSection={g.icon} color={g.color}>
                {g.label}
                <Badge color={g.color} variant='light' size='xs' ml={6}>
                  {g.endpoints.length}
                </Badge>
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </ScrollArea>

        {API_GROUPS.map((g) => (
          <Tabs.Panel key={g.id} value={g.id}>
            <Stack gap='xs'>
              <Divider
                label={
                  <Group gap='xs'>
                    {g.icon}
                    <Text size='sm' fw={600}>
                      {g.label} endpoints
                    </Text>
                  </Group>
                }
                mb='sm'
              />
              <Accordion variant='separated' radius='md'>
                {g.endpoints.map((ep) => (
                  <EndpointBlock key={ep.method + ep.path} ep={ep} />
                ))}
              </Accordion>
            </Stack>
          </Tabs.Panel>
        ))}
      </Tabs>
    </Box>
  );
}
