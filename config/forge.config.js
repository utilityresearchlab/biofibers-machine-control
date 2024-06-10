module.exports = {
  hooks: "require:./config/hooks.js",
  packagerConfig: {
    appId: "org.utilityresearchlab.biofiberscontrol",
    icon: "./icon/utility-icon-512x512",
    osxUniversal: {
      x64ArchFiles: "*"
    },
    mac: {
      category: "public.app-category.utilities"
    },
    win: {
      target: "portable"
    },
    linux: {
      target: "AppImage"
    }
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "biofibers_machine_control"
      }
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: [
        "darwin"
      ]
    },
    {
      name: "@electron-forge/maker-dmg",
      config: {
        icon: "icon/utility-icon-512x512.icns"
      }
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {}
    }
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-webpack",
      config: {
        mainConfig: "./config/webpack.main.config.js",
        renderer: {
          nodeIntegration: true,
          config: "./config/webpack.renderer.config.js",
          entryPoints: [
            {
              html: "./biofibers-machine-control-app/src/renderer/index.html",
              js: "./biofibers-machine-control-app/src/renderer/renderer.js",
              name: "main_window",
              preload: {
                js: "./biofibers-machine-control-app/src/main/preload.js"
              }
            }
          ]
        }
      }
    }
  ]
};