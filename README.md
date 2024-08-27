Exploratory interface for 1.78 million complaint/appeal submissions filed by federal prison inmates over 24 years, published by the Data Liberation Project. For access to raw data, see the DLP's website.

# Using the Dashboard
The dashboard interface has three primary components: the column control, the row filters, and the data display table.

## Column Control
The multi-select bar in the upper right corner controls which columns of data are displayed in the reactive table. Users can select
1-8 columns, and all columns stored in the API are available.

## Row Filters
Row filters are updated dynamically, with one filter for each column currently displayed (excepting Case Number). Like the API,
row filters accept exactly one value. When a filter is set, only rows where the relevant column equals that value will be returned.
Multiple filters can be set at once, but one filter cannot return multiple values in the same column without successive requests.

## Data Display Table
Displays, by default, 15 rows of data from the current query. Number of rows to display and current page to view can both be
customized by the user. Download CSV button exports up to 100,000 rows of data from the current query, regardless of what is currently
displayed on screen.

# API Access
Documentation to come