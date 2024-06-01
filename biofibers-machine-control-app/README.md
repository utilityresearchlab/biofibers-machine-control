# Instructions for Running, Building, and Distributing the Biofibers Machine Control App

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
- To resolve this error, when you see the pop-up, go to `System Preferences` -> `Privacy and Security` -> Scroll Down -> Click "Allow" for the associatied security warning shown. 
- Note that you may have to click "cancel" in the first dialog window that appears for the security item to appear in System Preferences. 

## To compile app for Mac Distribution 
- If you want a MacOS Universal app, run `npm run pack-mac-unv`.
- If you want a MacOS x64 app, run `npm run pack-mac-x64`
- The output of either file will be present in the `dist` folder.
- Zip the app, then share.

## Handling the "App is Damaged Message" When Installing on MacOS
If you download an application from the internet, MacOS will tell you an application is damaged and you should move it to the trash. This is a safety feature to ensure users don't install applications that are not signed with a certificate and/or not from a verified developer. This will happen if you try to run our application. 

To open the application properly once you have downloaded the zip file, you must do the following:
1. Unzip the app
2. Open a terminal, and go to the directory of the .app file
3. Run the command, `xattr -c biofibers-machine-control.app`
4. Now, you should be able to open the application with out an issue.

You can find more information about this issue on this [Apple Discussions Forum Post](https://discussions.apple.com/thread/253714860?sortBy=best)

