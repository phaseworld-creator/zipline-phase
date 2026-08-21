import { fetchApi } from '@/lib/fetchApi';
import { themeComponents, ZiplineTheme } from '@/lib/theme';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Code,
  ColorInput,
  ColorSwatch,
  Divider,
  Group,
  MantineProvider,
  NavLink,
  Paper,
  ScrollArea,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Table,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconCheck,
  IconCode,
  IconCopy,
  IconDeviceFloppy,
  IconDownload,
  IconEye,
  IconPaintFilled,
  IconPalette,
  IconRefresh,
  IconTrash,
} from '@tabler/icons-react';
import { createTheme } from '@mantine/core';
import { useState } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';

/* ─── Types ─────────────────────────────────────────────────── */
type ColorScheme = 'dark' | 'light';
type Radius = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type ColorShades = [string, string, string, string, string, string, string, string, string, string];

type ThemeDraft = {
  name: string;
  colorScheme: ColorScheme;
  primaryColor: string;
  mainBackgroundColor: string;
  primaryShades: ColorShades;
  darkShades: ColorShades;
  fontFamily: string;
  headingFontFamily: string;
  defaultRadius: Radius;
  extraCss: string;
};

/* ─── Defaults ───────────────────────────────────────────────── */
const DEFAULT_DARK_SHADES: ColorShades = [
  '#f8fafc', '#94a3b8', '#475569', '#334155',
  '#1e293b', '#0f172a', '#0d1220', '#080d18',
  '#050810', '#030712',
];

const DEFAULT_PRIMARY_SHADES: ColorShades = [
  '#f0f0ff', '#e0e0fe', '#c7c8fd', '#a5a8fb',
  '#818cf8', '#6366f1', '#4f46e5', '#4338ca',
  '#3730a3', '#312e81',
];

const INITIAL: ThemeDraft = {
  name: 'My Theme',
  colorScheme: 'dark',
  primaryColor: 'primary',
  mainBackgroundColor: '#030712',
  primaryShades: [...DEFAULT_PRIMARY_SHADES] as ColorShades,
  darkShades: [...DEFAULT_DARK_SHADES] as ColorShades,
  fontFamily: 'system-ui, sans-serif',
  headingFontFamily: 'system-ui, sans-serif',
  defaultRadius: 'md',
  extraCss: '',
};

const PRESETS: { label: string; draft: Partial<ThemeDraft> }[] = [
  {
    label: 'Phase Dark',
    draft: {
      colorScheme: 'dark',
      mainBackgroundColor: '#030712',
      primaryShades: ['#f0f0ff','#e0e0fe','#c7c8fd','#a5a8fb','#818cf8','#6366f1','#4f46e5','#4338ca','#3730a3','#312e81'] as ColorShades,
      darkShades: ['#f8fafc','#94a3b8','#475569','#334155','#1e293b','#0f172a','#0d1220','#080d18','#050810','#030712'] as ColorShades,
    },
  },
  {
    label: 'Midnight Purple',
    draft: {
      colorScheme: 'dark',
      mainBackgroundColor: '#0d0020',
      primaryShades: ['#faf5ff','#f3e8ff','#e9d5ff','#d8b4fe','#c084fc','#a855f7','#9333ea','#7e22ce','#6b21a8','#581c87'] as ColorShades,
      darkShades: ['#faf5ff','#e9d5ff','#6b21a8','#4c1d95','#3b0764','#2e1065','#1e0a3c','#150828','#0d0020','#060012'] as ColorShades,
    },
  },
  {
    label: 'Rose Gold',
    draft: {
      colorScheme: 'dark',
      mainBackgroundColor: '#1a0a0a',
      primaryShades: ['#fff1f2','#ffe4e6','#fecdd3','#fda4af','#fb7185','#f43f5e','#e11d48','#be123c','#9f1239','#881337'] as ColorShades,
      darkShades: ['#fff1f2','#fecdd3','#9f1239','#7f1d1d','#450a0a','#300505','#200303','#150202','#1a0a0a','#0d0000'] as ColorShades,
    },
  },
  {
    label: 'Ocean Teal',
    draft: {
      colorScheme: 'dark',
      mainBackgroundColor: '#021018',
      primaryShades: ['#f0fdfa','#ccfbf1','#99f6e4','#5eead4','#2dd4bf','#14b8a6','#0d9488','#0f766e','#115e59','#134e4a'] as ColorShades,
      darkShades: ['#f0fdfa','#99f6e4','#0f766e','#134e4a','#052e2e','#021a1a','#021418','#011010','#010c0e','#010809'] as ColorShades,
    },
  },
  {
    label: 'Light Minimal',
    draft: {
      colorScheme: 'light',
      mainBackgroundColor: '#f8fafc',
      primaryShades: ['#eff6ff','#dbeafe','#bfdbfe','#93c5fd','#60a5fa','#3b82f6','#2563eb','#1d4ed8','#1e40af','#1e3a8a'] as ColorShades,
      darkShades: ['#ffffff','#f8fafc','#f1f5f9','#e2e8f0','#cbd5e1','#94a3b8','#64748b','#475569','#334155','#1e293b'] as ColorShades,
    },
  },
];

/* ─── Shade row editor ───────────────────────────────────────── */
function ShadeEditor({
  label,
  shades,
  onChange,
}: {
  label: string;
  shades: ColorShades;
  onChange: (i: number, val: string) => void;
}) {
  return (
    <Box>
      <Text size='sm' fw={600} mb={6}>{label}</Text>
      <Group gap={6} wrap='nowrap'>
        {shades.map((c, i) => (
          <Tooltip key={i} label={`[${i}] ${c}`} position='top'>
            <ColorInput
              value={c}
              onChange={(v) => onChange(i, v)}
              format='hex'
              withPicker
              swatches={[]}
              style={{ width: 56 }}
              styles={{ input: { paddingLeft: 28, fontSize: '0.7rem' }, preview: { width: 20 } }}
            />
          </Tooltip>
        ))}
      </Group>
      <Group gap={4} mt={4}>
        {shades.map((c, i) => (
          <ColorSwatch key={i} color={c} size={18} radius='xs' />
        ))}
      </Group>
    </Box>
  );
}

/* ─── Live preview ───────────────────────────────────────────── */
function LivePreview({ draft }: { draft: ThemeDraft }) {
  const builtTheme = buildMantineTheme(draft);

  return (
    <MantineProvider
      theme={createTheme(builtTheme)}
      defaultColorScheme={draft.colorScheme}
      forceColorScheme={draft.colorScheme}
    >
      <Box
        p='md'
        style={{
          background: draft.mainBackgroundColor,
          borderRadius: 16,
          minHeight: 420,
          border: '1px solid rgba(255,255,255,0.08)',
          fontFamily: draft.fontFamily,
        }}
      >
        {/* Fake nav */}
        <Paper withBorder p='sm' mb='md' radius='md'>
          <Group justify='space-between'>
            <Text fw={800} size='lg' style={{ fontFamily: draft.headingFontFamily }}>
              {draft.name}
            </Text>
            <Group gap='xs'>
              <Badge color={draft.primaryColor} variant='light'>Live</Badge>
              <Button size='xs' radius={draft.defaultRadius}>Action</Button>
            </Group>
          </Group>
        </Paper>

        {/* Fake sidebar + content */}
        <Group align='flex-start' gap='md'>
          <Paper withBorder p='sm' style={{ width: 140, minHeight: 260 }} radius='md'>
            <Stack gap={4}>
              {['Dashboard', 'Files', 'Upload', 'URLs', 'Settings'].map((item, i) => (
                <NavLink
                  key={item}
                  label={item}
                  active={i === 0}
                  variant='light'
                  style={{ borderRadius: 8 }}
                />
              ))}
            </Stack>
          </Paper>

          <Stack gap='sm' style={{ flex: 1 }}>
            {/* Stat cards */}
            <SimpleGrid cols={3} spacing='sm'>
              {[
                { label: 'Files', value: '128' },
                { label: 'Storage', value: '4.2 GB' },
                { label: 'Links', value: '37' },
              ].map(({ label, value }) => (
                <Paper key={label} withBorder p='sm' radius='md'>
                  <Text size='xs' c='dimmed'>{label}</Text>
                  <Text fw={700} size='xl' style={{ fontFamily: draft.headingFontFamily }}>
                    {value}
                  </Text>
                </Paper>
              ))}
            </SimpleGrid>

            {/* Buttons showcase */}
            <Paper withBorder p='sm' radius='md'>
              <Text size='xs' fw={600} c='dimmed' mb='xs'>Buttons</Text>
              <Group gap='xs'>
                <Button size='xs' radius={draft.defaultRadius}>Primary</Button>
                <Button size='xs' variant='outline' radius={draft.defaultRadius}>Outline</Button>
                <Button size='xs' variant='subtle' radius={draft.defaultRadius}>Subtle</Button>
                <Button size='xs' color='red' radius={draft.defaultRadius}>Danger</Button>
              </Group>
            </Paper>

            {/* Table */}
            <Paper withBorder p='sm' radius='md'>
              <Text size='xs' fw={600} c='dimmed' mb='xs'>Table</Text>
              <Table striped highlightOnHover fz='xs'>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Size</Table.Th>
                    <Table.Th>Type</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {[['photo.png', '2.1 MB', 'image'], ['video.mp4', '48 MB', 'video'], ['doc.pdf', '340 KB', 'document']].map(([n, s, t]) => (
                    <Table.Tr key={n}>
                      <Table.Td>{n}</Table.Td>
                      <Table.Td>{s}</Table.Td>
                      <Table.Td><Badge size='xs' variant='light'>{t}</Badge></Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </Stack>
        </Group>
      </Box>
    </MantineProvider>
  );
}

/* ─── Build a MantineTheme from draft ────────────────────────── */
function buildMantineTheme(draft: ThemeDraft): any {
  return {
    colorScheme: draft.colorScheme,
    primaryColor: draft.primaryColor,
    defaultRadius: draft.defaultRadius,
    fontFamily: draft.fontFamily,
    headings: { fontFamily: draft.headingFontFamily },
    colors: {
      [draft.primaryColor]: draft.primaryShades,
      dark: draft.darkShades,
    },
    mainBackgroundColor: draft.mainBackgroundColor,
    components: {},
  };
}

/* ─── Build export JSON ─────────────────────────────────────── */
function buildThemeJson(draft: ThemeDraft): object {
  return {
    name: draft.name,
    colorScheme: draft.colorScheme,
    primaryColor: draft.primaryColor,
    mainBackgroundColor: draft.mainBackgroundColor,
    fontFamily: draft.fontFamily,
    headings: {
      fontFamily: draft.headingFontFamily,
      fontWeight: '700',
    },
    defaultRadius: draft.defaultRadius,
    extraCss: draft.extraCss,
    colors: {
      [draft.primaryColor]: draft.primaryShades,
      dark: draft.darkShades,
    },
  };
}

/* ─── Main component ─────────────────────────────────────────── */
export default function DashboardThemeMaker() {
  const [draft, setDraft] = useState<ThemeDraft>({ ...INITIAL });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('colors');

  const { data: savedSlugs, isLoading: slugsLoading } = useSWR<string[]>('/api/server/themes/custom');

  const set = <K extends keyof ThemeDraft>(key: K, val: ThemeDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: val }));

  const setShade = (which: 'primaryShades' | 'darkShades', i: number, val: string) =>
    setDraft((d) => {
      const copy = [...d[which]] as ColorShades;
      copy[i] = val;
      return { ...d, [which]: copy };
    });

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setDraft((d) => ({ ...d, ...preset.draft }));
  };

  const exportJson = () => {
    const json = JSON.stringify(buildThemeJson(draft), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${draft.name.toLowerCase().replace(/\s+/g, '_')}.theme.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(buildThemeJson(draft), null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveToServer = async () => {
    setSaving(true);
    const payload = {
      ...buildThemeJson(draft),
      colors: {
        [draft.primaryColor]: draft.primaryShades,
        dark: draft.darkShades,
      },
    };
    const { error } = await fetchApi('/api/server/themes/custom', 'POST', payload);
    setSaving(false);

    if (error) {
      notifications.show({ message: error.error || 'Save failed', color: 'red' });
      return;
    }

    notifications.show({
      title: 'Theme saved!',
      message: `"${draft.name}" is now available in theme settings.`,
      color: 'teal',
      icon: <IconCheck size='1rem' />,
    });
    globalMutate('/api/server/themes/custom');
    globalMutate('/api/server/themes');
  };

  const deleteFromServer = async (slug: string) => {
    const res = await fetch(`/api/server/themes/custom/${encodeURIComponent(slug)}`, { method: 'DELETE' });
    if (!res.ok) {
      notifications.show({ message: 'Failed to delete theme', color: 'red' });
      return;
    }
    notifications.show({ message: `Theme "${slug}" deleted`, color: 'orange', icon: <IconTrash size='1rem' /> });
    globalMutate('/api/server/themes/custom');
    globalMutate('/api/server/themes');
  };

  const jsonPreview = JSON.stringify(buildThemeJson(draft), null, 2);

  return (
    <Box>
      {/* Header */}
      <Group gap='sm' mb='xs'>
        <IconPalette size='1.5rem' style={{ color: 'var(--mantine-color-violet-4)' }} />
        <Title order={1}>Theme Maker</Title>
        <Badge color='violet' variant='light'>Live Preview</Badge>
      </Group>
      <Text c='dimmed' mb='lg'>
        Design a custom theme, preview it live, then save it to the server or export as JSON.
      </Text>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing='lg'>
        {/* ── Left: editor ── */}
        <Stack gap='md'>

          {/* Presets */}
          <Paper withBorder p='sm' radius='md'>
            <Text size='sm' fw={600} mb='xs'>Start from a preset</Text>
            <Group gap='xs'>
              {PRESETS.map((p) => (
                <Button
                  key={p.label}
                  size='xs'
                  variant='light'
                  onClick={() => applyPreset(p)}
                >
                  {p.label}
                </Button>
              ))}
              <Tooltip label='Reset to defaults'>
                <ActionIcon variant='subtle' onClick={() => setDraft({ ...INITIAL })}>
                  <IconRefresh size='1rem' />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Paper>

          {/* Editor tabs */}
          <Tabs value={activeTab} onChange={(v) => setActiveTab(v ?? 'colors')}>
            <Tabs.List>
              <Tabs.Tab value='colors' leftSection={<IconPaintFilled size='0.9rem' />}>Colors</Tabs.Tab>
              <Tabs.Tab value='typography'>Typography</Tabs.Tab>
              <Tabs.Tab value='misc'>Misc</Tabs.Tab>
              <Tabs.Tab value='css' leftSection={<IconCode size='0.9rem' />}>Extra CSS</Tabs.Tab>
              <Tabs.Tab value='json'>JSON</Tabs.Tab>
            </Tabs.List>

            {/* ── Colors tab ── */}
            <Tabs.Panel value='colors' pt='sm'>
              <Stack gap='md'>
                <Group grow>
                  <TextInput
                    label='Theme name'
                    value={draft.name}
                    onChange={(e) => set('name', e.currentTarget.value)}
                  />
                  <SegmentedControl
                    mt={22}
                    value={draft.colorScheme}
                    onChange={(v) => set('colorScheme', v as ColorScheme)}
                    data={[
                      { label: '🌙 Dark', value: 'dark' },
                      { label: '☀️ Light', value: 'light' },
                    ]}
                  />
                </Group>

                <Group grow>
                  <TextInput
                    label='Primary color key'
                    description='Name used in colors object (e.g. "violet", "teal")'
                    value={draft.primaryColor}
                    onChange={(e) => set('primaryColor', e.currentTarget.value.toLowerCase().replace(/\s/g, ''))}
                  />
                  <ColorInput
                    label='Background color'
                    description='Main AppShell background'
                    value={draft.mainBackgroundColor}
                    onChange={(v) => set('mainBackgroundColor', v)}
                    format='hex'
                  />
                </Group>

                <Divider label='Primary color — 10 shades (lightest → darkest)' />
                <ShadeEditor
                  label='Primary shades'
                  shades={draft.primaryShades}
                  onChange={(i, v) => setShade('primaryShades', i, v)}
                />

                <Divider label='Dark/surface color — 10 shades' />
                <ShadeEditor
                  label='Dark shades (backgrounds & surfaces)'
                  shades={draft.darkShades}
                  onChange={(i, v) => setShade('darkShades', i, v)}
                />
              </Stack>
            </Tabs.Panel>

            {/* ── Typography tab ── */}
            <Tabs.Panel value='typography' pt='sm'>
              <Stack gap='md'>
                <TextInput
                  label='Body font family'
                  description='CSS font-family for all text'
                  placeholder="'Plus Jakarta Sans', system-ui, sans-serif"
                  value={draft.fontFamily}
                  onChange={(e) => set('fontFamily', e.currentTarget.value)}
                />
                <TextInput
                  label='Heading font family'
                  description='CSS font-family for h1–h6 (leave same as body for uniform look)'
                  placeholder="'Syne', sans-serif"
                  value={draft.headingFontFamily}
                  onChange={(e) => set('headingFontFamily', e.currentTarget.value)}
                />
                <Select
                  label='Default border radius'
                  value={draft.defaultRadius}
                  onChange={(v) => set('defaultRadius', (v ?? 'md') as Radius)}
                  data={['xs', 'sm', 'md', 'lg', 'xl']}
                />
                <Text size='xs' c='dimmed'>
                  To load a Google Font, add it in Extra CSS tab using @import.
                </Text>
              </Stack>
            </Tabs.Panel>

            {/* ── Misc tab ── */}
            <Tabs.Panel value='misc' pt='sm'>
              <Stack gap='md'>
                <Select
                  label='Default border radius'
                  value={draft.defaultRadius}
                  onChange={(v) => set('defaultRadius', (v ?? 'md') as Radius)}
                  data={[
                    { value: 'xs', label: 'xs — 2px' },
                    { value: 'sm', label: 'sm — 4px' },
                    { value: 'md', label: 'md — 8px' },
                    { value: 'lg', label: 'lg — 16px' },
                    { value: 'xl', label: 'xl — 32px' },
                  ]}
                />
                <Text size='sm' c='dimmed'>
                  More options (shadow, spacing, etc.) can be added via Extra CSS.
                </Text>
              </Stack>
            </Tabs.Panel>

            {/* ── Extra CSS tab ── */}
            <Tabs.Panel value='css' pt='sm'>
              <Stack gap='xs'>
                <Text size='xs' c='dimmed'>
                  Raw CSS injected into the page as a &lt;style&gt; tag when this theme is active.
                  Use for Google Font @import, variable overrides, or custom scrollbar styles.
                </Text>
                <Textarea
                  value={draft.extraCss}
                  onChange={(e) => set('extraCss', e.currentTarget.value)}
                  minRows={10}
                  autosize
                  ff='monospace'
                  placeholder={`/* Example */\n@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');\n\n:root {\n  --my-custom-var: #ff6b6b;\n}`}
                />
              </Stack>
            </Tabs.Panel>

            {/* ── JSON preview tab ── */}
            <Tabs.Panel value='json' pt='sm'>
              <Stack gap='xs'>
                <Text size='xs' c='dimmed'>
                  This is the JSON that will be saved as a <Code>.theme.json</Code> file.
                  You can place it manually in the <Code>./themes/</Code> directory.
                </Text>
                <ScrollArea h={340}>
                  <Code block ff='monospace' style={{ fontSize: '0.75rem', whiteSpace: 'pre' }}>
                    {jsonPreview}
                  </Code>
                </ScrollArea>
              </Stack>
            </Tabs.Panel>
          </Tabs>

          {/* Action buttons */}
          <Group gap='sm'>
            <Button
              leftSection={<IconDeviceFloppy size='1rem' />}
              variant='gradient'
              gradient={{ from: 'violet', to: 'indigo' }}
              onClick={saveToServer}
              loading={saving}
              flex={1}
            >
              Save to server
            </Button>
            <Button
              leftSection={<IconDownload size='1rem' />}
              variant='outline'
              onClick={exportJson}
            >
              Export JSON
            </Button>
            <Tooltip label={copied ? 'Copied!' : 'Copy JSON'}>
              <ActionIcon
                variant='outline'
                size='lg'
                color={copied ? 'teal' : 'gray'}
                onClick={copyJson}
              >
                {copied ? <IconCheck size='1rem' /> : <IconCopy size='1rem' />}
              </ActionIcon>
            </Tooltip>
          </Group>

          {/* Saved custom themes */}
          {!slugsLoading && savedSlugs && savedSlugs.length > 0 && (
            <Paper withBorder p='sm' radius='md'>
              <Text size='sm' fw={600} mb='xs'>
                Saved custom themes
              </Text>
              <Stack gap='xs'>
                {savedSlugs.map((slug) => (
                  <Group key={slug} justify='space-between'>
                    <Code>{slug}</Code>
                    <ActionIcon
                      variant='light'
                      color='red'
                      size='sm'
                      onClick={() => deleteFromServer(slug)}
                    >
                      <IconTrash size='0.85rem' />
                    </ActionIcon>
                  </Group>
                ))}
              </Stack>
            </Paper>
          )}
        </Stack>

        {/* ── Right: live preview ── */}
        <Box>
          <Group gap='xs' mb='sm'>
            <IconEye size='1rem' style={{ color: 'var(--mantine-color-dimmed)' }} />
            <Text size='sm' fw={600} c='dimmed'>
              Live preview — updates as you type
            </Text>
            <Badge color={draft.colorScheme === 'dark' ? 'dark' : 'yellow'} variant='dot' size='xs'>
              {draft.colorScheme}
            </Badge>
          </Group>
          <LivePreview draft={draft} />
        </Box>
      </SimpleGrid>
    </Box>
  );
}
