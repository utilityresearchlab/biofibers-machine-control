Desktop App to Control the Biofibers Spinning Machine

# Instructions for Running, Building, and Distributing the Biofibers Machine Control App

## Install the app
- Go to the project directory and run the following to setup a python virtual enviroment (this is required for MacOS Sonoma + Python 3.12 due to the removal of setuptools) 
    - `python3 -m venv .venv`
    - `source .venv/bin/activate`
    - `python3 -m pip install -r requirements.txt`
- Run `npm install`
- Alternatively, `npm run reinstall` will clear all node_modules and install them again

## Run / Debug the app
- Run `source .venv/bin/activate`
- Run `npm run start`

## Make the app for distribution using Electron Builder
- Run `source .venv/bin/activate`
- Run `npm run dist`

## Info about Packaging Apps for Mac/Windows/Linux Guide
https://stevenklambert.com/writing/comprehensive-guide-building-packaging-electron-app/#packaging-an-electron-app

## SECURITY WARNINGS ON MAC
- When attempting to run the app on MacOS, you may run into security errors like "fsevent.node" cannot be opened". 
- To resolve this error, when you see the pop-up, go to `System Preferences` -> `Privacy and Security` -> Scroll Down -> Click "Allow" for the associatied security warning shown. 
- Note that you may have to click "cancel" in the first dialog window that appears for the security item to appear in System Preferences. 

## Compiling the App
### MacOS Apps
- First run `source .venv/bin/activate`, then run one of the following commands:
- If you want a MacOS Universal app, run `npm run pack-mac-unv`.
- If you want a MacOS x64 app, run `npm run pack-mac-x64`
- If you want a MacOS arm64 app, run `npm run pack-mac-arm64`
- The output of either file will be present in the `out` folder.
- Zip the app, then share.

#### Handling the "App is Damaged Message" When Installing on MacOS
If you download an application from the internet, MacOS will tell you an application is damaged and you should move it to the trash. This is a safety feature to ensure users don't install applications that are not signed with a certificate and/or not from a verified developer. This will typically happen if you try to run our application. 

To open the application properly once you have downloaded the zip file, you must do the following:
1. Unzip the app
2. Open a terminal, and go to the directory of the .app file
3. Run the command, `xattr -c biofibers-machine-control.app`
4. Now, you should be able to open the application with out an issue.

You can find more information about this issue on this [Apple Discussions Forum Post](https://discussions.apple.com/thread/253714860?sortBy=best)

### Windows App
https://stevenklambert.com/writing/comprehensive-guide-building-packaging-electron-app/#packaging-an-electron-app

- To compile a x64 windows application, run `npm run pack-win-x64`
- The output app will be present in the `out` folder.


# Build Errors
- Build doesn't compile on MacOS Sonoma + Python 3.12 because node-gyp fails to compile serialport bindings:
    - Run `pip3 install setuptools` (you should probably run this in a virtual environment)
    - For more info see this [post](https://github.com/nodejs/node-gyp/issues/2992#issuecomment-2101781719)