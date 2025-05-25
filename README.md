# Biofibers Machine Control Desktop Application
The application is the companion to the [Desktop Biofibers Spinning Machine](https://github.com/utilityresearchlab/desktop-biofibers-spinning). It makes it much easier to send commands, and control the spinning process compared to other g-code based interfaces. It is currently available for MacOS and Windows.

<img width="400" alt="Screenshot 2025-05-24 at 10 34 34 PM" src="https://github.com/user-attachments/assets/ea6ced0a-d474-43f2-9ccf-06404f2c8780" />
<img width="400" alt="Screenshot 2025-05-24 at 10 32 20 PM" src="https://github.com/user-attachments/assets/bcd75dcd-f69e-42fe-8962-07ce5166ee25" />

## Instructions for Downloading and Using the Application
This repository houses the source code of the application if you are curious, but we make it easy for you to use the application without compiling code! 

**To get started using the application, simply [download the latest release](https://github.com/utilityresearchlab/biofibers-machine-control/releases) for your operating system.**

## Getting Help
Join our Discord server for help getting started or if you run into any errors with the application: https://discord.gg/vDmk3t2FMX

-----

## Development (Advanced Users) - Instructions for Running, Building, and Distributing from the Source Code
### On MacOS (>= Sonoma 14.5)
#### Installing the App on MacOS
0. Install NVM, Node and NPM using directions on (Nodejs.org)[https://nodejs.org/en/download]
1. Go to the project directory, and run the following to setup a python virtual enviroment (this is required for MacOS Sonoma + Python 3.12 due to the removal of setuptools) 
    - `python3 -m venv .venv`
    - `source .venv/bin/activate`
    - `python3 -m pip install -r requirements.txt`
2. Run `nvm install` to install the node version
3. Run `nvm use` to activate the node version
4. Run `npm install` to install the packages
5. Alternatively, `npm run reinstall` will clear all node_modules and install them again

#### Running / Debugging the App on MacOS
0. Run `nvm use` to activate the proper node version
1. Run `source .venv/bin/activate` to activate the python Venv
2. Run `npm run start`

##### Build Errors on MacOS
- You should accept Xcode License in terminal using: `sudo xcodebuild -license accept`
- If build doesn't compile on MacOS Sonoma + Python 3.12 because node-gyp fails to compile serialport bindings:
    - Run `pip3 install setuptools` (you should probably run this in a virtual environment)
    - For more info see this [post](https://github.com/nodejs/node-gyp/issues/2992#issuecomment-2101781719)

##### SECURITY WARNINGS ON MAC
- When attempting to run the app on MacOS, you may run into security errors like "fsevent.node" cannot be opened". 
- To resolve this error, when you see the pop-up, go to `System Preferences` -> `Privacy and Security` -> Scroll Down -> Click "Allow" for the associatied security warning shown. 
- Note that you may have to click "cancel" in the first dialog window that appears for the security item to appear in System Preferences. 

#### Packaging App for Different Platforms on MacOS
##### Packaging MacOS Apps on MacOS
1. First run `nvm use && source .venv/bin/activate`, then run one of the following commands:
2. If you want a MacOS Universal app, run `npm run pack-mac-unv`.
3. If you want a MacOS x64 app, run `npm run pack-mac-x64`
4. If you want a MacOS arm64 app, run `npm run pack-mac-arm64`
5. The output of either file will be present in the `out/` folder within a sub-folder named by current date of format `{year}-{month}-{day}`.  
6. Zip the app, then share.

###### Handling the "App is Damaged Message" When Installing on MacOS
If you download an application from the internet, MacOS will tell you an application is damaged and you should move it to the trash. This is a safety feature to ensure users don't install applications that are not signed with a certificate and/or not from a verified developer. This will typically happen if you try to run our application. 

To open the application properly once you have downloaded the zip file, you must do the following:
1. Unzip the app
2. Open a terminal, and go to the directory of the .app file
3. Run the command, `xattr -c biofibers-machine-control.app`
4. Now, you should be able to open the application with out an issue.

You can find more information about this issue on this [Apple Discussions Forum Post](https://discussions.apple.com/thread/253714860?sortBy=best)

#### [NOT WORKING] Packaging Windows App on MacOS
- The instructions below do not appear to work on MacOS due to its lack of support for Squirrel Distributions; see this [github issue](https://github.com/electron/forge/issues/3142).
- To build the app for Windows (on a mac), you must first install wine and mono. See these guides for reference:
    1. [Packaging Apps with Electron-Forge](https://stevenklambert.com/writing/comprehensive-guide-building-packaging-electron-app/#packaging-an-electron-app) 
    2. [Installing Wine on a Mac](https://github.com/Gcenx/wine-on-mac)
    3. With HomeBrew Installed already, in your terminal run `brew install --cask --no-quarantine wine@staging`
    4. Then run `brew install mono`

##### Build the App for Windows on MacOS
1. To compile a x64 windows application, run `npm run pack-win-x64`
2. The output app will be present in the `out` folder.

### On Windows 10 (x64)
#### Installing the App on Windows 10 
0. Install NVM, Node and NPM using directions on (Nodejs.org)[https://nodejs.org/en/download]
1. Clone the repository
2. Go to repository folder: `cd .\biofibers-machine-control\`
3. Create Python Venv: `python3 -m venv .venv`
4. Activate Python Venv: `. .\.venv\Scripts\activate`
5. Install Python package requirements: `pip install -r requirements.txt`
6. Install Node Environment: 
	- Allow install of remote signed packages: 
        `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`
	- Installs fnm (Fast Node Manage): 
	    `winget install Schniz.fnm`
	- Configure fnm environment:
	    `fnm env --use-on-cd | Out-String | Invoke-Expression`
	- Download and install Node.js:
	    `fnm use --install-if-missing`
	- Verifies the right Node.js version is in the environment
	    `node -v # should print node version in .nvmrc` 
	- Verifies the right npm version is in the environment
	    `npm -v # should print npm version`
7. With Node Env set-up and active, install NPM packages: `npm install`

#### Running the App on Windows
1. Activate Python Venv: `. .\.venv\Scripts\activate`
2. Activate the node env `fnm use --install-if-missing`
3. To Start app run: `npx electron-forge start`

##### Build Errors on Windows 10
1. If the build fails: `Error: Could not find any Visual Studio installation to use` appears from Node-gyp, follow instructions at the following link to install visualstudio2022-workload-vctools using Chocolately:https://github.com/nodejs/node-gyp?tab=readme-ov-file#on-windows


#### Packaging App for Windows on Windows:
1. Activate Python Venv and Node env activated
2. Run: `npx electron-forge package --platform='win32' --arch='x64'`
3. The output of either file will be present in the `out/` folder within a sub-folder named by current date of format `{year}-{month}-{day}`.  
4. Zip the app, then share.


##### Other references for Packaging Apps
- Info about Packaging Apps for Mac/Windows/Linux Guide: https://stevenklambert.com/writing/comprehensive-guide-building-packaging-electron-app/#packaging-an-electron-app
