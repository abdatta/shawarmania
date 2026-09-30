## MODIFIED Requirements

### Requirement: The reader asks for the download, and receives a real file

Opening a receipt SHALL display the receipt and SHALL NOT begin a download.

The download SHALL be an ordinary navigation to the PDF's own address, served with
a PDF content type, an attachment disposition and a filename identifying the
business, the outlet and the bill number.

The PDF SHALL NOT be assembled in the reader's browser, and SHALL NOT be delivered
through a script-generated object URL.

No rendered receipt, in either format, SHALL be persisted.

Where the page is requested with `view=counter`, exactly, it SHALL omit the download
link, SHALL report its height to the page that framed it on load and whenever its
height changes, SHALL space its top and bottom evenly, SHALL show the bill number
and the time on one plain row, SHALL leave out the sentence
saying it is not a tax invoice, and SHALL otherwise show the same bill. No other value of any
parameter SHALL change the page, and the page without it SHALL carry no script.

> The counter view was added by `the-counter-views-the-receipt`, the child of ops
> #63. The ops counter frames this page in a sandbox that refuses downloads, where
> the link would be a dead control in front of a customer, and sizes its pop-up to
> the height this view reports.

#### Scenario: Downloading inside a chat application's browser

- **WHEN** the download is tapped inside an in-app browser
- **THEN** the file is delivered by ordinary navigation, with no dependence on
  script-driven download behaviour

#### Scenario: Opening the receipt

- **WHEN** a receipt link is opened
- **THEN** the receipt is displayed and nothing downloads on its own

#### Scenario: The counter's view

- **WHEN** a receipt is requested with `?view=counter`
- **THEN** the page carries no download link, and every row, total and note is the
  same as without it
