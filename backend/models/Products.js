const mongoose = require('mongoose');
const bwipjs = require('bwip-js');
const fs = require('fs');
const path = require('path');

const ProductSchema = new mongoose.Schema({
  productId: { type: String, unique: true, required: true }, // Store as 5-digit string
  upc: { type: String, unique: true, required: true }, // Store 13-digit EAN-13
  barcode: { type: String }, // Store Barcode image path
  name: { type: String, required: true, unique: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  isVeg: { type: Boolean, default: true },
  isPastry: { type: Boolean, default: false },
  album: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Album', 
    required: function () { return this.productType === 'cake'; }
  },
  productType: { type: String, enum: ['cake', 'non-cake'], default: 'non-cake' },
  description: { type: String },
  foodNotes: { type: String },
  ingredients: { type: String },
  available: { type: Boolean, default: true },
  images: [{ type: String }],
  priceDetails: [
    {
      price: { type: Number, required: true },
      rate: { type: Number, required: true },
      offerPercent: { type: Number, default: 0 },
      quantity: { type: Number, required: true },
      unit: { type: String, enum: ['kg', 'g', 'pcs'], required: true },
      cakeType: { 
        type: String, 
        enum: ['freshCream', 'butterCream'], 
        required: false
      },
      gst: { type: Number, enum: [0, 5, 12, 18, 22], default: 0 }
    }
  ],
}, { timestamps: true });

// Auto-generate 5-digit product ID, EAN-13 barcode, and store barcode image
ProductSchema.pre('save', async function (next) {
  if (!this.productId) {
    const lastProduct = await mongoose.model('Product').findOne().sort({ productId: -1 });
    const nextProductId = lastProduct && lastProduct.productId
      ? String(parseInt(lastProduct.productId) + 1).padStart(5, '0')
      : '00001';
    this.productId = nextProductId;
  }

  if (!this.upc) {
    const companyPrefix = '8901234';
    const eanWithoutCheckDigit = companyPrefix + this.productId;
    const checkDigit = calculateEAN13CheckDigit(eanWithoutCheckDigit);
    this.upc = eanWithoutCheckDigit + checkDigit;
  }

  if (!this.barcode) {
    const barcodePath = `uploads/barcodes/${this.productId}.png`;
    await generateBarcode(this.upc, barcodePath);
    this.barcode = barcodePath;
  }

  next();
});

async function generateBarcode(upc, barcodePath) {
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer({
      bcid: 'ean13',
      text: upc,
      scale: 3,
      height: 20,
      includetext: true,
      textxalign: 'center',
    }, (err, png) => {
      if (err) {
        console.error('❌ Error generating barcode:', err);
        reject(err);
      } else {
        fs.writeFileSync(barcodePath, png);
        resolve();
      }
    });
  });
}

function calculateEAN13CheckDigit(ean) {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(ean[i]) * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10;
}

module.exports = mongoose.model('Product', ProductSchema);