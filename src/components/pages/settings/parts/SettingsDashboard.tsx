import DomainSelect from '@/components/DomainSelect';
import { useThemes } from '@/components/ThemeProvider';
import { useSettingsStore } from '@/lib/client/store/settings';
import { Box, Group, Paper, Select, Stack, Switch, Text, Title } from '@mantine/core';
import { IconMoonFilled, IconPaintFilled, IconSunFilled } from '@tabler/icons-react';
import { useShallow } from 'zustand/shallow';

const renderThemeOption =
  (themes: ReturnType<typeof useThemes>) =>
  ({ option }: { option: { value: string; label: string } }) => {
    const theme = themes.find((t) => t.id === option.value);
    
    // Extract color swatches from theme
    const getSwatches = () => {
      if (!theme || option.value === 'system') return null;
      
      const colors = theme.colors || {};
      const primaryColor = theme.primaryColor || 'violet';
      const primaryShade = colors[primaryColor]?.[5] || colors[primaryColor]?.[4];
      
      // Try to get a secondary color (first non-primary, non-dark color)
      const colorKeys = Object.keys(colors).filter(k => k !== 'dark' && k !== primaryColor);
      const secondaryColor = colorKeys[0];
      const secondaryShade = secondaryColor ? colors[secondaryColor]?.[5] || colors[secondaryColor]?.[4] : null;
      
      // Background color
      const bgColor = theme.mainBackgroundColor || (theme.colorScheme === 'dark' ? '#1a1b1e' : '#ffffff');
      
      return (
        <Group gap={3}>
          {primaryShade && (
            <Box style={{ width: 14, height: 14, borderRadius: 2, background: primaryShade, border: '1px solid rgba(0,0,0,0.1)' }} />
          )}
          {secondaryShade && (
            <Box style={{ width: 14, height: 14, borderRadius: 2, background: secondaryShade, border: '1px solid rgba(0,0,0,0.1)' }} />
          )}
          <Box style={{ width: 14, height: 14, borderRadius: 2, background: bgColor, border: '1px solid rgba(0,0,0,0.2)' }} />
        </Group>
      );
    };

    return (
      <Group gap='xs' wrap='nowrap'>
        {option.value === 'system' ? (
          <IconPaintFilled size='1rem' />
        ) : theme?.colorScheme === 'dark' ? (
          <IconMoonFilled size='1rem' />
        ) : (
          <IconSunFilled size='1rem' />
        )}
        <Text style={{ flex: 1 }}>{option.label}</Text>
        {getSwatches()}
      </Group>
    );
  };

export default function SettingsDashboard() {
  const [settings, update] = useSettingsStore(useShallow((state) => [state.settings, state.update]));
  const themes = useThemes();

  const sortedThemes = themes.sort((a, b) => {
    if (a.colorScheme === 'light' && b.colorScheme === 'dark') return -1;
    if (a.colorScheme === 'dark' && b.colorScheme === 'light') return 1;
    return 0;
  });

  return (
    <Paper withBorder p='sm' h='100%'>
      <Title order={2}>Dashboard Settings</Title>
      <Text size='sm' c='dimmed' mt={3}>
        These settings are saved automatically in your <b>browser.</b>
      </Text>

      <Stack gap='sm' my='xs'>
        <Stack>
          <Switch
            label='Disable Media Preview'
            description='Disable previews of files in the dashboard. This may help to save data and speed up the dashboard if you have a lot of media files, but it will also disable the file viewer and show a generic file icon instead of a preview for supported files.'
            checked={settings.disableMediaPreview}
            onChange={(event) => update('disableMediaPreview', event.currentTarget.checked)}
          />
          <Switch
            label='Mute video and audio previews'
            description='When enabled, video and audio in the file viewer autoplay muted. Turning this off tries to play sound immediately. Browsers may block unmuted autoplay until you interact with the page.'
            checked={settings.mediaAutoMuted}
            onChange={(event) => update('mediaAutoMuted', event.currentTarget.checked)}
          />
          <Switch
            label='Warn on deletion'
            description='Show a warning when deleting stuff. When this is disabled, files, urls, etc will be deleted with no prior warning! Folders, users, and bulk-transactions are exempt from this rule and will always warn you before deleting anything.'
            checked={settings.warnDeletion}
            onChange={(event) => update('warnDeletion', event.currentTarget.checked)}
          />
          <Switch
            label='File navigation buttons'
            description='Show previous/next on the right and left of the file viewer to easily navigate between files.'
            checked={settings.fileNavButtons}
            onChange={(event) => update('fileNavButtons', event.currentTarget.checked)}
          />
          <Switch
            label='Show recents'
            description='Show recent uploads and logins on the home page.'
            checked={settings.homeShowRecents}
            onChange={(event) => update('homeShowRecents', event.currentTarget.checked)}
          />

          <Switch
            label='Show activity'
            description='Show your recent activity as a graph on the home page.'
            checked={settings.homeShowActivity}
            onChange={(event) => update('homeShowActivity', event.currentTarget.checked)}
          />

          <Switch
            label='Show file types'
            description='Show the file types table on the home page.'
            checked={settings.homeShowTypes}
            onChange={(event) => update('homeShowTypes', event.currentTarget.checked)}
          />
        </Stack>

        <Select
          label='File viewer'
          description='Choose which file viewer opens when you click a file.'
          data={[
            { value: 'fullscreen', label: 'Fullscreen (beta)' },
            { value: 'default', label: 'Default (modal)' },
          ]}
          value={settings.fileViewer}
          onChange={(value) => update('fileViewer', (value as 'default' | 'fullscreen') ?? 'fullscreen')}
        />

        <DomainSelect
          label='Default Domain'
          description='Set the default domain used for copied links anywhere in the dashboard. Leave blank or select "Default domain" to use the current domain that serves the dashboard.'
          value={settings.domain}
          onChange={(value) => update('domain', (value as string) ?? '')}
        />

        <Select
          label='Theme'
          description='The theme to use for the dashboard. This is only a visual change on your browser and does not change the theme for other users.'
          data={[
            { value: 'system', label: 'System' },
            ...sortedThemes.map((theme) => ({ value: theme.id, label: theme.name })),
          ]}
          value={settings.theme}
          onChange={(value) => update('theme', value ?? 'builtin:dark_gray')}
          leftSection={<IconPaintFilled size='1rem' />}
          renderOption={renderThemeOption(themes)}
        />

        {settings.theme === 'system' && (
          <Group grow>
            <Select
              label='Dark Theme'
              description='The theme to use for the dashboard when your system is in dark mode.'
              data={themes
                .filter((theme) => theme.colorScheme === 'dark')
                .map((theme) => ({ value: theme.id, label: theme.name }))}
              value={settings.themeDark}
              onChange={(value) => update('themeDark', value ?? 'builtin:dark_gray')}
              disabled={settings.theme !== 'system'}
              leftSection={<IconMoonFilled size='1rem' />}
            />

            <Select
              label='Light Theme'
              description='The theme to use for the dashboard when your system is in light mode.'
              data={themes
                .filter((theme) => theme.colorScheme === 'light')
                .map((theme) => ({ value: theme.id, label: theme.name }))}
              value={settings.themeLight}
              onChange={(value) => update('themeLight', value ?? 'builtin:light_gray')}
              disabled={settings.theme !== 'system'}
              leftSection={<IconSunFilled size='1rem' />}
            />
          </Group>
        )}
      </Stack>
    </Paper>
  );
}
