import { Button, Group, Stack, Text, ColorInput, NumberInput, Slider, ActionIcon } from '@mantine/core';
import { useRef, useState, useEffect } from 'react';
import { IconTrash, IconCheck } from '@tabler/icons-react';

export interface ImageEditorProps {
  file: File;
  onSave: (editedFile: File) => void;
  onCancel: () => void;
}

export default function ImageEditor({ file, onSave, onCancel }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [drawColor, setDrawColor] = useState('#ff0000');
  const [drawSize, setDrawSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState<'move' | 'draw'>('move');
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      imageRef.current = img;
      render();
    };
    img.src = URL.createObjectURL(file);
    return () => URL.revokeObjectURL(img.src);
  }, [file, scale, rotation, brightness, contrast]);

  const render = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.filter = 'none';
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current!.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current!.height / rect.height);

    if (mode === 'draw') {
      setIsDrawing(true);
      setLastPos({ x, y });
    } else if (isCropping) {
      setIsCropping(true);
      setCropStart({ x, y });
      setCropRect({ x, y, w: 0, h: 0 });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || mode !== 'draw' || !lastPos) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current!.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current!.height / rect.height);

    const ctx = canvasRef.current!.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawSize;
    ctx.lineCap = 'round';
    ctx.stroke();

    setLastPos({ x, y });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setLastPos(null);
  };

  const handleCropMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isCropping || !cropStart) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current!.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current!.height / rect.height);

    setCropRect({
      x: Math.min(cropStart.x, x),
      y: Math.min(cropStart.y, y),
      w: Math.abs(x - cropStart.x),
      h: Math.abs(y - cropStart.y),
    });
  };

  const handleCropMouseUp = () => {
    setIsCropping(false);
  };

  const applyCrop = () => {
    if (!cropRect || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
    canvas.width = cropRect.w;
    canvas.height = cropRect.h;
    ctx.putImageData(imageData, 0, 0);
    setCropRect(null);
    setIsCropping(false);
    setCropStart(null);
  };

  const resetEdits = () => {
    setScale(1);
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setDrawColor('#ff0000');
    setDrawSize(5);
    setMode('move');
    setCropRect(null);
    setIsCropping(false);
    render();
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, file.type || 'image/png');
    });

    if (!blob) return;

    const editedFile = new File([blob], file.name, { type: file.type });
    onSave(editedFile);
  };

  return (
    <Stack gap='sm'>
      <Text fw={700}>Quick Image Editor</Text>

      <canvas
        ref={canvasRef}
        style={{
          maxWidth: '100%',
          border: '1px solid var(--mantine-color-gray-3)',
          borderRadius: 8,
          cursor: mode === 'draw' ? 'crosshair' : 'default',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={(e) => {
          handleMouseMove(e);
          handleCropMouseMove(e);
        }}
        onMouseUp={() => {
          handleMouseUp();
          handleCropMouseUp();
        }}
        onMouseLeave={() => {
          handleMouseUp();
          handleCropMouseUp();
        }}
      />

      {isCropping && cropRect && (
        <Button size='xs' onClick={applyCrop} leftSection={<IconCheck size='1rem' />}>
          Apply Crop
        </Button>
      )}

      <Group gap='xs'>
        <Button
          size='xs'
          variant={mode === 'move' ? 'filled' : 'outline'}
          onClick={() => setMode('move')}
        >
          Move
        </Button>
        <Button
          size='xs'
          variant={mode === 'draw' ? 'filled' : 'outline'}
          onClick={() => setMode('draw')}
        >
          Draw
        </Button>
        <Button
          size='xs'
          variant={isCropping ? 'filled' : 'outline'}
          onClick={() => {
            setIsCropping(!isCropping);
            setMode('move');
          }}
        >
          Crop
        </Button>
        <ActionIcon size='sm' variant='subtle' color='red' onClick={resetEdits}>
          <IconTrash size='1rem' />
        </ActionIcon>
      </Group>

      {mode === 'draw' && (
        <Group gap='xs'>
          <ColorInput
            size='xs'
            label='Color'
            value={drawColor}
            onChange={setDrawColor}
            w={80}
          />
          <NumberInput
            size='xs'
            label='Size'
            min={1}
            max={50}
            value={drawSize}
            onChange={(v) => setDrawSize(Number(v))}
            w={80}
          />
        </Group>
      )}

      <Stack gap={2}>
        <Text size='xs' c='dimmed'>Brightness</Text>
        <Slider value={brightness} onChange={setBrightness} min={0} max={200} />
        <Text size='xs' c='dimmed'>Contrast</Text>
        <Slider value={contrast} onChange={setContrast} min={0} max={200} />
        <Text size='xs' c='dimmed'>Rotation</Text>
        <Slider value={rotation} onChange={setRotation} min={0} max={360} />
        <Text size='xs' c='dimmed'>Scale</Text>
        <Slider value={scale} onChange={setScale} min={0.1} max={3} step={0.1} />
      </Stack>

      <Group justify='right'>
        <Button variant='outline' onClick={onCancel}>
          Cancel
        </Button>
        <Button leftSection={<IconCheck size='1rem' />} onClick={handleSave}>
          Save Edit
        </Button>
      </Group>
    </Stack>
  );
}
