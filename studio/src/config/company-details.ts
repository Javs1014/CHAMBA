
// src/config/company-details.ts

// This file centralizes all static company information to ensure consistency across all documents.

export const companyDetails = {
  'Trade Evolution': {
    name: 'TradeEvolution OÜ',
    taxId: '1669512',
    phone: '+372-5811-2114',
    address: 'Harju maakond, Tallinn, Kesklinna linnaosa, Pärnu mnt 139c, 11317, Estonia',
    website: 'www.trd-e.ee',
    logoUrl: '', // No longer used, SVG component is used instead
    usdAccountDetails: {
      accountHolder: 'TradeEvolution OÜ',
      wireRoutingNumber: '026073150',
      accountNumber: '8313015989',
      accountType: 'Checking',
      swiftCode: 'CMFGUS33',
      bankAddress: ['Wise US Inc (Community Federal Savings Bank)', '30 W. 26th Street, Sixth Floor', 'New York, NY 10010', 'United States'],
    },
    eurAccountDetails: {
      accountHolder: 'TRADE EVOLUTION OÜ',
      swiftBic: 'LHVBEE22',
      iban: 'EE247700771008688480',
      bankAddress: ['AS LHV Pank', 'Tartu mnt 2', '10145 Tallinn', 'Estonia'],
    },
    signature: {
      name: 'Rubén Colín',
      title: 'CEO',
    },
  },
  'Successful Trade': {
    name: 'Successful Trade PTE LTD',
    uen: '202334442E',
    phone: '(+65) 8588 0588',
    address: '160 Robinson Road, #14-04 Singapore Business Federation Centre, Singapore 068914',
    website: 'www.successfultrd.com',
    footerText: 'This is a computer-generated document. No signature is required.',
    bankDetails: {
      accountHolder: 'Successful Trade PTE. LTD.',
      accountNumber: '717-123456-789', // This seems like a placeholder, using as is.
      swift: 'OCBCSGSGXXX',
      bankName: 'OCBC',
      bankAddress: '63 Chulia Street #10-00, OCBC Centre East, Singapore 049514',
    },
    signature: {
      name: 'Management',
      title: 'Successful Trade PTE LTD'
    }
  }
};
