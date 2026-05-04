/**
 * Vehicle Controller
 * Handles vehicle record operations
 */

const Vehicle = require('../models/Vehicle');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { Document, Packer, Table, TableRow, TableCell, Paragraph, HeadingLevel, BorderStyle, VerticalAlign, AlignmentType, PageBreak, UnderlineType } = require('docx');

class VehicleController {
  /**
   * Create new vehicle record
   */
  static async createRecord(req, res) {
    try {
      const { weight, status, image, carNumber } = req.body;

      const vehicle = new Vehicle({
        weight,
        status,
        image,
        carNumber,
        timestamp: new Date(),
      });

      await vehicle.save();

      res.status(201).json({
        success: true,
        message: 'Vehicle record created',
        data: vehicle,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get all vehicle records
   */
  static async getAllRecords(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const status = req.query.status;
      const search = req.query.search;
      const sort = req.query.sort || 'timestamp-desc';
      const weightMin = req.query.weightMin;
      const weightMax = req.query.weightMax;
      const dateFrom = req.query.dateFrom;
      const dateTo = req.query.dateTo;

      let query = {};

      // Status filter
      if (status && status !== 'all') {
        query.status = status;
      }

      // Search by number plate
      if (search) {
        query.carNumber = { $regex: search, $options: 'i' };
      }

      // Weight range filter
      if (weightMin || weightMax) {
        query.weight = {};
        if (weightMin) query.weight.$gte = parseFloat(weightMin);
        if (weightMax) query.weight.$lte = parseFloat(weightMax);
      }

      // Date range filter
      if (dateFrom || dateTo) {
        query.timestamp = {};
        if (dateFrom) query.timestamp.$gte = new Date(dateFrom);
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          query.timestamp.$lte = toDate;
        }
      }

      // Parse sort parameter (format: "field-asc" or "field-desc")
      let sortObj = { timestamp: -1 }; // default
      if (sort) {
        const [field, order] = sort.split('-');
        const sortOrder = order === 'asc' ? 1 : -1;
        sortObj = { [field]: sortOrder };
      }

      const records = await Vehicle.find(query)
        .sort(sortObj)
        .limit(limit)
        .skip(skip)
        .lean();

      const total = await Vehicle.countDocuments(query);

      res.json({
        success: true,
        data: records,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get single record by ID
   */
  static async getRecordById(req, res) {
    try {
      const { id } = req.params;
      const record = await Vehicle.findById(id);

      if (!record) {
        return res.status(404).json({
          success: false,
          error: 'Record not found',
        });
      }

      res.json({
        success: true,
        data: record,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Delete record
   */
  static async deleteRecord(req, res) {
    try {
      const { id } = req.params;
      const record = await Vehicle.findByIdAndDelete(id);

      if (!record) {
        return res.status(404).json({
          success: false,
          error: 'Record not found',
        });
      }

      res.json({
        success: true,
        message: 'Record deleted',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get analytics
   */
  static async getAnalytics(req, res) {
    try {
      const { days = 7 } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const records = await Vehicle.find({
        timestamp: { $gte: startDate },
      });

      const totalVehicles = records.length;
      const allowedVehicles = records.filter((r) => r.status === 'ALLOWED').length;
      const blockedVehicles = records.filter((r) => r.status === 'BLOCKED').length;
      const avgWeight =
        records.length > 0
          ? records.reduce((sum, r) => sum + r.weight, 0) / records.length
          : 0;

      res.json({
        success: true,
        data: {
          totalVehicles,
          allowedVehicles,
          blockedVehicles,
          averageWeight: avgWeight.toFixed(2),
          period: `Last ${days} days`,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Export records in various formats
   */
  static async exportRecords(req, res) {
    try {
      console.log('📥 Export request received:', {
        format: req.query.format,
        filters: {
          status: req.query.status,
          search: req.query.search,
          weightMin: req.query.weightMin,
          weightMax: req.query.weightMax,
          dateFrom: req.query.dateFrom,
          dateTo: req.query.dateTo,
        },
        sort: req.query.sort,
      });

      const format = req.query.format || 'csv';
      const status = req.query.status;
      const search = req.query.search;
      const sort = req.query.sort || 'timestamp-desc';
      const weightMin = req.query.weightMin;
      const weightMax = req.query.weightMax;
      const dateFrom = req.query.dateFrom;
      const dateTo = req.query.dateTo;
      const limit = parseInt(req.query.limit) || 10;

      // Build query (same as getAllRecords)
      let query = {};
      if (status && status !== 'all') query.status = status;
      if (search) query.carNumber = { $regex: search, $options: 'i' };
      if (weightMin || weightMax) {
        query.weight = {};
        if (weightMin) query.weight.$gte = parseFloat(weightMin);
        if (weightMax) query.weight.$lte = parseFloat(weightMax);
      }
      if (dateFrom || dateTo) {
        query.timestamp = {};
        if (dateFrom) query.timestamp.$gte = new Date(dateFrom);
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          query.timestamp.$lte = toDate;
        }
      }

      console.log('🔍 Database query:', query);

      // Parse sort
      let sortObj = { timestamp: -1 };
      if (sort) {
        const [field, order] = sort.split('-');
        const sortOrder = order === 'asc' ? 1 : -1;
        sortObj = { [field]: sortOrder };
      }

      console.log('📊 Sort object:', sortObj);

      // Get records
      const records = await Vehicle.find(query)
        .sort(sortObj)
        .limit(limit)
        .lean();

      console.log(`📦 Found ${records.length} records`);

      let fileBuffer;
      let contentType;
      let filename;

      // Generate format-specific content
      if (format === 'csv') {
        fileBuffer = VehicleController.generateCSV(records);
        contentType = 'text/csv;charset=utf-8;';
        filename = `vehicles-${new Date().toISOString().split('T')[0]}.csv`;
      } else if (format === 'excel') {
        fileBuffer = await VehicleController.generateExcel(records);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `vehicles-${new Date().toISOString().split('T')[0]}.xlsx`;
      } else if (format === 'word') {
        fileBuffer = await VehicleController.generateWord(records);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        filename = `vehicles-${new Date().toISOString().split('T')[0]}.docx`;
      } else if (format === 'pdf') {
        fileBuffer = await VehicleController.generatePDF(records);
        contentType = 'application/pdf';
        filename = `vehicles-${new Date().toISOString().split('T')[0]}.pdf`;
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid format. Use csv, excel, word, or pdf',
        });
      }

      console.log(`✅ Generated ${format} content, size: ${fileBuffer.length} bytes`);

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', contentType);
      res.send(fileBuffer);
      
      console.log('✅ Export sent successfully');
    } catch (error) {
      console.error('❌ Export error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  /**
   * Generate CSV content
   */
  static generateCSV(records) {
    const headers = ['Date & Time', 'Weight (kg)', 'Status', 'Car Number', 'Vehicle Type'];
    const rows = records.map((v) => [
      new Date(v.timestamp).toLocaleString(),
      v.weight,
      v.status,
      v.carNumber || '-',
      v.vehicleType || '-',
    ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach((row) => {
      csvContent += row.map((cell) => `"${cell}"`).join(',') + '\n';
    });

    return Buffer.from(csvContent, 'utf-8');
  }

  /**
   * Generate Excel (.xlsx) file using ExcelJS
   */
  static async generateExcel(records) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Vehicle Records');

    // Add headers
    const headers = ['Date & Time', 'Weight (kg)', 'Status', 'Car Number', 'Vehicle Type'];
    worksheet.addRow(headers);

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEC6B1B' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'center' };

    // Add data rows
    records.forEach((v) => {
      worksheet.addRow([
        new Date(v.timestamp).toLocaleString(),
        v.weight,
        v.status,
        v.carNumber || '-',
        v.vehicleType || '-',
      ]);
    });

    // Set column widths
    worksheet.columns = [
      { width: 20 },
      { width: 15 },
      { width: 12 },
      { width: 15 },
      { width: 15 },
    ];

    // Write to buffer
    return await workbook.xlsx.writeBuffer();
  }

  /**
   * Generate Word (.docx) file - using HTML-based approach
   */
  static async generateWord(records) {
    const headers = ['Date & Time', 'Weight (kg)', 'Status', 'Car Number', 'Vehicle Type'];
    
    // Create table header row
    const headerCells = headers.map(
      (h) =>
        new TableCell({
          children: [new Paragraph({ text: h, bold: true, color: 'FFFFFF' })],
          shading: { fill: 'EC6B1B' },
          verticalAlign: VerticalAlign.CENTER,
        })
    );

    const headerRow = new TableRow({
      children: headerCells,
      height: { value: 400, rule: 'atLeast' },
    });

    // Create table data rows
    const dataRows = records.map(
      (v, idx) =>
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph(new Date(v.timestamp).toLocaleString())],
              shading: { fill: idx % 2 === 0 ? 'F9F9F9' : 'FFFFFF' },
            }),
            new TableCell({
              children: [new Paragraph(String(v.weight))],
              shading: { fill: idx % 2 === 0 ? 'F9F9F9' : 'FFFFFF' },
            }),
            new TableCell({
              children: [new Paragraph(v.status)],
              shading: { fill: idx % 2 === 0 ? 'F9F9F9' : 'FFFFFF' },
            }),
            new TableCell({
              children: [new Paragraph(v.carNumber || '-')],
              shading: { fill: idx % 2 === 0 ? 'F9F9F9' : 'FFFFFF' },
            }),
            new TableCell({
              children: [new Paragraph(v.vehicleType || '-')],
              shading: { fill: idx % 2 === 0 ? 'F9F9F9' : 'FFFFFF' },
            }),
          ],
        })
    );

    // Create document
    const doc = new Document({
      sections: [
        {
          children: [
            // Title
            new Paragraph({
              text: 'Vehicle Records Report',
              heading: HeadingLevel.HEADING_1,
              color: 'EC6B1B',
              size: 48,
              bold: true,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            // Info section
            new Paragraph({
              text: `Generated on: ${new Date().toLocaleString()}`,
              spacing: { after: 100 },
            }),
            new Paragraph({
              text: `Total Records: ${records.length}`,
              spacing: { after: 300 },
            }),

            // Table
            new Table({
              rows: [headerRow, ...dataRows],
              width: { size: 100, type: 'percentage' },
              borders: {
                topBorder: { style: BorderStyle.SINGLE, size: 1, color: 'DDD' },
                bottomBorder: { style: BorderStyle.SINGLE, size: 1, color: 'DDD' },
                leftBorder: { style: BorderStyle.SINGLE, size: 1, color: 'DDD' },
                rightBorder: { style: BorderStyle.SINGLE, size: 1, color: 'DDD' },
                insideHorizontalBorder: { style: BorderStyle.SINGLE, size: 1, color: 'DDD' },
                insideVerticalBorder: { style: BorderStyle.SINGLE, size: 1, color: 'DDD' },
              },
            }),

            // Footer
            new Paragraph({
              text: '',
              spacing: { before: 400 },
            }),
            new Paragraph({
              text: 'This is an auto-generated report from LoadGate Vehicle Monitoring System',
              alignment: AlignmentType.CENTER,
              color: '666666',
              size: 18,
            }),
          ],
        },
      ],
    });

    // Generate buffer
    return await Packer.toBuffer(doc);
  }

  /**
   * Generate PDF using PDFKit
   */
  static async generatePDF(records) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
        });

        const chunks = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err) => reject(err));

        // Title
        doc.fontSize(20).font('Helvetica-Bold').fillColor('#EC6B1B').text('Vehicle Records Report', { align: 'center' });
        doc.moveDown();

        // Info section
        doc.fontSize(11).fillColor('#000000');
        doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: 'left' });
        doc.text(`Total Records: ${records.length}`, { align: 'left' });
        doc.moveDown();

        // Table headers
        const headers = ['Date & Time', 'Weight (kg)', 'Status', 'Car Number', 'Vehicle Type'];
        const colWidth = (doc.page.width - 100) / headers.length;

        // Draw header row
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#FFFFFF');
        doc.rect(50, doc.y, doc.page.width - 100, 25).fill('#EC6B1B');
        
        let xPos = 50;
        headers.forEach((header) => {
          doc.fillColor('#FFFFFF').text(header, xPos + 5, doc.y - 22, {
            width: colWidth - 10,
            align: 'left',
          });
          xPos += colWidth;
        });

        doc.moveDown(1.5);

        // Draw data rows
        doc.fontSize(9).font('Helvetica').fillColor('#000000');
        let rowNum = 0;

        records.forEach((record) => {
          const yStart = doc.y;
          const rowHeight = 20;

          // Alternate row background
          if (rowNum % 2 === 0) {
            doc.rect(50, yStart, doc.page.width - 100, rowHeight).fill('#f0f0f0');
          }

          const row = [
            new Date(record.timestamp).toLocaleString(),
            record.weight,
            record.status,
            record.carNumber || '-',
            record.vehicleType || '-',
          ];

          xPos = 50;
          row.forEach((cell, idx) => {
            doc.fillColor('#000000').text(String(cell), xPos + 5, yStart + 5, {
              width: colWidth - 10,
              align: 'left',
            });
            xPos += colWidth;
          });

          doc.y = yStart + rowHeight;
          rowNum++;

          // Add new page if needed
          if (doc.y > doc.page.height - 100) {
            doc.addPage();
          }
        });

        // Footer
        doc.moveDown(2);
        doc.fontSize(9).fillColor('#666666').text('LoadGate Vehicle Monitoring System - Auto-generated Report', { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = VehicleController;
