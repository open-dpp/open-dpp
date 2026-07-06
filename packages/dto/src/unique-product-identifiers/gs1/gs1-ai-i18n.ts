/**
 * @generated DO NOT EDIT BY HAND
 *
 * Regenerate with: pnpm gen:gs1  (scripts/gs1-generator/index.mts)
 *
 * Provenance: GS1 Application Identifier registry — https://ref.gs1.org/ai/
 * Retrieved: 2026-07-06 (UTC), 206 translation rows (en, de)
 * Upstream payload SHA-256: f49b2e288acdf7fca711f47ffb1cbecaa2b22c5445f4f9089ef2821912e0d336
 *
 * Data © GS1 AISBL, published under the GS1 terms of use (factual standards
 * data, attribution given; no open-source license).
 *
 * GS1 AI description translations, keyed exactly as GS1 publishes them in the
 * translation block of the AI browser page: exact AI strings, decimal-place /
 * sequence family keys ("390n", "703s"), and the "91-99" range key. Use
 * getGs1AiDescription() from gs1-ai-description.ts to resolve an AI.
 */

/** A translated GS1 AI description. `en` is always present; other languages are optional. */
export interface Gs1AiI18nEntry {
  readonly en: string;
  readonly de?: string;
}

/** Languages vendored into GS1_AI_I18N. */
export type Gs1AiI18nLang = "en" | "de";

/** GS1 AI description translations (206 rows), keyed as published by GS1. */
export const GS1_AI_I18N = {
  "00": {
    en: "Serial Shipping Container Code (SSCC)",
    de: "Serial Shipping Container Code (SSCC)",
  },
  "01": { en: "Global Trade Item Number (GTIN)", de: "Global Trade Item Number (GTIN)" },
  "02": {
    en: "Identification of trade items contained in a logistic unit",
    de: "Global Trade Item Number (GTIN) der Handelseinheiten enthalten in einer Transporteinheit",
  },
  "03": {
    en: "Identification of a Made-to-Order (MtO) trade item (GTIN)",
    de: "Identifikationsschlüssel einer auftragsspezifischen (Made-to-Order - MtO) Handelseinheit (GTIN)",
  },
  "10": { en: "Batch or lot number", de: "Los-/Chargennummer" },
  "11": { en: "Production date (YYMMDD)", de: "Produktionsdatum (JJMMTT)" },
  "12": { en: "Due date for amount on payment slip (YYMMDD)", de: "Fälligkeitsdatum (JJMMTT)" },
  "13": { en: "Packaging date (YYMMDD)", de: "Packdatum (JJMMTT)" },
  "15": { en: "Best before date (YYMMDD)", de: "Mindesthaltbarkeitsdatum (JJMMTT)" },
  "16": { en: "Sell by date (YYMMDD)", de: "”Zu verkaufen bis”-Datum (JJMMTT)" },
  "17": { en: "Expiration date (YYMMDD)", de: "Verfallsdatum (JJMMTT)" },
  "20": { en: "Internal product variant", de: "Interne Produktvariante" },
  "21": { en: "Serial number", de: "Seriennummer" },
  "22": { en: "Consumer product variant", de: "Verbraucherproduktvariante" },
  "235": {
    en: "Third Party Controlled, Serialised Extension of Global Trade Item Number (GTIN) (TPX)",
    de: "Serielle Erweiterung der GTIN durch Dritte (TPX)",
  },
  "240": {
    en: "Additional product identification assigned by the manufacturer",
    de: "Zusätzliche Produktidentifikation des Herstellers",
  },
  "241": { en: "Customer part number", de: "Kundenteilenummer" },
  "242": { en: "Made-to-Order variation number", de: "unternehmensspezifische Variationsnummer" },
  "243": { en: "Packaging component number", de: "Verpackungskomponentennummer" },
  "250": { en: "Secondary serial number", de: "Seriennummer eines integrierten Bauteiles" },
  "251": { en: "Reference to source entity", de: "Bezug auf die Ursprungseinheit" },
  "253": {
    en: "Global Document Type Identifier (GDTI)",
    de: "Global Document Type Identifier (GDTI)",
  },
  "254": {
    en: "Global Location Number (GLN) extension component",
    de: "Global Location Number (GLN) Erweiterungskomponente",
  },
  "255": { en: "Global Coupon Number (GCN)", de: "Global Coupon Number (GCN)" },
  "30": {
    en: "Variable count of items (variable measure trade item)",
    de: "Variable Menge in Stück (Mengenvariable Einheiten)",
  },
  "310n": {
    en: "Net weight, kilograms (variable measure trade item)",
    de: "Nettogewicht, Kilogramm (Mengenvariable Einheiten)",
  },
  "311n": {
    en: "Length or first dimension, metres (variable measure trade item)",
    de: "Länge oder 1. Dimension, Meter Handelsinformation (Mengenvariable Einheiten)",
  },
  "312n": {
    en: "Width, diameter, or second dimension, metres (variable measure trade item)",
    de: "Breite, Durchmesser oder 2. Dimension, Meter Handelsinformation (Mengenvariable Einheiten)",
  },
  "313n": {
    en: "Depth, thickness, height, or third dimension, metres (variable measure trade item)",
    de: "Dicke, Tiefe, Höhe oder 3. Dimension, Meter Handelsinformation (Mengenvariable Einheiten)",
  },
  "314n": {
    en: "Area, square metres (variable measure trade item)",
    de: "Fläche, Handelsinformation, Quadratmeter (Mengenvariable Einheiten)",
  },
  "315n": {
    en: "Net volume, litres (variable measure trade item)",
    de: "Nettovolumen, Liter (Mengenvariable Einheiten)",
  },
  "316n": {
    en: "Net volume, cubic metres (variable measure trade item)",
    de: "Nettovolumen, Kubikmeter (Mengenvariable Einheiten)",
  },
  "320n": {
    en: "Net weight, pounds (variable measure trade item)",
    de: "Nettogewicht, Pfund (Mengenvariable Einheiten)",
  },
  "321n": {
    en: "Length or first dimension, inches (variable measure trade item)",
    de: "Länge oder 1. Dimension, Inch, Handelsinformation (Mengenvariable Einheiten)",
  },
  "322n": {
    en: "Length or first dimension, feet (variable measure trade item)",
    de: "Länge oder 1. Dimension, Feet, Handelsinformation (Mengenvariable Einheiten)",
  },
  "323n": {
    en: "Length or first dimension, yards (variable measure trade item)",
    de: "Länge oder 1. Dimension, Yard, Handelsinformation (Mengenvariable Einheiten)",
  },
  "324n": {
    en: "Width, diameter, or second dimension, inches (variable measure trade item)",
    de: "Breite, Durchmesser oder 2. Dimension, Inch, Handelsinformation (Mengenvariable Einheiten)",
  },
  "325n": {
    en: "Width, diameter, or second dimension, feet (variable measure trade item)",
    de: "Breite, Durchmesser oder 2. Dimension, Feet, Handelsinformation (Mengenvariable Einheiten)",
  },
  "326n": {
    en: "Width, diameter, or second dimension, yards (variable measure trade item)",
    de: "Breite, Durchmesser oder 2. Dimension, Yard, Handelsinformation (Mengenvariable Einheiten)",
  },
  "327n": {
    en: "Depth, thickness, height, or third dimension, inches (variable measure trade item)",
    de: "Tiefe, Dicke, Höhe oder 3. Dimension, Inch, Handelsinformation (Mengenvariable Einheiten)",
  },
  "328n": {
    en: "Depth, thickness, height, or third dimension, feet (variable measure trade item)",
    de: "Tiefe, Dicke, Höhe oder 3. Dimension, Feet, Handelsinformation (Mengenvariable Einheiten)",
  },
  "329n": {
    en: "Depth, thickness, height, or third dimension, yards (variable measure trade item)",
    de: "Tiefe, Dicke, Höhe oder 3. Dimension, Yard, Handelsinformation (Mengenvariable Einheiten)",
  },
  "330n": { en: "Logistic weight, kilograms", de: "Bruttogewicht, Kilogramm" },
  "331n": { en: "Length or first dimension, metres", de: "Länge oder 1. Dimension, Meter" },
  "332n": {
    en: "Width, diameter, or second dimension, metres",
    de: "Breite, Durchmesser oder 2. Dimension, Meter",
  },
  "333n": {
    en: "Depth, thickness, height, or third dimension, metres",
    de: "Dicke, Tiefe, Höhe oder 3. Dimension, Meter",
  },
  "334n": { en: "Area, square metres", de: "Fläche, Quadratmeter" },
  "335n": { en: "Logistic volume, litres", de: "Bruttovolumen, Liter" },
  "336n": { en: "Logistic volume, cubic metres", de: "Bruttovolumen, Kubikmeter" },
  "337n": { en: "Kilograms per square metre", de: "Kilogramm pro Quadratmeter" },
  "340n": { en: "Logistic weight, pounds", de: "Bruttogewicht, Pfund" },
  "341n": { en: "Length or first dimension, inches", de: "Länge oder 1. Dimension, Inch" },
  "342n": { en: "Length or first dimension, feet", de: "Länge oder 1. Dimension, Feet" },
  "343n": { en: "Length or first dimension, yards", de: "Länge oder 1. Dimension, Yard" },
  "344n": {
    en: "Width, diameter, or second dimension, inches",
    de: "Breite, Durchmesser oder 2. Dimension, Inch",
  },
  "345n": {
    en: "Width, diameter, or second dimension, feet",
    de: "Breite, Durchmesser oder 2. Dimension, Feet",
  },
  "346n": {
    en: "Width, diameter, or second dimension, yard",
    de: "Breite, Durchmesser oder 2. Dimension, Yard",
  },
  "347n": {
    en: "Depth, thickness, height, or third dimension, inches",
    de: "Dicke, Tiefe, Höhe oder 3. Dimension, Inch",
  },
  "348n": {
    en: "Depth, thickness, height, or third dimension, feet",
    de: "Dicke, Tiefe, Höhe oder 3. Dimension, Feet",
  },
  "349n": {
    en: "Depth, thickness, height, or third dimension, yards",
    de: "Dicke, Tiefe, Höhe oder 3. Dimension, Yard",
  },
  "350n": {
    en: "Area, square inches (variable measure trade item)",
    de: "Fläche, Square Inch (Mengenvariable Handelseinheiten)",
  },
  "351n": {
    en: "Area, square feet (variable measure trade item)",
    de: "Fläche, Square Feet (Mengenvariable Handelseinheiten)",
  },
  "352n": {
    en: "Area, square yards (variable measure trade item)",
    de: "Fläche, Square Yards (Mengenvariable Handelseinheiten)",
  },
  "353n": { en: "Area, square inches", de: "Fläche, Square Inch" },
  "354n": { en: "Area, square feet", de: "Fläche, Square Feet" },
  "355n": { en: "Area, square yards", de: "Fläche, Square Yard" },
  "356n": {
    en: "Net weight, troy ounces (variable measure trade item)",
    de: "Nettogewicht, Troy-Unze (Mengenvariable Handelseinheiten)",
  },
  "357n": {
    en: "Net weight (or volume), ounces (variable measure trade item)",
    de: "Nettogewicht (oder Volumen), Unze (Mengenvariable Handelseinheiten)",
  },
  "360n": {
    en: "Net volume, quarts (variable measure trade item)",
    de: "Nettovolumen, Quart (Mengenvariable Handelseinheiten)",
  },
  "361n": {
    en: "Net volume, gallons U.S. (variable measure trade item)",
    de: "Nettovolumen, Gallone U.S. (Mengenvariable Handelseinheiten)",
  },
  "362n": { en: "Logistic volume, quarts", de: "Bruttovolumen, Quart" },
  "363n": { en: "Logistic volume, gallons U.S.", de: "Bruttovolumen, Gallone U.S." },
  "364n": {
    en: "Net volume, cubic inches (variable measure trade item)",
    de: "Nettovolumen, Cubic Inch (Mengenvariable Handelseinheiten)",
  },
  "365n": {
    en: "Net volume, cubic feet (variable measure trade item)",
    de: "Nettovolumen, Cubic Feet (Mengenvariable Handelseinheiten)",
  },
  "366n": {
    en: "Net volume, cubic yards (variable measure trade item)",
    de: "Nettovolumen, Cubic Yard (Mengenvariable Handelseinheiten)",
  },
  "367n": { en: "Logistic volume, cubic inches", de: "Bruttovolumen, Cubic Inch" },
  "368n": { en: "Logistic volume, cubic feet", de: "Bruttovolumen, Cubic Feet" },
  "369n": { en: "Logistic volume, cubic yards", de: "Bruttovolumen, Cubic Yard" },
  "37": {
    en: "Count of trade items or trade item pieces contained in a logistic unit",
    de: "Anzahl in einer Transporteinheit enthaltenen Einheiten oder Teile einer Handelseinheit",
  },
  "390n": {
    en: "Amount payable or coupon value - Single monetary area",
    de: "Fälliger Betrag oder Couponwert – gegebener Währungsbereich",
  },
  "391n": {
    en: "Amount payable and ISO currency code",
    de: "Fälliger Betrag – mit ISO Währungscode",
  },
  "392n": {
    en: "Amount payable for a variable measure trade item – Single monetary area",
    de: "Zu zahlender Betrag – gegebener Währungsbereich",
  },
  "393n": {
    en: "Amount payable for a variable measure trade item and ISO currency code",
    de: "Zu zahlender Betrag – mit ISO Währungscode",
  },
  "394n": { en: "Percentage discount of a coupon", de: "Prozentrabatt eines Coupons" },
  "395n": {
    en: "Amount Payable per unit of measure single monetary area (variable measure trade item)",
    de: "Zu zahlender Betrag pro Maßeinheit in der lokalen Währung (Mengenvariable Handelseinheiten)",
  },
  "400": {
    en: "Customer’s purchase order number",
    de: "Bestell-/Auftragsnummer des Warenempfängers",
  },
  "401": {
    en: "Global Identification Number for Consignment (GINC)",
    de: "Global Identification Number for Consignment (GINC)",
  },
  "402": {
    en: "Global Shipment Identification Number (GSIN)",
    de: "Global Shipment Identification Number (GSIN)",
  },
  "403": { en: "Routing code", de: "Leitcode, Routing Code" },
  "410": {
    en: "Ship to / Deliver to Global Location Number (GLN)",
    de: "Global Location Number (GLN) des Warenempfängers",
  },
  "411": {
    en: "Bill to / Invoice to Global Location Number (GLN)",
    de: "Global Location Number (GLN) des Rechnungsempfängers",
  },
  "412": {
    en: "Purchased from Global Location Number (GLN)",
    de: "Global Location Number (GLN) des Lieferanten",
  },
  "413": {
    en: "Ship for / Deliver for - Forward to Global Location Number (GLN)",
    de: "Global Location Number (GLN) des Endempfängers (bei gebrochenem Transport)",
  },
  "414": {
    en: "Identification of a physical location - Global Location Number (GLN)",
    de: "Global Location Number (GLN) zur Identifikation einer physischen Lokation",
  },
  "415": {
    en: "Global Location Number (GLN) of the invoicing party",
    de: "Global Location Number (GLN) des fakturierenden Teilnehmers",
  },
  "416": {
    en: "Global Location Number (GLN) of the production or service location",
    de: "Global Location Number (GLN) des Produktions- oder Servicestandorts",
  },
  "417": {
    en: "Party Global Location Number (GLN)",
    de: "Global Location Number (GLN) einer Organisation",
  },
  "420": {
    en: "Ship to / Deliver to postal code within a single postal authority",
    de: "Postleitzahl des Empfängers (ohne Ländercode)",
  },
  "421": {
    en: "Ship to / Deliver to postal code with ISO country code",
    de: "Postleitzahl des Empfängers (mit vorangestelltem 3-stelligen ISO Ländercode)",
  },
  "422": { en: "Country of origin of a trade item", de: "Ursprungsland der Ware" },
  "423": { en: "Country of initial processing", de: "Länder der ersten Verarbeitungsstufe" },
  "424": { en: "Country of processing", de: "Land der Verarbeitung" },
  "425": { en: "Country of disassembly", de: "Land der Zerlegung" },
  "426": { en: "Country covering full process chain", de: "Land aller Verarbeitungsstufen" },
  "427": {
    en: "Country subdivision of origin code for a trade item",
    de: "Region des Ursprungslandes der Handelseinheit",
  },
  "4300": { en: "Ship-to / Deliver-to Company name", de: "Empfänger-Unternehmen" },
  "4301": { en: "Ship-to / Deliver-to contact name", de: "Empfänger-Kontakt" },
  "4302": { en: "Ship-to / Deliver-to address line 1", de: "Empfänger-Adresszeile 1" },
  "4303": { en: "Ship-to / Deliver-to address line 2", de: "Empfänger-Adresszeile 2" },
  "4304": { en: "Ship-to / Deliver-to suburb", de: "Empfänger-Ortsteil" },
  "4305": { en: "Ship-to / Deliver-to locality", de: "Empfänger-Ort" },
  "4306": { en: "Ship-to / Deliver-to region", de: "Empfänger-Region" },
  "4307": { en: "Ship-to / Deliver-to country code", de: "Empfänger-Ländercode" },
  "4308": { en: "Ship-to / Deliver-to telephone number", de: "Empfänger-Telefonnummer" },
  "4309": { en: "Ship-to / Deliver-to GEO location", de: "Empfänger-GEO Lokation" },
  "4310": { en: "Return-to company name", de: "Retoure an-Unternehmen" },
  "4311": { en: "Return-to contact", de: "Retoure an-Kontakt" },
  "4312": { en: "Return-to address line 1", de: "Retoure an-Adresszeile 1" },
  "4313": { en: "Return-to address line 2", de: "Retoure an-Adresszeile 2" },
  "4314": { en: "Return-to suburb", de: "Retoure an-Ortsteil" },
  "4315": { en: "Return-to locality", de: "Retoure an-Ort" },
  "4316": { en: "Return-to region", de: "Retoure an-Region" },
  "4317": { en: "Return-to country code", de: "Retoure an-Ländercode" },
  "4318": { en: "Return-to postal code", de: "Retoure an-Postleitzahl" },
  "4319": { en: "Return-to telephone number", de: "Retoure an-Telefonnummer" },
  "4320": { en: "Service code description", de: "Erläuterung des Liefercodes" },
  "4321": { en: "Dangerous goods flag", de: "Kennzeichen für Gefahrgut" },
  "4322": { en: "Authority to leave", de: "Zustellung ohne persönliche Entgegennahme" },
  "4323": { en: "Signature required flag", de: "Kennzeichen für - Unterschrift erforderlich" },
  "4324": {
    en: "Not before delivery date time (YYMMDDhhmm)",
    de: "Keine Zustellung vor Datum/Zeit (JJMMTTSSMM)",
  },
  "4325": {
    en: "Not after delivery date time (YYMMDDhhmm)",
    de: "Keine Zustellung nach Datum/Zeit (JJMMTTSSMM)",
  },
  "4326": { en: "Release date (YYMMDD)", de: "Freigabedatum für Auslieferung" },
  "4330": { en: "Maximum temperature in Fahrenheit", de: "Maximale Temperatur in Fahrenheit" },
  "4331": { en: "Maximum temperature in Celsius", de: "Maximale Temperatur in Celsius" },
  "4332": { en: "Minimum temperature in Fahrenheit", de: "Minimale Temperatur in Fahrenheit" },
  "4333": { en: "Minimum temperature in Celsius", de: "Minimale Temperatur in Celsius" },
  "7001": { en: "NATO Stock Number (NSN)", de: "NATO Stock Number" },
  "7002": {
    en: "UNECE meat carcasses and cuts classification",
    de: "UNECE Fleischkarkassen und Schnittklassifizierung",
  },
  "7003": {
    en: "Expiration date and time (YYMMDDhhmm)",
    de: "Verfallsdatum und -zeit (JJMMTTSSMM)",
  },
  "7004": { en: "Active potency", de: "Aktive Potenz" },
  "7005": { en: "Catch area", de: "Fanggebiet" },
  "7006": { en: "First freeze date (YYMMDD)", de: "Erstes Einfrierdatum (JJMMTT)" },
  "7007": { en: "Harvest date (YYMMDD[YYMMDD])", de: "Erntedatum (JJMMTT[JJMMTT])" },
  "7008": { en: "Species for fishery purposes", de: "Fischspezies" },
  "7009": { en: "Fishing gear type", de: "Fanggerätekategorie" },
  "7010": { en: "Production method", de: "Produktionsmethode" },
  "7011": { en: "Test by date (YYMMDD[hhmm])", de: "Prüfdatum (JJMMTT[SSMM])" },
  "7020": { en: "Refurbishment lot ID", de: "Losnummer der Wiederaufbereitung" },
  "7021": { en: "Functional status", de: "Funktionaler Status" },
  "7022": { en: "Revision status", de: "Revisionsstatus" },
  "7023": {
    en: "Global Individual Asset Identifier (GIAI) of an assembly",
    de: "Global Individual Asset Identifier (GIAI) einer Baugruppe",
  },
  "703s": {
    en: "Number of processor with three-digit ISO country code",
    de: "Nummer des Verarbeitungsbetriebes mit ISO Ländercode",
  },
  "7040": {
    en: "GS1 UIC with Extension 1 and Importer index",
    de: "GS1 UIC mit Erweiterung 1 und Importeur Index",
  },
  "7041": { en: "UN/CEFACT freight unit type", de: "Art der UN/CEFACT-Frachteinheit" },
  "710": {
    en: "National Healthcare Reimbursement Number (NHRN) - Germany PZN",
    de: "National Healthcare Reimbursement Number (NHRN) – Deutschland PZN",
  },
  "711": {
    en: "National Healthcare Reimbursement Number (NHRN) - France CIP",
    de: "National Healthcare Reimbursement Number (NHRN) – Frankreich CIP",
  },
  "712": {
    en: "National Healthcare Reimbursement Number (NHRN) - Spain CN",
    de: "National Healthcare Reimbursement Number (NHRN) – Spanien CN",
  },
  "713": {
    en: "National Healthcare Reimbursement Number (NHRN) - Brasil DRN",
    de: "National Healthcare Reimbursement Number (NHRN) – Brasilien DRN",
  },
  "714": {
    en: "National Healthcare Reimbursement Number (NHRN) - Portugal AIM",
    de: "National Healthcare Reimbursement Number (NHRN) – Portugal AIM",
  },
  "715": {
    en: "National Healthcare Reimbursement Number (NHRN) - United States of America NDC",
    de: "National Healthcare Reimbursement Number (NHRN) – USA NDC",
  },
  "716": {
    en: "National Healthcare Reimbursement Number (NHRN) - Italy AIC",
    de: "National Healthcare Reimbursement Number (NHRN) – Italien AIC",
  },
  "717": {
    en: "National Healtcare Reimbursement Number (NHRN) – Costa Rica Sanitary Register Number",
    de: "National Healthcare Reimbursement Number (NHRN) – Costa Rica Sanitary Register Number",
  },
  "723n": { en: "Certification reference", de: "Zertifizierungsnummer" },
  "7240": { en: "Protocol ID", de: "Protokoll ID" },
  "7241": { en: "AIDC media type", de: "AIDC Trägertyp" },
  "7242": { en: "Version Control Number (VCN)", de: "Versions-Kontrollnummer (VCN)" },
  "7250": { en: "Date of birth (YYYYMMDD)", de: "Geburtsdatum (JJJJMMTT)" },
  "7251": {
    en: "Date and time of birth (YYYYMMDDhhmm)",
    de: "Geburtsdatum und -zeit (JJJJMMTTSSMM)",
  },
  "7252": { en: "Biological sex", de: "Biologisches Geschlecht" },
  "7253": { en: "Family name of person", de: "Familienname" },
  "7254": { en: "Given name of person", de: "Vorname" },
  "7255": { en: "Name suffix of person", de: "Namenszusatz" },
  "7256": { en: "Full name of person", de: "vollständiger Name" },
  "7257": { en: "Address of person", de: "Wohnadresse" },
  "7258": { en: "Baby birth sequence", de: "Geburtsreihenfolge" },
  "7259": { en: "Baby of family name", de: "Baby der Familie" },
  "8001": {
    en: "Roll products (width, length, core diameter, direction, splices)",
    de: "Sonderanwendung Rollenprodukte (Breite, Länge, Durchmesser, Richtung, Spleißungen)",
  },
  "8002": {
    en: "Cellular mobile telephone identifier",
    de: "Cellular Mobile Telephone Identifier",
  },
  "8003": {
    en: "Global Returnable Asset Identifier (GRAI)",
    de: "Global Returnable Asset Identifier (GRAI)",
  },
  "8004": {
    en: "Global Individual Asset Identifier (GIAI)",
    de: "Global Individual Asset Identifier (GIAI)",
  },
  "8005": { en: "Price per unit of measure", de: "Preis pro Maßeinheit" },
  "8006": {
    en: "Identification of an individual trade item (ITIP) piece",
    de: "Identifikation eines einzelnen Teils einer Handelseinheit",
  },
  "8007": {
    en: "International Bank Account Number (IBAN)",
    de: "Internationale Bankenverrechnungsnummer (IBAN)",
  },
  "8008": {
    en: "Date and time of production (YYMMDDhh[mm[ss]])",
    de: "Produktionsdatum und -zeit (JJMMTTSS[MM[SS]])",
  },
  "8009": {
    en: "Optically Readable Sensor Indicator",
    de: "Indikator für einen optisch interpretierbaren Sensor",
  },
  "8010": { en: "Component/Part Identifier (CPID)", de: "Component/Part Identifier (CPID)" },
  "8011": {
    en: "Component/Part Identifier serial number (CPID SERIAL)",
    de: "Component/Part Identifier Serial Number (CPID SERIAL)",
  },
  "8012": { en: "Software version", de: "Software Version" },
  "8013": { en: "Global Model Number (GMN)", de: "Global Model Number (GMN)" },
  "8014": {
    en: "Highly Individualised Device Registration Identifier (HIDRI)",
    de: "Highly Individualised Device Registration Identifier (HIDRI)",
  },
  "8017": {
    en: "Global Service Relation Number (GSRN) to identify the relationship between an organisation offering services and the provider of services",
    de: "Global Service Relation Number (GSRN) zur Identifizierung der Beziehung zwischen Anbieter des Services und dem Erbringer",
  },
  "8018": {
    en: "Global Service Relation Number (GSRN) to identify the relationship between an organisation offering services and the recipient of services",
    de: "Global Service Relation Number (GSRN) zur Identifizierung der Beziehung zwischen Anbieter des Services und dem Empfänger",
  },
  "8019": {
    en: "Service Relation Instance Number (SRIN)",
    de: "Service Relation Instance Number (SRIN) Vorgangsnummer einer Servicebeziehung",
  },
  "8020": { en: "Payment slip reference number", de: "Zahlscheinbezugsnummer" },
  "8026": {
    en: "Identification of pieces of a trade item (ITIP) contained in a logistic unit",
    de: "Identifikation von Teilen einer Handelseinheit (ITIP) enthalten in einer Transporteinheit",
  },
  "8030": { en: "Digital Signature (DigSig)", de: "Digitale Signatur (DigSig)" },
  "8040": {
    en: "International Mobile Equipment Identity (IMEI)",
    de: "International Mobile Equipment Identity (IMEI)",
  },
  "8041": {
    en: "International Mobile Equipment Identity 2 (IMEI2)",
    de: "International Mobile Equipment Identity 2 (IMEI2)",
  },
  "8042": { en: "Embedded SIM", de: "digitale SIM" },
  "8043": { en: "Physical SIM", de: "physische SIM" },
  "8110": {
    en: "Coupon code identification for use in North America",
    de: "Coupon Code für Nordamerika",
  },
  "8111": { en: "Loyalty points of a coupon", de: "Treuepunkte eines Coupon" },
  "8112": {
    en: "Positive offer file coupon code identification for use in North America",
    de: "„Positive Offer File“ Couponidentifikation in Nordamerika",
  },
  "8200": { en: "Extended Packaging URL", de: "Extended Packaging URL" },
  "90": {
    en: "Information mutually agreed between trading partners",
    de: "Information für bilateral abgestimmte Anwendung",
  },
  "91-99": { en: "Company internal information", de: "Unternehmensinterne Anwendung" },
} as const satisfies Readonly<Record<string, Gs1AiI18nEntry>>;
