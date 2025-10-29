module.exports = {
  expo: {
    // === PROJECT IDENTITY ===
    name: "GasLT",
    slug: "gaslt",
    scheme: "gaslt",

    // === EAS CONFIGURATION ===
    extra: {
      eas: {
        projectId: "f52bfa5e-6cd2-432b-8acb-2c132c3d19f2"
      }
    },

    // === VERSION AND ENVIRONMENT ===
    version: "1.0.0",
    sdkVersion: "54.0.0",
    description: "A refined app for managing assets.",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",

    // === SPLASH SCREEN ===
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },

    // === iOS CONFIGURATION ===
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.gaslt",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },

    // === ANDROID CONFIGURATION ===
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.gaslt"
    },

    // === WEB CONFIGURATION ===
    web: {
      favicon: "./assets/favicon.png"
    },

    // === PLUGINS ===
    plugins: [
      "expo-asset",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#ffffff",
          image: "./assets/splash-icon.png"
        }
      ]
    ]
  }
};
