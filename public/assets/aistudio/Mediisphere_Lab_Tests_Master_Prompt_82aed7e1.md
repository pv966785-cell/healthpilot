# MASTER PROMPT — Add Lab Test Catalogue with Prices (Mediisphere)

You are a senior React + TypeScript engineer working on my existing app "Mediisphere" (a healthcare app with Patient, Doctor, Lab, Pharmacist and Admin sections; Tailwind CSS; demo data only). Do NOT rebuild or restyle the app. Make only the changes below, keep the current design, and do not break any existing feature.

## GOAL
Replace the small demo lab-test list with the full real lab test catalogue below (140 items, with prices in INR), and make it searchable and filterable for patients, and manageable for Lab and Admin users.

## 1. DATA — `content.ts`
Currently `SAMPLE_LAB_TESTS` has fields: id, name, category, parameters, reportHours, originalPrice, discountedPrice, fastingRequired, sampleType.
- Replace the contents of `SAMPLE_LAB_TESTS` with ALL 140 items from the DATA section below. Keep the export name so every existing screen keeps working.
- Extend the type (add optional fields, don't remove existing ones): `labRate: number`, `vial: string`, `tat: string`, `includes?: string[]` (only for panels), `isPanel: boolean`.
- Mapping for each row: `id` = "lab-" + running number; `name` = Test Name; `category` = Category; `sampleType` = Vial/Sample; `tat` = TAT text; `labRate` = Price; `discountedPrice` = labRate; `originalPrice` = labRate (do NOT invent fake discounts); `includes` = list split by comma for Special Panels, `isPanel` = true only for Special Panels; `parameters` = number of items in `includes` for panels, otherwise 1.
- `reportHours`: parse from TAT ("Up To 6 Hours" → 6, "Up to 72 hours" → 72, "Up to 4 days" → 96, "Up to 6 days" → 144; if unparseable → 24).
- `fastingRequired`: true for fasting-related tests (e.g. names containing "Fasting", "F/R/PP", "Lipid", "Sugar", "Glucose" ) else false. Keep it easy to edit.
- Add a single constant `PRICE_MARKUP_PERCENT = 0` at top of the file. Patient-facing price = round(labRate × (1 + PRICE_MARKUP_PERCENT/100)). With 0 the patient price equals the lab rate. Use this one function everywhere a lab price is shown.
- Categories to use (exact): Hematology, Biochemistry, Hormones, Immunology And Serology, Cancer Markers, Clinical Pathology, Microbiology, Special Tests, Special Panels.

## 2. PATIENT SCREENS
Wherever lab tests are shown (Lab Tests screen and the homepage preview that does `SAMPLE_LAB_TESTS.slice(0, 4)`):
- Show name, category, sample type, report time (TAT) and price (₹, Indian number format).
- Homepage preview: show the first 4 items of "Special Panels" (health check-ups) instead of the old ones.
- Lab Tests screen: add a search box (matches name and panel contents), category filter chips (All + 9 categories), a "Health Packages" quick filter (Special Panels), and sort (Price low→high, high→low, A→Z). Show result count. Add a clean "No tests found" empty state.
- Panels must show a small "Includes" expandable list.
- "Book / Add to cart" behaviour must stay exactly as it works today with the new items (the cart/booking total should use the new price function).
- Keep it mobile-first and fast: render in pages or with simple virtualization/"Load more" (20 per load) so 140 cards don't slow the phone.

## 3. LAB & ADMIN SECTIONS
- Lab dashboard: show the full catalogue in a table (Test, Category, Sample, TAT, Lab Rate) with search and category filter.
- Admin: allow editing a test's price (labRate), TAT, and enabling/disabling a test (add `active: boolean`, default true; inactive tests are hidden from patients). Add "Add new test" and "Delete" with a confirm. Store changes in the existing app state/context (and localStorage if the app already persists data there) so they reflect immediately on the patient side.
- Admin can also change `PRICE_MARKUP_PERCENT` from a small settings field (default 0) so the patient price updates everywhere.

## 4. QUALITY RULES
- TypeScript must compile with no errors; no `any` unless unavoidable.
- Keep existing styling (Tailwind classes, dark mode, #8B5CF6 accent used for categories).
- Do not change unrelated files. Do not add new heavy dependencies.
- Disclaimer line under the tests list: "Prices are indicative and may change. This is a test version with demo data."
- After the changes, list the files you modified and how to test them.

## DATA (140 items)
Format: Category | Test Name | Sample/Vial | TAT | Price in INR | Includes (panels only)

Hematology | Complete Blood Count (CBC) | EDTA | Up To 6 Hours | 300
Hematology | CBC+ESR | EDTA | Up To 6 Hours | 350
Hematology | Hemoglobin | EDTA | Up To 6 Hours | 100
Hematology | PT-INR | Citrate | Up To 6 Hours | 300
Hematology | APTT | Citrate | Up To 6 Hours | 300
Hematology | Clotting Time | On spot | Up To 6 Hours | 120
Hematology | Bleeding Time | On spot | Up To 6 Hours | 120
Hematology | Hba1c | EDTA | Up To 6 Hours | 400
Hematology | Peripheral Smear | EDTA | Up To 6 Hours | 150
Hematology | Blood Group | EDTA | Up To 6 Hours | 120
Hematology | Malarial Parasite | EDTA | Up To 6 Hours | 150
Hematology | Reticulocyte Count | EDTA | Up To 6 Hours | 150
Hematology | Abs Neut Count | EDTA | Up To 6 Hours | 150
Hematology | Abs Eos Count | EDTA | Up To 6 Hours | 150
Hematology | Platelet Count | EDTA | Up To 6 Hours | 150
Hematology | D-Dimer | Citrate | Up To 6 Hours | 1000
Biochemistry | Liver Function Test | Plain | Up To 6 Hours | 650
Biochemistry | Lipid Profile | Plain | Up To 6 Hours | 600
Biochemistry | Iron Profile Study (Iron+TIBC+Ferritin) | Plain | Up To 6 Hours | 850
Biochemistry | Kidney Function Test | Plain | Up To 6 Hours | 650
Biochemistry | Total Iron | Plain | Up To 6 Hours | 300
Biochemistry | TIBC | Plain | Up To 6 Hours | 200
Biochemistry | Ferritin | Plain | Up To 6 Hours | 600
Biochemistry | Total Cholesterol | Plain | Up To 6 Hours | 200
Biochemistry | HDL | Plain | Up To 6 Hours | 300
Biochemistry | Triglycerides | Plain | Up To 6 Hours | 200
Biochemistry | Uric Acid | Plain | Up To 6 Hours | 150
Biochemistry | Urea/BUN | Plain | Up To 6 Hours | 150
Biochemistry | Creatinine | Plain | Up To 6 Hours | 150
Biochemistry | Se Electrolyte (Na/K/Cl) | Plain | Up To 6 Hours | 350
Biochemistry | Chloride | Plain | Up To 6 Hours | 150
Biochemistry | Calcium Ionized | Plain | Up To 6 Hours | 150
Biochemistry | Sodium | Plain | Up To 6 Hours | 150
Biochemistry | Potassium | Plain | Up To 6 Hours | 150
Biochemistry | Sugar F/R/PP | Plain | Up To 6 Hours | 80
Biochemistry | Total Bilirubin | Plain | Up To 6 Hours | 150
Biochemistry | Bilirubin (Indirect) | Plain | Up To 6 Hours | 150
Biochemistry | Bilirubin (Direct) | Plain | Up To 6 Hours | 150
Biochemistry | Bilirubin (Total+Direct+Indirect) | Plain | Up To 6 Hours | 250
Biochemistry | AST (SGOT) | Plain | Up To 6 Hours | 150
Biochemistry | ALT (SGPT) | Plain | Up To 6 Hours | 150
Biochemistry | Allkaline Phospatase | Plain | Up To 6 Hours | 150
Biochemistry | Gamma Glutamyl Transferase (GGT) | Plain | Up To 6 Hours | 250
Biochemistry | Total Protein | Plain | Up To 6 Hours | 150
Biochemistry | Albumin | Plain | Up To 6 Hours | 150
Biochemistry | Globulin | Plain | Up To 6 Hours | 150
Biochemistry | Total Protein+Albumin+Globulin | Plain | Up To 6 Hours | 250
Biochemistry | Hs CRP | Plain | Up To 6 Hours | 350
Biochemistry | Lactate Dehydrogenase (LDH) | Plain | Up To 6 Hours | 200
Biochemistry | Amylase | Plain | Up To 6 Hours | 400
Biochemistry | Lipase | Plain | Up To 6 Hours | 500
Biochemistry | RA Factor | Plain | Up To 6 Hours | 400
Biochemistry | Vit B12 | Plain | Up To 6 Hours | 1200
Biochemistry | VIT D (25 (OH) Vitamin D) | Plain | Up To 6 Hours | 1500
Hormones | Thyroid Profile | Plain | Up To 6 Hours | 450
Hormones | T3 (Tri-iodothyronine) | Plain | Up To 6 Hours | 200
Hormones | T4 (Thyroxine) | Plain | Up To 6 Hours | 200
Hormones | TSH (Thyroid Stimulating Hormone) | Plain | Up To 6 Hours | 200
Hormones | LH (Luteinizing Hormone) | Plain | Up To 6 Hours | 600
Hormones | FSH (Follicle Stimulating Hormone) | Plain | Up To 6 Hours | 500
Hormones | Prolactin | Plain | Up To 6 Hours | 500
Hormones | B-Hcg | Plain | Up To 6 Hours | 700
Hormones | Insulin | Plain | Up To 6 Hours | 800
Hormones | Cortisol | Plain | Up To 6 Hours | 550
Hormones | Estradiol (E2) | Plain | Up To 24 Hours | 1000
Hormones | Free Thyroid Profile | Plain | Up To 6 Hours | 700
Hormones | Free T3 | Plain | Up To 6 Hours | 300
Hormones | Free T4 | Plain | Up To 6 Hours | 300
Hormones | Anti-TPO | Plain | Up To 6 Hours | 1200
Hormones | AMH (Anti Mullerian Hormone ) | Plain | Up To 8 Hours | 2100
Hormones | Testosterone- Total | Plain | Up To 6 Hours | 500
Hormones | Estriol(E3) | Plain | Up To 6 Hours | 1600
Hormones | Progesterone | Plain | Up To 6 Hours | 600
Hormones | DHEA- Sulphate | Plain | Up To 24 Hours | 1000
Hormones | PTH (Parathyroid Hormone ) | Plain | Up To 8 Hours | 1000
Immunology And Serology | Viral Marker Combo (HIV,HBSAG,HCV) | Plain | Up to 6 hours | 1000
Immunology And Serology | Hiv I,II Screening | Plain | Up to 6 hours | 400
Immunology And Serology | ASO | Plain | Up to 6 hours | 350
Immunology And Serology | TORCH IgM | Plain | Up to 6 hours | 2500
Immunology And Serology | Rubella IgG | Plain | Up to 6 hours | 600
Immunology And Serology | Rubella IgM | Plain | Up to 6 hours | 600
Immunology And Serology | IgE | Plain | Up to 6 hours | 750
Immunology And Serology | Hepatitis-C Rapid | Plain | Up to 6 hours | 600
Immunology And Serology | HBsAg Rapid | Plain | Up to 6 hours | 350
Immunology And Serology | Rheumatoid Factor | Plain | Up to 6 hours | 400
Immunology And Serology | Anti-Nuclear Antibody (ANA) | Plain | Up to 6 hours | 600
Immunology And Serology | Anti CCP | Plain | Up to 6 hours | 1500
Immunology And Serology | VDRL | Plain | Up to 6 hours | 150
Immunology And Serology | HS-CRP | Plain | Up to 6 hours | 450
Immunology And Serology | Widal | Plain | Up to 6 hours | 200
Immunology And Serology | Typhi-Dot | Plain | Up to 6 hours | 300
Immunology And Serology | Scrub Typhus Rapid | Plain | Up to 6 hours | 900
Immunology And Serology | Chikun-Gunya Rapid | Plain | Up to 6 hours | 900
Immunology And Serology | Hepatitis B envelope Ag (HBeAg) | Plain | Up to 6 hours | 900
Immunology And Serology | Dengue Rapid | Plain | Up to 6 hours | 1000
Immunology And Serology | Dengue Elisa | Plain | Up to 6 hours | 1200
Immunology And Serology | Malaria Antigen | EDTA | Up to 6 hours | 400
Immunology And Serology | Covid Antigen | Kit/VTM | Up to 6 hours | 275
Cancer Markers | PSA –Total | Plain | Up to 6 hours | 700
Cancer Markers | PSA-Free | Plain | Up to 24 hours | 900
Cancer Markers | Alpha Fetoprotein (AFP) | Plain | Up to 6 hours | 800
Cancer Markers | CA-125 | Plain | Up to 6 hours | 1000
Cancer Markers | CEA | Plain | Up to 6 hours | 630
Cancer Markers | CA 19-9 | Plain | Up to 6 hours | 1250
Cancer Markers | CA 15.3 | Plain | Up To 24 hours | 1250
Clinical Pathology | Urine –Routine | CON | Up to 6 hours | 150
Clinical Pathology | Urine For Malignant Cytology | CON | Up to 12 hours | 300
Clinical Pathology | Fluid- DLC/TLC | CON | Up to 6 hours | 250
Clinical Pathology | Stool-Routine | CON | Up to 6 hours | 150
Clinical Pathology | Semen Routine | CON | Up to 6 hours | 500
Clinical Pathology | Sputum For AFB | CON | Up to 6 hours | 300
Clinical Pathology | Fluid For Malignant Cytology | CON | Up to 12 hours | 300
Microbiology | Urine C/S | CON | Up to 72 hours | 500
Microbiology | Stool For S.Typhi | CON | Up to 72 hours | 750
Microbiology | Stool C/S | CON | Up to 72 hours | 500
Microbiology | Throat Swab Culture | Swab Stick | Up to 72 hours | 800
Microbiology | Pus Culture | Swab Stick | Up to 72 hours | 800
Microbiology | Blood Culture | Blood culture vial | Up to 72 hours | 1100
Special Tests | FNAC(1-Site) | Slide | Up to 24 hours | 1000
Special Tests | Biopsy Small | Con | Up to 4 days | 800
Special Tests | Biopsy Large | Con | Up to 6 days | 1600
Special Tests | Biopsy Medium | Con | Up to 4 days | 1200
Special Tests | Biopsy Radical | Con | Up to 6 days | 2500
Special Tests | Rapid COV Antigen | Kit | Up to 6 hours | 275
Special Tests | Covid RT-PCR | Ctm | Up to 6 hours | 700
Special Tests | Fluid Cytology | Con | Up to 8 hours | 300
Special Tests | PAP Conventional | Slide | Up to 48 hours | 800
Special Tests | PAP- LBC | Con | Up to 48 hours | 1100
Special Tests | HLB-27 | EDTA | Up to 48 hours | 2500
Special Tests | High Risk HPV PCR (14 serotypes) | PAP/Tissue | Up to 48 hours | 2800
Special Panels | Akshaya health check-up (Basic) | Plain | Up to 6 hours | 549 | Includes: CBC, Fasting blood sugar, SGPT, SGOT, Urea, Creatinine, Cholesterol, TGL, TSH
Special Panels | Akshaya Health Check-Up (Advanced) | Plain | Up to 6 hours | 999 | Includes: CBC, ESR, Blood Sugar, LFT, KFT, Lipid Profile, Thyroid Function, Urine R/E
Special Panels | Akshaya Health Check-Up (Complete) | Plain | Up to 8 hours | 1499 | Includes: CBC, Blood Sugar, LFT, KFT, Lipid Profile, TFT, Urine R/E, Vitamin D3, HbA1c
Special Panels | Akshaya Health Check-Up (Senior) | Plain | Up to 8 hours | 2199 | Includes: CBC, Blood Sugar, LFT, KFT, Lipid Profile, Thyroid Function, Urine R/E, Vitamin D3, HbA1c, Testosterone, PSA, HsCRP, RA factor
Special Panels | Diabetic Panel | Plain | Up to 6 hours | 699 | Includes: Blood Sugar Fasting+PP, HbA1c, Urine R/E, Urea, Creatinine, Lipid Profile
Special Panels | A.N.C(Antinatal Profile) | Plain | Up to 6 hours | 1500 | Includes: CBC, Blood Sugar, ABO, HIV, HBsAg, HCV, VDRL, TSH, Urine R/E
Special Panels | Preoprative Profile | Plain | Up to 6 hours | 1600 | Includes: CBC, Blood Sugar, PT, APTT, HIV, HBsAg, HCV, Urea, Creatinine
Special Panels | Fever Profile -1 | Plain | Up to 6 hours | 500 | Includes: CBC, ESR, Typhidot, PS for Malaria, Urine R/E
Special Panels | Fever Profile-2 | Plain | Up to 6 hours | 1500 | Includes: CBC, ESR, MP Ag (Rapid), Typhidot, Dengue Serology, CRP, Urine R/E
Special Panels | Shakti Female Wellness Plus Tests | Plain | Up to 8 hours | 1949 | Includes: CBC, ESR, GBP, Urine R/E, FBG, TSH, T3, T4, Lipid Profile, Urea, Creatinine, Iron Studies, Vit D3, Calcium, Testosterone, LH, FSH
