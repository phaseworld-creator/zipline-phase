/**
 * /dashboard/admin/audit-logs — paginated audit log viewer for admins.
 */
import { fetchApi } from '@/lib/fetchApi';
import {
  Badge,
  Container,
  Group,
  Loader,
  Pagination,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch, IconShieldCheck } from '@tabler/icons-react';
import { useState } from 'react';
import useSWR from 'swr';
import type { ApiAdminAuditLogsResponse } from '@/server/routes/api/admin/audit-logs';

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

export function Component() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [debouncedAction] = useDebouncedValue(actionFilter, 300);

  const params = new URLSearchParams({
    page: String(page - 1),
    perpage: String(PER_PAGE),
    ...(debouncedAction ? { action: debouncedAction } : {}),
  });

  const { data, isLoading } = useSWR<ApiAdminAuditLogsResponse>(
    `/api/admin/audit-logs?${params}`,
    (url: string) => fetchApi(url).then((r) => r.data),
    { keepPreviousData: true },
  );

  const totalPages = Math.ceil((data?.total ?? 0) / PER_PAGE);

  return (
    <Container my='lg' size='xl'>
      <Group mb='lg' justify='space-between'>
        <Group gap='xs'>
          <IconShieldCheck size='1.4rem' />
          <Title order={2}>Audit Log</Title>
          {data && (
            <Badge variant='light' color='gray'>
              {data.total} entries
            </Badge>
          )}
        </Group>
        <TextInput
          placeholder='Filter by action…'
          leftSection={<IconSearch size='1rem' />}
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.currentTarget.value); setPage(1); }}
          w={220}
          size='sm'
        />
      </Group>

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
                    <Badge
                      color={ACTION_COLORS[log.action] ?? 'gray'}
                      variant='light'
                      size='sm'
                    >
                      {log.action}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size='sm'>{log.actorName ?? log.actorId ?? '—'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size='xs' c='dimmed'>
                      {log.targetType && <Badge size='xs' mr={4}>{log.targetType}</Badge>}
                      {log.targetId}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size='xs' c='dimmed' style={{ fontFamily: 'monospace', maxWidth: 300, wordBreak: 'break-all' }}>
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
