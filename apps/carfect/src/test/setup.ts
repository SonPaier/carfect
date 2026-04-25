import '@testing-library/jest-dom';
import '@/i18n/config';
import { beforeEach } from 'vitest';
import { setViewport } from './utils/viewport';

// Polyfill URL.createObjectURL / revokeObjectURL for jsdom (used by file download flows)
if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = (() => 'blob:mock-url') as typeof URL.createObjectURL;
}
if (typeof URL.revokeObjectURL === 'undefined') {
  URL.revokeObjectURL = (() => undefined) as typeof URL.revokeObjectURL;
}

// Reset viewport to desktop before each test for isolation
beforeEach(() => {
  setViewport('desktop');
});

// Mock ResizeObserver for components using it
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = () => {};

// Mock hasPointerCapture for Radix UI + jsdom compatibility
Element.prototype.hasPointerCapture = () => false;
Element.prototype.setPointerCapture = () => {};
Element.prototype.releasePointerCapture = () => {};

// Polyfill getClientRects/getBoundingClientRect on Range for ProseMirror/Tiptap in jsdom
const emptyRect = {
  x: 0,
  y: 0,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: 0,
  height: 0,
  toJSON: () => ({}),
};
if (typeof Range !== 'undefined') {
  Range.prototype.getClientRects = function () {
    const list = [emptyRect] as unknown as DOMRectList;
    return list;
  };
  Range.prototype.getBoundingClientRect = function () {
    return emptyRect as DOMRect;
  };
}

// Polyfill document.elementFromPoint for ProseMirror/Tiptap in jsdom (used by posAtCoords)
if (typeof document !== 'undefined' && !document.elementFromPoint) {
  document.elementFromPoint = (() => null) as typeof document.elementFromPoint;
}
