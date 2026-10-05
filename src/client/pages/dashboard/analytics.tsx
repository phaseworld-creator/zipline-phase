/**
 * /dashboard/analytics — per-user analytics: top files, download trend, storage growth, type breakdown.
 */
import { bytes } from '@/lib/bytes';
import { fetchApi } from '@/lib/fetchApi';
import {
  Badge,
  Box,
  Card,
  Container,
  Group,
  Loader,
  NumberFormatter,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { AreaChart, BarChart, DonutChart } from '@mantine/charts';
import { useState } from 'react';
import useSWR from 'swr';
import type { ApiUserAnalyticsResponse } from '@/server/routes/api/user/analytics';

const RANGE_OPTIONS = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '365', label: '1 year' },
];

export function Component() {
  const [days, setDays] = useState('30');

  const { data, isLoading } = useSWR<ApiUserAnalyticsResponse>(
    `/api/user/analytics?days=${days}`,
    (url: string) => fetchApi(url).then((r) => r.data),
    { keepPreviousData: true },
  );

  if (isLoading && !data) {
    return (
      <Container my='lg'>
        <Group justify='center' py='xl'>
          <Loader />
        </Group>
      </Container>
    );
  }

  const trendData = (data?.downloadTrend ?? []).map((d) => ({
    date: d.date,
    Downloads: d.count,
  }));

  const growthData = (data?.storageGrowth ?? []).map((d) => ({
    date: d.date,
    'Storage (MB)': +(d.bytes / 1024 / 1024).toFixed(2),
  }));

  const pieData = (data?.typeBreakdown ?? []).map((t, i) => ({
    name: t.type,
    value: t.count,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <Container my='lg' size='xl'>
      <Group justify='space-between' mb='lg'>
        <Title order={2}>My Analytics</Title>
        <Select
          value={days}
          onChange={(v) => setDays(v ?? '30')}
          data={RANGE_OPTIONS}
          w={130}
          size='sm'
        />
      </Group>

      {/* Summary cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb='lg'>
        <StatCard label='Files' value={data?.topFiles.length ?? 0} />
        <StatCard
          label='Total Downloads'
          value={data?.downloadTrend.reduce((a, d) => a + d.count, 0) ?? 0}
        />
        <StatCard
          label='Peak Day'
          value={
            data?.downloadTrend.length
              ? Math.max(...data.downloadTrend.map((d) => d.count))
              : 0
          }
          suffix='downloads'
        />
        <StatCard
          label='Storage'
          value={bytes(data?.storageGrowth?.at(-1)?.bytes ?? 0)}
          raw
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }} mb='lg'>
        {/* Download trend */}
        <Card withBorder p='md'>
          <Text fw={600} mb='sm'>
            Download Trend
          </Text>
          <BarChart
            h={200}
            data={trendData}
            dataKey='date'
            series={[{ name: 'Downloads', color: 'blue' }]}
            tickLine='y'
          />
        </Card>

        {/* Storage growth */}
        <Card withBorder p='md'>
          <Text fw={600} mb='sm'>
            Storage Growth
          </Text>
          <AreaChart
            h={200}
            data={growthData}
            dataKey='date'
            series={[{ name: 'Storage (MB)', color: 'teal' }]}
            curveType='monotone'
            tickLine='y'
          />
        </Card>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }} mb='lg'>
        {/* Type breakdown */}
        <Card withBorder p='md'>
          <Text fw={600} mb='sm'>
            File Type Breakdown
          </Text>
          {pieData.length > 0 ? (
            <Group>
              <DonutChart data={pieData} size={160} thickness={30} />
              <Stack gap={4}>
                {pieData.map((d) => (
                  <Group key={d.name} gap='xs'>
                    <Box w={12} h={12} style={{ background: d.color, borderRadius: 2 }} />
                    <Text size='sm'>{d.name}</Text>
                    <Badge size='xs' variant='light'>
                      {d.value}
                    </Badge>
                  </Group>
                ))}
              </Stack>
            </Group>
          ) : (
            <Text c='dimmed' size='sm'>
              No data
            </Text>
          )}
        </Card>

        {/* Top files */}
        <Card withBorder p='md'>
          <Text fw={600} mb='sm'>
            Top Files by Views
          </Text>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>File</Table.Th>
                <Table.Th>Views</Table.Th>
                <Table.Th>Size</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(data?.topFiles ?? []).slice(0, 8).map((f) => (
                <Table.Tr key={f.id}>
                  <Table.Td>
                    <Text size='sm' truncate maw={160}>
                      <a href={f.url} target='_blank' rel='noreferrer'>
                        {f.name}
                      </a>
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <NumberFormatter value={f.views} thousandSeparator />
                  </Table.Td>
                  <Table.Td>{bytes(f.size)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      </SimpleGrid>
    </Container>
  );
}

function StatCard({
  label,
  value,
  suffix,
  raw,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  raw?: boolean;
}) {
  return (
    <Paper withBorder p='md'>
      <Text size='xs' c='dimmed' tt='uppercase' fw={500}>
        {label}
      </Text>
      <Text fz='xl' fw={700} mt={4}>
        {raw ? value : typeof value === 'number' ? <NumberFormatter value={value} thousandSeparator /> : value}
        {suffix && (
          <Text span size='sm' c='dimmed' ml={4}>
            {suffix}
          </Text>
        )}
      </Text>
    </Paper>
  );
}

const CHART_COLORS = [
  'blue.6', 'teal.6', 'orange.6', 'grape.6', 'red.6',
  'cyan.6', 'lime.6', 'yellow.6', 'indigo.6', 'pink.6',
];
