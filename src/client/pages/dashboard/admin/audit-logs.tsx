/**
 * /dashboard/admin/audit-logs — paginated audit log viewer with filtering.
 */
import { fetchApi } from '@/lib/fetchApi';
import type { ApiAdminAuditLogsResponse } from '@/server/routes/api/admin/audit-logs';
import {
  Badge,
  Button,
  Container,
  Group,
  Loader,
  Pagination,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import '@mantine/dates/styles.css';
import { useDebouncedValue } from '@mantine/hooks';
import { IconCalendar, IconSearch, IconShieldCheck, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import useSWR from 'swr';

const PER_PAGE = 25;

const ACTION_COLORS: Record<string, string> = {
  'user.delete': 'red',
  'user.role_change': 'orange',
  'user.quota_change': 'yellow',
  'user.token_disable': 'grape',
  'user.token_enable': 'teal',
  'settings.update': 'blue',
  'file.delete': 'pink',
  'file.delete_bulk': 'pink',
  'invite.create': 'green',
  'invite.delete': 'red',
};

const TARGET_TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'user', label: 'User' },
  { value: 'file', label: 'File' },
  { value: 'settings', label: 'Settings' },
  { value: 'invite', label: 'Invite' },
  { value: 'url', label: 'URL' },
  { value: 'folder', label: 'Folder' },
];

export function Component() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);

  const [debouncedAction] = useDebouncedValue(actionFilter, 300);
  const [debouncedActor] = useDebouncedValue(actorFilter, 300);

  const hasFilters =
    debouncedAction || debouncedActor || targetTypeFilter || dateRange[0] || dateRange[1];

  const params = new URLSearchParams({
    page: String(page - 1),
    perpage: String(PER_PAGE),
    ...(debouncedAction ? { action: debouncedAction } : {}),
    ...(debouncedActor ? { actorId: debouncedActor } : {}),
    ...(targetTypeFilter ? { targetType: targetTypeFilter } : {}),
    ...(dateRange[0] ? { createdAfter: dateRange[0].toISOString() } : {}),
    ...(dateRange[1]
      ? { createdBefore: new Date(dateRange[1].getTime() + 86_400_000 - 1).toISOString() }
      : {}),
  });

  const { data, isLoading } = useSWR<ApiAdminAuditLogsResponse>(
    `/api/admin/audit-logs?${params}`,
    (url: string) => fetchApi(url).then((r) => r.data),
    { keepPreviousData: true },
  );

  const totalPages = Math.ceil((data?.total ?? 0) / PER_PAGE);

  const clearFilters = () => {
    setActionFilter('');
    setActorFilter('');
    setTargetTypeFilter('');
    setDateRange([null, null]);
    setPage(1);
  };

  return (
    <Container my='lg' size='xl'>
      <Group mb='md' justify='space-between' align='flex-start'>
        <Group gap='xs'>
          <IconShieldCheck size='1.4rem' />
          <Title order={2}>Audit Log</Title>
          {data && (
            <Badge variant='light' color='gray'>
              {data.total} entries
            </Badge>
          )}
        </Group>

        {hasFilters && (
          <Button
            size='xs'
            variant='subtle'
            color='gray'
            leftSection={<IconX size='0.75rem' />}
            onClick={clearFilters}
          >
            Clear filters
          </Button>
        )}
      </Group>

      {/* Filter bar */}
      <Stack gap='sm' mb='md'>
        <Group gap='sm' wrap='wrap'>
          <TextInput
            placeholder='Filter by action…'
            leftSection={<IconSearch size='1rem' />}
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.currentTarget.value);
              setPage(1);
            }}
            w={200}
            size='sm'
          />
          <TextInput
            placeholder='Filter by actor ID…'
            leftSection={<IconSearch size='1rem' />}
            value={actorFilter}
            onChange={(e) => {
              setActorFilter(e.currentTarget.value);
              setPage(1);
            }}
            w={200}
            size='sm'
          />
          <Select
            placeholder='Target type'
            data={TARGET_TYPE_OPTIONS}
            value={targetTypeFilter}
            onChange={(v) => {
              setTargetTypeFilter(v ?? '');
              setPage(1);
            }}
            w={150}
            size='sm'
            clearable
          />
          <DatePickerInput
            type='range'
            placeholder='Date range'
            leftSection={<IconCalendar size='1rem' />}
            value={dateRange}
            onChange={(range) => {
              setDateRange(range as [Date | null, Date | null]);
              setPage(1);
            }}
            clearable
            size='sm'
            w={240}
            valueFormat='MMM D, YYYY'
          />
        </Group>
      </Stack>

      {isLoading && !data ? (
        <Group justify='center' py='xl'>
          <Loader />
        </Group>
      ) : (
        <>
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Time</Table.Th>
                <Table.Th>Action</Table.Th>
                <Table.Th>Actor</Table.Th>
                <Table.Th>Target</Table.Th>
                <Table.Th>Details</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(data?.logs ?? []).map((log) => (
                <Table.Tr key={log.id}>
                  <Table.Td>
                    <Text size='xs' c='dimmed' style={{ whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={ACTION_COLORS[log.action] ?? 'gray'} variant='light' size='sm'>
                      {log.action}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size='sm'>{log.actorName ?? log.actorId ?? '—'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size='xs' c='dimmed'>
                      {log.targetType && (
                        <Badge size='xs' mr={4}>
                          {log.targetType}
                        </Badge>
                      )}
                      {log.targetId}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text
                      size='xs'
                      c='dimmed'
                      style={{ fontFamily: 'monospace', maxWidth: 300, wordBreak: 'break-all' }}
                    >
                      {JSON.stringify(log.meta)}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
              {(data?.logs ?? []).length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text ta='center' c='dimmed' py='md'>
                      No audit log entries found.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>

          {totalPages > 1 && (
            <Group justify='center' mt='md'>
              <Pagination total={totalPages} value={page} onChange={setPage} />
            </Group>
          )}
        </>
      )}
    </Container>
  );
}
