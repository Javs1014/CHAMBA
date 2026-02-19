// src/components/invoice/invoice-document.tsx
'use client';
import type { InvoiceData } from '@/types';
import { format, parseISO } from 'date-fns';
import { SuccessfulTradeLogo } from '../proforma/successful-trade-logo';
import { companyDetails } from '@/config/company-details';
import { useState, useEffect } from 'react';

interface InvoiceDocumentProps {
    data: InvoiceData;
}

export function InvoiceDocument({ data }: InvoiceDocumentProps) {
    if (data.company === 'Successful Trade') {
        return <SuccessfulTradeInvoice data={data} company={companyDetails['Successful Trade']} />;
    }

    // Default to Trade Evolution template
    return <TradeEvolutionInvoice data={data} company={companyDetails['Trade Evolution']} />;
}

const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
        return format(parseISO(dateString), 'MMMM d, yyyy');
    } catch (error) {
        return dateString;
    }
};

const formatCurrency = (amount: number | undefined, decimals = 2) => {
    if (amount === undefined) return '0.00';
    return amount.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

// --- Successful Trade Invoice Template ---
function SuccessfulTradeInvoice({ data, company }: { data: InvoiceData, company: typeof companyDetails['Successful Trade'] }) {
    return (
        <div className="bg-card p-8 shadow-lg rounded-md w-full max-w-4xl mx-auto my-8 font-sans text-sm print:shadow-none">
            <SuccessfulTradeLogo className="mb-6 h-auto" />

            {/* Title and Invoice Info */}
            <div className="flex justify-end mb-6">
                <div className="w-1/2">
                    <h2 className="text-xl font-bold text-right mb-2">INVOICE</h2>
                    <div className="grid grid-cols-2 gap-x-4 text-sm">
                        <span className="font-bold">Invoice #</span><span className="">{data.invoiceNumber}</span>
                        <span className="font-bold">DATE</span><span className="">{formatDate(data.issuedAtDate)}</span>
                        <span className="font-bold">CURRENCY</span><span className="">{data.currency.replace(' DOLLAR', 'S')}</span>
                        <span className="font-bold">CUST. REF #</span><span className="">{data.salesDetail.reference || ''}</span>
                    </div>
                </div>
            </div>

            {/* Bill To / Ship To */}
            <div className="grid grid-cols-2 gap-8 mb-4">
                <div>
                    <p className="font-bold mb-1">BILL TO:</p>
                    <p className="font-semibold">{data.soldTo.name}</p>
                    <p className="whitespace-pre-wrap">{data.soldTo.addressLines.join('\n')}</p>
                    {data.soldTo.taxId && <p>Tax ID: {data.soldTo.taxId}</p>}
                </div>
                <div>
                    <p className="font-bold mb-1">SHIP TO:</p>
                    <p className="font-semibold">{data.shipTo.name}</p>
                    <p className="whitespace-pre-wrap">{data.shipTo.addressLines.join('\n')}</p>
                    {data.shipTo.taxId && <p>Tax ID: {data.shipTo.taxId}</p>}
                </div>
            </div>

            {/* Items Table */}
            <div>
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-[#DCF2D9]">
                            <th className="p-2 text-left font-bold w-[10%]">QTY.</th>
                            <th className="p-2 text-left font-bold w-[10%]">UNIT</th>
                            <th className="p-2 text-left font-bold w-[55%]">DESCRIPTION</th>
                            <th className="p-2 text-right font-bold w-[12.5%]">UNIT PRICE</th>
                            <th className="p-2 text-right font-bold w-[12.5%]">AMOUNT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.items.map((item, index) => (
                            <tr key={index} className="border-b">
                                <td className="p-2 align-top">{item.quantity}</td>
                                <td className="p-2 align-top">{item.unit}</td>
                                <td className="p-2 align-top whitespace-pre-wrap">
                                    <b>{item.productName}</b>
                                    {item.description && <p>{item.description}</p>}
                                </td>
                                <td className="p-2 text-right align-top">{formatCurrency(item.unitPrice, 3)}</td>
                                <td className="p-2 text-right align-top">{formatCurrency(item.totalPrice)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end mt-2">
                <div className="w-1/3">
                    <div className="flex justify-between">
                        <span>SUBTOTAL</span>
                        <span>{formatCurrency(data.subTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>TAX</span>
                        <span>{formatCurrency(data.salesTax)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t mt-1 pt-1">
                        <span>TOTAL</span>
                        <span>{formatCurrency(data.total)}</span>
                    </div>
                </div>
            </div>

            {/* Bank & Remarks */}
            <div className="grid grid-cols-2 gap-8 mt-16 pt-4 border-t border-black">
                <div>
                    <p className="font-bold mb-2">BANK DETAILS</p>
                    <p>Account holder: {company.bankDetails.accountHolder}</p>
                    <p>Account number: {company.bankDetails.accountNumber}</p>
                    <p>SWIFT: {company.bankDetails.swift}</p>
                    <p>Bank name: {company.bankDetails.bankName}</p>
                    <p>Bank address: {company.bankDetails.bankAddress}</p>
                </div>
                <div>
                    <p className="font-bold mb-2 text-right">REMARKS</p>
                    <div className="grid grid-cols-[max-content_1fr] gap-x-2 gap-y-0.5 justify-end text-right">
                        <span>Port of Origin:</span><span className="font-medium text-left">{data.salesDetail.portAtOrigin || 'N/A'}</span>
                        <span>Port of Arrival:</span><span className="font-medium text-left">{data.salesDetail.portOfArrival || 'N/A'}</span>
                        <span>Final Destination:</span><span className="font-medium text-left">{data.salesDetail.finalDestination || 'N/A'}</span>
                        <span>Containers:</span><span className="font-medium text-left">{data.salesDetail.containers || 'N/A'}</span>
                        <span>PI # Reference:</span><span className="font-medium text-left">{data.salesDetail.proformaRefNumber || 'N/A'}</span>
                        <span>Payment Terms:</span><span className="font-medium text-left">{data.salesDetail.paymentTerms || 'N/A'}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-12 pt-4 border-t border-black text-xs">
                <p className="font-bold">{company.name} (UEN: {company.uen})</p>
                <p>{company.address}</p>
                <p>Tel: {company.phone} | Web: {company.website}</p>
                <p className="mt-2 text-[10.5px] italic text-gray-600">{company.footerText}</p>
            </div>
            <style jsx global>{`
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print\\:shadow-none { box-shadow: none !important; }
          }
        `}</style>
        </div>
    );
}

// --- Trade Evolution Invoice Template ---
function TradeEvolutionInvoice({ data, company }: { data: InvoiceData, company: typeof companyDetails['Trade Evolution'] }) {
    const currencySymbol = data.currency.startsWith('USD') ? '$' : '';
    const logoBase64 = 'data:image/png;base64,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';
    return (
        <div className="bg-card p-10 shadow-lg rounded-md w-full max-w-4xl mx-auto my-8 font-sans text-xs print:shadow-none" style={{ fontFamily: 'Calibri, sans-serif' }}>
            <style jsx global>{`
                .calibri-font { font-family: 'Calibri', sans-serif; }
                .blue-line { border-top: 2px solid #0B5E8E; }
                .label { font-weight: bold; text-transform: uppercase; }
            `}</style>

            <div className="flex justify-between items-start mb-4">
                <div className="calibri-font">
                    <img src={logoBase64} alt="Trade Evolution Logo" style={{ width: '150px', height: 'auto' }} />
                </div>
                <div className="text-right text-[10px] text-[#0B5E8E] calibri-font">
                    <p>TradeEvolution OÜ &nbsp;&nbsp; TAX ID {company.taxId} &nbsp;&nbsp; Phone {company.phone}</p>
                    <p>ADDRESS: {company.address}, Estonia</p>
                </div>
            </div>

            <div className="blue-line mb-2"></div>

            <div className="flex justify-between items-start calibri-font">
                <div>
                    <p><span className="label">Issued at:</span> {data.issuedAtPlace}, {formatDate(data.issuedAtDate)}</p>
                </div>
                <div className="text-right">
                    <p className="label text-[#0B5E8E] text-sm">Invoice</p>
                    <p className="text-base">{data.invoiceNumber}</p>
                </div>
            </div>

            <div className="blue-line my-2"></div>

            <div className="grid grid-cols-2 gap-4 calibri-font">
                <div>
                    <p><span className="label">Sold to:</span> {data.soldTo.name}</p>
                    <p><span className="label">Address:</span> <span className="whitespace-pre-wrap">{data.soldTo.addressLines.join('\n')}</span></p>
                    <p><span className="label">Tax ID:</span> {data.soldTo.taxId}</p>
                </div>
                <div>
                    <p><span className="label">Ship to:</span> {data.shipTo.name}</p>
                    <p><span className="label">Address:</span> <span className="whitespace-pre-wrap">{data.shipTo.addressLines.join('\n')}</span></p>
                    <p><span className="label">Tax ID:</span> {data.shipTo.taxId}</p>
                </div>
            </div>

            <div className="text-right calibri-font mt-1"><strong>Currency:</strong> {data.currency}</div>
            <div className="blue-line my-2"></div>

            <table className="w-full border-collapse calibri-font">
                <thead>
                    <tr>
                        <th className="text-left label text-[#0B5E8E] w-[8%] pb-1">QTY.</th>
                        <th className="text-left label text-[#0B5E8E] w-[12%] pb-1">UNIT</th>
                        <th className="text-left label text-[#0B5E8E] w-[48%] pb-1">DESCRIPTION</th>
                        <th className="text-left label text-[#0B5E8E] w-[16%] pb-1">UNIT PRICE</th>
                        <th className="text-left label text-[#0B5E8E] w-[16%] pb-1">EXT. PRICE</th>
                    </tr>
                </thead>
                <tbody>
                    {data.items.map((item, index) => (
                        <tr key={index} className="border-b border-gray-200">
                            <td className="py-1 align-top">{item.quantity}</td>
                            <td className="py-1 align-top">{item.unit}</td>
                            <td className="py-1 align-top">
                                <p className="font-bold">{item.productName}</p>
                                <p className="text-[10px] whitespace-pre-wrap">{item.description}</p>
                            </td>
                            <td className="py-1 align-top">{currencySymbol}{formatCurrency(item.unitPrice, 3)}</td>
                            <td className="py-1 align-top">{currencySymbol}{formatCurrency(item.totalPrice)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="blue-line my-2"></div>

            <div className="grid grid-cols-2 gap-8 mt-2 calibri-font">
                <div>
                    <p className="label">SALES DETAIL</p>
                    <p>Port at Origin: {data.salesDetail.portAtOrigin}</p>
                    <p>Port of Arrival: {data.salesDetail.portOfArrival}</p>
                    <p>Final Destination: {data.salesDetail.finalDestination}</p>
                    <p>Proforma Ref #: {data.salesDetail.proformaRefNumber}</p>
                </div>
                <div>
                    <p>Vessel: {data.salesDetail.vessel}</p>
                    <p>Containers: {data.salesDetail.containers}</p>
                    <p>Container No.: {data.salesDetail.containerNo}</p>
                </div>
            </div>

            <div className="flex justify-end mt-2 calibri-font">
                <div className="w-48 text-right font-bold">
                    <div className="flex justify-between"><span>SUBTOTAL</span><span>{currencySymbol}{formatCurrency(data.subTotal)}</span></div>
                    <div className="flex justify-between"><span>TAX</span><span>{currencySymbol}{formatCurrency(data.salesTax)}</span></div>
                    <div className="flex justify-between"><span>TOTAL</span><span>{currencySymbol}{formatCurrency(data.total)}</span></div>
                </div>
            </div>

            <div className="mt-4 calibri-font text-[10.5px]">
                <p><strong>USD Account Details:</strong></p>
                <p>Account holder: {company.usdAccountDetails.accountHolder}</p>
                <p>Wire routing number: {company.usdAccountDetails.wireRoutingNumber}</p>
                <p>Account number: {company.usdAccountDetails.accountNumber}</p>
                <p>Account type: {company.usdAccountDetails.accountType}</p>
                <p>SWIFT Code: {company.usdAccountDetails.swiftCode}</p>
                <p className="whitespace-pre-wrap">Bank address: {company.usdAccountDetails.bankAddress.join('\n')}</p>
            </div>
        </div>
    );
}
