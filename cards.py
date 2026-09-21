cards = {'Which costing method is NOT permitted under International Financial Reporting Standards (IFRS)?': 'LIFO',
 'Test': 'Answer',
 'Another Question': 'Another Answer',
 'save this': 'answer',
 'test 2': 'test',
 'G/L Account': 'General Ledger Account = Hovedbokskonto',
 'Liability': 'Gjeld eller forpliktelse',
 'Account Type': 'Label som sier hvordan kontoen fungerer',
 'Account Category': 'Hva slags regnskapskategori den tilhører. Må tilhøre en '
                     'av følgende kategorier. (1) Assets - verdier som '
                     'bedriften eier. (2) Liabilities - Penger som bedriften '
                     'skylder alene. (3) Equity - aksjekapital, EK osv. (4) '
                     'Income - penger selskapet tjener. (5) Cost of goods '
                     '(COGS) - Direkte kostnader knyttet til det bedriften '
                     'selger. (6) Expense - Driftskostnader som ikke er '
                     'direkte nyttet til varen bedriften selger.',
 'Business Posting Group': 'Hvem du selger til',
 'Product Posting Group': 'Hva du selger',
 'Posting': 'Bokføring. Når man posterer et dokument, forteller vi BC at '
            'dokumentet er ferdig, og at BC kan opprette regnskapspostene som '
            'hører til.',
 'Direct Posting': 'Bokføring direkte mot en konto via en journal. Noen '
                   'kontoer styres av subledgers/reskontro.',
 'Reskontro': 'Detaljert oversikt over hvem som skylder penger og til hvem de '
              'skylder penger.',
 'Kundereskontro (Accounts Receivable)': 'Hvilke kunder som skylder deg '
                                         'penger, hvor mye de skylder deg, og '
                                         'ubetalte fakturaer.',
 'Leverandørreskontro (Accounts Payable)': 'Hvilke leverandører du skylder '
                                           'penger. Hvilke fakturaer som ikke '
                                           'er betalt.',
 'Subledger': 'Engelsk for en detaljert underbok/reskontro. Denne viser deg '
              'detaljene bak saldoen i hovedbokskontoen. Eksempel: 1500 '
              'Kundefordringer (hovedbokskonto) er på 15 000 kr. Reskontroen '
              'viser at kundene Iver AS og Daniel AS hhv. skylder 10 000 kr og '
              '5 000 kr.',
 'Hva er "Purchase Order" på norsk i BC?': 'Bestilling',
 'Hva er "Sales Order" på norsk?': 'Ordre',
 "BC er bygd på 'Navition', som opprinnelig ikke var en del av Microsoft. Hvor kommer selskapet som utviklet BC fra?": 'Danmark',
 'Har BC en CRM-modul?': 'Ja, men den er ikke så god.',
 'Hva er "Tilbud" på engelsk i BC?': 'Sales Quote',
 'Chart of Accounts': 'Kontoplan',
 'Journal': 'Kladd = En fane/side man forbereder postering før den bokføres',
 'General Journal': 'Finanskladd/Generell kladd = Den mest fleksible '
                    'journal-/kladdetypen',
 'Journal Batch': 'En samling av kladder hver bruker kan få, slik at man '
                  'slipper å redigere alle linjene hver gang man skal opprette '
                  'og postere en kladd.',
 'Fix Exchange Rate Amount': 'Felt som bestemmer hvilken side av valutakursen '
                             'som er låst fast når man beregner eller endrer '
                             'valutakursen.',
 'Bank Account Posting Group': 'BC skiller mellom en virkelig bankkonto (i DNB '
                               'f.eks.) og regnskapskontoen (1920 '
                               'Bankinnskudd). Fordi BC ikke automatisk vet at '
                               '1920 skal oppdateres når det kommer penger inn '
                               'på DNB-kontoen, har vi Bank Account Posting '
                               "Group. Når vi setter denne til 'BANK', så har "
                               'vi en regel som sier at når DNB-kontoen '
                               'endres, så er det 1920 som skal '
                               'oppdateres.Objektet (kunde, leverandør, '
                               'bankkonto) vet vanligvis bare hvillken posting '
                               'group den til.hører. Når BC vet hva slags '
                               'objekt det er, kanden finne ut hvilken konto '
                               'som skal oppdateresnår endringer skjer.',
 'Variable Allocation Account': 'Konto som brukes til å automatisk fordele et '
                                'beløp etter en bestemt fordelingsnøkkel. '
                                'Dersom Enora for eksempel betaler husleie på '
                                '100k, så skal 2/3 føres på '
                                'regnskapsavdelingen og resterende på Digital. '
                                'Når vi har postert 100k på 6300 Husleie, '
                                'kjører man en Allocation Account og får '
                                'følgende nye posteringer: 6300 Husleie, '
                                'Regnskap = 67k og 6300 Husleie, Digital = '
                                '33k.',
 'Hva menes med "Card" i BC?': 'En side som hjelper deg med å endre en '
                               'rad/objekt fra en tabell. Ex.: Item Card.',
 'Hva menes med "Document page" i BC?': 'Dokument Pages minner om "Card", men '
                                        'er sider som åpner detaljer rundt '
                                        'brukeroppgaver, som Purchase Orders '
                                        '(PO), Sales Order, Purchase Invoice '
                                        '(PI) osv.',
 'Statistical Account': 'Konto for å lagre ikke-finansiell data. Ex.: Antall '
                        'ansatte, avdelingsareal osv.',
 'Dimensjon': 'Tenk kolonne. En måte å merke transaksjoner med ekstra '
              'informasjon slik at man kan analysere regnskapet på flere måter '
              'uten å måtte opprette mange nye hovedbokskontoer. Typiske '
              'dimensjoner er Department, Project og Location.',
 'Default dimension': 'Dimensjon som foreslåls automatisk. Når for eksempel en '
                      "kostnad bliur ført på '6300 Husleie', så skal systemet "
                      'automatisk sette Department=Admin.',
 'Dimension requirement': 'En dimensjon som må være fylt ut for at man skal '
                          'kunne fortsette bokføring.',
 'Global dimension': 'De to første kolonnene i alle rader. Disse blir festet '
                     'og ligger alltid synlig.',
 'Shortcut dimension': 'Snarveiskolonner. Kan legge til 6 i tillegg til de to '
                       'glogbale.',
 'Default Dimension Priority': 'Regelen som avgjør hvilken verdi som vinner '
                               '(blir registrert) når flere objekterforeslår '
                               'ulike verdier for samme dimensjon. Dersom en '
                               "kunde med 'Project' = 'ABAR' legger inn en "
                               "salgsordre på en vare med 'Project' = "
                               "'AFLASK', og Customer har høyere prioritet enn "
                               "Item, blir resultatet 'ABAR'.",
 'Fiscal Year': 'Regnskapsår. Periode på 12 mnd. som foretak bruker til å '
                'utarbeide regnskapsår. For eksempel er det ikke '
                'hensiktsmessig for varehandelen å avslutte året 31. januar da '
                'det er i høysesong. Derfor har varehandelen ofte regnskapsår '
                'fra 1. februar til 31. januar.',
 'Straight Line Depreciation': 'Avskrivningsmetode der eiendelen avskrives med '
                               'samme beløpet hvert år. # Avskrivningsår må '
                               'defineres.',
 'DB1': 'Defining Balance 1 method. Avskrivningsmetode der verdien blir '
        'avskrevet med en prosentandel. Verdien avskrives med den summen '
        'biannually. Ex.= Declining balance % = 25%, Val_0 = 100. Val_jan_0 = '
        '100. Val_jun_0 = 100 - (halvparten av 100*25%) = 87,5. I des_0 skjer '
        'det samme, og verdien er 75. I jun_1 blir verdien 75 - (halvparten av '
        '75*25%). Samme summen trekkes fra i des_1. Osv.',
 'DB2': 'Declining Balance 2 method. Avskriviningsmetode der '
        'avskrivningsmengden er gitt ved følgende formel: DA = BV(1(1-P))^D. '
        'Ganske lik med DB1, men internt i et år skrives det av mer tidlig i '
        'året. Ser vi på året isolert sett, så blir avskrivningene de samme.',
 'External Document Number': 'Referansenummer fra ekstern part. Ex.: '
                             'Leverandørens fakturanummer eller leverandørens '
                             'kreditnotanummer.',
 'Costing Method': 'Hvordan vi skal verdsette lagerbeholdningen. Det er viktig '
                   'for å vite hvordan man skal regnskapsføre kostnadene. For '
                   'eksempel kjøper vi grandis to ganger - først på tilbud til '
                   '30 kr, så til 70 kr. Begge ligger i frysen ved siden av '
                   'hverandre. Vi spiser så en av dem (tilsvarer verdi på 100 '
                   'kr). Hvordan skal vi føre kostnadene? FIFO = 30kr. LIFO '
                   '(ulovlig) = 70kr. Average = 50kr. Specific = Hvilken '
                   'grandis spiste vi?',
 'Put-away and pick': 'Put-away er prosessen med å flytte varer fra '
                      'mottaksområdet til lagerplass (bin) etter at varene er '
                      'mottatt. Innlagring på norsk. Pick er plukk, altså '
                      'henting av varer fra lagerplassene for å klargjøre de '
                      'for levering.',
 'Directed put-away and pick': 'Den mest avanserte lagerkonfigurasjonen i BC. '
                               'Den lar ikke brukere flytte varer mellom bins. '
                               'Systemet styrer og optimaliserer '
                               'lageroperasjonene med egne dokumenter og '
                               'regler.',
 'SKU': 'Stockkeeping unit. Et objekt/rad/enhet som holder informasjon om en '
        'vare for spesifikke plasseringer, varianter eller begge. F.eks. vil '
        'aero bars lagret på fabrikken (main), intersport (distribusjonssenter '
        '1) og XXL (distribusjonssenter 2) representere 3 SKUer.',
 'Best Price Principle': 'BC finner automatisk den beste prisen eller rabatten '
                         'kunden har krav på. Ex.: Skal jeg benytte meg av 3 '
                         'for 2 eller 30% rabatt?',
 'test3': 'test3'}
