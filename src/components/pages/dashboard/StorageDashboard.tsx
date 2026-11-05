import { bytes } from '@/lib/bytes';
import { fetchApi } from '@/lib/fetchApi';
import type { ApiUserStatsResponse } from '@/server/routes/api/user/stats';
import { BarChart, DonutChart } from '@mantine/charts';
import {
  Badge,
  Box,
  Card,
  Container,
  Grid,
  Group,
  Progress,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import {
  IconDeviceSdCard,
  IconEyeFilled,
  IconFiles,
  IconLink,
} from '@tabler/icons-react';
import useSWR from 'swr';
import useUser from '@/lib/client/hooks/useUser';

const COLORS = [
  'blue', 'teal', 'grape', 'orange', 'pink',
  'cyan', 'lime', 'yellow', 'indigo', 'red',
];

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'blue',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <Card withBorder radius='md' p='md'>
      <Group justify='space-between' wrap='nowrap'>
        <Stack gap={2}>
          <Text size='xs' c='dimmed' tt='uppercase' fw={600} style={{ letterSpacing: '0.04em' }}>
            {label}
          </Text>
          <Text size='xl' fw={700}>
            {value}
          </Text>
          {sub && (
            <Text size='xs' c='dimmed'>
              {sub}
            </Text>
          )}
        </Stack>
        <Box
          style={{
            borderRadius: 8,
            padding: 8,
            background: `var(--mantine-color-${color}-light)`,
            color: `var(--mantine-color-${color}-light-color)`,
            flexShrink: 0,
          }}
        >
          <Icon size='1.4rem' />
        </Box>
      </Group>
    </Card>
  );
}

export default function StorageDashboard() {
  const { user } = useUser();

  const { data: stats, isLoading } = useSWR<ApiUserStatsResponse>(
    '/api/user/stats',
    (url: string) => fetchApi(url).then((r) => r.data),
  );

  // Quota calculations
  const quota = user?.quota;
  const hasStorageQuota = quota?.filesQuota === 'BY_BYTES' && quota?.maxBytes;
  const hasFileQuota = quota?.filesQuota === 'BY_FILES' && quota?.maxFiles;
  const hasUrlQuota = !!quota?.maxUrls;

  const maxBytesNum = hasStorageQuota
    ? bytes(quota!.maxBytes as string)
    : 0;
  const storagePercent =
    hasStorageQuota && maxBytesNum > 0
      ? Math.min(100, Math.round(((stats?.storageUsed ?? 0) / maxBytesNum) * 100))
      : null;

  const filePercent =
    hasFileQuota && quota!.maxFiles! > 0
      ? Math.min(100, Math.round(((stats?.filesUploaded ?? 0) / quota!.maxFiles!) * 100))
      : null;

  const urlPercent =
    hasUrlQuota && quota!.maxUrls! > 0
      ? Math.min(100, Math.round(((stats?.urlsCreated ?? 0) / quota!.maxUrls!) * 100))
      : null;

  // File type breakdown for donut chart
  const typeEntries = Object.entries(stats?.sortTypeCount ?? {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const donutData = typeEntries.map(([type, count], i) => ({
    name: type.split('/')[1] ?? type,
    value: count,
    color: COLORS[i % COLORS.length],
  }));

  // Bar chart — top 10 mime types by count
  const barData = typeEntries.map(([type, count]) => ({
    type: type.split('/')[1] ?? type,
    files: count,
  }));

  const quotaColor = (pct: number) =>
    pct >= 90 ? 'red' : pct >= 70 ? 'yellow' : 'teal';

  return (
    <Container my='lg' size='xl'>
      <Group mb='lg' gap='xs' align='center'>
        <IconDeviceSdCard size='1.4rem' />
        <Title order={2}>Storage</Title>
      </Group>

      {/* ── Stats ── */}
      {isLoading ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing='md' mb='lg'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={100} radius='md' />
          ))}
        </SimpleGrid>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing='md' mb='lg'>
          <StatCard
            icon={IconFiles}
            label='Files uploaded'
            value={stats?.filesUploaded ?? 0}
            sub={`${stats?.favoriteFiles ?? 0} favorited`}
            color='blue'
          />
          <StatCard
            icon={IconDeviceSdCard}
            label='Storage used'
            value={bytes(stats?.storageUsed ?? 0)}
            sub={`avg ${bytes(stats?.avgStorageUsed ?? 0)} / file`}
            color='grape'
          />
          <StatCard
            icon={IconEyeFilled}
            label='Total file views'
            value={stats?.views ?? 0}
            sub={`avg ${Math.round(stats?.avgViews ?? 0)} / file`}
            color='teal'
          />
          <StatCard
            icon={IconLink}
            label='Links created'
            value={stats?.urlsCreated ?? 0}
            sub={`${stats?.urlViews ?? 0} total views`}
            color='orange'
          />
        </SimpleGrid>
      )}

      {/* ── Quota bars ── */}
      {(storagePercent !== null || filePercent !== null || urlPercent !== null) && (
        <Card withBorder radius='md' p='md' mb='lg'>
          <Title order={4} mb='md'>
            Quota
          </Title>
          <Stack gap='sm'>
            {storagePercent !== null && (
              <Box>
                <Group justify='space-between' mb={4}>
                  <Text size='sm'>Storage</Text>
                  <Text size='sm' fw={600} c={quotaColor(storagePercent)}>
                    {bytes(stats?.storageUsed ?? 0)} / {quota!.maxBytes}
                  </Text>
                </Group>
                <Tooltip label={`${storagePercent}%`}>
                  <Progress
                    value={storagePercent}
                    color={quotaColor(storagePercent)}
                    size='md'
                    radius='xl'
                    animated={storagePercent >= 90}
                  />
                </Tooltip>
              </Box>
            )}
            {filePercent !== null && (
              <Box>
                <Group justify='space-between' mb={4}>
                  <Text size='sm'>Files</Text>
                  <Text size='sm' fw={600} c={quotaColor(filePercent)}>
                    {stats?.filesUploaded ?? 0} / {quota!.maxFiles}
                  </Text>
                </Group>
                <Tooltip label={`${filePercent}%`}>
                  <Progress
                    value={filePercent}
                    color={quotaColor(filePercent)}
                    size='md'
                    radius='xl'
                  />
                </Tooltip>
              </Box>
            )}
            {urlPercent !== null && (
              <Box>
                <Group justify='space-between' mb={4}>
                  <Text size='sm'>URLs</Text>
                  <Text size='sm' fw={600} c={quotaColor(urlPercent)}>
                    {stats?.urlsCreated ?? 0} / {quota!.maxUrls}
                  </Text>
                </Group>
                <Tooltip label={`${urlPercent}%`}>
                  <Progress
                    value={urlPercent}
                    color={quotaColor(urlPercent)}
                    size='md'
                    radius='xl'
                  />
                </Tooltip>
              </Box>
            )}
          </Stack>
        </Card>
      )}

      {/* ── Charts ── */}
      {!isLoading && donutData.length > 0 && (
        <Grid gap='md' mb='lg'>
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Card withBorder radius='md' p='md' h='100%'>
              <Title order={4} mb='md'>
                File types
              </Title>
              <Group justify='center'>
                <DonutChart
                  data={donutData}
                  size={180}
                  thickness={30}
                  tooltipDataSource='segment'
                  withLabelsLine
                  withLabels
                />
              </Group>
              <Stack gap={4} mt='md'>
                {donutData.map((d) => (
                  <Group key={d.name} gap='xs' justify='space-between'>
                    <Group gap='xs'>
                      <Box
                        w={10}
                        h={10}
                        style={{ borderRadius: 2, background: `var(--mantine-color-${d.color}-6)`, flexShrink: 0 }}
                      />
                      <Text size='xs'>{d.name}</Text>
                    </Group>
                    <Badge size='xs' variant='light'>
                      {d.value}
                    </Badge>
                  </Group>
                ))}
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 7 }}>
            <Card withBorder radius='md' p='md' h='100%'>
              <Title order={4} mb='md'>
                Files by type
              </Title>
              <BarChart
                h={280}
                data={barData}
                dataKey='type'
                series={[{ name: 'files', color: 'blue' }]}
                tickLine='y'
                gridAxis='y'
                barProps={{ radius: 4 }}
              />
            </Card>
          </Grid.Col>
        </Grid>
      )}

      {isLoading && (
        <Grid gap='md'>
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Skeleton height={340} radius='md' />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Skeleton height={340} radius='md' />
          </Grid.Col>
        </Grid>
      )}

      {!isLoading && donutData.length === 0 && (
        <Card withBorder radius='md' p='xl'>
          <Text c='dimmed' ta='center'>
            No files uploaded yet. Charts will appear once you start uploading.
          </Text>
        </Card>
      )}
    </Container>
  );
}
