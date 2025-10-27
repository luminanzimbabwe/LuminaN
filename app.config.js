module.exports = {
  expo: {
    // === PROJECT IDENTITY (Updated to LuminaNDriver) ===
    name: "LuminaNDriver", // Updated Project Name
    slug: "luminandriver", // Updated Project Slug (to match new target)
    scheme: "luminandriver", // Updated Scheme
    owner: "privateluminan", // Project Owner
    
    // === EAS CONFIGURATION ===
    extra: {
      eas: {
        projectId: "9cbdfef3-79ff-4081-9a1a-4fe43322fe9c" // New Project ID
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
      bundleIdentifier: "com.luminandriver", // Updated Bundle Identifier
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
      package: "com.luminandriver", // Updated Package Name
      
      buildProperties: {
        android: {
          enableProguardInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
          useLegacyPackaging: true  
        }
      }
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
      ],
      [
        "expo-build-properties",
        {
          android: {
            kotlinVersion: "2.0.21"
          }
        }
      ],
      "react-native-edge-to-edge" 
    ]
  }
};