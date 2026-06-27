import React from 'react';

const TermsModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const sections = [
        {
            title: "1. Order Cancellation Policy",
            content: [
                "All products available on As Simple as That are manufactured, customized, printed, embroidered, or sourced specifically for customer orders.",
                "Once an order has been successfully placed and payment has been confirmed, the order enters processing immediately.",
                "Therefore:",
                "• Order cancellations are not permitted after successful order placement.",
                "• Any cancellation request submitted after payment confirmation shall attract a cancellation fee equal to 100% of the order value.",
                "• Customers are advised to carefully review product specifications, sizing, colors, designs, shipping address, and contact information before placing an order."
            ]
        },
        {
            title: "2. Return Policy",
            content: [
                "As Simple as That follows a strict No Return Policy.",
                "Products shall not be accepted for return on the basis of:",
                "• Change of mind.",
                "• Incorrect size selected by the customer.",
                "• Color preference changes.",
                "• Personal dislike of the product.",
                "• Delayed delivery caused by courier partners or external circumstances.",
                "• Minor variations in color, texture, or appearance due to screen settings, photography, or manufacturing processes.",
                "Every product undergoes quality inspection before dispatch.",
                "Accordingly, customers acknowledge that all purchases made through the platform are final and non-returnable."
            ]
        },
        {
            title: "3. Refund Policy",
            content: [
                "Refunds shall not be provided for:",
                "• Customer cancellation requests.",
                "• Refused deliveries.",
                "• Incorrect product selections made by the customer.",
                "• Change-of-mind purchases.",
                "Refunds may only be issued if:",
                "• The product received is materially different from the item ordered.",
                "• The wrong product was shipped.",
                "• The product arrives with substantial manufacturing defects.",
                "• The shipment is lost and officially confirmed as lost by the logistics partner.",
                "Any approved refund shall be processed to the original payment method within 7–15 business days after verification."
            ]
        },
        {
            title: "4. Damaged or Incorrect Products",
            content: [
                "If a customer receives a damaged product, a defective product, or an incorrect product, the customer must notify As Simple as That customer support within 1-2 hours of delivery.",
                "The complaint must include:",
                "• Order number.",
                "• Clear photographs of the product.",
                "• Photographs of packaging and shipping label.",
                "• A brief description of the issue.",
                "Failure to report within the specified timeframe may result in rejection of the claim."
            ]
        },
        {
            title: "5. Shipping Policy",
            content: [
                "Shipping timelines are estimates and not guarantees.",
                "Delivery delays caused by weather conditions, customs clearance, government actions, strikes, force majeure events, or logistics providers shall not be grounds for cancellation, refund, or compensation.",
                "Customers are responsible for providing accurate delivery information."
            ]
        },
        {
            title: "6. International Orders",
            content: [
                "For international shipments:",
                "• Customers are responsible for any import duties, customs duties, taxes, VAT, GST, handling charges, brokerage fees, or government-imposed charges in the destination country.",
                "• Such charges are not included in the product price or shipping fee unless expressly stated.",
                "• Refusal to pay customs charges shall not qualify for a refund."
            ]
        }
    ];

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            zIndex: 9999, padding: '20px'
        }}>
            <div style={{
                background: 'white', padding: '30px', borderRadius: '12px', 
                width: '100%', maxWidth: '800px', maxHeight: '85vh', 
                overflowY: 'auto', position: 'relative',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}>
                <button onClick={onClose} style={{
                    position: 'absolute', top: '20px', right: '20px',
                    background: 'none', border: 'none', fontSize: '1.5rem', 
                    cursor: 'pointer', color: '#666'
                }}>
                    <i className="fas fa-times"></i>
                </button>

                <h1 style={{ fontFamily: "'Cinzel', serif", color: 'var(--gold)', textAlign: 'center', marginBottom: '30px' }}>TERMS &amp; CONDITIONS</h1>
                
                <div style={{ fontFamily: 'Montserrat, sans-serif', color: 'var(--dark)' }}>
                    <p style={{ marginBottom: '20px', fontSize: '0.9rem', lineHeight: '1.6' }}>
                        By accessing and using <strong>As Simple as That</strong>, you agree to be bound by the following terms, conditions, and policies. Please read them carefully before making any purchase.
                    </p>

                    {sections.map((section, idx) => (
                        <div key={idx} style={{ marginBottom: '25px' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--dark)', marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
                                {section.title}
                            </h2>
                            <div style={{ paddingLeft: '10px' }}>
                                {section.content.map((paragraph, pIdx) => (
                                    <p key={pIdx} style={{ 
                                        marginBottom: paragraph.startsWith('•') ? '6px' : '10px',
                                        marginLeft: paragraph.startsWith('•') ? '15px' : '0',
                                        fontSize: '0.85rem', 
                                        lineHeight: '1.5',
                                        color: '#444'
                                    }}>
                                        {paragraph}
                                    </p>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                
                <div style={{ textAlign: 'center', marginTop: '30px' }}>
                    <button onClick={onClose} style={{
                        padding: '12px 30px', background: 'var(--dark)', color: 'white',
                        border: 'none', borderRadius: '6px', fontFamily: "'Montserrat', sans-serif",
                        fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase'
                    }}>
                        I Understand
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TermsModal;
