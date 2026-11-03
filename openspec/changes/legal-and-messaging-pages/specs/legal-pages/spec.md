## ADDED Requirements

### Requirement: Three legal documents, each at its own permanent URL

The site SHALL serve three standalone documents at the directory URLs `/privacy/`, `/terms/` and
`/messages/`.

Each SHALL be a separate document rather than a state of the landing page. None SHALL be reachable
only through a modal, a fragment or a client-side route.

These URLs are published to a messaging regulator and printed in receipt small print. They SHALL NOT
be renamed or removed while the RCS agent registration referencing them is live.

#### Scenario: A document is opened cold

- **WHEN** `https://shawarmania.in/privacy/` is requested directly, with no prior visit to the site
- **THEN** the privacy document is served with HTTP 200 and its full text

#### Scenario: No landing page is required first

- **WHEN** any of the three URLs is opened without the landing page ever having loaded
- **THEN** the document renders completely, and the landing page's bundle is not required to do so

### Requirement: The documents render without JavaScript

Each document SHALL be complete in its served HTML. It SHALL NOT load React, GSAP, Lenis, or any
script, and SHALL NOT depend on script execution to render text, styling or navigation.

#### Scenario: A reviewer with scripting disabled

- **WHEN** any of the three documents is loaded in a browser with JavaScript disabled
- **THEN** the entire text renders, styled, and every link on the page is followable

#### Scenario: No script is served

- **WHEN** the served HTML of any of the three documents is inspected
- **THEN** it contains no `<script>` element

### Requirement: The privacy document discloses what messaging review requires

`/privacy/` SHALL state, in plain language:

- what is collected — a mobile number given at the counter, and the contents of the bill it belongs
  to;
- why it is collected — to send that customer their own bill, to recognise a returning customer
  at the counter, and to keep that customer's points and gold at the outlet that gave them;
- that the menu price is the same whether or not a number is given, and that giving one is what
  earns points;
- that points and gold belong to the outlet that gave them, and that removing a number ends them;
- that a mobile number and messaging consent SHALL NOT be sold, rented, or disclosed to any third
  party for that party's own marketing;
- who does process it on the business's behalf, by role — the messaging provider that delivers the
  message, WhatsApp when the counter sends a receipt there because an SMS did not get through, and
  the systems that hold the bill;
- what opening a receipt link records, exactly as ops records it (the time, a salted digest of the
  network address rather than the address, and the browser's identifier);
- how long it is kept, and how a customer asks for it to be removed;
- that ordering through a delivery platform happens under that platform's own policy, not this one;
- the named legal entity, the outlet the document speaks for with its own FSSAI licence, a contact
  email and a contact phone number.

#### Scenario: The phone-number disclosure is present

- **WHEN** `/privacy/` is read
- **THEN** it states how a mobile number is collected, what it is used for, and that it is not sold
  or passed to third parties for their own marketing

#### Scenario: The document names who is responsible

- **WHEN** `/privacy/` is read
- **THEN** it names the legal entity operating the brand, a reachable email address, and a reachable
  phone number

### Requirement: The terms document covers the site and the messaging programme

`/terms/` SHALL carry the website terms — that menu, prices and hours may change and the counter
price governs, and that brand assets belong to the business — and SHALL carry a distinctly headed
messaging section stating: what messages the programme sends, that it sends roughly one per bill,
that message and data rates may apply, how to get help, and that leaving the number out of a bill
is how to not receive that bill's SMS. It SHALL NOT promise replying STOP or a messaging preference,
because neither exists.

#### Scenario: The messaging section is reachable

- **WHEN** `/terms/` is read
- **THEN** a clearly headed section describes the messaging programme, its frequency, its cost to the
  recipient, how to get help, and that skipping the number skips the SMS

### Requirement: The opt-in document describes the real consent, and links the other two

`/messages/` SHALL state how consent is actually obtained, as `receipt-messaging` defines it: giving
a valid mobile number at the counter for a bill is the opt-in to one receipt SMS for that bill. It
SHALL NOT describe a separate consent question, and SHALL NOT present any sentence as wording the
counter says or shows unless the ops counter actually says or shows it.

It SHALL state what arrives, from whom, and how often, including that the counter may send the same
receipt link on WhatsApp when an SMS does not get through.

It SHALL say how not to receive a receipt SMS — leave the number out of that bill — and SHALL offer
help through a `tel:` link to a number that is answered and a `mailto:` link to a mailbox that is
read. It SHALL NOT promise replying STOP, a stop setting or any other messaging preference, because
the sender cannot receive replies and ops keeps no such preference. It SHALL keep a request to remove
a customer's details distinct from not receiving an SMS, pointing to `/privacy/` for the former.

It SHALL NOT offer a channel a customer cannot actually reach the business through. In particular a
WhatsApp contact SHALL be offered only when a WhatsApp number that receives messages is configured;
a broadcast channel SHALL NOT be presented as one, because a channel cannot be replied to.

It SHALL link `/terms/` and `/privacy/`, and those links SHALL be visible without scrolling on a
375 px-wide viewport.

`/messages/` SHALL NOT present a form, a checkbox or any other web mechanism that implies consent can
be given or recorded on the website, because no such mechanism exists.

#### Scenario: A customer does not want a receipt SMS

- **WHEN** a customer opens `/messages/` on a phone
- **THEN** it tells them to leave their number out of the bill, offers tappable call and email help,
  and promises no STOP reply and no stop setting

#### Scenario: A customer wants their details removed

- **WHEN** a customer reads `/messages/` looking to be forgotten
- **THEN** it points them to `/privacy/` for removal, separately from skipping an SMS

#### Scenario: A channel that cannot receive messages

- **WHEN** no WhatsApp number that receives messages is configured in the content layer
- **THEN** `/messages/` offers no WhatsApp contact, and does not substitute the broadcast channel
  for one

#### Scenario: The required links are reachable from the opt-in page

- **WHEN** `/messages/` is loaded at 375 px width
- **THEN** links to both `/terms/` and `/privacy/` are present above the fold

#### Scenario: No consent is collected on the web

- **WHEN** `/messages/` is inspected
- **THEN** it contains no form, checkbox or submit control

### Requirement: Business facts on the documents come from the content layer

Every business fact the three documents state — the legal entity name, outlet addresses, FSSAI
licence numbers, contact email and contact phone numbers — SHALL be resolved at build time from
`src/data/*.json` through the shared zod schemas, and SHALL NOT be typed into the documents'
markup.

The build SHALL fail if a document reaches the output with an unresolved placeholder, whether because
the value is absent or the path is misspelt.

An outlet's facts SHALL be addressable only by that outlet's identity. The injection mechanism SHALL
NOT offer an aggregate across every outlet — a joined licence string, a count — because that is what
puts an outlet into a legal document that the document does not speak for. Naming a second outlet
SHALL require naming it.

The mechanism SHALL NOT hardcode which outlet trades, so that closing one, or opening a third,
changes the documents and not the plumbing.

#### Scenario: A document speaks for one outlet

- **WHEN** the three documents are built while the business trades from one outlet
- **THEN** they state that outlet's address and its own FSSAI licence, and no other outlet's

#### Scenario: A fact is corrected once

- **WHEN** an FSSAI licence number is changed in `src/data/outlets.json` and the site is rebuilt
- **THEN** every document stating that number states the new one, with no document edited

#### Scenario: An unresolvable placeholder fails the build

- **WHEN** a document references a data path that does not resolve to a value
- **THEN** the build fails naming the document and the placeholder, and no output is published

### Requirement: The documents are legible, brand-faithful and printable

Each document SHALL use the site's existing design tokens and typefaces, SHALL constrain body text
to a readable measure rather than the full viewport width, SHALL render without horizontal scrolling
at 375 px, and SHALL carry a print stylesheet so a customer can keep a copy.

Reusing the site's typefaces SHALL NOT add font files to the build output.

#### Scenario: Read on a phone

- **WHEN** any of the three documents is opened at 375 px width
- **THEN** the text is readable, no horizontal scrolling is required, and links are comfortably
  tappable

#### Scenario: The build output gains no fonts

- **WHEN** the page-weight report runs after this change
- **THEN** the font files in the output are the same files, of the same count, as before it

### Requirement: The documents are base-path independent

No document SHALL hardcode a root-relative URL for an asset or for a link to another document. Every
such reference SHALL be resolved from the configured base path.

#### Scenario: Built for a project page

- **WHEN** the site is built with `VITE_BASE=/shawarmania/`
- **THEN** each document's stylesheet and its links to the other two documents resolve under
  `/shawarmania/`
