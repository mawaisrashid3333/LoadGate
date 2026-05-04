/**
 * Chart Export Utilities
 * Handles exporting charts to various image formats
 */

import html2canvas from 'html2canvas';

/**
 * Export chart to image
 * @param {HTMLElement} element - The chart container element to export
 * @param {string} format - The export format (png, jpg, jpeg, svg)
 * @param {string} filename - The filename for the exported image
 */
export const exportChartToImage = async (element, format = 'png', filename = 'chart') => {
  if (!element) {
    console.error('❌ Chart element not found');
    throw new Error('Chart element not found');
  }

  try {
    console.log(`📊 Starting chart export to ${format.toUpperCase()}...`);

    // Use html2canvas to convert the chart to canvas
    const canvas = await html2canvas(element, {
      backgroundColor: null,
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
    });

    if (format === 'svg') {
      exportCanvasToSVG(canvas, filename);
    } else if (format === 'png') {
      exportCanvasToPNG(canvas, filename);
    } else if (format === 'jpg' || format === 'jpeg') {
      exportCanvasToJPEG(canvas, filename, format === 'jpeg' ? 'jpeg' : 'jpg');
    }

    console.log(`✅ Chart exported successfully as ${format.toUpperCase()}`);
  } catch (error) {
    console.error(`❌ Error exporting chart:`, error);
    throw new Error(`Failed to export chart: ${error.message}`);
  }
};

/**
 * Export canvas to SVG
 */
const exportCanvasToSVG = (canvas, filename) => {
  const width = canvas.width;
  const height = canvas.height;
  const imageData = canvas.toDataURL('image/png');

  // Create SVG with embedded image
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <style type="text/css">
      <![CDATA[
        /* SVG stylesheet */
      ]]>
    </style>
  </defs>
  <image width="${width}" height="${height}" xlink:href="${imageData}"/>
</svg>`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().getTime()}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export canvas to PNG
 */
const exportCanvasToPNG = (canvas, filename) => {
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
};

/**
 * Export canvas to JPEG
 */
const exportCanvasToJPEG = (canvas, filename, format) => {
  canvas.toBlob(
    (blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}-${new Date().getTime()}.${format === 'jpeg' ? 'jpeg' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    'image/jpeg',
    0.95
  );
};

/**
 * Get file extension based on format
 */
export const getFileExtension = (format) => {
  const extensions = {
    png: 'png',
    jpg: 'jpg',
    jpeg: 'jpeg',
    svg: 'svg',
  };
  return extensions[format] || 'png';
};
