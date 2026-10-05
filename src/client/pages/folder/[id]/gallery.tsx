/**
 * /folder/:id/gallery — public image gallery / slideshow view for a folder.
 */
import { type Response } from '@/lib/api/response';
import { useTitle } from '@/lib/client/hooks/useTitle';
import {
  ActionIcon,
  Box,
  Button,
  Container,
  Group,
  Image,
  Modal,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconArrowLeft,
  IconArrowRight,
  IconDownload,
  IconGridDots,
  IconSlideshow,
  IconX,
} from '@tabler/icons-react';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Params, useLoaderData } from 'react-router-dom';
import useSWR from 'swr';

export async function loader({ params, request }: { params: Params<string>; request: Request }) {
  const url = new URL(request.url);
  const page = url.searchParams.get('page') ?? '1';

  const res = await fetch(
    `/api/server/folder/${params.id}?page=${page}&perpage=60`,
  );
  if (!res.ok) throw new Response('Folder not found', { status: 404 });
  return {
    folderId: params.id!,
    initial: (await res.json()) as Response['/api/server/folder/[id]'],
  };
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/svg+xml'];

export function Component() {
  const { folderId, initial } = useLoaderData<typeof loader>();
  const [page] = useQueryState('page', parseAsInteger.withDefault(1));

  const { data, isLoading } = useSWR<Response['/api/server/folder/[id]']>(
    `/api/server/folder/${folderId}?page=${page}&perpage=60`,
    (url: string) => fetch(url).then((r) => r.json()),
    { fallbackData: initial },
  );

  const folder = data?.folder ?? initial.folder;
  const allFiles = data?.page ?? [];
  const imageFiles = allFiles.filter((f) => IMAGE_TYPES.includes(f.type));

  useTitle(`${folder.name ?? 'Gallery'} — Gallery`);

  const [lightboxOpen, { open: openLightbox, close: closeLightbox }] = useDisclosure(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [slideshowActive, setSlideshowActive] = useState(false);
  const slideshowRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentImage = imageFiles[currentIdx];

  const prev = useCallback(() => {
    setCurrentIdx((i) => (i - 1 + imageFiles.length) % imageFiles.length);
  }, [imageFiles.length]);

  const next = useCallback(() => {
    setCurrentIdx((i) => (i + 1) % imageFiles.length);
  }, [imageFiles.length]);

  // Slideshow auto-advance every 4 seconds
  useEffect(() => {
    if (slideshowActive) {
      slideshowRef.current = setInterval(next, 4000);
    } else {
      if (slideshowRef.current) clearInterval(slideshowRef.current);
    }
    return () => {
      if (slideshowRef.current) clearInterval(slideshowRef.current);
    };
  }, [slideshowActive, next]);

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen, prev, next, closeLightbox]);

  const openAt = (idx: number) => {
    setCurrentIdx(idx);
    openLightbox();
  };

  return (
    <Container my='lg'>
      <Group justify='space-between' mb='md'>
        <Stack gap={2}>
          <Title order={2}>{folder.name ?? 'Gallery'}</Title>
          <Text c='dimmed' size='sm'>
            {imageFiles.length} image{imageFiles.length !== 1 ? 's' : ''}
          </Text>
        </Stack>
        <Group gap='xs'>
          <Tooltip label='Grid view'>
            <ActionIcon
              variant='light'
              component={Link}
              to={`/folder/${folderId}`}
            >
              <IconGridDots size='1rem' />
            </ActionIcon>
          </Tooltip>
          <Button
            leftSection={<IconSlideshow size='1rem' />}
            variant={slideshowActive ? 'filled' : 'light'}
            onClick={() => {
              if (!lightboxOpen) openAt(0);
              setSlideshowActive((s) => !s);
            }}
            size='xs'
          >
            {slideshowActive ? 'Stop' : 'Slideshow'}
          </Button>
        </Group>
      </Group>

      {isLoading ? (
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing='sm'>
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} height={180} radius='md' />
          ))}
        </SimpleGrid>
      ) : imageFiles.length === 0 ? (
        <Text c='dimmed' ta='center' py='xl'>
          No images in this folder.
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing='sm'>
          {imageFiles.map((file, idx) => (
            <Box
              key={file.id}
              style={{ cursor: 'pointer', borderRadius: 8, overflow: 'hidden', position: 'relative' }}
              onClick={() => openAt(idx)}
            >
              <Image
                src={file.url}
                alt={file.originalName ?? file.name}
                height={180}
                fit='cover'
                radius='md'
              />
            </Box>
          ))}
        </SimpleGrid>
      )}

      {/* Lightbox */}
      <Modal
        opened={lightboxOpen}
        onClose={() => {
          setSlideshowActive(false);
          closeLightbox();
        }}
        size='xl'
        withCloseButton={false}
        padding={0}
        centered
        overlayProps={{ blur: 4 }}
      >
        <Box pos='relative'>
          <Group justify='space-between' p='xs' style={{ background: 'rgba(0,0,0,0.6)', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
            <Text c='white' size='sm' truncate style={{ maxWidth: '60%' }}>
              {currentImage?.originalName ?? currentImage?.name}
              {'  '}
              <Text span c='dimmed' size='xs'>
                ({currentIdx + 1} / {imageFiles.length})
              </Text>
            </Text>
            <Group gap='xs'>
              {currentImage && (
                <Tooltip label='Download'>
                  <ActionIcon
                    variant='subtle'
                    color='white'
                    component='a'
                    href={`${currentImage.url}?download=1`}
                    download
                  >
                    <IconDownload size='1rem' />
                  </ActionIcon>
                </Tooltip>
              )}
              <ActionIcon variant='subtle' color='white' onClick={() => { setSlideshowActive(false); closeLightbox(); }}>
                <IconX size='1rem' />
              </ActionIcon>
            </Group>
          </Group>

          <Image
            src={currentImage?.url}
            alt={currentImage?.name}
            fit='contain'
            height={500}
            style={{ background: '#000' }}
          />

          <Group justify='space-between' p='xs' style={{ background: 'rgba(0,0,0,0.6)', position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10 }}>
            <ActionIcon variant='subtle' color='white' onClick={prev} disabled={imageFiles.length <= 1}>
              <IconArrowLeft size='1.2rem' />
            </ActionIcon>
            <ActionIcon
              variant={slideshowActive ? 'filled' : 'subtle'}
              color='white'
              onClick={() => setSlideshowActive((s) => !s)}
            >
              <IconSlideshow size='1rem' />
            </ActionIcon>
            <ActionIcon variant='subtle' color='white' onClick={next} disabled={imageFiles.length <= 1}>
              <IconArrowRight size='1.2rem' />
            </ActionIcon>
          </Group>
        </Box>
      </Modal>
    </Container>
  );
}
