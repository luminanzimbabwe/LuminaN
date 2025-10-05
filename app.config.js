module.exports = {
  expo: {
    name: "LuminaN",
    slug: "LuminaN",
    version: "1.0.0",
    sdkVersion: "54.0.0",
    description: "A refined app for managing assets.",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    scheme: "luminan",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.luminan",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.luminan",

      buildProperties: {
        android: {
          enableProguardInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
          useLegacyPackaging: true  
        }
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-asset",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#ffffff",
          image: "./assets/splash-icon.png"
        }
      ],
      [
        "expo-build-properties",
        {
          android: {
            kotlinVersion: "2.0.21"
          }
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "bc0c9b12-b895-46e4-892f-7983df55b098" 
      }
    }
  }
};
