## ADDED Requirements

### Requirement: Legal and messaging links in the footer

The footer's fine-print block SHALL carry three links — Privacy, Terms and Messaging — navigating to
`/privacy/`, `/terms/` and `/messages/` respectively.

They SHALL be ordinary anchors to real documents, resolved against the configured base path, and
SHALL be present in the footer of the landing page because messaging review checks a brand's footer
for its privacy policy and terms.

#### Scenario: The footer offers the documents

- **WHEN** the landing page's footer is reached
- **THEN** Privacy, Terms and Messaging are present as links, and each navigates to its document

#### Scenario: A link is opened in a new tab

- **WHEN** a visitor opens the Privacy link in a new tab, or copies its address
- **THEN** the address is a shareable URL that loads the privacy document on its own

#### Scenario: Built for a project page

- **WHEN** the site is built with `VITE_BASE=/shawarmania/`
- **THEN** the three footer links resolve under `/shawarmania/` rather than the domain root

## REMOVED Requirements

### Requirement: Accessible legal modals

**Reason**: The modals cannot satisfy what this brand now needs from its privacy and terms copy. RCS
messaging review loads a brand's privacy policy and terms as URLs and reads them; a `<dialog>` inside
the React bundle has no URL, renders nothing with scripting disabled, and cannot be pasted into a
registration form. The requirement's closing promise — "No routes are introduced" — is precisely
what is being reversed.

Keeping the modals alongside the new documents would leave a second, shorter, differently worded
privacy statement inside the bundle, one commit away from contradicting the document a reviewer
reads. One statement, one place.

**Migration**: The two modal triggers become three footer anchors, specified above, and the copy they
held is superseded by the documents specified in `legal-pages`. `LegalModal.tsx` and its module CSS
are deleted; the footer was their only consumer. The accessibility the modals provided — focus trap,
Escape to close — is satisfied more simply by real pages, which bring real navigation, a working back
button, a shareable address and no focus management to get wrong.
