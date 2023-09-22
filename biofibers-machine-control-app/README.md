# Instructions for Running and Building the Base Machine Control App

## Install the app
- Run `npm run install`

## Run / Debug the app
- Run `npm run start`

## Make the app for distribution using Electron Builder
- Run `npm run dist`

## Info about Packaging Apps for Mac/Windows/Linux Guide
https://stevenklambert.com/writing/comprehensive-guide-building-packaging-electron-app/#packaging-an-electron-app

## SECURITY WARNINGS ON MAC
- When attempting to run the app on MacOS, you may run into security errors like "fsevent.node" cannot be opened". 
- To resolve this errore, when you see the pop-up, go to `System Preferences` -> `Privacy and Security` -> Scroll Down -> Click "Allow" for the associatied security warning shown. 
- Note that you may have to click "click" in the dialog window that appears first for the security item to appear in System Preferences. 
