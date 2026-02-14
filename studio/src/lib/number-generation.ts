
// src/lib/number-generation.ts
import { format, getYear, parseISO, parse } from 'date-fns';
import type { Proforma, CompanyName } from '@/types';

// --- COUNTERS ---
// In a real database, these would be stored and managed server-side.
// For the prototype, we simulate them here.
let treInvoiceFolioCounter = 177;
const stlProformaFolioStart = 7573; // Set a base folio number to start from for a new year

// --- EXPORTED FUNCTIONS ---

/**
 * Generates a new proforma number based on company, date, and existing proformas.
 * @param company The company for which the proforma is being created.
 * @param issuedDate The date the proforma is being issued.
 * @param allProformas An array of all existing proformas to calculate counters.
 */
export function generateProformaNumber(
  company: CompanyName,
  issuedDate: Date,
  allProformas: Proforma[]
): string {
  const datePartDDMMYY = format(issuedDate, 'ddMMyy');
  const datePartYY = format(issuedDate, 'yy');

  if (company === 'Trade Evolution') {
    // Filter proformas for the same company and date
    const dailyProformas = allProformas.filter(p => {
        if (p.company !== 'Trade Evolution' || !p.proformaNumber.startsWith(`TRE${datePartDDMMYY}`)) {
            return false;
        }
        try {
            // Check if the date part of the proforma number matches
            return p.issuedDate.startsWith(format(issuedDate, 'yyyy-MM-dd'));
        } catch {
            return false;
        }
    });

    const newCounter = dailyProformas.length + 1;
    return `TRE${datePartDDMMYY}-${newCounter.toString().padStart(2, '0')}`;
  }

  // Logic for 'Successful Trade'
  if (company === 'Successful Trade') {
     // Find the highest counter for the given year
    const yearlyProformas = allProformas.filter(p => 
        p.company === 'Successful Trade' && p.proformaNumber.startsWith(`STL${datePartYY}`)
    );

    let maxCounter = 0;
    if (yearlyProformas.length > 0) {
        yearlyProformas.forEach(p => {
            const numPartStr = p.proformaNumber.substring(5); // STL<YY><XXXX>
            if(numPartStr) {
                const numPart = parseInt(numPartStr, 10);
                if (!isNaN(numPart) && numPart > maxCounter) {
                    maxCounter = numPart;
                }
            }
        });
    }
    
    // If no proformas for this year, start from the base folio, otherwise increment from max
    const newCounter = maxCounter >= stlProformaFolioStart ? maxCounter + 1 : stlProformaFolioStart;

    return `STL${datePartYY}${newCounter}`;
  }

  // Fallback for unknown company
  return `UNKNOWN-${datePartDDMMYY}`;
}


/**
 * Generates an invoice number from a proforma.
 * @param proforma The source proforma document.
 */
export function generateInvoiceNumber(proforma: Proforma): string {
    // Always prioritize an already-saved editable number
    if (proforma.editableInvoiceSpecificFields?.invoiceNumber) {
        return proforma.editableInvoiceSpecificFields.invoiceNumber;
    }

    if (proforma.company === 'Trade Evolution') {
        const datePart = proforma.proformaNumber.substring(3, 9); // TRE<DDMMYY>-XX -> DDMMYY
        
        treInvoiceFolioCounter++; // Increment the global folio
        const folio = `A${treInvoiceFolioCounter.toString().padStart(3,'0')}`;
        
        return folio; // Return only the folio number
    }
    
    // Successful Trade
    // Example: STL257573 -> ST25-INV7573
    const yearPart = proforma.proformaNumber.substring(3, 5); // STL<YY>XXXX -> YY
    const proformaConsecutive = proforma.proformaNumber.substring(5); // STL<YY>XXXX -> XXXX
    return `ST${yearPart}-INV${proformaConsecutive}`;
}


/**
 * Generates a Packing List name/title from a proforma.
 * @param proforma The source proforma document.
 */
export function generatePackingListName(proforma: Proforma): string {
    if (proforma.company === 'Trade Evolution') {
        // Example: TRE250725-01 -> TRE250725-01_PL
        return `${proforma.proformaNumber}_PL`;
    }

    // Successful Trade
    // Example: STL257573 -> ST-PL257573
    const proformaIdentifier = proforma.proformaNumber.substring(3); // STL<257573> -> 257573
    return `ST-PL${proformaIdentifier}`;
}
