import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LOGO_BASE64 } from './logoData.js';

/**
 * Format currency to Indian Rupees (Rs. X,XX,XXX.XX)
 */
function formatCurrency(val) {
    const num = Number(val) || 0;
    return `Rs. ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format date string safely
 */
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return String(dateStr);
        return d.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch {
        return String(dateStr);
    }
}

/**
 * Convert numerical amount into Indian currency in words
 */
function numberToWordsINR(amount) {
    if (!amount || isNaN(amount) || amount <= 0) return 'Zero Rupees Only';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function convertTwoDigits(n) {
        if (n < 20) return ones[n];
        return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    }

    function convertGroup(n) {
        let str = '';
        if (Math.floor(n / 100) > 0) {
            str += ones[Math.floor(n / 100)] + ' Hundred';
            if (n % 100 !== 0) str += ' and ';
        }
        if (n % 100 !== 0) {
            str += convertTwoDigits(n % 100);
        }
        return str;
    }

    const whole = Math.floor(amount);
    const paise = Math.round((amount - whole) * 100);

    let parts = [];
    let num = whole;

    const crore = Math.floor(num / 10000000);
    num %= 10000000;
    const lakh = Math.floor(num / 100000);
    num %= 100000;
    const thousand = Math.floor(num / 1000);
    num %= 1000;
    const hundred = num;

    if (crore > 0) parts.push(convertGroup(crore) + ' Crore');
    if (lakh > 0) parts.push(convertGroup(lakh) + ' Lakh');
    if (thousand > 0) parts.push(convertGroup(thousand) + ' Thousand');
    if (hundred > 0) parts.push(convertGroup(hundred));

    let result = parts.length > 0 ? parts.join(' ') + ' Rupees' : 'Zero Rupees';
    if (paise > 0) {
        result += ' and ' + convertTwoDigits(paise) + ' Paise';
    }
    return result + ' Only';
}

/**
 * Detect Indian State and determine GST classification (Intra-State vs Inter-State vs Export)
 */
function detectStateAndGst(address, country) {
    const isIndia = !country || country.trim().toLowerCase() === 'india';
    if (!isIndia) {
        return {
            isIndia: false,
            placeOfSupply: country || 'International',
            supplyType: 'Export of Goods (Zero Rated under LUT)',
            isAp: false,
            stateName: country || 'International',
            stateCode: '96'
        };
    }

    const addr = (address || '').toLowerCase();

    const states = [
        { name: 'Andhra Pradesh', code: '37', regex: /\b(andhra|ap|amaravati|visakhapatnam|vizag|vijayawada|guntur|tirupati|kurnool|nellore|kadapa|rajahmundry|kakinada|chittoor|anantapur)\b|5[1-3]\d{4}/i },
        { name: 'Telangana', code: '36', regex: /\b(telangana|hyderabad|secunderabad|warangal)\b|50\d{4}/i },
        { name: 'Maharashtra', code: '27', regex: /\b(maharashtra|mumbai|pune|nagpur|thane|nashik)\b|4[0-4]\d{4}/i },
        { name: 'Karnataka', code: '29', regex: /\b(karnataka|bangalore|bengaluru|mysore|mysuru|hubli)\b|5[6-9]\d{4}/i },
        { name: 'Tamil Nadu', code: '33', regex: /\b(tamil nadu|tamilnadu|chennai|coimbatore|madurai)\b|6[0-4]\d{4}/i },
        { name: 'Delhi', code: '07', regex: /\b(delhi|new delhi)\b|11\d{4}/i },
        { name: 'Uttar Pradesh', code: '09', regex: /\b(uttar pradesh|up|noida|lucknow|kanpur|varanasi|agra)\b|2[0-8]\d{4}/i },
        { name: 'Gujarat', code: '24', regex: /\b(gujarat|ahmedabad|surat|vadodara|rajkot)\b|3[6-9]\d{4}/i },
        { name: 'West Bengal', code: '19', regex: /\b(west bengal|wb|kolkata|howrah)\b|7[0-4]\d{4}/i },
        { name: 'Rajasthan', code: '08', regex: /\b(rajasthan|jaipur|jodhpur|udaipur)\b|3[0-4]\d{4}/i },
        { name: 'Kerala', code: '32', regex: /\b(kerala|kochi|cochin|trivandrum|thiruvananthapuram)\b|6[7-9]\d{4}/i },
        { name: 'Madhya Pradesh', code: '23', regex: /\b(madhya pradesh|mp|bhopal|indore)\b|4[5-8]\d{4}/i },
        { name: 'Haryana', code: '06', regex: /\b(haryana|gurgaon|gurugram|faridabad)\b|1[2-3]\d{4}/i },
        { name: 'Punjab', code: '03', regex: /\b(punjab|chandigarh|ludhiana|amritsar)\b|1[4-6]\d{4}/i },
        { name: 'Bihar', code: '10', regex: /\b(bihar|patna)\b|8[0-5]\d{4}/i },
        { name: 'Odisha', code: '21', regex: /\b(odisha|orissa|bhubaneswar|cuttack)\b|7[5-7]\d{4}/i }
    ];

    let detectedState = states.find(s => s.regex.test(addr));
    if (!detectedState) {
        detectedState = { name: 'Andhra Pradesh', code: '37' }; // Default to Andhra Pradesh if unspecified
    }

    const isIntraState = detectedState.code === '37';

    return {
        isIndia: true,
        isAp: isIntraState,
        placeOfSupply: `${detectedState.name} (${detectedState.code})`,
        stateName: detectedState.name,
        stateCode: detectedState.code,
        supplyType: isIntraState ? 'Intra-State Supply (CGST + SGST)' : 'Inter-State Supply (IGST)'
    };
}

/**
 * Generate and download an accurate, compliant PDF Tax Invoice
 * @param {Object} order - Full order data object (supports camelCase & snake_case)
 */
export const generateInvoice = (order) => {
    if (!order) {
        console.error("No order data provided to generateInvoice");
        return;
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // --- DATA NORMALIZATION ---
    const orderId = order.order_id || order.orderId || order.id || 'ASAT_ORD';
    const cleanOrderId = String(orderId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const orderDate = formatDate(order.created_at || order.createdAt || order.date);

    // Customer resolution (strictly avoids raw UUIDs or unformatted fallback)
    const rawCustomerName = order.customer_name || order.customerName || order.name || order.contactName || '';
    const customerName = (rawCustomerName && rawCustomerName.trim() && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i.test(rawCustomerName))
        ? rawCustomerName.trim()
        : (order.users?.email ? order.users.email.split('@')[0] : 'Valued Customer');

    const phone = order.phone || order.contact || order.customerPhone || '';
    const email = order.email || order.customerEmail || order.user_email || order.users?.email || '';
    const address = order.address || order.shippingAddress || order.shipping_address || 'Delivery address on record';
    const country = order.country || 'India';
    const trackingId = order.tracking_id || order.trackingId || '';
    const rawStatus = (order.status || 'CONFIRMED').toUpperCase();
    const paymentId = order.payment_id || order.paymentId || '';

    // Normalize items
    const rawItems = Array.isArray(order.items) ? order.items : [];
    const items = rawItems.map(item => {
        const qty = Math.max(1, Number(item.qty) || 1);
        const unitPrice = Number(item.price ?? item.user_price ?? item.unit_price ?? 0);
        return {
            name: item.name || item.title || 'Custom Apparel Item',
            size: item.size || 'Standard',
            color: item.colorName || item.color || '',
            printStyle: item.printStyle || (item.isMfgProduct ? 'Plain' : 'Printed'),
            designer: item.designerUsername && item.designerUsername !== 'anonymous' ? `@${item.designerUsername}` : '',
            qty,
            unitPrice,
            total: unitPrice * qty
        };
    });

    // Subtotal & Totals calculation
    const itemsSubtotal = items.reduce((sum, it) => sum + it.total, 0);
    const grandTotal = Number(order.total_amount ?? order.totalAmount ?? order.revenue ?? itemsSubtotal);

    // Accurate shipping & tax resolution without phantom defaults
    const pricingHistory = order.status_history?.[0]?.pricing || {};

    let shipping = 0;
    if (order.shipping_amount !== undefined && order.shipping_amount !== null && !isNaN(order.shipping_amount)) {
        shipping = Number(order.shipping_amount);
    } else if (order.shippingAmount !== undefined && order.shippingAmount !== null && !isNaN(order.shippingAmount)) {
        shipping = Number(order.shippingAmount);
    } else if (pricingHistory.shipping_amount !== undefined && !isNaN(pricingHistory.shipping_amount)) {
        shipping = Number(pricingHistory.shipping_amount);
    }

    let rawTax = 0;
    if (order.tax_amount !== undefined && order.tax_amount !== null && !isNaN(order.tax_amount)) {
        rawTax = Number(order.tax_amount);
    } else if (order.taxAmount !== undefined && order.taxAmount !== null && !isNaN(order.taxAmount)) {
        rawTax = Number(order.taxAmount);
    } else if (pricingHistory.tax_amount !== undefined && !isNaN(pricingHistory.tax_amount)) {
        rawTax = Number(pricingHistory.tax_amount);
    }

    // Infer unstated shipping if total exceeds subtotal
    const difference = Math.max(0, grandTotal - itemsSubtotal);
    if (!shipping && !rawTax && difference > 0) {
        shipping = difference;
    }

    let discount = 0;
    const computedSum = itemsSubtotal + shipping + rawTax;
    if (computedSum > grandTotal + 0.01) {
        discount = Math.round((computedSum - grandTotal) * 100) / 100;
    }

    // --- GST TAX & STATUTORY COMPUTATION ---
    const gstInfo = detectStateAndGst(address, country);
    const maxUnitPrice = items.reduce((max, it) => Math.max(max, it.unitPrice), 0);
    const defaultTaxRate = maxUnitPrice > 2500 ? 18 : 5; // Standard Indian Apparel GST Slabs (5% for <= 2500, 18% for > 2500)

    let taxableValue = 0;
    let totalTax = 0;
    let effectiveRate = defaultTaxRate;

    if (gstInfo.isIndia) {
        if (rawTax > 0) {
            totalTax = rawTax;
            taxableValue = Math.max(0, grandTotal - shipping - totalTax);
            if (taxableValue <= 0) taxableValue = Math.max(0, itemsSubtotal - discount);
            effectiveRate = Math.round((totalTax / (taxableValue || 1)) * 100) || defaultTaxRate;
        } else {
            // Price is inclusive of GST
            taxableValue = Math.round(((itemsSubtotal - discount) / (1 + defaultTaxRate / 100)) * 100) / 100;
            totalTax = Math.round(((itemsSubtotal - discount) - taxableValue) * 100) / 100;
            effectiveRate = defaultTaxRate;
        }
    } else {
        taxableValue = Math.max(0, itemsSubtotal - discount);
        totalTax = 0;
        effectiveRate = 0;
    }

    let cgstRate = 0, sgstRate = 0, igstRate = 0;
    let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;

    if (gstInfo.isIndia) {
        if (gstInfo.isAp) {
            cgstRate = effectiveRate / 2;
            sgstRate = effectiveRate / 2;
            cgstAmount = Math.round((totalTax / 2) * 100) / 100;
            sgstAmount = Math.round((totalTax - cgstAmount) * 100) / 100;
        } else {
            igstRate = effectiveRate;
            igstAmount = totalTax;
        }
    }

    // --- TOP ACCENT BAR ---
    doc.setFillColor(197, 160, 89); // Luxury Gold
    doc.rect(0, 0, pageWidth, 4, 'F');

    // --- HEADER SECTION ---
    // 1. Brand Logo Left (same as website)
    try {
        doc.addImage(LOGO_BASE64, 'PNG', 14, 8, 48, 48 / 3.622);
    } catch {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor(30, 34, 41);
        doc.text("ASAT", 14, 15);
        doc.setFontSize(7.5);
        doc.setTextColor(197, 160, 89);
        doc.text("DESIGNER PARADISE", 14, 19.5);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(50, 55, 65);
    doc.text("Evores Technology LLP", 14, 25.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 105, 115);
    doc.text("GSTIN: 37AAMFE8739J1ZQ  |  State: Andhra Pradesh (37)", 14, 29.5);
    doc.text("Email: contact@assimpleasthat.shop  |  Web: designerparadise.shop", 14, 33.5);

    // Right Header: TAX INVOICE
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(197, 160, 89);
    doc.text("TAX INVOICE", pageWidth - 14, 14, { align: "right" });

    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(120, 125, 135);
    doc.text("ORIGINAL FOR RECIPIENT", pageWidth - 14, 18.5, { align: "right" });

    // Invoice Meta Right-aligned
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(40, 44, 52);
    doc.text(`Invoice No: #${orderId}`, pageWidth - 14, 25.5, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.8);
    doc.setTextColor(90, 95, 105);
    doc.text(`Invoice Date: ${orderDate}`, pageWidth - 14, 29.5, { align: "right" });
    if (paymentId) {
        const displayPid = paymentId.length > 22 ? `${paymentId.slice(0, 22)}...` : paymentId;
        doc.text(`Payment Ref: ${displayPid}`, pageWidth - 14, 33.5, { align: "right" });
    }

    // Divider Rule
    const dividerY = 37.5;
    doc.setDrawColor(225, 228, 235);
    doc.setLineWidth(0.3);
    doc.line(14, dividerY, pageWidth - 14, dividerY);

    // --- CUSTOMER DETAILS & ORDER DETAILS CARDS ---
    const cardY = dividerY + 4;
    const cardWidth = (pageWidth - 28 - 6) / 2; // Two columns with 6mm gap
    const leftX = 14;
    const rightX = 14 + cardWidth + 6;

    // Card 1: Customer Details
    doc.setFillColor(250, 251, 253);
    doc.setDrawColor(230, 233, 240);
    doc.roundedRect(leftX, cardY, cardWidth, 34, 1.5, 1.5, 'FD');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(197, 160, 89);
    doc.text("CUSTOMER DETAILS", leftX + 4, cardY + 5.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 34, 41);
    doc.text(customerName, leftX + 4, cardY + 10.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(90, 95, 105);
    let contactY = cardY + 15;
    if (phone) {
        doc.text(`Phone: ${phone}`, leftX + 4, contactY);
        contactY += 4;
    }
    if (email) {
        doc.text(`Email: ${email}`, leftX + 4, contactY);
        contactY += 4;
    }

    const addrLines = doc.splitTextToSize(address, cardWidth - 8);
    doc.text(addrLines.slice(0, 2), leftX + 4, contactY);

    // Card 2: Order Metadata (without Tracking ID)
    doc.setFillColor(250, 251, 253);
    doc.roundedRect(rightX, cardY, cardWidth, 34, 1.5, 1.5, 'FD');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(197, 160, 89);
    doc.text("ORDER & DISPATCH DETAILS", rightX + 4, cardY + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(70, 75, 85);

    doc.text("Order Reference:", rightX + 4, cardY + 11.5);
    doc.setFont("helvetica", "bold");
    doc.text(String(orderId), rightX + 32, cardY + 11.5);

    doc.setFont("helvetica", "normal");
    doc.text("Order Date:", rightX + 4, cardY + 17.5);
    doc.text(orderDate, rightX + 32, cardY + 17.5);

    doc.text("Place of Supply:", rightX + 4, cardY + 23.5);
    doc.setFont("helvetica", "bold");
    doc.text(gstInfo.placeOfSupply, rightX + 32, cardY + 23.5);

    doc.setFont("helvetica", "normal");
    doc.text("Payment Mode:", rightX + 4, cardY + 29.5);
    doc.text(paymentId ? 'Prepaid / Online' : 'Online', rightX + 32, cardY + 29.5);

    // --- ITEMS TABLE ---
    const tableBody = items.map((item, idx) => {
        let specs = [];
        if (item.size) specs.push(`Size: ${item.size}`);
        if (item.color) specs.push(`Color: ${item.color}`);
        if (item.printStyle) specs.push(`Style: ${item.printStyle}`);
        if (item.designer) specs.push(`Designer: ${item.designer}`);

        const desc = specs.length > 0 ? `${item.name}\n${specs.join('  |  ')}` : item.name;

        return [
            String(idx + 1),
            desc,
            '6109',
            String(item.qty),
            formatCurrency(item.unitPrice),
            formatCurrency(item.total)
        ];
    });

    if (tableBody.length === 0) {
        tableBody.push(['1', 'Custom Garment', '6109', '1', formatCurrency(grandTotal), formatCurrency(grandTotal)]);
    }

    autoTable(doc, {
        startY: cardY + 38,
        head: [['#', 'Item Description & Specifications', 'HSN/SAC', 'Qty', 'Unit Price', 'Amount']],
        body: tableBody,
        theme: 'striped',
        headStyles: {
            fillColor: [197, 160, 89],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8.5,
            halign: 'left',
            cellPadding: 3.5
        },
        bodyStyles: {
            fontSize: 8,
            textColor: [40, 44, 52],
            cellPadding: 3.5
        },
        alternateRowStyles: {
            fillColor: [252, 252, 254]
        },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 18, halign: 'center' },
            3: { cellWidth: 14, halign: 'center' },
            4: { cellWidth: 28, halign: 'right' },
            5: { cellWidth: 28, halign: 'right' }
        },
        didParseCell: (data) => {
            if (data.section === 'head') {
                if (data.column.index === 0 || data.column.index === 2 || data.column.index === 3) {
                    data.cell.styles.halign = 'center';
                } else if (data.column.index === 4 || data.column.index === 5) {
                    data.cell.styles.halign = 'right';
                }
            }
        },
        margin: { left: 14, right: 14 }
    });

    let finalY = doc.lastAutoTable.finalY + 5;

    // Prevent page overflow for summary box & notes
    if (finalY + 82 > pageHeight - 25) {
        doc.addPage();
        finalY = 20;
    }

    // --- FINANCIALS SUMMARY CARD (Right Column) ---
    const summaryWidth = 80;
    const summaryX = pageWidth - 14 - summaryWidth;
    let sY = finalY;

    // Compute dynamic height for the summary card
    const taxLineCount = gstInfo.isIndia ? (gstInfo.isAp ? 2 : 1) : 1;
    const summaryLineCount = 4 + (discount > 0 ? 1 : 0) + taxLineCount;
    const summaryCardHeight = 14 + (summaryLineCount * 5.2);

    doc.setFillColor(250, 251, 253);
    doc.setDrawColor(225, 228, 235);
    doc.roundedRect(summaryX, sY, summaryWidth, summaryCardHeight, 1.5, 1.5, 'FD');

    let lineY = sY + 5.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(90, 95, 105);
    doc.text("Items Subtotal:", summaryX + 4, lineY);
    doc.setTextColor(30, 34, 41);
    doc.text(formatCurrency(itemsSubtotal), summaryX + summaryWidth - 4, lineY, { align: "right" });

    if (discount > 0) {
        lineY += 5;
        doc.setTextColor(90, 95, 105);
        doc.text("Promo Discount:", summaryX + 4, lineY);
        doc.setTextColor(40, 167, 69);
        doc.text(`- ${formatCurrency(discount)}`, summaryX + summaryWidth - 4, lineY, { align: "right" });
    }

    lineY += 5;
    doc.setTextColor(90, 95, 105);
    doc.text("Net Taxable Value:", summaryX + 4, lineY);
    doc.setTextColor(30, 34, 41);
    doc.text(formatCurrency(taxableValue), summaryX + summaryWidth - 4, lineY, { align: "right" });

    // Detailed GST Lines in summary box
    if (gstInfo.isIndia) {
        if (gstInfo.isAp) {
            lineY += 5;
            doc.setTextColor(90, 95, 105);
            doc.text(`CGST (${cgstRate}%):`, summaryX + 4, lineY);
            doc.setTextColor(30, 34, 41);
            doc.text(formatCurrency(cgstAmount), summaryX + summaryWidth - 4, lineY, { align: "right" });

            lineY += 5;
            doc.setTextColor(90, 95, 105);
            doc.text(`SGST (${sgstRate}%):`, summaryX + 4, lineY);
            doc.setTextColor(30, 34, 41);
            doc.text(formatCurrency(sgstAmount), summaryX + summaryWidth - 4, lineY, { align: "right" });
        } else {
            lineY += 5;
            doc.setTextColor(90, 95, 105);
            doc.text(`IGST (${igstRate}%):`, summaryX + 4, lineY);
            doc.setTextColor(30, 34, 41);
            doc.text(formatCurrency(igstAmount), summaryX + summaryWidth - 4, lineY, { align: "right" });
        }
    } else {
        lineY += 5;
        doc.setTextColor(90, 95, 105);
        doc.text("Export GST (0%):", summaryX + 4, lineY);
        doc.setTextColor(30, 34, 41);
        doc.text("Rs. 0.00 (LUT)", summaryX + summaryWidth - 4, lineY, { align: "right" });
    }

    lineY += 5;
    doc.setTextColor(90, 95, 105);
    doc.text("Shipping & Handling:", summaryX + 4, lineY);
    doc.setTextColor(30, 34, 41);
    doc.text(shipping > 0 ? formatCurrency(shipping) : "FREE (Rs. 0.00)", summaryX + summaryWidth - 4, lineY, { align: "right" });

    lineY += 4;
    doc.setDrawColor(197, 160, 89);
    doc.setLineWidth(0.4);
    doc.line(summaryX + 4, lineY, summaryX + summaryWidth - 4, lineY);

    lineY += 5.5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 34, 41);
    doc.text("Grand Total (INR):", summaryX + 4, lineY);
    doc.setFontSize(10.5);
    doc.setTextColor(197, 160, 89);
    doc.text(formatCurrency(grandTotal), summaryX + summaryWidth - 4, lineY, { align: "right" });

    // --- LEFT COLUMN: AMOUNT IN WORDS, GST STATUTORY BOX & DECLARATIONS ---
    // Strictly confine width so text NEVER overflows or touches summaryX!
    const notesWidth = 92; // 14mm to 106mm, leaving 10mm gap before summaryX (116mm)
    let curY = finalY;

    // 1. Amount in Words
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(60, 65, 75);
    doc.text("Amount in Words:", 14, curY + 4);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(40, 44, 52);
    const words = numberToWordsINR(grandTotal);
    const wordsLines = doc.splitTextToSize(words, notesWidth);
    doc.text(wordsLines, 14, curY + 8);

    curY += 9 + (wordsLines.length * 3.8);

    // 2. GST Statutory & Compliance Details Card
    const gstBoxHeight = 25;
    doc.setFillColor(248, 249, 252);
    doc.setDrawColor(225, 228, 235);
    doc.roundedRect(14, curY, notesWidth, gstBoxHeight, 1.5, 1.5, 'FD');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(197, 160, 89);
    doc.text("GST STATUTORY & COMPLIANCE DETAILS", 14 + 3.5, curY + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(70, 75, 85);
    doc.text("• Supplier GSTIN: 37AAMFE8739J1ZQ | Andhra Pradesh (37)", 14 + 3.5, curY + 9);
    doc.text(`• Place of Supply: ${gstInfo.placeOfSupply} | HSN Code: 6109`, 14 + 3.5, curY + 13.5);
    doc.text(`• Supply Nature: ${gstInfo.supplyType}`, 14 + 3.5, curY + 18);
    doc.text(`• Net Taxable: ${formatCurrency(taxableValue)} | Total Tax: ${formatCurrency(totalTax)}`, 14 + 3.5, curY + 22.5);

    curY += gstBoxHeight + 5;

    // 3. Terms & Tax Declarations (With splitTextToSize on EVERY line, no overlap)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 105, 115);
    doc.text("Terms & Tax Declarations:", 14, curY);

    curY += 3.8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(120, 125, 135);

    const notes = [
        "• All prices are inclusive of GST and applicable duties from our end.",
        "• For international shipments, destination import duties & taxes (if levied) are the responsibility of the recipient.",
        "• Return/exchange request window is 36 hours from confirmed delivery.",
        "• For queries, warranty, or customer assistance: contact@assimpleasthat.shop"
    ];

    notes.forEach(nt => {
        const wrapped = doc.splitTextToSize(nt, notesWidth);
        doc.text(wrapped, 14, curY);
        curY += (wrapped.length * 3.4);
    });

    // --- FOOTER ON ALL PAGES ---
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Signatory on final page (Removed Authorized Signatory and Digital Stamp line)
        if (i === totalPages) {
            const sigY = pageHeight - 22;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(50, 55, 65);
            doc.text("For Evores Technology LLP", pageWidth - 14, sigY - 2, { align: "right" });

            doc.setFont("helvetica", "italic");
            doc.setFontSize(7.2);
            doc.setTextColor(120, 125, 135);
            doc.text("Computer-generated invoice. No physical signature required.", pageWidth - 14, sigY + 2, { align: "right" });
        }

        doc.setDrawColor(220, 224, 230);
        doc.setLineWidth(0.3);
        doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(130, 135, 145);
        doc.text("Evores Technology LLP  •  Brand: ASAT Designer Paradise  •  designerparadise.shop", 14, pageHeight - 9);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 9, { align: "right" });
    }

    // --- DOWNLOAD / SAVE ---
    doc.save(`Invoice_${cleanOrderId}.pdf`);
};
