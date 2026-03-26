import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRollScan } from './useRollScan';

// ─── Service mock ────────────────────────────────────────────

const mockUploadRollPhoto = vi.fn();
const mockExtractRollData = vi.fn();
const mockFileToBase64 = vi.fn();

vi.mock('../services/rollService', () => ({
  uploadRollPhoto: (...args: unknown[]) => mockUploadRollPhoto(...args),
  extractRollData: (...args: unknown[]) => mockExtractRollData(...args),
  fileToBase64: (...args: unknown[]) => mockFileToBase64(...args),
}));

// ─── Helpers ─────────────────────────────────────────────────

function makeFile(name = 'label.jpg') {
  return new File(['pixels'], name, { type: 'image/jpeg' });
}

const extractedResponse = {
  brand: 'Ultrafit',
  productName: 'Crystal XP',
  description: 'Paint Protection Film',
  productCode: 'CXP-001',
  barcode: '1234567890123',
  widthMm: 1524,
  lengthM: 15,
  confidence: { productName: 0.95 },
  warnings: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUploadRollPhoto.mockResolvedValue('https://storage.example.com/photo.jpg');
  mockFileToBase64.mockResolvedValue('base64data');
  mockExtractRollData.mockResolvedValue(extractedResponse);

  // URL.createObjectURL stub
  if (!globalThis.URL.createObjectURL) {
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:test');
  }
});

// ─── Tests ───────────────────────────────────────────────────

describe('useRollScan', () => {
  it('passes instanceId to extractRollData', async () => {
    const { result } = renderHook(() => useRollScan({ instanceId: 'inst-42' }));

    await act(async () => {
      await result.current.addFiles([makeFile()]);
    });

    expect(mockExtractRollData).toHaveBeenCalledWith(
      'base64data',
      'image/jpeg',
      'inst-42',
    );
  });

  it('passes instanceId to uploadRollPhoto', async () => {
    const { result } = renderHook(() => useRollScan({ instanceId: 'inst-42' }));

    await act(async () => {
      await result.current.addFiles([makeFile()]);
    });

    expect(mockUploadRollPhoto).toHaveBeenCalledWith(expect.any(File), 'inst-42');
  });

  it('stores extracted productName from AI response', async () => {
    const { result } = renderHook(() => useRollScan({ instanceId: 'inst-1' }));

    await act(async () => {
      await result.current.addFiles([makeFile()]);
    });

    await waitFor(() => {
      expect(result.current.confirmedResults).toHaveLength(1);
    });

    expect(result.current.confirmedResults[0].extractedData.productName).toBe('Crystal XP');
  });

  it('sets status to error when extractRollData fails', async () => {
    mockExtractRollData.mockRejectedValue(new Error('OCR failed'));

    const { result } = renderHook(() => useRollScan({ instanceId: 'inst-1' }));

    await act(async () => {
      await result.current.addFiles([makeFile()]);
    });

    await waitFor(() => {
      expect(result.current.errorResults).toHaveLength(1);
    });

    expect(result.current.errorResults[0].error).toBe('OCR failed');
  });

  it('processes multiple files sequentially', async () => {
    const callOrder: string[] = [];
    mockUploadRollPhoto.mockImplementation(async () => {
      callOrder.push('upload');
      return 'https://storage.example.com/photo.jpg';
    });
    mockExtractRollData.mockImplementation(async () => {
      callOrder.push('extract');
      return extractedResponse;
    });

    const { result } = renderHook(() => useRollScan({ instanceId: 'inst-1' }));

    await act(async () => {
      await result.current.addFiles([makeFile('a.jpg'), makeFile('b.jpg')]);
    });

    // Should be upload-extract-upload-extract, not upload-upload-extract-extract
    expect(callOrder).toEqual(['upload', 'extract', 'upload', 'extract']);
  });
});
