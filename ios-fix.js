const fs = require('fs');
const path = require('path');

// Function to run after the prebuild process that modifies the Podfile
function fixPodfile() {
  const iosPath = path.join(__dirname, 'ios');
  const podfilePath = path.join(iosPath, 'Podfile');
  
  if (!fs.existsSync(podfilePath)) {
    console.log('Podfile not found. Run "npx expo prebuild" first.');
    return;
  }
  
  let podfileContent = fs.readFileSync(podfilePath, 'utf8');
  
  // Add pod repo source for Firebase if not present
  if (!podfileContent.includes('source \'https://github.com/CocoaPods/Specs.git\'')) {
    podfileContent = 'source \'https://github.com/CocoaPods/Specs.git\'\n' + podfileContent;
  }
  
  // Force specific pod versions for Firebase
  // This block would be inserted just before the end of the target 'TafseerAi' do block
  const podFileModification = `
  # Fix Firebase dependencies
  pod 'Firebase', :modular_headers => true
  pod 'FirebaseCore', :modular_headers => true
  pod 'GoogleUtilities', :modular_headers => true
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