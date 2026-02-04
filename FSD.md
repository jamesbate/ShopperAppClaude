# Functional specification document: Shopper app.
## Overview
An app that assists with grocery shopping. The app keeps a shared shopping list, allows items to be scanned while shopping, balances how much users pay, and reminds the user when items expire. Scanned items are categorised, allowing for basic breakdowns on how much is spend on each category. Scanning works using by recording a video of the item using the phone's camera, while the user rotates the item. Al is used to extract the barcode, expiry date, and other relevant information.
## System/architecture
- The app should run on android devices.
- In scanning mode, the app takes a video of the item as the user rotates. Al should be used to infer what that item is, which involves recognising the expiry date printed on the item, and reading the barcode, if possible. - Metadata of each item stored, and reused if the same item is scanned again.
-
## Functional requirements
### Shared shopping list
A shopping list is shared between users in a group. Each user can add, remove or modify elements. Those elements can include hyperlinks, or barcode information. The list has a history, and suggests previously added items as a user types the elements name.
### Barcode scanning
The app allows users to scan barcodes of items via the phone's camera. The user presses a scan button, promping the phone to record a video. Al analysis that video, attempting to identify the item, barcode, expiry date, and other relevant information, and the phone notifies the user when the the scan was successful. The metadata obtained from that scan is stored alongside the associated item. Scanning of e.g. vegetables relies solely on Al recognition. Items on the shopping list are automatically removed when the item is scanned. ### Finance balancing
As users scan items, they are prompted for the price. That price is then stored and associated with the barcode. Next time that item is scanned, the price will be automatically suggested, allowing the users to press okay, or edit if there is an offer.
### Expiry management
Expiry dates are either read directly from the item via the scan, or guessed in other cases (e.g. vegetables). Users can change the status of items from closed to open. Users are reminded when each item expires.
## Possible future directions
Recipe suggestion based on what items are available, taking into account how to use food before it expires.
