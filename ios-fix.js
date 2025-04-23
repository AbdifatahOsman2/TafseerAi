const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to run after the prebuild process that modifies the Podfile
function fixPodfile() {
  const iosPath = path.join(__dirname, 'ios');
  const podfilePath = path.join(iosPath, 'Podfile');
  
  if (!fs.existsSync(podfilePath)) {
    console.log('Podfile not found. Run "npx expo prebuild" first.');
    return;
  }
  
  // Fix known issues
  try {
    // Clean Pod cache
    execSync('rm -rf ~/Library/Caches/CocoaPods', { stdio: 'inherit' });
    console.log('Cleaned CocoaPods cache.');
  } catch (error) {
    console.error('Error cleaning CocoaPods cache:', error.message);
  }
  
  let podfileContent = fs.readFileSync(podfilePath, 'utf8');
  
  // Add pod repo sources if not present
  const sources = [
    'source \'https://github.com/CocoaPods/Specs.git\'',
    'source \'https://cdn.cocoapods.org/\''
  ];
  
  for (const source of sources) {
    if (!podfileContent.includes(source)) {
      podfileContent = source + '\n' + podfileContent;
    }
  }
  
  // Force specific pod versions for Firebase
  const podFileModification = `
  # Fix Firebase dependencies
  pod 'Firebase', :modular_headers => true
  pod 'FirebaseCore', :modular_headers => true
  pod 'GoogleUtilities', :modular_headers => true
  pod 'RNFBApp', :path => '../node_modules/@react-native-firebase/app'
  pod 'RNFBFirestore', :path => '../node_modules/@react-native-firebase/firestore'
  $RNFirebaseAsStaticFramework = true
`;

  // Insert the modification before the end of the first target block
  podfileContent = podfileContent.replace(
    /target .* do([\s\S]*?)end/m,
    (match, targetContent) => {
      return `target 'TafseerAi' do${targetContent}${podFileModification}\nend`;
    }
  );
  
  fs.writeFileSync(podfilePath, podfileContent);
  console.log('Modified Podfile to fix Firebase dependencies');
}

// Run the fix
fixPodfile(); 