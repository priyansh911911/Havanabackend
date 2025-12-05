const CashTransaction = require('../models/CashTransaction');
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');

// 💰 Get cash summary + optional filters (date, week, month, year, today, source, custom range) + pagination
const getCashAtReception = async (req, res) => {
  try {
    const { filter, page = 1, limit = 10, startDate: startQuery, endDate: endQuery } = req.query;
    const matchConditions = {};

    // --- Apply date filters ---
    const now = new Date();
    let startDate, endDate;

    if (startQuery && endQuery) {
      // Custom date range
      const startD = new Date(startQuery);
      const endD = new Date(endQuery);
      if (isNaN(startD.getTime()) || isNaN(endD.getTime())) {
        return res.status(400).json({ message: 'Invalid startDate or endDate format' });
      }
      startDate = new Date(startD.setHours(0, 0, 0, 0));
      endDate = new Date(endD.setHours(23, 59, 59, 999));
    } else {
      switch (filter) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date(now.setHours(23, 59, 59, 999));
          break;
        case 'week': {
          const curr = new Date();
          const first = curr.getDate() - curr.getDay();
          startDate = new Date(curr.setDate(first));
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date();
          endDate.setHours(23, 59, 59, 999);
          break;
        }
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
          break;
        case 'date':
          if (req.query.date) {
            const d = new Date(req.query.date);
            if (isNaN(d.getTime())) return res.status(400).json({ message: 'Invalid date format' });
            startDate = new Date(d.setHours(0, 0, 0, 0));
            endDate = new Date(d.setHours(23, 59, 59, 999));
          }
          break;
      }
    }

    if (startDate && endDate) {
      matchConditions.createdAt = { $gte: startDate, $lte: endDate };
    }

    // --- Group transactions by source ---
    const sources = ['RESTAURANT', 'ROOM_BOOKING', 'BANQUET + PARTY', 'OTHER'];
    const cards = {};

    for (const source of sources) {
      const sourceMatch = { ...matchConditions, source };

      const totalIn = await CashTransaction.aggregate([
        { $match: { ...sourceMatch, type: { $in: ['KEEP AT RECEPTION', 'OFFICE TO RECEPTION'] } } },
        { $group: { _id: "$source", total: { $sum: "$amount" } } }
      ]);

      const totalOut = await CashTransaction.aggregate([
        { $match: { ...sourceMatch, type: 'SENT TO OFFICE' } },
        { $group: { _id: "$source", total: { $sum: "$amount" } } }
      ]);

      const totalReceived = totalIn.reduce((sum, s) => sum + s.total, 0);
      const totalSent = totalOut.reduce((sum, s) => sum + s.total, 0);
      const cashInReception = totalReceived - totalSent;

      const transactions = await CashTransaction.find(sourceMatch)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('receptionistId', 'name email');

      const totalTransactions = await CashTransaction.countDocuments(sourceMatch);
      const totalPages = Math.ceil(totalTransactions / limit);

      cards[source] = {
        summary: { totalReceived, totalSent, cashInReception },
        breakdown: { receivedBreakdown: totalIn, sentBreakdown: totalOut },
        pagination: { page: parseInt(page), limit: parseInt(limit), totalPages, totalTransactions },
        transactions,
      };
    }

    res.json({ filterApplied: filter || (startQuery && endQuery ? 'custom-range' : 'all'), cards });
  } catch (err) {
    console.error('Error fetching cash report:', err);
    res.status(500).json({ message: 'Server error while fetching cash report' });
  }
};

// ➕ Add new cash transaction with validation
const addCashTransaction = async (req, res) => {
  try {
    const { amount, type, description, receptionistId, source } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }
    if (!['KEEP AT RECEPTION', 'SENT TO OFFICE', 'OFFICE TO RECEPTION'].includes(type)) {
      return res.status(400).json({ message: 'Type must be KEEP AT RECEPTION, SENT TO OFFICE, or OFFICE TO RECEPTION' });
    }

    const validSources = ['RESTAURANT', 'ROOM_BOOKING', 'BANQUET + PARTY', 'OTHER'];
    if (!source || !validSources.includes(source.toUpperCase())) {
      return res.status(400).json({ message: `Source is required. Valid sources: ${validSources.join(', ')}` });
    }

    const transaction = await CashTransaction.create({
      amount,
      type,
      description,
      source: source.toUpperCase(),
      receptionistId,
    });

    res.status(201).json({ message: 'Transaction added successfully', transaction });
  } catch (err) {
    console.error('Error adding cash transaction:', err);
    res.status(500).json({ message: 'Server error while adding transaction' });
  }
};

// 📋 Get all transactions (unfiltered) with pagination
const getAllCashTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const transactions = await CashTransaction.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('receptionistId', 'name email');

    const totalTransactions = await CashTransaction.countDocuments();
    const totalPages = Math.ceil(totalTransactions / limit);

    res.json({
      pagination: { page: parseInt(page), limit: parseInt(limit), totalPages, totalTransactions },
      transactions,
    });
  } catch (err) {
    console.error('Error fetching all transactions:', err);
    res.status(500).json({ message: 'Server error while fetching transactions' });
  }
};

// Generate Excel report for cash transactions with date range filter
const generateCashTransactionsExcel = async (req, res) => {
  try {
    const { startDate, endDate, source, type } = req.query;
    const filter = {};

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (source) filter.source = source;
    if (type) filter.type = type;

    const transactions = await CashTransaction.find(filter)
      .populate('receptionistId', 'name email')
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Cash Transactions');

    worksheet.columns = [
      { header: 'Transaction ID', key: 'transactionId', width: 20 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Type', key: 'type', width: 25 },
      { header: 'Source', key: 'source', width: 20 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Receptionist', key: 'receptionist', width: 20 },
      { header: 'Created At', key: 'createdAt', width: 20 }
    ];

    transactions.forEach(transaction => {
      worksheet.addRow({
        transactionId: transaction._id.toString(),
        amount: transaction.amount,
        type: transaction.type,
        source: transaction.source,
        description: transaction.description || '',
        receptionist: transaction.receptionistId?.name || 'Unknown',
        createdAt: transaction.createdAt.toLocaleDateString()
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=cash-transactions-${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getCashAtReception,
  addCashTransaction,
  getAllCashTransactions,
  generateCashTransactionsExcel,
};
