import { useApiPagination } from '@/components/pages/files/useApiPagination';
import { type Response } from '@/lib/api/response';
import { useTitle } from '@/lib/client/hooks/useTitle';
import { useFileNavStore } from '@/lib/client/store/fileNav';
import { Folder } from '@/lib/db/models/folder';
import { FolderBreadcrumb } from '@/lib/folderHierarchy';
import {
  ActionIcon,
  Anchor,
  Box,
  Breadcrumbs,
  Button,
  Card,
  Container,
  Group,
  Pagination,
  Paper,
  PasswordInput,
  Progress,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { notifications } from '@mantine/notifications';
import { IconFolder, IconLock, IconUpload, IconX } from '@tabler/icons-react';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, Params, useLoaderData, useNavigate, useSearchParams } from 'react-router-dom';
import { useShallow } from 'zustand/shallow';
import { useQueryState, parseAsInteger } from 'nuqs';

const DashboardFile = lazy(() => import('@/components/file/DashboardFile'));
const DashboardFileModal = lazy(() => import('@/components/file/DashboardFile/DashboardFileModal'));

export async function loader({ params, request }: { params: Params<string>; request: Request }) {
  const url = new URL(request.url);
  const page = url.searchParams.get('page') ?? '1';
  const perpage = url.searchParams.get('perpage') ?? '15';
  const token = url.searchParams.get('token') ?? '';

  const res = await fetch(
    `/api/server/folder/${params.id}?page=${encodeURIComponent(page)}&perpage=${encodeURIComponent(perpage)}${token ? `&token=${encodeURIComponent(token)}` : ''}`,
  );
  if (!res.ok) {
    throw new Response('Folder not found', { status: 404 });
  }
  return {
    initial: (await res.json()) as Response['/api/server/folder/[id]'] & { passwordRequired?: boolean },
    folderId: params.id!,
    token,
  };
}

function PublicFolderCard({ folder }: { folder: Partial<Folder> }) {
  return (
    <Link to={`/folder/${folder.id}`} style={{ textDecoration: 'none' }}>
      <Card withBorder shadow='sm' style={{ cursor: 'pointer' }}>
        <Card.Section withBorder inheritPadding py='xs'>
          <Group gap='xs'>
            <IconFolder size='1.2rem' />
            <Text fw={500}>{folder.name}</Text>
          </Group>
        </Card.Section>
        <Card.Section inheritPadding py='xs'>
          <Stack gap={2}>
            <Text size='xs' c='dimmed'>
              {folder._count?.files ?? 0} files
            </Text>
            {(folder._count?.children ?? 0) > 0 && (
              <Text size='xs' c='dimmed'>
                {folder._count?.children} subfolders
              </Text>
            )}
          </Stack>
        </Card.Section>
      </Card>
    </Link>
  );
}

const PER_PAGE_OPTIONS = [9, 12, 15, 30, 45];

export function Component() {
  const { initial, folderId, token } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perpage] = useQueryState('perpage', parseAsInteger.withDefault(15));

  // Password gate state — always declared regardless of passwordRequired
  const [pwValue, setPwValue] = useState('');
  const [pwError, setPwError] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  const passwordRequired = !!(initial as any).passwordRequired;

  const { data, isLoading } = useApiPagination<Response['/api/server/folder/[id]']>(
    {
      route: `/api/server/folder/${initial.folder.id}`,
      page,
      perpage,
      sort: 'createdAt',
      order: 'desc',
      ...(token ? { token } : {}),
    },
    {
      fallbackData: passwordRequired ? undefined : initial,
      keepPreviousData: true,
      revalidateOnFocus: false,
    },
  );

  const folder = data?.folder ?? initial.folder;
  const files = data?.page ?? [];
  const totalRecords = data?.total ?? 0;
  const cachedPages = data?.pages ?? 0;

  useTitle(folder.name ?? 'Folder');

  const buildBreadcrumbs = () => {
    const items: FolderBreadcrumb[] = [];
    let current = folder.parent as Partial<Folder> | undefined;
    while (current && current.public) {
      items.unshift({ id: current.id!, name: current.name!, public: true });
      current = current.parent as Partial<Folder> | undefined;
    }
    items.push({ id: folder.id!, name: folder.name!, public: true });
    return items;
  };

  const breadcrumbs = buildBreadcrumbs();
  const children = (folder.children ?? []) as Partial<Folder>[];
  const from = totalRecords === 0 ? 0 : (page - 1) * perpage + 1;
  const to = Math.min(page * perpage, totalRecords);

  const [current, setCurrent, setFiles] = useFileNavStore(
    useShallow((state) => [state.current, state.setCurrent, state.setFiles]),
  );
  const currentFile = current ? (files.find((file) => file.id === current) ?? null) : null;
  const ids = useMemo(() => files.map((file) => file.id), [files]);

  useEffect(() => {
    setFiles(ids);
  }, [ids]);

  // Render password gate after all hooks
  if (passwordRequired) {
    return (
      <Container size='xs' my='xl'>
        <Stack align='center' gap='md'>
          <IconLock size='2.5rem' />
          <Title order={3}>Password required</Title>
          <Text c='dimmed' ta='center'>
            This folder is password protected.
          </Text>
          <Box w='100%'>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setUnlocking(true);
                setPwError('');
                try {
                  const res = await fetch(`/api/server/folder/${folderId}/password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: pwValue }),
                  });
                  if (res.ok) {
                    const { token: t } = await res.json();
                    navigate(`/folder/${folderId}?token=${encodeURIComponent(t)}`, { replace: true });
                  } else {
                    setPwError('Incorrect password');
                  }
                } finally {
                  setUnlocking(false);
                }
              }}
            >
              <PasswordInput
                placeholder='Enter password'
                value={pwValue}
                onChange={(e) => setPwValue(e.currentTarget.value)}
                error={pwError}
                mb='sm'
              />
              <Button fullWidth type='submit' loading={unlocking} disabled={!pwValue.trim()}>
                Unlock
              </Button>
            </form>
          </Box>
        </Stack>
      </Container>
    );
  }

  return (
    <>
      <Container my='lg'>
        <DashboardFileModal
          open={!!currentFile}
          setOpen={(open) => setCurrent(open ? (currentFile?.id ?? null) : null)}
          file={currentFile}
          reduce
          sequenced
        />

        {breadcrumbs.length > 1 && (
          <Breadcrumbs mb='md'>
            {breadcrumbs.map((item, index) => (
              <Anchor
                key={item.id}
                onClick={() => navigate(`/folder/${item.id}`)}
                style={{ cursor: 'pointer' }}
                fw={index === breadcrumbs.length - 1 ? 600 : 400}
              >
                {item.name}
              </Anchor>
            ))}
          </Breadcrumbs>
        )}

        <Group>
          <Title order={1}>{folder.name}</Title>

          {folder.allowUploads && (
            <Link to={`/folder/${folder.id}/upload`} reloadDocument>
              <ActionIcon variant='outline'>
                <IconUpload size='1rem' />
              </ActionIcon>
            </Link>
          )}
        </Group>

        {folder.allowUploads && (
          <FolderDropzone folderId={folder.id!} onUploaded={() => setPage(1)} />
        )}

        {children.length > 0 && (
          <>
            <Title order={3} mt='md' mb='sm'>
              Subfolders
            </Title>
            <SimpleGrid
              cols={{
                base: 1,
                lg: 4,
                md: 3,
                sm: 2,
              }}
              spacing='md'
            >
              {children.map((child) => (
                <PublicFolderCard key={child.id} folder={child} />
              ))}
            </SimpleGrid>
          </>
        )}

        {(files.length ?? 0) > 0 && (
          <>
            <Title order={3} mt='md' mb='sm'>
              Files
            </Title>
            <SimpleGrid
              cols={{
                base: 1,
                lg: 3,
                md: 2,
              }}
              spacing='md'
            >
              {files.map((file: any) => (
                <Suspense fallback={<Skeleton height={350} animate />} key={file.id}>
                  <DashboardFile file={file} reduce onOpen={(fileId) => setCurrent(fileId)} />
                </Suspense>
              ))}
            </SimpleGrid>
          </>
        )}

        {children.length === 0 && totalRecords === 0 && (
          <Text c='dimmed' mt='md'>
            This folder is empty.
          </Text>
        )}

        <Group justify='space-between' align='center' mt='md'>
          <Text size='sm'>{`${from} - ${to} / ${totalRecords} files`}</Text>

          <Group gap='sm'>
            <Select
              value={perpage.toString()}
              data={PER_PAGE_OPTIONS.map((val) => ({ value: val.toString(), label: `${val}` }))}
              onChange={(value) => {
                setSearchParams((prev) => {
                  prev.set('perpage', value ?? '15');
                  prev.set('page', '1');
                  return prev;
                });
              }}
              w={80}
              size='xs'
              variant='filled'
              disabled={isLoading}
            />

            <Pagination
              value={page}
              onChange={setPage}
              total={cachedPages}
              size='sm'
              withControls
              withEdges
              disabled={isLoading}
            />
          </Group>
        </Group>
      </Container>
    </>
  );
}

Component.displayName = 'ViewFolderId';

function FolderDropzone({ folderId, onUploaded }: { folderId: string; onUploaded: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    setProgress(0);

    const body = new FormData();
    for (const f of files) body.append('file', f);

    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          notifications.show({
            title: 'Uploaded',
            message: `${files.length} file${files.length === 1 ? '' : 's'} uploaded successfully`,
            color: 'teal',
          });
          onUploaded();
        } else {
          notifications.show({
            title: 'Upload failed',
            message: `Server returned ${xhr.status}`,
            color: 'red',
          });
        }
        resolve();
      };
      xhr.onerror = () => {
        notifications.show({ title: 'Upload failed', message: 'Network error', color: 'red' });
        resolve();
      };
      xhr.open('POST', '/api/upload');
      xhr.setRequestHeader('x-zipline-folder', folderId);
      xhr.send(body);
    });

    setUploading(false);
    setProgress(0);
  };

  return (
    <Paper withBorder radius='md' mt='sm' mb='md'>
      <Dropzone onDrop={upload} loading={uploading} p='md' radius='md'>
        <Group justify='center' gap='xs' style={{ minHeight: 60, pointerEvents: 'none' }}>
          <Dropzone.Accept>
            <IconUpload size='1.5rem' color='var(--mantine-color-blue-6)' />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX size='1.5rem' color='var(--mantine-color-red-6)' />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconUpload size='1.5rem' color='var(--mantine-color-dimmed)' />
          </Dropzone.Idle>
          <Text size='sm' c='dimmed'>
            Drop files here or click to upload
          </Text>
        </Group>
      </Dropzone>
      {uploading && <Progress value={progress} size='xs' radius={0} animated />}
    </Paper>
  );
}
