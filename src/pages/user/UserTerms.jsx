import React, { useEffect } from 'react';
import BackButton from '../../components/BackButton';

function UserTerms() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const termsData = [
        {
            category: "I. Marketplace Model",
            subsections: [
                {
                    subtitle: "1. How the Marketplace Works",
                    text: [
                        "Our platform operates as a partial marketplace model that connects independent fashion and graphic designers with customers looking for original and creative designs.",
                        "Designers create and submit their original artwork to the platform. When a customer places an order, we handle the complete production process, including manufacturing, quality checks, packaging, shipping, and customer support, to ensure a smooth shopping experience."
                    ]
                },
                {
                    subtitle: "2. Designer Responsibilities",
                    text: [
                        "All designers selling through the platform are required to accept and comply with our Designer Policies and Terms & Conditions during registration.",
                        "Designers are responsible for:",
                        "• Creating original designs and ensuring they do not infringe on the intellectual property rights of others.",
                        "• Providing accurate information related to their designs.",
                        "• Following all platform guidelines and policies.",
                        "Any violation of the Designer Policies may result in suspension or removal from the platform."
                    ]
                },
                {
                    subtitle: "3. Platform Responsibilities",
                    text: [
                        "To provide a consistent and reliable experience, we are responsible for:",
                        "• Manufacturing products using the selected designer's artwork.",
                        "• Performing quality inspections before dispatch.",
                        "• Packaging and shipping customer orders.",
                        "• Providing order tracking and delivery updates.",
                        "• Handling customer support, complaints, and eligible return, exchange, or refund requests in accordance with our policies.",
                        "• Protecting customer payment information and maintaining a secure shopping experience.",
                        "While we manage the fulfillment process, the creative ownership of designs remains subject to our Intellectual Property Policy."
                    ]
                }
            ]
        },
        {
            category: "II. Shipping Policy",
            subsections: [
                {
                    subtitle: "1. Order Delivery",
                    text: [
                        "We will arrange delivery of your order through the most suitable and reliable shipping partner available for your delivery location.",
                        "Customers are responsible for providing a complete, accurate, and valid shipping address, along with the correct contact details, at the time of placing the order.",
                        "We shall not be responsible for delivery failures, delays, returns, exchanges, or refunds arising from incorrect, incomplete, or inaccurate shipping information provided by the customer."
                    ]
                },
                {
                    subtitle: "2. Order Tracking",
                    text: [
                        "Once your order has been shipped, we will provide the shipping partner's name and the tracking ID through the registered communication channel (such as website, email, SMS, or WhatsApp, where applicable).",
                        "Customers can use the provided tracking ID to monitor the delivery status directly on the shipping partner's tracking portal.",
                        "Tracking information will be shared as soon as it becomes available after the order has been dispatched."
                    ]
                },
                {
                    subtitle: "3. Unboxing Video",
                    text: [
                        "Customers are strongly advised to record a continuous, uninterrupted unboxing video from the moment the sealed package is opened until the product is fully displayed.",
                        "The unboxing video serves as supporting evidence in case of complaints related to missing items, incorrect products, damaged products, or defective products.",
                        "We may request the unboxing video while reviewing claims related to delivery or product issues."
                    ]
                },
                {
                    subtitle: "4. Shipping Delays",
                    text: [
                        "The estimated delivery time provided is only an approximation and should not be considered a guaranteed delivery date.",
                        "Delivery may be delayed due to circumstances beyond our control, including but not limited to public holidays, weekends, adverse weather conditions, transportation disruptions, strikes, government restrictions, natural disasters, national or state emergencies, or other unforeseen events.",
                        "We will make reasonable efforts to keep customers informed of any significant shipping delays whenever possible."
                    ]
                }
            ]
        },
        {
            category: "III. Return, Exchange & Refund Policy",
            subsections: [
                {
                    subtitle: "1. Non-Eligible Returns, Exchanges & Refunds",
                    text: [
                        "We do not accept returns, exchanges, or refunds for the following reasons:",
                        "• The customer selected the wrong size while placing the order.",
                        "• The customer selected the wrong color or variant.",
                        "• The product color varies within the acceptable limits stated in the Product Appearance Policy.",
                        "• The customer did not like the product, its fit, style, or appearance.",
                        "• The product meets the specifications described on the website and has no manufacturing defect or delivery issue."
                    ]
                },
                {
                    subtitle: "2. Exchange for Damaged or Defective Products",
                    text: [
                        "Exchanges will only be accepted if the product is received in a damaged, defective, or incorrect condition due to an error by us or during transit.",
                        "Customers must raise a support ticket through the website and provide the required supporting evidence, including an uninterrupted unboxing video recorded from the moment the sealed package is opened until the product is fully displayed.",
                        "We reserve the right to inspect and verify the claim before approving an exchange.",
                        "Claims submitted without sufficient supporting evidence may be rejected."
                    ]
                },
                {
                    subtitle: "3. Refund for Lost Packages",
                    text: [
                        "If an order is confirmed as lost in transit by the shipping partner and cannot be delivered to the customer, we will process a full refund or provide an alternative resolution at our discretion.",
                        "Refunds for lost packages will be initiated only after confirmation from the respective shipping partner."
                    ]
                },
                {
                    subtitle: "4. Returns Due to Our Error",
                    text: [
                        "We will accept returns if the customer receives a product due to a genuine mistake on our part, including but not limited to:",
                        "• Delivery of an incorrect product.",
                        "• Delivery of an incorrect size or variant different from the customer's confirmed order.",
                        "• Delivery of a product with a verified manufacturing defect.",
                        "Such requests are subject to verification and may require supporting evidence, including an uninterrupted unboxing video and photographs of the product.",
                        "Upon successful verification, we will arrange the return and provide an appropriate replacement, exchange, or refund, as applicable."
                    ]
                },
                {
                    subtitle: "5. General Conditions",
                    text: [
                        "All return, exchange, and refund requests are subject to review and approval by the Customer Support team.",
                        "We reserve the right to reject any claim that is found to be false, fraudulent, unsupported by adequate evidence, or inconsistent with the policies stated above."
                    ]
                }
            ]
        },
        {
            category: "IV. Cancellation Policy",
            subsections: [
                {
                    subtitle: "1. Order Cancellation",
                    text: [
                        "Customers may request to cancel their order within 36 hours of successful payment.",
                        "If a cancellation request is made within the 36-hour period, a 50% cancellation fee will be deducted from the total order value, and the remaining amount will be refunded through the original payment method, subject to the applicable refund timeline.",
                        "Once 36 hours have passed from the time of successful payment, the order will be considered confirmed. Any cancellation request made after this period will be subject to a 100% cancellation fee, and no refund will be issued."
                    ]
                }
            ]
        },
        {
            category: "V. Product Appearance Policy",
            subsections: [
                {
                    subtitle: "1. Product Image Variance",
                    text: [
                        "The product images displayed on the website may include AI-generated model images or digitally enhanced visuals for presentation purposes.",
                        "While every effort is made to accurately represent the product, the actual appearance, fit, drape, or styling of the product may vary slightly from the images shown on the website."
                    ]
                },
                {
                    subtitle: "2. Color Variance",
                    text: [
                        "The actual color of the product may vary by up to 5% from the images displayed on the website.",
                        "Minor color variations may occur due to factors such as lighting conditions, camera settings, image processing, fabric dyeing, and differences in display settings across mobile devices, tablets, and computer monitors.",
                        "Such minor color differences are standard within the apparel industry and shall not be considered a product defect."
                    ]
                },
                {
                    subtitle: "3. Size Variance",
                    text: [
                        "The measurements of the delivered product may vary by up to 5% from the published size chart.",
                        "Minor size variations may occur due to the garment manufacturing process, including fabric characteristics, cutting, stitching, and finishing.",
                        "Such measurement differences are considered acceptable industry standards and shall not be treated as manufacturing defects or grounds for return, exchange, or refund."
                    ]
                }
            ]
        },
        {
            category: "VI. Complaint & Dispute Resolution Policy",
            subsections: [
                {
                    subtitle: "1. Complaint Submission Process",
                    text: [
                        "Customers may submit complaints or report issues by raising a support ticket through the website.",
                        "To help us investigate and resolve complaints efficiently, customers may be requested to provide relevant supporting information, including order details, photographs, or an uninterrupted unboxing video, where applicable.",
                        "Failure to provide the requested information may affect our ability to process or resolve certain complaints."
                    ]
                },
                {
                    subtitle: "2. Escalation Process",
                    text: [
                        "All complaints and support requests are handled by our Customer Support team with due care and attention.",
                        "Our support team will review each case thoroughly and take appropriate action based on the nature of the issue and the information provided.",
                        "If a complaint cannot be resolved during the initial review, it will be escalated to the appropriate team for further investigation and resolution.",
                        "We are committed to resolving genuine customer concerns fairly, promptly, and in accordance with applicable policies."
                    ]
                }
            ]
        },
        {
            category: "VII. Privacy Policy",
            subsections: [
                {
                    subtitle: "1. Information Collected",
                    text: [
                        "We collect the information necessary to process orders, provide customer support, improve our services, and enhance the overall shopping experience.",
                        "Customer information may include details such as name, contact information, shipping and billing address, email address, phone number, and order history.",
                        "We do not sell, rent, or share customers' personal information with any third-party organizations for their independent marketing or commercial purposes, except where required to fulfill orders (such as shipping partners, payment service providers) or where required by applicable law.",
                        "Customer information may be used internally for business analytics, including understanding customer preferences, purchasing patterns, and sentiment analysis, to improve our products, services, and customer experience.",
                        "We implement reasonable administrative, technical, and security measures to protect customer information against unauthorized access, misuse, alteration, or disclosure.",
                        "By using our website and services, customers consent to the collection and use of their information in accordance with this Privacy Policy."
                    ]
                }
            ]
        },
        {
            category: "VIII. Intellectual Property Policy",
            subsections: [
                {
                    subtitle: "1. Ownership of Intellectual Property",
                    text: [
                        "All our product designs, artwork, graphics, logos, brand names, trademarks, website content, photographs, illustrations, digital assets, and other creative materials are our exclusive intellectual property.",
                        "Every clothing design created, developed, or published by us is protected under applicable intellectual property and copyright laws. We retain all rights, title, and interest in our original designs and creative works.",
                        "No individual or organization may copy, reproduce, modify, distribute, manufacture, sell, or commercially exploit any of our designs, logos, artwork, or other intellectual property without obtaining prior written permission from us.",
                        "Unauthorized use, imitation, reproduction, or distribution of any of our intellectual property may result in appropriate legal action under applicable laws.",
                        "We reserve the right to protect and enforce our intellectual property rights against any unauthorized use or infringement."
                    ]
                }
            ]
        },
        {
            category: "IX. Payment, Wallet, Referral & Affiliate Policy",
            subsections: [
                {
                    subtitle: "1. Failed Payments",
                    text: [
                        "In the event of a payment failure, customers are advised to contact their respective payment service provider, bank, card issuer, or payment gateway for assistance regarding the transaction.",
                        "Any refund arising from a failed or unsuccessful payment will be processed in accordance with the policies of the respective payment service provider or bank.",
                        "We shall not be responsible for technical failures, transaction declines, payment processing errors, or delays caused by third-party payment gateways or financial institutions."
                    ]
                },
                {
                    subtitle: "2. Wallet",
                    text: [
                        "Customers may maintain a Wallet on the website to receive referral rewards, affiliate earnings, promotional credits, refunds (where applicable), and other eligible benefits.",
                        "Wallet balances may be used to make purchases on the website, subject to applicable terms and conditions.",
                        "Customers may submit a wallet withdrawal request for eligible balances through their account.",
                        "Approved withdrawal requests will generally be processed within 72 hours, subject to verification and applicable policies."
                    ]
                },
                {
                    subtitle: "3. Referral Program",
                    text: [
                        "Customers may earn referral rewards by referring new customers to us through the official referral program.",
                        "The referral reward amount for each successful purchase will be determined solely by us and may vary depending on the product, promotional campaign, or other business considerations.",
                        "Referral rewards will be credited to the customer's Wallet only after the referred order has been successfully delivered and completed.",
                        "We reserve the right to modify, suspend, or discontinue the referral program or revise referral reward amounts at any time without prior notice."
                    ]
                },
                {
                    subtitle: "4. Affiliate Program",
                    text: [
                        "We operate an affiliate marketing program that allows eligible participants to promote our products using their unique affiliate links.",
                        "Affiliates will earn commissions on qualifying purchases made through their affiliate links, as determined by us.",
                        "Affiliate commissions will be credited to the participant's Wallet only after the respective order has been successfully delivered and completed.",
                        "We reserve the right to verify affiliate transactions and withhold, reject, or reverse commissions in cases of fraudulent activity, self-purchases, misuse of the affiliate program, cancelled orders, returned orders, or violations of our policies.",
                        "We may revise the affiliate commission structure, eligibility criteria, or program terms at our sole discretion."
                    ]
                }
            ]
        }
    ];

    return (
        <main style={{ flex: 1, padding: '40px 5%', width: '100%', minHeight: '80vh', background: "var(--bg, #FAFAF8)" }}>
            <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
                <BackButton />
                <div className="glass-card" style={{ padding: '40px', marginTop: '20px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.95)', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ fontFamily: "'Cormorant Garamond', 'Cinzel', serif", color: 'var(--gold, #C5A059)', fontSize: '2.2rem', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        CUSTOMER TERMS &amp; CONDITIONS
                    </h1>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', color: '#666', fontSize: '0.9rem' }}>
                        As Simple as That — Terms of Service, Shopping &amp; Store Policies
                    </p>
                </div>

                <div style={{ fontFamily: 'Montserrat, sans-serif', color: '#2d3748', lineHeight: '1.7' }}>
                    <div style={{ background: 'rgba(197,160,89,0.08)', borderLeft: '4px solid var(--gold, #C5A059)', padding: '16px 20px', borderRadius: '0 8px 8px 0', marginBottom: '40px' }}>
                        <p style={{ margin: 0, fontSize: '0.92rem', color: '#4a5568' }}>
                            Welcome to <strong>As Simple as That</strong>. By placing an order, browsing our website, or participating in our wallet/referral programs, you agree to be bound by the terms, policies, and conditions outlined below.
                        </p>
                    </div>

                    {termsData.map((cat, cIdx) => (
                        <div key={cIdx} style={{ marginBottom: '40px', paddingBottom: '30px', borderBottom: cIdx === termsData.length - 1 ? 'none' : '1px solid #edf2f7' }}>
                            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1.25rem', fontWeight: 800, color: 'var(--gold, #C5A059)', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '8px', height: '18px', background: 'var(--gold, #C5A059)', borderRadius: '2px', display: 'inline-block' }}></span>
                                {cat.category}
                            </h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', paddingLeft: '12px' }}>
                                {cat.subsections.map((sub, sIdx) => (
                                    <div key={sIdx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
                                        <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: '#1a202c', margin: '0 0 12px' }}>
                                            {sub.subtitle}
                                        </h3>
                                        {sub.text.map((paragraph, pIdx) => (
                                            <p key={pIdx} style={{
                                                margin: pIdx === sub.text.length - 1 ? 0 : '0 0 10px',
                                                fontSize: '0.88rem',
                                                color: paragraph.startsWith('•') ? '#2d3748' : '#4a5568',
                                                paddingLeft: paragraph.startsWith('•') ? '14px' : '0',
                                                fontWeight: paragraph.startsWith('•') ? '600' : '400'
                                            }}>
                                                {paragraph}
                                            </p>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </main>
    );
}

export default UserTerms;
