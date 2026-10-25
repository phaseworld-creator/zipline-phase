import { buildDiscordComponentEmbed } from '@/lib/discord/component-embed';
import { Box, Group, Text } from '@mantine/core';
import React, { useMemo } from 'react';
import type { BuiltChild, BuiltButton } from '@/lib/discord/component-embed';

function EmojiSpan({ emoji }: { emoji?: BuiltButton['emoji'] }) {
  if (!emoji?.name) return null;
  return <span style={{ marginRight: 4 }}>{emoji.name}</span>;
}

function DiscordButton({ button }: { button: BuiltButton }) {
  const label = button.label ?? button.url;

  return (
    <a
      href={button.url}
      target='_blank'
      rel='noopener norereact'
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '8px 16px',
        borderRadius: 4,
        background: '#7289da',
        color: '#fff',
        fontSize: 14,
        fontWeight: 500,
        textDecoration: 'none',
        ...(button.disabled ? { opacity: 0.5, pointerEvents: 'none' } : {}),
      }}
    >
      <EmojiSpan emoji={button.emoji} />
      {label}
    </a>
  );
}

function TextDisplay({ content }: { content: string }) {
  const cleanContent = content
    .replace(/^#+\s*/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1');
  return (
    <Text size='sm' c='dimmed' style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {cleanContent}
    </Text>
  );
}

function Section({ section }: { section: Extract<BuiltChild, { type: 9 }> }) {
  const texts = section.components.map((t, i) => <TextDisplay key={t.id ?? i} content={t.content} />);

  let accessory: React.ReactNode = null;
  if (section.accessory.type === 2) {
    accessory = (
      <Box
        style={{ flexShrink: 0, width: 80, height: 80, borderRadius: 8, overflow: 'hidden', marginLeft: 16 }}
      >
        <DiscordButton button={section.accessory as BuiltButton & { disabled?: boolean }} />
      </Box>
    );
  } else if (section.accessory.type === 11) {
    accessory = (
      <Box
        style={{
          flexShrink: 0,
          width: 80,
          height: 80,
          borderRadius: 8,
          marginLeft: 16,
          backgroundImage: `url('${section.accessory.media.url}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          ...(section.accessory.spoiler ? { filter: 'blur(10px)' } : {}),
        }}
        title={section.accessory.description}
      />
    );
  }

  return (
    <Group align='flex-start' gap={0} style={{ flexWrap: 'nowrap', minWidth: 0 }}>
      <Box style={{ flex: 1, minWidth: 0 }}>{texts}</Box>
      {accessory}
    </Group>
  );
}

function MediaGallery({ gallery }: { gallery: Extract<BuiltChild, { type: 12 }> }) {
  return (
    <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
      {gallery.items.map((item, i) => (
        <Box key={i} style={{ borderRadius: 8, overflow: 'hidden', position: 'relative', aspectRatio: 1 }}>
          <img
            src={item.media.url}
            alt=''
            loading='lazy'
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              ...(item.spoiler ? { filter: 'blur(10px)' } : {}),
            }}
          />
          {item.description && (
            <Box
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                color: '#fff',
                padding: '8px 6px 4px',
                fontSize: 12,
              }}
            >
              {item.description}
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
}

function ActionRow({ row }: { row: Extract<BuiltChild, { type: 1 }> }) {
  return (
    <Group gap='xs' style={{ flexWrap: 'wrap' }}>
      {row.components.map((button, i) => (
        <DiscordButton key={button.id ?? i} button={button} />
      ))}
    </Group>
  );
}

function Separator() {
  return <Box component='hr' style={{ border: 'none', borderTop: '1px solid #4f545c', margin: '16px 0' }} />;
}

export default function ComponentEmbedView({ config, parseValue }: { config: unknown; parseValue?: any }) {
  const built = useMemo(() => {
    if (!config) return null;
    return buildDiscordComponentEmbed(config, parseValue ?? {});
  }, [config, parseValue]);

  if (!built) return null;

  return (
    <Box style={{ maxWidth: 720, margin: '16px 0' }}>
      {built.map((child, i) => {
        switch (child.type) {
          case 1:
            return <ActionRow key={child.id ?? i} row={child} />;
          case 10:
            return <TextDisplay key={child.id ?? i} content={child.content} />;
          case 9:
            return <Section key={child.id ?? i} section={child} />;
          case 12:
            return <MediaGallery key={child.id ?? i} gallery={child} />;
          case 14:
            return <Separator key={child.id ?? i} />;
          default:
            return null;
        }
      })}
    </Box>
  );
}
