// Tax Configuration Constants
const TAX_CONFIG = {
  CGST_RATE: 0.025, // 2.5%
  SGST_RATE: 0.025, // 2.5%
  TOTAL_TAX_RATE: 0.05, // 5% (2.5% + 2.5%)
  TAX_DIVISOR: 1.05, // For calculating taxable amount from total (1 + total tax rate)
  
  // Display rates for invoices
  DISPLAY_RATE: 2.5 // 2.5% for display purposes
};

// Utility functions for tax calculations
const calculateTaxableAmount = (totalAmount) => {
  return totalAmount / TAX_CONFIG.TAX_DIVISOR;
};

const calculateCGST = (taxableAmount) => {
  return taxableAmount * TAX_CONFIG.CGST_RATE;
};

const calculateSGST = (taxableAmount) => {
  return taxableAmount * TAX_CONFIG.SGST_RATE;
};

const calculateTotalTax = (taxableAmount) => {
  return taxableAmount * TAX_CONFIG.TOTAL_TAX_RATE;
};

const calculateTotalWithTax = (taxableAmount) => {
  return taxableAmount * (1 + TAX_CONFIG.TOTAL_TAX_RATE);
};

module.exports = {
  TAX_CONFIG,
  calculateTaxableAmount,
  calculateCGST,
  calculateSGST,
  calculateTotalTax,
  calculateTotalWithTax
};