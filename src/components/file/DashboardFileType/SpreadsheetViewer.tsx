import { Box, Paper, Stack, Table, Text } from '@mantine/core';
import { useEffect, useState } from 'react';

interface SpreadsheetViewerProps {
  fileUrl: string;
}

export default function SpreadsheetViewer({ fileUrl }: SpreadsheetViewerProps) {
  const [tables, setTables] = useState<Array<{ name: string; headers: string[]; rows: string[][] }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSpreadsheet() {
      try {
        setLoading(true);
        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error('Failed to fetch spreadsheet');

        const buffer = await res.arrayBuffer();
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });

        const sheets: Array<{ name: string; headers: string[]; rows: string[][] }> = [];
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
          if (json.length === 0) continue;

          const headers = (json[0] as string[]) || [];
          const rows = json.slice(1).map((row) => row.map((cell) => String(cell ?? '')));
          sheets.push({ name: sheetName, headers, rows });
        }

        setTables(sheets);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }

    loadSpreadsheet();
  }, [fileUrl]);

  if (loading) {
    return (
      <Box style={{ height: '100%', width: '100%' }}>
        <Stack align='center' justify='center' style={{ height: '100%' }}>
          <Text size='sm' c='dimmed'>
            Loading spreadsheet...
          </Text>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box style={{ height: '100%', width: '100%' }}>
        <Stack align='center' justify='center' style={{ height: '100%' }}>
          <Text size='sm' c='red'>
            Failed to load spreadsheet: {error}
          </Text>
        </Stack>
      </Box>
    );
  }

  if (tables.length === 0) {
    return (
      <Box style={{ height: '100%', width: '100%' }}>
        <Stack align='center' justify='center' style={{ height: '100%' }}>
          <Text size='sm' c='dimmed'>
            No data found in spreadsheet
          </Text>
        </Stack>
      </Box>
    );
  }

  return (
    <Paper withBorder p='xs' style={{ height: '100%', width: '100%', overflow: 'auto' }}>
      <Stack gap='xs' style={{ width: '100%' }}>
        {tables.map((table) => (
          <Stack key={table.name} gap='xs'>
            <Text fw={700} size='sm' c='dimmed'>
              {table.name}
            </Text>
            <Table striped highlightOnHover style={{ width: '100%', minWidth: '600px' }}>
              <thead>
                <tr>
                  {table.headers.map((h, hi) => (
                    <th key={hi}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}
