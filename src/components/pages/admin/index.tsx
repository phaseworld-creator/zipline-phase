import { useConfig } from '@/components/ConfigProvider';
import { LinksList } from '@/components/LinksList';
import useLogin from '@/lib/client/hooks/useLogin';
import { isAdministrator } from '@/lib/role';
import { Divider, SimpleGrid, Text, Title } from '@mantine/core';
import {
  IconAdjustments,
  IconApi,
  IconBrush,
  IconGhost2Filled,
  IconGraph,
  IconLogin2,
  IconSparkles,
  IconStopwatch,
  IconTags,
  IconUsersGroup,
} from '@tabler/icons-react';
import { Version } from './parts/Version';
import { Storage } from './parts/Storage';

export default function DashboardAdminHome() {
  const { user } = useLogin();
  const config = useConfig();

  const adminLinks = [
    {
      label: 'Metrics',
      description: 'Instance-wide usage graphs and statistics',
      href: '/dashboard/metrics',
      icon: IconGraph,
      show:
        config.features.metrics.enabled &&
        (!config.features.metrics.adminOnly || isAdministrator(user?.role)),
    },
    {
      label: 'Actions',
      description: 'Maintenance tools and import/export',
      href: '/dashboard/admin/actions',
      icon: IconStopwatch,
      show: true,
    },
    {
      label: 'Users',
      description: 'Manage users and quotas',
      href: '/dashboard/admin/users',
      icon: IconUsersGroup,
      show: true,
    },
    {
      label: 'Settings',
      description: 'Server configuration',
      href: '/dashboard/admin/settings',
      icon: IconAdjustments,
      show: user?.role === 'SUPERADMIN',
    },
    {
      label: 'Invites',
      description: 'Create and manage invite codes',
      href: '/dashboard/admin/invites',
      icon: IconTags,
      show: config.invites.enabled,
    },
    {
      label: 'Theme Maker',
      description: 'Design custom themes with live preview',
      href: '/dashboard/admin/theme-maker',
      icon: IconBrush,
      show: true,
    },
  ];

  const phaseLinks = [
    {
      label: 'Troll',
      description: 'Disguised prank links with preset media',
      href: '/dashboard/admin/troll',
      icon: IconGhost2Filled,
      show: true,
    },
    {
      label: 'API Reference',
      description: 'Browse and test all API endpoints',
      href: '/dashboard/admin/api-docs',
      icon: IconApi,
      show: true,
    },
    {
      label: 'Login Customiser',
      description: 'Customise the login page appearance with live preview',
      href: '/dashboard/admin/login-customiser',
      icon: IconLogin2,
      show: user?.role === 'SUPERADMIN',
    },
  ];

  return (
    <>
      <Title order={1}>Administrator</Title>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing='md' my='md'>
        <Storage />
        <Version />
      </SimpleGrid>

      <LinksList links={adminLinks} />

      <Divider my='lg' />

      <Text fw={700} size='lg' mb='sm' style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <IconSparkles size='1.1rem' /> Phase
      </Text>
      <LinksList links={phaseLinks} />
    </>
  );
}
