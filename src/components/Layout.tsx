import type { Response } from '@/lib/api/response';
import useAvatar from '@/lib/client/hooks/useAvatar';
import useLogin from '@/lib/client/hooks/useLogin';
import { useLogout } from '@/lib/client/hooks/useLogout';
import { useUserStore } from '@/lib/client/store/user';
import type { SafeConfig } from '@/lib/config/safe';
import { fetchApi } from '@/lib/fetchApi';
import { isAdministrator } from '@/lib/role';
import {
  AppShell,
  Avatar,
  Box,
  Burger,
  Button,
  Divider,
  Menu,
  NavLink,
  Paper,
  ScrollArea,
  Title,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { useModals } from '@mantine/modals';
import { showNotification } from '@mantine/notifications';
import {
  IconAdjustments,
  IconApi,
  IconBrush,
  IconChevronDown,
  IconChevronRight,
  IconClipboardCopy,
  IconExternalLink,
  IconFileText,
  IconFileUpload,
  IconFiles,
  IconFolder,
  IconGhost2Filled,
  IconGraph,
  IconHome,
  IconLink,
  IconLogin2,
  IconLogout,
  IconMusic,
  IconRefreshDot,
  IconSettingsFilled,
  IconShieldCheckFilled,
  IconShieldLockFilled,
  IconSparkles,
  IconStopwatch,
  IconSun,
  IconMoon,
  IconTags,
  IconUpload,
  IconUsersGroup,
  IconChartBar,
} from '@tabler/icons-react';
import { useState } from 'react';
import { Link, NavigateFunction, Outlet, useLoaderData, useLocation, useNavigate } from 'react-router-dom';
import type { dashboardLoader } from '../client/routes';
import ConfigProvider from './ConfigProvider';
import VersionBadge from './VersionBadge';
import { SETTINGS_EXTERNAL_LINKS } from './pages/serverSettings';
import { useKeyboardShortcuts } from '@/lib/client/hooks/useKeyboardShortcuts';
import { useThemeOverrideStore } from '@/lib/client/store/themeOverride';

type NavLinks = {
  label: string;
  icon: React.ReactNode;
  active: (path: string) => boolean;
  href?: string;
  links?: NavLinks[];
  if?: (user: Response['/api/user']['user'], config: SafeConfig) => boolean;
};

const navLinks: NavLinks[] = [
  {
    label: 'Home',
    icon: <IconHome size='1rem' />,
    active: (path: string) => path === '/dashboard',
    href: '/dashboard',
  },
  {
    label: 'Metrics',
    icon: <IconGraph size='1rem' />,
    active: (path: string) => path === '/dashboard/metrics',
    href: '/dashboard/metrics',
    if: (user, config) =>
      config.features.metrics.enabled &&
      (config.features.metrics.adminOnly ? isAdministrator(user?.role) : true),
  },
  {
    label: 'Analytics',
    icon: <IconChartBar size='1rem' />,
    active: (path: string) => path === '/dashboard/analytics',
    href: '/dashboard/analytics',
  },
  {
    label: 'Files',
    icon: <IconFiles size='1rem' />,
    active: (path: string) => path === '/dashboard/files',
    href: '/dashboard/files',
  },
  {
    label: 'Folders',
    icon: <IconFolder size='1rem' />,
    active: (path: string) => path === '/dashboard/folders',
    href: '/dashboard/folders',
  },
  {
    label: 'Upload',
    icon: <IconUpload size='1rem' />,
    active: (path: string) => path.startsWith('/dashboard/upload'),
    links: [
      {
        label: 'File',
        icon: <IconFileUpload size='1rem' />,
        active: (path: string) => path === '/dashboard/upload/file',
        href: '/dashboard/upload/file',
      },
      {
        label: 'Text',
        icon: <IconFileText size='1rem' />,
        active: (path: string) => path === '/dashboard/upload/text',
        href: '/dashboard/upload/text',
      },
    ],
  },
  {
    label: 'URLs',
    icon: <IconLink size='1rem' />,
    active: (path: string) => path === '/dashboard/urls',
    href: '/dashboard/urls',
  },
  {
    label: 'Administrator',
    icon: <IconShieldLockFilled size='1rem' />,
    if: (user) => isAdministrator(user?.role),
    active: (path: string) => path.startsWith('/dashboard/admin'),
    links: [
      {
        label: 'Dashboard',
        icon: <IconHome size='1rem' />,
        active: (path: string) => path === '/dashboard/admin',
        href: '/dashboard/admin',
      },
      {
        label: 'Settings',
        icon: <IconAdjustments size='1rem' />,
        active: (path: string) => path.startsWith('/dashboard/admin/settings'),
        if: (user) => user?.role === 'ADMIN',
        href: '/dashboard/admin/settings',
        links: SETTINGS_EXTERNAL_LINKS.map(({ label, href, icon: Icon }) => ({
          label,
          icon: <Icon size='1rem' />,
          active: (path: string) => path === href,
          href,
        })),
      },
      {
        label: 'Actions',
        icon: <IconStopwatch size='1rem' />,
        active: (path: string) => path === '/dashboard/admin/actions',
        href: '/dashboard/admin/actions',
      },
      {
        label: 'Audit Logs',
        icon: <IconShieldCheckFilled size='1rem' />,
        active: (path: string) => path === '/dashboard/admin/audit-logs',
        href: '/dashboard/admin/audit-logs',
      },
      {
        label: 'Users',
        icon: <IconUsersGroup size='1rem' />,
        active: (path: string) => path === '/dashboard/admin/users',
        href: '/dashboard/admin/users',
      },
      {
        label: 'Invites',
        icon: <IconTags size='1rem' />,
        active: (path: string) => path === '/dashboard/admin/invites',
        href: '/dashboard/admin/invites',
        if: (_, config) => config.invites.enabled,
      },
      {
        label: 'Theme Maker',
        icon: <IconBrush size='1rem' />,
        active: (path: string) => path === '/dashboard/admin/theme-maker',
        href: '/dashboard/admin/theme-maker',
      },
      {
        label: 'Phase',
        icon: <IconSparkles size='1rem' />,
        active: (path: string) =>
          path === '/dashboard/admin/troll' ||
          path === '/dashboard/admin/soundboard' ||
          path === '/dashboard/admin/api-docs' ||
          path === '/dashboard/admin/login-customiser',
        links: [
          {
            label: 'Troll',
            icon: <IconGhost2Filled size='1rem' />,
            active: (path: string) => path === '/dashboard/admin/troll',
            href: '/dashboard/admin/troll',
          },
          {
            label: 'Soundboard',
            icon: <IconMusic size='1rem' />,
            active: (path: string) => path === '/dashboard/admin/soundboard',
            href: '/dashboard/admin/soundboard',
            if: (_, config) => config.features.soundboard,
          },
          {
            label: 'API Reference',
            icon: <IconApi size='1rem' />,
            active: (path: string) => path === '/dashboard/admin/api-docs',
            href: '/dashboard/admin/api-docs',
          },
          {
            label: 'Login Customiser',
            icon: <IconLogin2 size='1rem' />,
            active: (path: string) => path === '/dashboard/admin/login-customiser',
            href: '/dashboard/admin/login-customiser',
            if: (user) => user?.role === 'ADMIN',
          },
        ],
      },
    ],
  },
];

const renderLinks = (
  links: NavLinks[],
  pathname: string,
  user: Response['/api/user']['user'],
  config: SafeConfig,
  navigate: NavigateFunction,
) => {
  const visible = (link: NavLinks) => !link.if || link.if(user as Response['/api/user']['user'], config);

  const active = (link: NavLinks): boolean => {
    if (!visible(link)) return false;
    if (link.active(pathname)) return true;
    return (link.links || []).some((child) => active(child));
  };

  return links.map((link) => {
    if (visible(link)) {
      const sublinks = link.links;
      const isActive = link.active(pathname);

      if (!sublinks) {
        return (
          <NavLink
            key={link.label}
            label={link.label}
            leftSection={link.icon}
            variant='light'
            rightSection={<IconChevronRight size='0.7rem' />}
            active={isActive}
            component={Link}
            to={link.href || ''}
            prefetch='intent'
          />
        );
      } else {
        return (
          <NavLink
            key={link.label}
            label={link.label}
            leftSection={link.icon}
            variant='light'
            rightSection={<IconChevronRight size='0.7rem' />}
            active={isActive && !sublinks.some((child) => active(child))}
            defaultOpened={isActive || sublinks.some((child) => active(child))}
            onClick={(event) => {
              if (!link.href) return;
              event.preventDefault();
              navigate(link.href);
            }}
          >
            {renderLinks(sublinks, pathname, user as Response['/api/user']['user'], config, navigate)}
          </NavLink>
        );
      }
    }
    return null;
  });
};

export default function Layout() {
  const [opened, setOpened] = useState(false);
  const modals = useModals();
  const clipboard = useClipboard();
  const setUser = useUserStore((s) => s.setUser);
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useLogout();

  const loaderData = useLoaderData<typeof dashboardLoader>();
  const config = loaderData.config;

  const { user, mutate } = useLogin();
  const { avatar } = useAvatar();

  const { override: themeOverride, toggle: toggleTheme } = useThemeOverrideStore();

  // Wire keyboard shortcuts
  useKeyboardShortcuts();

  const [prev, setPrev] = useState(location.pathname);
  if (prev !== location.pathname) {
    setPrev(location.pathname);
    setOpened(false);
  }

  const copyToken = () => {
    modals.openConfirmModal({
      title: 'Copy token?',
      children:
        'Are you sure you want to copy your token? Your token can interact with all parts of Zipline. Do not share this token with anyone.',
      labels: { confirm: 'Copy', cancel: 'No, close this popup' },
      onConfirm: async () => {
        const { data, error } = await fetchApi<Response['/api/user/token']>('/api/user/token');
        if (error) {
          showNotification({
            title: 'Error',
            message: error.error,
            color: 'red',
            icon: <IconClipboardCopy size='1rem' />,
          });
        } else {
          clipboard.copy(data?.token ?? '');
          showNotification({
            title: 'Copied',
            message: 'Your token has been copied to your clipboard.',
            color: 'green',
            icon: <IconClipboardCopy size='1rem' />,
          });
        }
      },
    });
  };

  const refreshToken = () => {
    modals.openConfirmModal({
      title: 'Refresh token?',
      children:
        'Are you sure you want to refresh your token? Once you refresh/reset your token, you will need to update any scripts or applications that use your token.',
      labels: { confirm: 'Refresh', cancel: 'No, close this popup' },
      onConfirm: async () => {
        const { data, error } = await fetchApi<Response['/api/user/token']>('/api/user/token', 'PATCH');
        if (error) {
          showNotification({
            title: 'Error',
            message: error.error,
            color: 'red',
            icon: <IconRefreshDot size='1rem' />,
          });
        } else {
          setUser(data?.user);
          mutate(data as Response['/api/user']);
          showNotification({
            title: 'Refreshed',
            message: 'Your token has been refreshed.',
            color: 'green',
            icon: <IconRefreshDot size='1rem' />,
          });
        }
      },
    });
  };

  const logoMark = (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: 4,
        background: 'var(--accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
        fontWeight: 700,
        fontSize: 14,
        color: '#fff',
        flexShrink: 0,
      }}
    >
      {config.website.titleLogo ? (
        <Avatar src={config.website.titleLogo} alt='logo' radius={0} size={28} />
      ) : (
        (config.website.title?.trim()[0] ?? 'Z').toUpperCase()
      )}
    </div>
  );

  return (
    <AppShell
      navbar={{ breakpoint: 'sm', width: { sm: 210, lg: 240 }, collapsed: { mobile: !opened } }}
      header={{ height: 56 }}
      footer={{ height: { base: 0.1 } }}
      styles={{ main: { background: 'var(--bg)', minHeight: '100vh' } }}
    >
      <AppShell.Header
        px='md'
        style={{
          background: 'var(--bg-2)',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
          <Burger
            opened={opened}
            onClick={() => setOpened((o) => !o)}
            size='sm'
            color='var(--fg-3)'
            mr='md'
            hiddenFrom='sm'
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {logoMark}
            <Title
              visibleFrom='sm'
              lineClamp={1}
              style={{
                fontFamily: "'Space Grotesk', system-ui, sans-serif",
                fontWeight: 600,
                fontSize: '0.95rem',
                letterSpacing: '-0.01em',
                color: 'var(--fg)',
              }}
            >
              {config.website.title.trim()}
            </Title>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tooltip label={themeOverride === 'dark' ? 'Switch to light' : 'Switch to dark'}>
              <ActionIcon
                variant='subtle'
                color='gray'
                onClick={toggleTheme}
                size='sm'
                aria-label='Toggle dark/light mode'
              >
                {themeOverride === 'dark' ? <IconSun size='1rem' /> : <IconMoon size='1rem' />}
              </ActionIcon>
            </Tooltip>
            <Menu shadow='none' width={220} offset={8}>
              <Menu.Target>
                <Button
                  variant='subtle'
                  color='gray'
                  style={{
                    background: 'var(--bg-3)',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--fg)',
                    fontFamily: "'Space Grotesk', system-ui, sans-serif",
                    fontWeight: 500,
                    fontSize: '0.85rem',
                    padding: '5px 12px',
                  }}
                  leftSection={
                    avatar ? (
                      <Avatar src={avatar} radius={0} size={20} alt={user?.username ?? 'User avatar'} />
                    ) : (
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 2,
                          background: 'var(--accent)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#fff',
                        }}
                      >
                        {(user?.username?.[0] ?? 'U').toUpperCase()}
                      </div>
                    )
                  }
                  rightSection={<IconChevronDown size='0.65rem' />}
                  size='sm'
                >
                  {user?.username}
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>
                  {user?.username}
                  {isAdministrator(user?.role) ? ' · admin' : ''}
                </Menu.Label>
                <Menu.Item
                  leftSection={<IconClipboardCopy size='1rem' />}
                  onClick={copyToken}
                >
                  Copy token
                </Menu.Item>
                <Menu.Item color='red' leftSection={<IconRefreshDot size='1rem' />} onClick={refreshToken}>
                  Refresh token
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconSettingsFilled size='1rem' />}
                  component={Link}
                  to='/dashboard/settings'
                  prefetch='intent'
                >
                  Settings
                </Menu.Item>
                {(user?.role === 'ADMIN') && (
                  <Menu.Item
                    leftSection={<IconAdjustments size='1rem' />}
                    component={Link}
                    to='/dashboard/admin/settings'
                    prefetch='intent'
                  >
                    Server Settings
                  </Menu.Item>
                )}
                <Menu.Divider />
                <Menu.Item color='red' leftSection={<IconLogout size='1rem' />} onClick={logout}>
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </div>
        </div>
      </AppShell.Header>

      <AppShell.Navbar
        hidden={!opened}
        zIndex={90}
        style={{
          background: 'var(--bg-2)',
          borderRight: '1px solid var(--line)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          hiddenFrom='sm'
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 14px 10px' }}
        >
          {logoMark}
          <span
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontWeight: 600,
              fontSize: '0.95rem',
              color: 'var(--fg)',
              letterSpacing: '-0.01em',
            }}
          >
            {config.website.title.trim()}
          </span>
        </Box>
        <Divider hiddenFrom='sm' style={{ marginBottom: 6 }} />

        <ScrollArea style={{ flex: 1 }} px={8} py={4}>
          {renderLinks(navLinks, location.pathname, user as Response['/api/user']['user'], config, navigate)}
        </ScrollArea>

        <div style={{ padding: '6px 0' }}>
          <VersionBadge />
          <Divider style={{ margin: '6px 0' }} />
          <ScrollArea mah={140} px={8}>
            <Box>
              {config.website.externalLinks.map(({ name, url }, i) => (
                <NavLink
                  key={i}
                  label={name}
                  leftSection={<IconExternalLink size='1rem' />}
                  variant='light'
                  component={Link}
                  to={url}
                  target='_blank'
                  style={{ marginBottom: 2 }}
                />
              ))}
            </Box>
          </ScrollArea>
        </div>
      </AppShell.Navbar>

      <AppShell.Main>
        <ConfigProvider data={loaderData}>
          <Paper
            withBorder
            m='md'
            p='md'
            radius={0}
            style={{ background: 'var(--bg-2)', border: '1px solid var(--line)' }}
          >
            <Outlet />
          </Paper>
        </ConfigProvider>
      </AppShell.Main>

      <AppShell.Footer display='none' />
    </AppShell>
  );
}
