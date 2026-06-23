<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Data Privacy Consent</title>
    <style>
        @page { margin: 0.5in; }
        body { font-family: Arial, sans-serif; font-size: 9pt; line-height: 1.3; margin: 0; color: #000; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        
        .header-table { width: 100%; margin-bottom: 15px; border-bottom: 2px solid #047857; padding-bottom: 10px; }
        .coop-name { font-size: 11pt; font-weight: bold; color: #047857; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 1px; }
        .address-block { font-size: 7.5pt; color: #333; line-height: 1.2; }
        .address-line { display: block; }
        
        .doc-title { text-align: center; font-weight: bold; text-decoration: underline; margin: 15px 0; font-size: 11pt; }
        
        p { text-align: justify; margin-bottom: 8px; text-indent: 30px; }
        
        .list-block { margin-left: 20px; text-align: justify; margin-bottom: 8px; }
        .list-item { display: flex; margin-bottom: 6px; }
        .list-letter { width: 20px; flex-shrink: 0; }
        .list-text { text-align: justify; }

        .indent-no-bullet { margin-left: 40px; text-align: justify; margin-bottom: 6px; }
        
        .sig-section { margin-top: 30px; }
        .line-val { border-bottom: 1px solid black; display: inline-block; min-width: 250px; font-weight: bold; text-align: center; }
        .page-break { page-break-after: always; }
    </style>
</head>
<body>
    @php
        $logoPath = public_path('/images/logo/pis_logo.png'); 
        $logoData = file_exists($logoPath) ? 'data:image/' . pathinfo($logoPath, PATHINFO_EXTENSION) . ';base64,' . base64_encode(file_get_contents($logoPath)) : '';
    @endphp

    <table class="header-table">
        <tr>
            <td width="70" style="vertical-align: middle;">
                @if($logoData) <img src="{{ $logoData }}" style="width: 65px; height: auto;"/> @endif
            </td>
            <td class="text-center">
                <div class="coop-name">PEOPLE'S MULTI-PURPOSE COOPERATIVE</div>
                <div class="address-block">
                    <span class="address-line"><strong>(Main Office)</strong> Stall #2, Principe Building, Maharlika Highway, Upi, Gamu, Isabela</span>
                    <span class="address-line"><strong>(Liaison Office)</strong> Purok 3, Brgy. Militar, Palayan City, Nueva Ecija</span>
                    <span class="address-line"><strong>Gmail:</strong> peoplesmpcooperative@gmail.com</span>
                    <span class="address-line">(02)8848-9760, (63)965-953-2196, (63)953-033-1580, (63)968-263-5186</span>
                </div>
            </td>
            <td width="70"></td>
        </tr>
    </table>

    <div class="doc-title">DATA PRIVACY CONSENT FORM</div>

    <p>By signing this consent form, I/we (as "Data Subject") grant my/our free, voluntary and unconditional consent to the collection and processing of all Personal Data (as defined below), and account or transaction information or records (collectively, the "information") relating to me/us disclosed/transmitted by me/us in person or by my/our authorized agent/representative/s to the information database system of the People's Multi-Purpose Cooperative Credit Cooperative and/or any of its authorized agent/s or representative/s as Information controller, by whatever means in accordance with Republic Act 10173, otherwise known as the "Data Privacy Act of 2012" of the Republic of the Philippines, including its implementing Rules and Regulations (IRR) as well as all other guidelines and issuances by the National Privacy Commission (NPC).</p>

    <p>I/we understand that my/our "Personal Data" means any information, whether recorded in a material form of not, (a) from which identity of an individual is apparent or can be reasonably and directly ascertained by the entity holding the information, or when put together with other information would directly and certainly identify and individual, (b) about an individual's race, ethnic origin, marital status, age, color, gender, health, education and religious and/or political affiliations, (c) referring to any proceeding for any offense committed or alleged to have been committed by such individual, the disposal of such proceedings, or the sentence of any court in such proceedings, and (d) issued by government agencies peculiar to an individual which includes, but not limited to, social security members and licenses.</p>

    <p>I/we understand, further, that People's Multi-Purpose Cooperative shall keep the Personal Data and Information and the business and/or transaction/s that I/we do with People's Multi-Purpose Cooperative (the "Business") in strict confidence, and that the collection and processing of all Personal Data and/or Information by People's Multi-Purpose Cooperative may be used for any of the following purposes (collectively, the "Purposes"):</p>

    <div class="list-block">
        <table style="width: 100%; border-collapse: collapse;">
            <tr><td class="list-letter" valign="top">a.</td><td class="list-text">To make decisions relating to the establishments, maintenance or termination of accounts and the establishments, provision or continuation of savings and lending services including, but not limited to, investments, savings, loan, mortgage and/or other secured transactions, and otherwise maintaining accurate "Know Your Customer (KYC)" information and conducting anti-money laundering and sanctions, credit and background checks;</td></tr>
            <tr><td class="list-letter" valign="top">b.</td><td class="list-text">To provide, operate, process and administer People's Multi-Purpose Cooperative accounts and services or to process applications for People's Multi-Purpose Cooperative accounts, products and/or services, including banking/financial transactions such as savings deposit transactions and credit/financial facilities, subscription of proposed subscription of products or services (whether offered or issued by People's Multi-Purpose Cooperative or otherwise), and to maintain service quality and train staff;</td></tr>
            <tr><td class="list-letter" valign="top">c.</td><td class="list-text">To undertake activities related to the provision of People's Multi-Purpose Cooperative accounts and services including but not limited to transaction authorization, statement printing and distribution, customer service and conduct of surveys, the provision research reports, offering documents, product profiles, customer profiling, term sheets or other product related materials, administration of rewards and loyalty programs;</td></tr>
            <tr><td class="list-letter" valign="top">d.</td><td class="list-text">To provide product related services and support, including, without limitation, provision of processing or administrative support or acting as an intermediary / nominee shareholder / agent / broker/market participant / counterparty in connection with participation in various products whether such products are offered or issued by People's Multi-Purpose Cooperative;</td></tr>
            <tr><td class="list-letter" valign="top">e.</td><td class="list-text">To fulfill domestic and foreign legal, regulatory, governmental, tax enforcement and compliance requirements including Philippine and/or foreign anti-money laundering, sanctions and tax obligations applicable to People's Multi-Purpose Cooperative and any of its affiliates and subsidiaries, and disclosure to any domestic or foreign market exchange, court tribunal, and/or legal, regulatory, governmental, tax and law enforcement authority (each, an "Authority") pursuant to relevant guidelines, regulations, orders, guidance or requests from the Authority and comply with any treaty or agreement with or between foreign and domestic Authorities applicable to People's Multi-Purpose Cooperative and/or and any of its affiliates and subsidiaries, their agents or providers;</td></tr>
        </table>
        
        <div class="indent-no-bullet">To verify the identity or authority of my/our family members, friends, beneficiaries, attorneys, attorneys-in-fact, shareholders, beneficial owners (if relevant), persons under any trust, trustees, partners, committee members, directors, officers or authorized signatories, sureties, guarantors, other security and other individuals, representatives who contact People's Multi-Purpose Cooperative or may be contacted by People's Multi-Purpose Cooperative (collectively, the "Related Person/s") and to carry out respond to requests, questions or instructions from verified representatives or other parties pursuant to People's Multi-Purpose Cooperative's then currently security procedure;</div>

        <table style="width: 100%; border-collapse: collapse;">
            <tr><td class="list-letter" valign="top">f.</td><td class="list-text">For risk assessment, statistical and trend analysis and planning purposes, including to carry out data processing, statistical, credit, risk and anti-money laundering and sanctions analysis, creating and maintaining credit scoring models, and otherwise ensuring or ongoing credit worthiness of Data Subjects and Related Person/s, including conducting banking, credit, financial and other background checks and reviews, and maintaining banking, credit and financial history of individuals (whether or not there exists any direct relationship between the Data Subject or Related Person/s, and People's Multi-Purpose Cooperative and creating and maintaining business development plans and activities for present and future reference;</td></tr>
            <tr><td class="list-letter" valign="top">g.</td><td class="list-text">To monitor and record all calls and electronic communications with Data Subject/s and Related Person/s for record keeping, quality assurance, customer service training, investigation, litigation and fraud prevention purposes;</td></tr>
            <tr><td class="list-letter" valign="top">h.</td><td class="list-text">For crime and fraud detection, prevention, investigation and prosecution;</td></tr>
            <tr><td class="list-letter" valign="top">i.</td><td class="list-text">To enforce (including without limitation collecting amounts outstanding) or defend the rights of People's Multi-purpose Cooperative and/or any of its affiliates and subsidiaries, its employees, officers and director, contractual or otherwise;</td></tr>
            <tr><td class="list-letter" valign="top">j.</td><td class="list-text">To perform internal management and management reporting, to operate control and management information systems and to carry out business risk, control or compliance review or testing, internal audits or enable the conduct of external audits;</td></tr>
            <tr><td class="list-letter" valign="top">k.</td><td class="list-text">To comply with contractual arrangements or to support initiatives, projects and programs by or between financial industry self-regulatory organizations, financial industry bodies, associations of financial services providers or other financial institutions (each, an "Industry Organization"), including assisting other financial institutions to conduct background or credit checks or collect debts;</td></tr>
            <tr><td class="list-letter" valign="top">l.</td><td class="list-text">To manage People's Multi-Purpose Cooperative's relationship with the Data Subject, which may include providing information about the Data Subject or a Related Person/s, to People's Multi-Purpose Cooperative and any of its affiliates and subsidiaries;</td></tr>
            <tr><td class="list-letter" valign="top">m.</td><td class="list-text">To comply with any obligations, requirements, policies, procedures, measures or arrangements for sharing data and information within People's Multi-Purpose Cooperative and any of its affiliates and subsidiaries and any other use of data and information in accordance with any People's Multi-Purpose Cooperative programs for compliance with tax, sanctions or prevention or detection of money laundering, terrorist financing or other unlawful activities; and</td></tr>
            <tr><td class="list-letter" valign="top">n.</td><td class="list-text">To comply with any obligations, requirements, policies, procedures, measures or arrangements for sharing data and information within People's Multi-Purpose Cooperative and any of its affiliates and subsidiaries and any other use of data and information in accordance with any People's Multi-Purpose Cooperative programs for compliance with tax, sanctions or prevention or detection of money laundering, terrorist financing or other unlawful activities; and</td></tr>
        </table>
    </div>

    <p>Or any other transactions and/or purposes analogous or relating directly thereto, at the same time, I/we agree that the Information shall be retained by People's Multi-Purpose Cooperative for as long as necessary for the fulfillment of any of the aforementioned Purposes, and shall continue to be detained for a period of two (2) years notwithstanding the termination of any of the above Purposes.</p>

    <p>Further, I/we understand that, with respect to my/our duty and responsibility: (i) to inform said Related Person/s of the Purpose/s for which his/their Personal Data have been submitted, collected and processed by People's Multi-Purpose Cooperative, (ii) to obtain consent from the said Related Person/s for the collection and processing of his/her Personal Data/Information in accordance with the Data Privacy Act of 2012, and (iii) to inform People's Multi-Purpose Cooperative that such consent from said Related Person/s have been obtained.</p>

    <div class="page-break"></div>

    <table class="header-table">
        <tr>
            <td width="70" style="vertical-align: middle;">
                @if($logoData) <img src="{{ $logoData }}" style="width: 65px; height: auto;"/> @endif
            </td>
            <td class="text-center">
                <div class="coop-name">PEOPLE'S MULTI-PURPOSE COOPERATIVE</div>
                <div class="address-block">
                    <span class="address-line"><strong>(Main Office)</strong> Stall #2, Principe Building, Maharlika Highway, Upi, Gamu, Isabela</span>
                    <span class="address-line"><strong>(Liaison Office)</strong> Purok 3, Brgy. Militar, Palayan City, Nueva Ecija</span>
                    <span class="address-line"><strong>Gmail:</strong> peoplesmpcooperative@gmail.com</span>
                    <span class="address-line">(02)8848-9760, (63)965-953-2196, (63)953-033-1580, (63)968-263-5186</span>
                </div>
            </td>
            <td width="70"></td>
        </tr>
    </table>

    <p>I/we hereby acknowledge that I/we have been provided with the written notification below on my/our rights as a Data Subject (each, a "Right", collectively, the "Rights") in accordance with the Data Privacy Act of 2012, to wit:</p>

    <div class="list-block">
        <table style="width: 100%; border-collapse: collapse;">
            <tr><td class="list-letter" valign="top">i.</td><td class="list-text">To be informed whether information and/or Personal Data is being or has been processed;</td></tr>
            <tr><td class="list-letter" valign="top">ii.</td><td class="list-text">To require People's Multi-Purpose Cooperative to correct any information and/or Personal Data relating to the Data Subject which is accurate;</td></tr>
            <tr><td class="list-letter" valign="top">iii.</td><td class="list-text">To object the processing of the Information and/or Personal Data in case of Changes or amendments to the information and/or Personal Data supplied or declared to the Data Subject;</td></tr>
            <tr><td class="list-letter" valign="top">iv.</td><td class="list-text">To access the Information and/or Personal Data;</td></tr>
            <tr><td class="list-letter" valign="top">v.</td><td class="list-text">To suspend, withdraw or order the blocking, removal or destruction of the Data Subject's Personal Data from People's Multi-Purpose Cooperative's information database system.</td></tr>
        </table>
    </div>

    <div class="list-block" style="margin-top: 15px;">
        <table style="width: 100%; border-collapse: collapse;">
            <tr><td class="list-letter" valign="top">a.</td><td class="list-text">I/we acknowledge, further, that if I/we was/were to exercise any of the Rights enumerated above, People's Multi-Purpose Cooperative reserves its right to re-evaluate and/or terminate its Business with me/us as well as any of the Purposes and/or People's Multi-Purpose Cooperative services/products for which the information and/or Personal Data has been collected and processed.</td></tr>
            <tr><td class="list-letter" valign="top">b.</td><td class="list-text">I/We have read and understood the above and hereby consent to, agree on, accept and acknowledge these terms of consent for myself/ourselves and/or as agent/s for and on behalf of the principal/s I/we represent by signing below.</td></tr>
        </table>
    </div>

    <div class="sig-section">
        <p style="text-indent: 0;">Signed in <strong>_____________________________</strong> on <strong>{{ $date }}</strong></p>
        
        <table style="width: 100%; margin-top: 40px;">
            <tr>
                <td width="50%" valign="bottom">
                    <div style="margin-bottom: 5px;"><strong>Company Name: People's Multi-Purpose Cooperative</strong></div>
                    <div>By: _____________________________</div>
                    <div style="font-size: 8pt; margin-left: 25px;">Authorized Signatory</div>
                </td>
                <td width="50%" class="text-center" valign="bottom">
                    <div class="line-val uppercase">{{ $member->firstName }} {{ $member->lastName }}</div>
                    <div style="font-size: 8pt;">Signature over Printed Name</div>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>