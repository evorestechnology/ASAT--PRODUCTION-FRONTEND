import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
 * Generate and download a dynamic, accurate PDF Tax Invoice
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

    // Customer resolution (strictly avoids UUIDs or placeholder defaults)
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

    let shipping = null;
    if (order.shipping_amount !== undefined && order.shipping_amount !== null && !isNaN(order.shipping_amount)) {
        shipping = Number(order.shipping_amount);
    } else if (order.shippingAmount !== undefined && order.shippingAmount !== null && !isNaN(order.shippingAmount)) {
        shipping = Number(order.shippingAmount);
    } else if (pricingHistory.shipping_amount !== undefined && !isNaN(pricingHistory.shipping_amount)) {
        shipping = Number(pricingHistory.shipping_amount);
    }

    let tax = null;
    if (order.tax_amount !== undefined && order.tax_amount !== null && !isNaN(order.tax_amount)) {
        tax = Number(order.tax_amount);
    } else if (order.taxAmount !== undefined && order.taxAmount !== null && !isNaN(order.taxAmount)) {
        tax = Number(order.taxAmount);
    } else if (pricingHistory.tax_amount !== undefined && !isNaN(pricingHistory.tax_amount)) {
        tax = Number(pricingHistory.tax_amount);
    }

    // Intelligently infer unstated charges so subtotal + shipping + tax is always mathematically sound
    if (shipping === null) {
        const difference = Math.max(0, grandTotal - itemsSubtotal);
        if (tax !== null) {
            shipping = Math.max(0, difference - tax);
        } else {
            shipping = difference;
            tax = 0;
        }
    }
    if (tax === null) {
        tax = Math.max(0, grandTotal - itemsSubtotal - shipping);
    }

    let discount = 0;
    const computedSum = itemsSubtotal + shipping + tax;
    if (computedSum > grandTotal + 0.01) {
        discount = Math.round((computedSum - grandTotal) * 100) / 100;
    }

    // --- TOP ACCENT BAR ---
    doc.setFillColor(197, 160, 89); // Luxury Gold
    doc.rect(0, 0, pageWidth, 4, 'F');

    // --- HEADER SECTION ---
    let startY = 15;

    // Brand Left
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(30, 34, 41);
    doc.text("ASAT", 14, startY);

    doc.setFontSize(7.5);
    doc.setTextColor(197, 160, 89);
    doc.text("DESIGNER PARADISE", 14, startY + 4.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(60, 65, 75);
    doc.text("Evores Technology LLP", 14, startY + 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 105, 115);
    doc.text("GSTIN: 37AAMFE8739J1ZQ  |  State: Andhra Pradesh (37)", 14, startY + 14.5);
    doc.text("Email: support@asat.shop  |  Web: www.asat.shop", 14, startY + 18.5);

    // Right Header: TAX INVOICE
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(197, 160, 89);
    doc.text("TAX INVOICE", pageWidth - 14, startY, { align: "right" });

    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(120, 125, 135);
    doc.text("ORIGINAL FOR RECIPIENT", pageWidth - 14, startY + 4.5, { align: "right" });

    // Status Pill Badge
    let statusColor = [40, 167, 69]; // Default green for paid/completed
    if (rawStatus === 'CANCELLED') statusColor = [220, 53, 69];
    else if (rawStatus === 'PENDING') statusColor = [230, 140, 20];
    else if (rawStatus === 'SHIPPED' || rawStatus === 'MANUFACTURING') statusColor = [0, 123, 255];

    const badgeText = rawStatus;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    const badgeWidth = doc.getTextWidth(badgeText) + 8;
    const badgeX = pageWidth - 14 - badgeWidth;
    const badgeY = startY + 7.5;

    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.roundedRect(badgeX, badgeY, badgeWidth, 5.5, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(badgeText, badgeX + (badgeWidth / 2), badgeY + 4, { align: "center" });

    // Invoice Meta Right-aligned
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(40, 44, 52);
    doc.text(`Invoice No: #${orderId}`, pageWidth - 14, startY + 17.5, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(90, 95, 105);
    doc.text(`Invoice Date: ${orderDate}`, pageWidth - 14, startY + 22, { align: "right" });
    if (paymentId) {
        const displayPid = paymentId.length > 20 ? `${paymentId.slice(0, 20)}...` : paymentId;
        doc.text(`Payment Ref: ${displayPid}`, pageWidth - 14, startY + 26, { align: "right" });
    }

    // Divider Rule
    const dividerY = startY + 30;
    doc.setDrawColor(225, 228, 235);
    doc.setLineWidth(0.3);
    doc.line(14, dividerY, pageWidth - 14, dividerY);

    // --- BILL TO / SHIP TO & ORDER DETAILS CARDS ---
    const cardY = dividerY + 4;
    const cardWidth = (pageWidth - 28 - 6) / 2; // Two columns with 6mm gap
    const leftX = 14;
    const rightX = 14 + cardWidth + 6;

    // Card 1: Bill To
    doc.setFillColor(250, 251, 253);
    doc.setDrawColor(230, 233, 240);
    doc.roundedRect(leftX, cardY, cardWidth, 34, 1.5, 1.5, 'FD');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(197, 160, 89);
    doc.text("BILL TO / SHIP TO", leftX + 4, cardY + 5.5);

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

    // Card 2: Order Metadata
    doc.setFillColor(250, 251, 253);
    doc.roundedRect(rightX, cardY, cardWidth, 34, 1.5, 1.5, 'FD');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(197, 160, 89);
    doc.text("ORDER & DISPATCH DETAILS", rightX + 4, cardY + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(70, 75, 85);

    doc.text("Order Reference:", rightX + 4, cardY + 10.5);
    doc.setFont("helvetica", "bold");
    doc.text(String(orderId), rightX + 32, cardY + 10.5);

    doc.setFont("helvetica", "normal");
    doc.text("Order Date:", rightX + 4, cardY + 15);
    doc.text(orderDate, rightX + 32, cardY + 15);

    doc.text("Place of Supply:", rightX + 4, cardY + 19.5);
    doc.text(country, rightX + 32, cardY + 19.5);

    doc.text("Tracking ID:", rightX + 4, cardY + 24);
    doc.text(trackingId || 'Standard Dispatch', rightX + 32, cardY + 24);

    doc.text("Payment Mode:", rightX + 4, cardY + 28.5);
    doc.text(paymentId ? 'Prepaid / Online' : 'Online', rightX + 32, cardY + 28.5);

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
    if (finalY + 65 > pageHeight - 25) {
        doc.addPage();
        finalY = 20;
    }

    // --- FINANCIALS SUMMARY CARD (Right) ---
    const summaryWidth = 78;
    const summaryX = pageWidth - 14 - summaryWidth;
    let sY = finalY;

    doc.setFillColor(250, 251, 253);
    doc.setDrawColor(225, 228, 235);
    doc.roundedRect(summaryX, sY, summaryWidth, discount > 0 ? 44 : 38, 1.5, 1.5, 'FD');

    let lineY = sY + 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(90, 95, 105);
    doc.text("Items Subtotal:", summaryX + 4, lineY);
    doc.setTextColor(30, 34, 41);
    doc.text(formatCurrency(itemsSubtotal), summaryX + summaryWidth - 4, lineY, { align: "right" });

    if (discount > 0) {
        lineY += 5.5;
        doc.setTextColor(90, 95, 105);
        doc.text("Promo Discount:", summaryX + 4, lineY);
        doc.setTextColor(40, 167, 69);
        doc.text(`- ${formatCurrency(discount)}`, summaryX + summaryWidth - 4, lineY, { align: "right" });
    }

    lineY += 5.5;
    doc.setTextColor(90, 95, 105);
    doc.text("Shipping & Handling:", summaryX + 4, lineY);
    doc.setTextColor(30, 34, 41);
    doc.text(shipping > 0 ? formatCurrency(shipping) : "FREE (Rs. 0.00)", summaryX + summaryWidth - 4, lineY, { align: "right" });

    lineY += 5.5;
    doc.setTextColor(90, 95, 105);
    doc.text("Estimated GST / Taxes:", summaryX + 4, lineY);
    doc.setTextColor(30, 34, 41);
    doc.text(tax > 0 ? formatCurrency(tax) : "Included in Total", summaryX + summaryWidth - 4, lineY, { align: "right" });

    lineY += 4;
    doc.setDrawColor(197, 160, 89);
    doc.setLineWidth(0.4);
    doc.line(summaryX + 4, lineY, summaryX + summaryWidth - 4, lineY);

    lineY += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 34, 41);
    doc.text("Grand Total (INR):", summaryX + 4, lineY);
    doc.setFontSize(10.5);
    doc.setTextColor(197, 160, 89);
    doc.text(formatCurrency(grandTotal), summaryX + summaryWidth - 4, lineY, { align: "right" });

    // --- LEFT NOTES & AMOUNT IN WORDS ---
    const notesWidth = summaryX - 14 - 8;
    let nY = finalY + 4;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(60, 65, 75);
    doc.text("Amount in Words:", 14, nY);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(40, 44, 52);
    const words = numberToWordsINR(grandTotal);
    const wordsLines = doc.splitTextToSize(words, notesWidth);
    doc.text(wordsLines, 14, nY + 4.5);

    nY += 6 + (wordsLines.length * 4);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 105, 115);
    doc.text("Terms & Tax Declarations:", 14, nY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(120, 125, 135);
    const notes = [
        "• All prices are inclusive of GST and applicable duties from our end.",
        "• For international shipments, destination import duties & taxes (if levied) are the responsibility of the recipient.",
        "• Return/exchange request window is 36 hours from confirmed delivery.",
        "• For queries, warranty, or customer assistance: support@asat.shop"
    ];
    let noteY = nY + 3.5;
    notes.forEach(nt => {
        doc.text(nt, 14, noteY);
        noteY += 3.5;
    });

    // --- FOOTER ON ALL PAGES ---
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Signatory on final page
        if (i === totalPages) {
            const sigY = pageHeight - 24;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(50, 55, 65);
            doc.text("For Evores Technology LLP", pageWidth - 14, sigY - 7, { align: "right" });

            doc.setFont("helvetica", "italic");
            doc.setFontSize(7.5);
            doc.setTextColor(120, 125, 135);
            doc.text("Authorized Signatory (Digital Stamp)", pageWidth - 14, sigY - 3, { align: "right" });
            doc.text("Computer-generated invoice. No physical signature required.", pageWidth - 14, sigY + 1, { align: "right" });
        }

        doc.setDrawColor(220, 224, 230);
        doc.setLineWidth(0.3);
        doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(130, 135, 145);
        doc.text("Evores Technology LLP  •  Brand: ASAT Designer Paradise  •  www.asat.shop", 14, pageHeight - 9);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 9, { align: "right" });
    }

    // --- DOWNLOAD / SAVE ---
    doc.save(`Invoice_${cleanOrderId}.pdf`);
};

