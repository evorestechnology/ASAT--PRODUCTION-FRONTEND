import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInvoice = (order) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header Fonts and Colors
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text("INVOICE", pageWidth - 14, 20, { align: "right" });

    // Company Information (Left)
    doc.setFontSize(14);
    doc.text("Evores Technology LLP", 14, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Brand: As Simple as That", 14, 27);
    doc.text("GSTIN: 37AAMFE8739J1ZQ", 14, 32);
    doc.text("IEC: ", 14, 37);

    // Bill From
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40);
    doc.text("Bill From:", 14, 50);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("Evores Technology LLP", 14, 55);
    doc.text("Andhra Pradesh, India", 14, 60);

    // Bill To
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40);
    doc.text("Bill To:", pageWidth / 2, 50);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(order.customerName || 'Customer', pageWidth / 2, 55);
    
    // Address wrapping
    const addressLines = doc.splitTextToSize(order.address || 'N/A', (pageWidth / 2) - 14);
    doc.text(addressLines, pageWidth / 2, 60);

    // Invoice Details (Right Aligned)
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const invoiceDetailsY = 32;
    doc.text(`Invoice Number: ${order.orderId || order.id}`, pageWidth - 14, invoiceDetailsY, { align: "right" });
    const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'N/A';
    doc.text(`Invoice Date: ${orderDate}`, pageWidth - 14, invoiceDetailsY + 5, { align: "right" });

    // Table Data preparation
    const tableBody = [];
    const items = order.items || [];
    
    items.forEach((item, index) => {
        tableBody.push([
            index === 0 ? (order.orderId || order.id) : '', // Only show order id on first row
            `${index + 1}. ${item.name}`,
            item.qty || 1,
            `Rs. ${(item.price * (item.qty || 1)).toLocaleString('en-IN')}`
        ]);
    });

    // Generate Table
    autoTable(doc, {
        startY: Math.max(60 + (addressLines.length * 5), 75), // Start below address
        head: [['Order ID', 'Items', 'Qty', 'Price']],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [197, 160, 89], textColor: 255 }, // Admin Gold
        styles: { fontSize: 9, cellPadding: 5 },
        columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 30, halign: 'right' }
        }
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    // Totals
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    
    // shippingAmount comes from order.shippingAmount or shipping_amount
    const shipping = Number(order.shippingAmount) || Number(order.shipping_amount) || 200; 
    
    // Calculate subtotal from items if needed
    const subtotal = items.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
    
    // In our DB we have totalAmount.
    const grandTotal = Number(order.totalAmount) || Number(order.total_amount) || (subtotal + shipping);

    doc.text("Shipping Charges:     ", pageWidth - 50, finalY);
    doc.text(`Rs. ${shipping.toLocaleString('en-IN')}`, pageWidth - 14, finalY, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(40);
    doc.text("Grand Total:", pageWidth - 50, finalY + 7);
    doc.text(`Rs. ${grandTotal.toLocaleString('en-IN')}`, pageWidth - 14, finalY + 7, { align: "right" });

    // Note
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(120);
    const noteText = "Note: the above is the price for all taxes included from our end, if you are importing it to your country then Import duties, customs taxes, and local fees (if any) are the responsibility of the recipient.";
    const splitNote = doc.splitTextToSize(noteText, pageWidth - 28);
    doc.text(splitNote, 14, finalY + 25);

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setDrawColor(200);
    doc.line(14, pageHeight - 30, pageWidth - 14, pageHeight - 30);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("Website: www.asat.shop", 14, pageHeight - 15);
    
    doc.setFont("helvetica", "italic");
    doc.text("Authorized Signature", pageWidth - 14, pageHeight - 15, { align: "right" });

    // Download
    doc.save(`Invoice_${order.orderId || order.id}.pdf`);
};
