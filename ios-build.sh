#!/bin/bash

# Exit on any errors
set -e

echo "🧹 Cleaning up old build artifacts..."
rm -rf ios/Pods
rm -rf ios/build
rm -rf ~/Library/Caches/CocoaPods

echo "📦 Installing Node dependencies..."
npm install

echo "🔨 Generating iOS project files..."
npx expo prebuild --platform ios --clean

echo "📂 Navigating to iOS directory..."
cd ios

echo "🔄 Updating CocoaPods repositories..."
pod repo update

echo "📱 Installing iOS dependencies..."
pod install --repo-update

echo "✅ iOS build preparation completed!"
echo "You can now build the app in Xcode or run:"
echo "npx expo run:ios" 