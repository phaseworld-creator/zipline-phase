import type { Response } from '@/lib/api/response';
import {
  Button,
  Divider,
  LoadingOverlay,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { settingsOnSubmit } from '../settingsOnSubmit';
import useServerSettings from '../useServerSettings';

export default function Features() {
  const { data, isLoading } = useServerSettings();

  return (
    <>
      <LoadingOverlay visible={isLoading} />
      {data ? <Form data={data} isLoading={isLoading} /> : null}
    </>
  );
}

function Form({ data, isLoading }: { data: Response['/api/server/settings']; isLoading: boolean }) {
  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      featuresImageCompression: data.settings.featuresImageCompression,
      featuresRobotsTxt: data.settings.featuresRobotsTxt,
      featuresHealthcheck: data.settings.featuresHealthcheck,
      featuresUserRegistration: data.settings.featuresUserRegistration,
      featuresOauthRegistration: data.settings.featuresOauthRegistration,
      featuresDeleteOnMaxViews: data.settings.featuresDeleteOnMaxViews,
      featuresPublicUploadPortal: data.settings.featuresPublicUploadPortal,
      featuresOneTimeShareLinks: data.settings.featuresOneTimeShareLinks,
      featuresSoundboard: data.settings.featuresSoundboard,
      featuresAdvancedAnalytics: data.settings.featuresAdvancedAnalytics,

      featuresThumbnailsEnabled: data.settings.featuresThumbnailsEnabled,
      featuresThumbnailsNumberThreads: data.settings.featuresThumbnailsNumberThreads,
      featuresThumbnailsFormat: data.settings.featuresThumbnailsFormat,
      featuresThumbnailsInstantaneous: data.settings.featuresThumbnailsInstantaneous,

      featuresMetricsEnabled: data.settings.featuresMetricsEnabled,
      featuresMetricsAdminOnly: data.settings.featuresMetricsAdminOnly,
      featuresMetricsShowUserSpecific: data.settings.featuresMetricsShowUserSpecific,

      featuresVersionChecking: data.settings.featuresVersionChecking,

      featuresWatermarkEnabled: data.settings.featuresWatermarkEnabled,
      featuresWatermarkText: data.settings.featuresWatermarkText,
      featuresWatermarkImage: data.settings.featuresWatermarkImage,
      featuresWatermarkPosition: data.settings.featuresWatermarkPosition,
      featuresWatermarkOpacity: data.settings.featuresWatermarkOpacity,
    },
    enhanceGetInputProps: (payload) => ({
      disabled: data.tampered.includes(payload.field) || false,
    }),
  });

  const onSubmit = settingsOnSubmit(navigate, form);

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack gap='lg'>
        <Switch
          label='Image Compression'
          description='Allows the ability for users to compress images.'
          {...form.getInputProps('featuresImageCompression', { type: 'checkbox' })}
        />

        <Switch
          label='/robots.txt'
          description='Enables a /robots.txt to stop search crawlers. Requires a server restart.'
          {...form.getInputProps('featuresRobotsTxt', { type: 'checkbox' })}
        />

        <Switch
          label='Healthcheck'
          description='Enables a healthcheck route for uptime monitoring. Requires a server restart.'
          {...form.getInputProps('featuresHealthcheck', { type: 'checkbox' })}
        />

        <Switch
          label='User Registration'
          description='Allows users to register an account on the server.'
          {...form.getInputProps('featuresUserRegistration', { type: 'checkbox' })}
        />

        <Switch
          label='OAuth Registration'
          description='Allows users to register an account using OAuth providers.'
          {...form.getInputProps('featuresOauthRegistration', { type: 'checkbox' })}
        />

        <Switch
          label='Delete on Max Views'
          description='Automatically deletes files/urls after they reach the maximum view count. Requires a server restart.'
          {...form.getInputProps('featuresDeleteOnMaxViews', { type: 'checkbox' })}
        />

        <Switch
          label='Enable Metrics'
          description='Enables metrics for the server. Requires a server restart.'
          {...form.getInputProps('featuresMetricsEnabled', { type: 'checkbox' })}
        />

        <Switch
          label='Admin Only Metrics'
          description='Requires an administrator to view metrics.'
          {...form.getInputProps('featuresMetricsAdminOnly', { type: 'checkbox' })}
        />

        <Switch
          label='Show User Specific Metrics'
          description='Shows metrics specific to each user, for all users.'
          {...form.getInputProps('featuresMetricsShowUserSpecific', { type: 'checkbox' })}
        />

        <Switch
          label='Public Upload Portal'
          description='Allow unauthenticated uploads via a public community portal. Disabled by default for security.'
          {...form.getInputProps('featuresPublicUploadPortal', { type: 'checkbox' })}
        />

        <Switch
          label='One-Time Share Links'
          description='Allow users to create links that self-destruct after a single view.'
          {...form.getInputProps('featuresOneTimeShareLinks', { type: 'checkbox' })}
        />

        <Switch
          label='Soundboard'
          description='Enable audio prank links in the troll system.'
          {...form.getInputProps('featuresSoundboard', { type: 'checkbox' })}
        />

        <Switch
          label='Advanced Analytics'
          description='Enable expanded analytics with bandwidth and type breakdown charts.'
          {...form.getInputProps('featuresAdvancedAnalytics', { type: 'checkbox' })}
        />

        <Divider label='Watermark' />

        <Switch
          label='Enable Watermark'
          description='Automatically overlay a watermark on uploaded images.'
          {...form.getInputProps('featuresWatermarkEnabled', { type: 'checkbox' })}
        />

        <TextInput
          label='Watermark Text'
          description='Text to overlay on images. Leave blank to use image watermark.'
          placeholder='Zipline'
          {...form.getInputProps('featuresWatermarkText')}
        />

        <TextInput
          label='Watermark Image Path'
          description='Absolute path to a watermark image file.'
          placeholder='/path/to/watermark.png'
          {...form.getInputProps('featuresWatermarkImage')}
        />

        <Select
          label='Watermark Position'
          description='Where to place the watermark on the image.'
          data={[
            { value: 'center', label: 'Center' },
            { value: 'top-left', label: 'Top Left' },
            { value: 'top-right', label: 'Top Right' },
            { value: 'bottom-left', label: 'Bottom Left' },
            { value: 'bottom-right', label: 'Bottom Right' },
            { value: 'tile', label: 'Tile' },
          ]}
          {...form.getInputProps('featuresWatermarkPosition')}
        />

        <NumberInput
          label='Watermark Opacity'
          description='Opacity percentage (0-100) for the watermark.'
          min={0}
          max={100}
          {...form.getInputProps('featuresWatermarkOpacity')}
        />

        <Divider label='Thumbnails' />

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing='lg'>
          <Switch
            label='Enable Thumbnails'
            description='Enables thumbnail generation for images. Requires a server restart.'
            {...form.getInputProps('featuresThumbnailsEnabled', { type: 'checkbox' })}
          />
          <Switch
            label='Instantaneous Thumbnails'
            description='Generates thumbnails immediately after a file is uploaded, instead of waiting for the task to run.'
            {...form.getInputProps('featuresThumbnailsInstantaneous', { type: 'checkbox' })}
          />
        </SimpleGrid>

        <NumberInput
          label='Thumbnails Number Threads'
          description='Number of threads to use for thumbnail generation, usually the number of CPU threads. Requires a server restart.'
          placeholder='Enter a number...'
          min={1}
          max={16}
          {...form.getInputProps('featuresThumbnailsNumberThreads')}
        />

        <Select
          label='Thumbnails Format'
          description='The output format for thumbnails. Requires a server restart.'
          data={[
            { value: 'jpg', label: '.jpg' },
            { value: 'png', label: '.png' },
            { value: 'webp', label: '.webp' },
          ]}
          {...form.getInputProps('featuresThumbnailsFormat')}
        />

        <Divider label='Version Checking' />

        <Switch
          label='Version Checking'
          description='Query GitHub for updates and display the status on the sidebar to all users.'
          {...form.getInputProps('featuresVersionChecking', { type: 'checkbox' })}
        />
      </Stack>

      <Button type='submit' mt='md' loading={isLoading} leftSection={<IconDeviceFloppy size='1rem' />}>
        Save
      </Button>
    </form>
  );
}
