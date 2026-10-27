# Brevo DOI email templates — DNS Digital Pass (IT / DE / EN)

**Sender for all:** Dolomiti NordicSki <welcome@dolomitinordicski.com>  
**List ID after confirmation:** 13 — DNS Digital Pass Marketing  
**Template type:** Brevo transactional email with double-opt-in confirmation link  
**Required button URL exactly:** `{{ params.DOIurl }}`  
**Do not send a standard marketing campaign as the confirmation email.**  
**Do not put a physical pass number, short activation code, or QR in the email.**

## IT — DNS Digital Pass | Conferma newsletter
**Subject:** Conferma l'iscrizione alle novità di Dolomiti NordicSki

Ciao,

hai richiesto di ricevere via email le novità e le comunicazioni di Dolomiti NordicSki.

Per confermare la tua iscrizione, seleziona il pulsante qui sotto.

**[Conferma l'iscrizione]** → `{{ params.DOIurl }}`

Se non hai richiesto l'iscrizione, ignora questo messaggio. Il tuo Digital Pass rimane utilizzabile indipendentemente dalla scelta di ricevere la newsletter.

Un saluto,  
Il team Dolomiti NordicSki

## DE — DNS Digital Pass | Newsletter bestätigen
**Subject:** Bitte bestätige deine Anmeldung zum Dolomiti NordicSki Newsletter

Hallo,

du hast dich dafür entschieden, Neuigkeiten und Informationen von Dolomiti NordicSki per E-Mail zu erhalten.

Bitte bestätige deine Anmeldung über die Schaltfläche unten.

**[Newsletter-Anmeldung bestätigen]** → `{{ params.DOIurl }}`

Wenn du dich nicht angemeldet hast, ignoriere diese E-Mail. Dein Digital Pass funktioniert unabhängig davon, ob du den Newsletter abonnierst.

Sportliche Grüße  
Dein Dolomiti NordicSki Team

## EN — DNS Digital Pass | Confirm newsletter subscription
**Subject:** Confirm your Dolomiti NordicSki newsletter subscription

Hello,

you requested to receive news and updates from Dolomiti NordicSki by email.

Please confirm your subscription using the button below.

**[Confirm subscription]** → `{{ params.DOIurl }}`

If you did not request this subscription, you can ignore this message. Your Digital Pass remains available whether or not you subscribe.

Best regards,  
The Dolomiti NordicSki Team

## Setup and acceptance checklist
1. Verify sender address and sending domain in Brevo (SPF/DKIM).
2. Create 3 transactional DOI templates (one per language), use the required button variable in each. Save their template IDs in backend configuration.
3. Set a real HTTPS confirmation page in DNS; clicking the link must not issue a new pass.
4. Verify API key is loaded exclusively from Secret Manager.
5. Test with a controlled address: **not yet in list 13** immediately after DOI request; added only after clicking confirmation.
6. Test prior unsubscribes/suppressions and DNS consent withdrawal before deploying.
7. Marketing status remains independent of Digital Pass activation, Wallet delivery and QR validation.

Reference: https://developers.brevo.com/reference/create-doi-contact
