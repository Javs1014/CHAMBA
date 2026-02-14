
export type ProformaStatus = "DRAFT" | "SENT" | "REVIEWED" | "APPROVED" | "REJECTED";

export type CompanyName = 'Trade Evolution' | 'Successful Trade' | 'Both';

export interface Payment {
  id: string;
  amount: number;
  date: string; // ISO string for consistency
  notes?: string;
}

export interface Product {
  id:string;
  name: string;
  description: string;
  price: number;
  category?: string; 
  unit: string; 
  createdAt: string; 
  updatedAt: string; 
}

export interface Client {
  id: string;
  name: string;
  email: string;
  address?: string;
  companyName?: string;
  taxId?: string; 
  balance?: number;
  createdAt: string; 
  updatedAt: string; 
  company: CompanyName;
}

export interface ProformaItem {
  productId: string;
  productName: string; 
  description?: string; 
  quantity: number;
  unit: string; 
  unitPrice: number; 
  totalPrice: number;
}

// Interface for storing editable invoice fields within the Proforma
export interface EditableInvoiceSpecificFields {
  invoiceNumber?: string;
  issuedAtDate?: string; // Storing as string, consistent with Proforma
  paymentTerms?: string;
}

// Interface for storing editable Bill of Lading fields within the Proforma
export interface EditableBillOfLadingSpecificFields {
  blNo?: string;
  storagePath?: string; // Add this to keep track of the file in Firebase Storage
  oceanVesselVoyNo?: string;
  ladenOnBoardDate?: string;
  placeAndDateOfIssue?: string;
  freightPayableAt?: string;
  numOriginalBL?: string;
}

// Interface for storing editable Packing List fields within the Proforma
export interface EditablePackingListSpecificFields {
  issuedAtPlace?: string;
  productSummary?: string;
  packingListNotes?: string; // Specific notes for the packing list document
  editedContainers?: {
    containerNumber: string;
    netWeight: number;
    grossWeight: number;
    totalVolumeM3: number;
  }[];
}


export interface Proforma {
  id: string;
  proformaNumber: string; 
  clientId: string;
  
  clientName: string; 
  clientAddress?: string; 
  clientTaxId?: string; 

  shipToName?: string;
  shipToAddress?: string; 
  shipToTaxId?: string;
  shipToClientId?: string;

  items: ProformaItem[];
  currency: string; 
  company: Extract<CompanyName, 'Trade Evolution' | 'Successful Trade'>;

  portAtOrigin?: string;
  portOfArrival?: string;
  finalDestination?: string;
  reference?: string; 
  paymentTerms?: string;
  delivery?: string; 
  vessel?: string;
  containers?: string; 
  containerNo?: string; 

  subTotal: number;
  taxAmount?: number; 
  grandTotal: number;
  
  status: ProformaStatus; 
  notes?: string; 
  issuedDate: string; 
  expiryDate?: string; 

  customerSignatoryName?: string; 
  createdAt: string; 
  updatedAt: string; 

  payments?: Payment[];

  uploadedBillOfLadingUrl?: string;
  editableInvoiceSpecificFields?: EditableInvoiceSpecificFields;
  editableBillOfLadingSpecificFields?: EditableBillOfLadingSpecificFields;
  editablePackingListSpecificFields?: EditablePackingListSpecificFields;
}

export interface NavLinkItem {
  href: string;
  label: string;
  icon: React.ElementType;
  active?: boolean; 
}

// --- Invoice Types ---
interface AddressInfo {
  name: string;
  addressLines: string[];
  taxId?: string;
}

interface InvoiceSalesDetail {
  portAtOrigin?: string;
  portOfArrival?: string;
  finalDestination?: string;
  reference?: string;
  paymentTerms?: string;
  vessel?: string;
  containers?: string;
  containerNo?: string;
  proformaRefNumber?: string;
}

export interface InvoiceData {
  proformaId: string; 
  invoiceNumber: string; 
  issuedAtPlace: string; 
  issuedAtDate: string; 
  company: Extract<CompanyName, 'Trade Evolution' | 'Successful Trade'>;
  
  soldTo: AddressInfo;
  shipTo: AddressInfo;

  currency: string; 
  items: ProformaItem[]; 

  salesDetail: InvoiceSalesDetail;
  
  subTotal: number;
  salesTax: number; 
  total: number;
  
  proformaNumber?: string;
}


// --- Bill of Lading (BOL) Types ---
export interface BOLParty {
  name: string;
  addressLines: string[];
  rfcTaxId?: string;
}

export interface BOLShippingAgent {
  name: string;
  rfc?: string;
  addressLines: string[];
  tel?: string;
  attn?: string;
}

export interface BOLContainerItem {
  containerNo: string; 
  sealNoMarksNumbers: string;
  numContainersOrPackages: string;
  kindOfPackagesDescription: string;
  grossWeightMeasurement: string; 
}

export interface BillOfLadingData {
  proformaId: string; 
  blNo: string;
  bookingNo: string;
  mocNv?: string; 

  logisticsCompany: { 
    name: string;
    logoUrl?: string;
  };

  shipper: BOLParty; 
  consignee: BOLParty; 
  notifyParty: BOLParty; 

  oceanVesselVoyNo: string;
  portOfLoading: string;
  placeOfReceipt: string;
  preCarriageBy: string;
  portOfDischarge: string;
  placeOfDelivery: string;
  finalDestinationMerchantRef: string;

  shippingAgentReferences?: BOLShippingAgent; 

  containerItems: BOLContainerItem[];
  particularsFurnishedByShipper: string[]; 

  totalPackagesWords: string;
  freightPayableAt: string;
  exRate: string;
  numOriginalBL: string; 
  placeAndDateOfIssue: string; 
  
  ladenOnBoardDate?: string; 
  signatureBy: string; 

  proformaIssuedDate?: string;
  proformaItems?: ProformaItem[];
  proformaClientName?: string;
  proformaClientAddress?: string;
  proformaShipToName?: string;
  proformaShipToAddress?: string;
}

// --- Packing List Types ---
export interface PackingListContainerItemDetail {
  descriptionOfGoods: string;
  piecesXPack: number; // e.g., 22
}

export interface PackingListContainer {
  containerNumber: string; 
  netWeight: number; 
  grossWeight: number; 
  items: PackingListContainerItemDetail[]; 
  totalPacks?: number; 
  totalPieces?: number; 
  totalVolumeM3?: number; 
}

export interface PackingListData {
  packingListName: string;
  proformaId: string;
  company: Extract<CompanyName, 'Trade Evolution' | 'Successful Trade'>;
  
  // Header info
  issuedAtPlace: string;
  issuedAtDate: string;
  
  // Client info
  billTo: AddressInfo;
  shipTo: AddressInfo;
  
  // Document references
  invoiceRef?: string; 
  custRef?: string;
  piRef?: string;
  
  // Route details
  portAtOrigin: string;
  portOfArrival: string;
  finalDestination: string;
  containers?: string;
  
  // Product & Notes
  productSummary?: string; 
  packingListNotes?: string; 

  // Container breakdown
  containerItems: PackingListContainer[];

  // --- Fields specific to TradeEvolution template ---
  salesOrderNumber?: string; 
  companyName?: string;
  companyTaxId?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyWebsite?: string;
}
