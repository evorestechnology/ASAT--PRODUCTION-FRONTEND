import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../../components/BackButton';

const SECTIONS = [
    {
        num: '1',
        title: 'Eligibility & Account Requirements',
        clauses: [
            { num: '1.1', text: "Any individual or legally registered business that wishes to sell fashion designs through the Platform may create a Designer Account by completing the registration process and accepting these Designer Terms & Conditions and all applicable Platform Policies." },
            { num: '1.2', text: "By registering as a designer, you confirm that all information, documents, and details provided during registration are accurate, complete, and up to date. You agree to promptly update your information whenever any changes occur." },
            { num: '1.3', text: "Upon successful registration, designers are encouraged to review the tutorials, guidelines, and educational resources provided by the Platform to understand the marketplace, listing standards, operational procedures, and applicable policies before publishing any products or designs." },
            { num: '1.4', text: "Each designer may maintain only one active Designer Account. If duplicate accounts are found, the Platform reserves the right to suspend or terminate any or all associated accounts, including freezing any wallet balances until the matter is reviewed and resolved in accordance with the applicable Platform Policies." },
            { num: '1.5', text: "The Platform reserves the right to verify the identity, business information, or any other information provided by the designer at the time of registration or at any time thereafter." },
            { num: '1.6', text: "The Platform reserves the sole right to suspend, restrict, or terminate any Designer Account that violates these Terms & Conditions, applicable Platform Policies, or applicable laws." },
        ]
    },
    {
        num: '2',
        title: 'Designer Responsibilities',
        clauses: [
            { num: '2.1', text: "Designers are solely responsible for all designs, artwork, product listings, descriptions, images, and other content published through their Designer Account." },
            { num: '2.2', text: "Every design uploaded to the Platform must be the designer's own original creative work. Designers are solely responsible for ensuring that they have all necessary rights, permissions, and ownership to publish and commercialize their designs." },
            { num: '2.3', text: "Designers shall ensure that all designs comply with these Terms & Conditions, the Designer Design Policy, the Intellectual Property Policy, and all applicable laws." },
            {
                num: '2.4', text: "The following types of designs and content are strictly prohibited on the Platform, including but not limited to:",
                bullets: [
                    "AI-generated designs or artwork. (AI-generated models, mockups, and product presentation images may be permitted, provided the actual design itself is original and complies with the Platform's policies.)",
                    "Copyrighted, trademarked, or otherwise protected content without the necessary legal rights or authorization.",
                    "Designs that copy, imitate, or substantially resemble another designer's work.",
                    "Duplicate or repeatedly uploaded versions of the same design without legitimate variation.",
                    "Religious content, symbols, or artwork intended for commercial sale.",
                    "Political content, political party logos, symbols, slogans, or campaign materials.",
                    "National flags, government emblems, or official insignia used as the primary design element.",
                    "Merchandise, fan art, or designs based on movies, television shows, games, music, celebrities, sports teams, brands, or other third-party intellectual property, even if the designer claims to have obtained permission, unless expressly approved by the Platform.",
                    "Hate speech, discriminatory content, extremist symbols, or content promoting violence, harassment, or intolerance against any individual or group.",
                    "Offensive, obscene, defamatory, sexually explicit, illegal, or otherwise inappropriate content.",
                    "Any design that violates applicable laws or infringes upon the rights of any individual, organization, or third party.",
                ]
            },
            { num: '2.5', text: "The Platform encourages originality and creativity and does not impose unnecessary restrictions on a designer's artistic expression." },
            { num: '2.6', text: "The Platform reserves the right to review, reject, remove, suspend, or permanently prohibit any design or Designer Account that violates these Terms & Conditions or any applicable Platform Policy. Repeated violations may result in suspension or permanent termination of the Designer Account." },
        ]
    },
    {
        num: '3',
        title: 'Marketplace Role',
        clauses: [
            { num: '3.1', text: "The Platform operates as a technology-enabled fashion marketplace that connects independent fashion designers with customers seeking original and creative fashion products." },
            { num: '3.2', text: "The Platform provides designers with the digital infrastructure to showcase, promote, and offer their original designs to customers through the marketplace." },
            { num: '3.3', text: "The Platform operates under a partial marketplace model. While designers create and own their original designs, the Platform manages the manufacturing, quality control, packaging, shipping, and delivery of products in accordance with the designer's approved design specifications and the customer's confirmed order." },
            { num: '3.4', text: "Designers acknowledge that the Platform may engage manufacturers, logistics partners, payment service providers, and other third-party service providers as necessary to facilitate the production and fulfillment of customer orders." },
            { num: '3.5', text: "For each successfully completed order, the designer shall receive the design remuneration specified by the designer, subject to the applicable Payment Policy." },
        ]
    },
    {
        num: '4',
        title: 'Payment Policy',
        clauses: [
            { num: '4.1', label: 'Designer Wallet', text: "Every registered designer shall be provided with a dedicated Wallet on the Platform. The Wallet enables designers to view their earnings, payment history, withdrawal requests, and completed settlements." },
            { num: '4.2', label: 'Royalty Credits', text: "For every successfully completed customer order, the designer shall receive the design royalty specified by the designer at the time of listing, subject to these Terms & Conditions and the applicable Platform Policies." },
            { num: '4.3', label: 'Withdrawal Requests', text: "Designers may submit a withdrawal request for the available Wallet balance at any time through the Platform. Subject to verification and compliance with applicable Platform Policies, approved withdrawal requests shall be processed and settled within 72 hours from the time the withdrawal request is submitted." },
            { num: '4.4', label: 'No Platform Deductions', text: "The Platform does not deduct any platform fees, withdrawal charges, or administrative fees from the designer's Wallet balance or withdrawal amount. The amount credited to the Wallet shall be the amount payable to the designer, unless otherwise required by applicable law or a valid legal order." },
            { num: '4.5', label: 'Taxes', text: "The Platform does not deduct taxes from the designer's Wallet credits or withdrawals unless required by applicable law. Designers are solely responsible for determining, reporting, and paying any taxes applicable to their earnings in their respective jurisdictions." },
            { num: '4.6', label: 'Base Currency', text: "The Platform's base settlement currency is Indian Rupees (INR). All Wallet credits, balances, settlements, and withdrawals are maintained and processed in INR." },
            { num: '4.7', label: 'Currency Exchange', text: "For designers residing outside India, the amount received in their local currency may vary depending on the exchange rate, banking practices, intermediary fees charged by financial institutions, and other currency conversion factors. The Platform is not responsible for any gain or loss arising from exchange rate fluctuations or charges imposed by banks or payment service providers." },
            { num: '4.8', label: 'Payment Verification', text: "The Platform reserves the right to verify a designer's identity, bank account details, payment information, or supporting documents before processing any withdrawal request in order to prevent fraud, unauthorized transactions, or regulatory violations." },
            { num: '4.9', label: 'Payment Holds', text: "The Platform may temporarily place a hold on Wallet balances or delay withdrawals where reasonably necessary to investigate suspected fraud, policy violations, duplicate accounts, payment disputes, chargebacks, legal requirements, or security concerns." },
        ]
    },
    {
        num: '5',
        title: 'Intellectual Property Policy',
        clauses: [
            { num: '5.1', label: 'Ownership of Designs', text: "All original designs, artwork, graphics, and other creative content uploaded by a designer remain the exclusive intellectual property of the respective designer. Nothing in these Terms & Conditions transfers the ownership of the designer's intellectual property to the Platform." },
            {
                num: '5.2', label: 'License Granted to the Platform', text: "By uploading a design to the Platform, the designer grants the Platform a non-exclusive, worldwide, royalty-free, revocable (upon removal of the design, except where necessary to complete pending orders), and limited license to:",
                bullets: [
                    "Display, publish, and promote the design on the Platform.",
                    "Manufacture products incorporating the design solely for fulfilling customer orders.",
                    "Store, reproduce, and process the design for operational purposes.",
                    "Use the design in advertisements, social media, promotional campaigns, email marketing, and other marketing materials related to the Platform.",
                    "Create product mockups, previews, thumbnails, and promotional images using the uploaded design.",
                ]
            },
            { num: '5.3', label: 'Designer Warranty', text: "The designer represents and warrants that they are the lawful owner of the uploaded design or possess all necessary rights to use and commercialize it; that the design does not infringe any copyright, trademark, patent, design right, or other intellectual property rights of any third party; and that the design complies with all applicable Platform Policies and applicable laws." },
            { num: '5.4', label: 'Copyright Complaints', text: "If the Platform receives a copyright or intellectual property complaint regarding a design, it may review the complaint and request additional information or supporting documentation from the concerned designer. During the review process, the Platform may temporarily restrict access to, disable, or remove the reported design where it reasonably believes such action is necessary." },
            { num: '5.5', label: 'Content Removal', text: "The Platform reserves the right to reject, disable, remove, or permanently prohibit any design that violates these Terms & Conditions or any Platform Policy, infringes or is suspected of infringing the intellectual property rights of any third party, is subject to a valid legal notice or regulatory requirement, or may expose the Platform, customers, or other designers to legal or reputational risk." },
            { num: '5.6', label: 'Platform Marketing Rights', text: "The designer authorizes the Platform to use the uploaded designs, product images, designer name, brand name, logo, and related promotional content for marketing, advertising, social media, public relations, marketplace promotions, exhibitions, newsletters, and other promotional activities related to the Platform without requiring additional approval or compensation, unless otherwise agreed in writing." },
            { num: '5.7', label: 'Reservation of Rights', text: "Except for the limited license expressly granted under this Policy, all intellectual property rights remain with their respective owners. No provision of these Terms & Conditions shall be interpreted as granting ownership of a designer's intellectual property to the Platform." },
        ]
    },
    {
        num: '6',
        title: 'Product Appearance Policy',
        clauses: [
            { num: '6.1', label: 'Product Images', text: "Designers shall upload clear, accurate, and high-quality images that fairly represent their original designs. Product images must not contain misleading edits, watermarks, promotional text, or any content that may misrepresent the final product." },
            { num: '6.2', label: 'AI-Generated Images', text: "AI-generated models, lifestyle images, mockups, and product presentation images are permitted for showcasing products, provided they accurately represent the original design. However, AI-generated designs or artwork are strictly prohibited under the Designer Design Policy." },
            { num: '6.3', label: 'Product Representation', text: "The Platform makes reasonable efforts to ensure that product images accurately represent the final manufactured product. However, the final delivered product may differ slightly from the images displayed on the Platform due to manufacturing processes, lighting conditions, photography, display settings, and material characteristics." },
            { num: '6.4', label: 'Color Variation Disclaimer', text: "Actual product colors may vary slightly from the images displayed on the Platform due to differences in camera settings, lighting conditions, printing processes, fabric materials, and individual screen or device display settings. Such variations shall not be considered manufacturing defects." },
            { num: '6.5', label: 'Size Tolerance', text: "Minor variations in product dimensions may occur during the manufacturing process. Unless otherwise specified, a reasonable manufacturing tolerance shall be considered acceptable and shall not constitute a defect." },
            { num: '6.6', label: 'Fabric Variation', text: "The appearance, texture, weight, finish, and feel of fabrics may vary slightly due to differences in fabric batches, manufacturing processes, dye lots, and material characteristics. Such variations are considered normal and do not affect the intended quality of the product." },
            { num: '6.7', label: 'Photography Standards', text: "All product photographs, mockups, and promotional images must accurately represent the uploaded design and must not intentionally mislead customers regarding product features, colors, quality, dimensions, or overall appearance." },
            { num: '6.8', label: 'Platform Disclaimer', text: "Minor variations in color, size, print placement, stitching, fabric texture, or overall appearance resulting from standard manufacturing and production processes shall not be considered defects and shall not, by themselves, qualify a product for return, exchange, or refund unless otherwise provided under the applicable Return, Exchange & Refund Policy." },
        ]
    },
    {
        num: '7',
        title: 'Privacy Policy',
        clauses: [
            { num: '7.1', label: 'Data Collection', text: "To provide and operate the Platform, we may collect personal, business, and technical information from designers during registration, account verification, product listing, order processing, payment processing, and ongoing use of the Platform." },
            { num: '7.2', label: 'Business Information', text: "The Platform may collect and store information including, but not limited to: full name or business name; contact information, including email address and phone number; business registration details, where applicable; bank account and payout information; tax-related information, where required by applicable law; and product listings, design information, and other content uploaded by the designer." },
            { num: '7.3', label: 'Payment Information', text: "To facilitate settlements and withdrawals, the Platform may collect payment-related information such as bank account details, payment preferences, transaction history, wallet balances, withdrawal requests, and payment records. Sensitive financial information is handled using appropriate security measures and trusted payment service providers where applicable." },
            { num: '7.4', label: 'Customer Information', text: "Designers may receive limited customer information necessary for fulfilling customer orders, such as the customer's name, delivery address, contact details, and order information. Designers shall use such information solely for the purpose of fulfilling orders through the Platform and shall not copy, disclose, sell, misuse, or use such information for marketing or any purpose unrelated to the Platform." },
            { num: '7.5', label: 'Data Sharing', text: "The Platform may share information with manufacturers, logistics partners, payment service providers, verification agencies, technology service providers, or government and regulatory authorities where necessary to operate the Platform, process orders, comply with legal obligations, or protect the rights, safety, and security of the Platform, its users, and third parties. The Platform does not sell designers' personal information to third parties." },
            { num: '7.6', label: 'Data Security', text: "The Platform implements reasonable administrative, technical, and organizational measures to protect personal and business information against unauthorized access, alteration, disclosure, misuse, or destruction. While the Platform strives to maintain appropriate security standards, no method of electronic transmission or data storage can be guaranteed to be completely secure." },
            { num: '7.7', label: 'Data Retention', text: "The Platform may retain designer information, transaction records, payment history, and related data for as long as necessary to operate the Platform, comply with legal obligations, resolve disputes, enforce these Terms & Conditions, and satisfy regulatory or accounting requirements." },
            { num: '7.8', label: 'Policy Updates', text: "The Platform reserves the right to update or modify this Privacy Policy from time to time. Any revised version shall become effective upon publication on the Platform unless otherwise required by applicable law." },
        ]
    },
];

const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Montserrat:wght@300;400;500;600;700&display=swap');

    .dt-page {
        min-height: 100vh;
        background: #0a0a0a;
        color: rgba(255,255,255,0.88);
        font-family: 'Montserrat', sans-serif;
    }
    .dt-hero {
        background: linear-gradient(135deg, #0a0a0a 0%, #111 50%, #0d0d0d 100%);
        border-bottom: 1px solid rgba(197,160,89,0.18);
        padding: 60px 0 48px;
        text-align: center;
        position: relative;
        overflow: hidden;
    }
    .dt-hero::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse at 50% 0%, rgba(197,160,89,0.08) 0%, transparent 70%);
        pointer-events: none;
    }
    .dt-hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(197,160,89,0.1);
        border: 1px solid rgba(197,160,89,0.3);
        padding: 6px 18px;
        border-radius: 30px;
        font-size: 0.7rem;
        letter-spacing: 2.5px;
        text-transform: uppercase;
        color: rgba(197,160,89,0.9);
        margin-bottom: 24px;
    }
    .dt-hero-title {
        font-family: 'Cinzel', serif;
        font-size: clamp(2rem, 5vw, 3.5rem);
        font-weight: 700;
        letter-spacing: 4px;
        color: #fff;
        margin-bottom: 14px;
        text-shadow: 0 0 40px rgba(197,160,89,0.15);
    }
    .dt-hero-title span { color: #C5A059; }
    .dt-hero-sub {
        font-size: 0.85rem;
        color: rgba(255,255,255,0.45);
        letter-spacing: 1.5px;
        max-width: 520px;
        margin: 0 auto;
        line-height: 1.7;
    }
    .dt-nav {
        position: sticky;
        top: 0;
        z-index: 100;
        background: rgba(10,10,10,0.96);
        backdrop-filter: blur(16px);
        border-bottom: 1px solid rgba(255,255,255,0.05);
        padding: 0 5%;
        display: flex;
        gap: 0;
        overflow-x: auto;
        scrollbar-width: none;
    }
    .dt-nav::-webkit-scrollbar { display: none; }
    .dt-nav-item {
        padding: 16px 20px;
        font-size: 0.72rem;
        font-weight: 600;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: rgba(255,255,255,0.4);
        cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: all 0.3s;
        white-space: nowrap;
        border-radius: 0;
        background: none;
        border-top: none;
        border-left: none;
        border-right: none;
        font-family: 'Montserrat', sans-serif;
    }
    .dt-nav-item:hover { color: rgba(255,255,255,0.75); }
    .dt-nav-item.active {
        color: #C5A059;
        border-bottom-color: #C5A059;
    }
    .dt-body {
        max-width: 900px;
        margin: 0 auto;
        padding: 60px 5% 100px;
    }
    .dt-section {
        margin-bottom: 64px;
        scroll-margin-top: 80px;
    }
    .dt-section-header {
        display: flex;
        align-items: flex-start;
        gap: 20px;
        margin-bottom: 32px;
        padding-bottom: 20px;
        border-bottom: 1px solid rgba(197,160,89,0.12);
    }
    .dt-section-num {
        font-family: 'Cinzel', serif;
        font-size: 2.5rem;
        font-weight: 700;
        color: rgba(197,160,89,0.25);
        line-height: 1;
        flex-shrink: 0;
        min-width: 50px;
    }
    .dt-section-title {
        font-family: 'Cinzel', serif;
        font-size: 1.35rem;
        font-weight: 700;
        color: #fff;
        letter-spacing: 1.5px;
        line-height: 1.3;
        padding-top: 6px;
    }
    .dt-clause {
        display: flex;
        gap: 16px;
        margin-bottom: 20px;
        padding: 18px 22px;
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,255,255,0.04);
        border-left: 3px solid rgba(197,160,89,0.2);
        border-radius: 0 8px 8px 0;
        transition: border-left-color 0.3s, background 0.3s;
    }
    .dt-clause:hover {
        border-left-color: rgba(197,160,89,0.5);
        background: rgba(255,255,255,0.03);
    }
    .dt-clause-num {
        font-family: 'Cinzel', serif;
        font-size: 0.78rem;
        font-weight: 700;
        color: rgba(197,160,89,0.7);
        letter-spacing: 0.5px;
        flex-shrink: 0;
        padding-top: 2px;
        min-width: 34px;
    }
    .dt-clause-body {
        font-size: 0.9rem;
        line-height: 1.8;
        color: rgba(255,255,255,0.75);
    }
    .dt-clause-label {
        font-weight: 700;
        color: rgba(255,255,255,0.92);
        margin-right: 6px;
    }
    .dt-prohibited {
        color: rgba(229,57,53,0.8);
        font-weight: 700;
    }
    .dt-bullet-list {
        list-style: none;
        padding: 0;
        margin-top: 12px;
    }
    .dt-bullet-list li {
        display: flex;
        gap: 10px;
        padding: 6px 0;
        font-size: 0.88rem;
        color: rgba(255,255,255,0.68);
        line-height: 1.6;
        border-bottom: 1px solid rgba(255,255,255,0.03);
    }
    .dt-bullet-list li:last-child { border-bottom: none; }
    .dt-bullet-list li::before {
        content: '◆';
        color: rgba(197,160,89,0.4);
        font-size: 0.55rem;
        flex-shrink: 0;
        margin-top: 5px;
    }
    .dt-footer-bar {
        background: #0d0d0d;
        border-top: 1px solid rgba(197,160,89,0.12);
        padding: 40px 5%;
        text-align: center;
    }
    .dt-footer-logo {
        font-family: 'Cinzel', serif;
        font-size: 1.2rem;
        letter-spacing: 3px;
        color: #fff;
        margin-bottom: 12px;
    }
    .dt-footer-logo span { color: #C5A059; }
    .dt-footer-text {
        font-size: 0.78rem;
        color: rgba(255,255,255,0.3);
        letter-spacing: 0.5px;
        max-width: 600px;
        margin: 0 auto 20px;
        line-height: 1.7;
    }
    .dt-cta-btn {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        background: #C5A059;
        color: #0a0a0a;
        padding: 14px 32px;
        font-family: 'Cinzel', serif;
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 2px;
        text-transform: uppercase;
        text-decoration: none;
        border-radius: 2px;
        transition: all 0.3s;
    }
    .dt-cta-btn:hover {
        background: #e8c97a;
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(197,160,89,0.3);
    }
    .dt-back {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 20px;
        background: transparent;
        border: 1px solid rgba(255,255,255,0.12);
        color: rgba(255,255,255,0.6);
        font-family: 'Montserrat', sans-serif;
        font-size: 0.75rem;
        letter-spacing: 1px;
        text-decoration: none;
        border-radius: 6px;
        transition: all 0.3s;
        position: absolute;
        top: 30px;
        left: 5%;
    }
    .dt-back:hover {
        border-color: rgba(197,160,89,0.4);
        color: #C5A059;
        background: rgba(197,160,89,0.05);
    }
`;

function DesignerTerms() {
    const [activeSection, setActiveSection] = useState('1');

    const scrollToSection = (num) => {
        setActiveSection(num);
        const el = document.getElementById(`tc-section-${num}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="dt-page">
            <style>{styles}</style>

            <div className="dt-hero">
                <Link to="/designer" className="dt-back">
                    <span>←</span> Back
                </Link>
                <div className="dt-hero-badge">
                    <i className="fas fa-file-contract"></i>
                    Legal Document
                </div>
                <h1 className="dt-hero-title">Designer <span>Terms</span> &amp; Conditions</h1>
                <p className="dt-hero-sub">These terms govern your use of the ASAT Platform as a designer. Please read all sections carefully.</p>
            </div>

            {/* Sticky navigation */}
            <div className="dt-nav">
                {SECTIONS.map(s => (
                    <button
                        key={s.num}
                        className={`dt-nav-item ${activeSection === s.num ? 'active' : ''}`}
                        onClick={() => scrollToSection(s.num)}
                    >
                        {s.num}. {s.title.split(' ').slice(0, 2).join(' ')}
                    </button>
                ))}
            </div>

            <div className="dt-body">
                {SECTIONS.map((section) => (
                    <div
                        key={section.num}
                        id={`tc-section-${section.num}`}
                        className="dt-section"
                    >
                        <div className="dt-section-header">
                            <div className="dt-section-num">{section.num}</div>
                            <div className="dt-section-title">{section.title}</div>
                        </div>

                        {section.clauses.map((clause) => (
                            <div key={clause.num} className="dt-clause">
                                <div className="dt-clause-num">{clause.num}</div>
                                <div className="dt-clause-body">
                                    {clause.label && <span className="dt-clause-label">{clause.label} —</span>}
                                    {clause.num === '2.4'
                                        ? <><span className="dt-prohibited">Strictly prohibited</span> content includes but is not limited to:</>
                                        : clause.text
                                    }
                                    {clause.bullets && (
                                        <ul className="dt-bullet-list">
                                            {clause.bullets.map((b, i) => <li key={i}>{b}</li>)}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <div className="dt-footer-bar">
                <div className="dt-footer-logo">ASAT <span>STUDIO</span></div>
                <p className="dt-footer-text">
                    By registering as a designer on the ASAT Platform, you confirm that you have read, understood, and agreed to be bound by all of the above Terms &amp; Conditions, Policies, and Guidelines.
                </p>
                <Link to="/designer/register" className="dt-cta-btn">
                    <i className="fas fa-arrow-right"></i>
                    Register as a Designer
                </Link>
            </div>
        </div>
    );
}

export default DesignerTerms;
