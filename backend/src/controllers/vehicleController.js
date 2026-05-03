/**
 * Vehicle Controller
 * Handles vehicle record operations
 */

const Vehicle = require('../models/Vehicle');

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
      const format = req.query.format || 'csv';
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

      // Parse sort
      let sortObj = { timestamp: -1 };
      if (sort) {
        const [field, order] = sort.split('-');
        const sortOrder = order === 'asc' ? 1 : -1;
        sortObj = { [field]: sortOrder };
      }

      // Get records
      const records = await Vehicle.find(query)
        .sort(sortObj)
        .limit(limit)
        .skip(skip)
        .lean();

      let fileContent;
      let contentType;
      let filename;

      // Generate format-specific content
      if (format === 'csv') {
        fileContent = this.generateCSV(records);
        contentType = 'text/csv;charset=utf-8;';
        filename = `vehicles-${new Date().toISOString().split('T')[0]}.csv`;
      } else if (format === 'excel') {
        fileContent = this.generateExcel(records);
        contentType = 'application/vnd.ms-excel;charset=utf-8;';
        filename = `vehicles-${new Date().toISOString().split('T')[0]}.xls`;
      } else if (format === 'word') {
        fileContent = this.generateWord(records);
        contentType = 'application/msword;charset=utf-8;';
        filename = `vehicles-${new Date().toISOString().split('T')[0]}.doc`;
      } else if (format === 'pdf') {
        fileContent = this.generatePDF(records);
        contentType = 'application/pdf;charset=utf-8;';
        filename = `vehicles-${new Date().toISOString().split('T')[0]}.pdf`;
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid format. Use csv, excel, word, or pdf',
        });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', contentType);
      res.send(fileContent);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
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

    return csvContent;
  }

  /**
   * Generate Excel content (HTML format for compatibility)
   */
  static generateExcel(records) {
    const headers = ['Date & Time', 'Weight (kg)', 'Status', 'Car Number', 'Vehicle Type'];
    const rows = records.map((v) => [
      new Date(v.timestamp).toLocaleString(),
      v.weight,
      v.status,
      v.carNumber || '-',
      v.vehicleType || '-',
    ]);

    let excelContent = '<table><tr>';
    headers.forEach((h) => {
      excelContent += `<th>${h}</th>`;
    });
    excelContent += '</tr>';

    rows.forEach((row) => {
      excelContent += '<tr>';
      row.forEach((cell) => {
        excelContent += `<td>${cell}</td>`;
      });
      excelContent += '</tr>';
    });
    excelContent += '</table>';

    return excelContent;
  }

  /**
   * Generate Word content (HTML format)
   */
  static generateWord(records) {
    const headers = ['Date & Time', 'Weight (kg)', 'Status', 'Car Number', 'Vehicle Type'];
    const rows = records.map((v) => [
      new Date(v.timestamp).toLocaleString(),
      v.weight,
      v.status,
      v.carNumber || '-',
      v.vehicleType || '-',
    ]);

    let wordContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #EC6B1B; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #EC6B1B; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <h1>Vehicle Records Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Total Records: ${rows.length}</p>
          <table>
            <tr>
              ${headers.map((h) => `<th>${h}</th>`).join('')}
            </tr>
            ${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}
          </table>
        </body>
      </html>
    `;
    return wordContent;
  }

  /**
   * Generate PDF content (HTML format - browser will convert)
   */
  static generatePDF(records) {
    const headers = ['Date & Time', 'Weight (kg)', 'Status', 'Car Number', 'Vehicle Type'];
    const rows = records.map((v) => [
      new Date(v.timestamp).toLocaleString(),
      v.weight,
      v.status,
      v.carNumber || '-',
      v.vehicleType || '-',
    ]);

    let pdfContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #EC6B1B; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 10px; text-align: left; border: 1px solid #ddd; font-size: 12px; }
            th { background-color: #EC6B1B; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .footer { margin-top: 30px; font-size: 10px; color: #666; }
          </style>
        </head>
        <body>
          <h1>Vehicle Records Report</h1>
          <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Total Records:</strong> ${rows.length}</p>
          <table>
            <tr>
              ${headers.map((h) => `<th>${h}</th>`).join('')}
            </tr>
            ${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}
          </table>
          <div class="footer">
            <p>This is an auto-generated report from LoadGate Vehicle Monitoring System</p>
          </div>
        </body>
      </html>
    `;
    return pdfContent;
  }
}

module.exports = VehicleController;
