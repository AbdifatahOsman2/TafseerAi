# Quran Reciter Feature

This feature allows users to select their preferred Quran reciter for audio playback in the TafseerAi app.

## Features

- Choose from multiple renowned Quran reciters
- Persistent selection saved using AsyncStorage
- Audio playback for individual ayahs
- Audio playback for entire surahs (plays first ayah)
- Reciter selection available in the Profile settings screen

## Available Reciters

The app currently supports the following reciters:

- Mishary Rashid Alafasy (default)
- Abdul Basit Murattal
- Abdurrahmaan As-Sudais
- Ahmed ibn Ali al-Ajamy
- Hani Rifai
- Mahmoud Khalil Al-Husary
- Mahmoud Khalil Al-Husary (Mujawwad)
- Maher Al Muaiqly
- Mohamed Siddiq al-Minshawi
- Mohamed Siddiq al-Minshawi (Mujawwad)
- Muhammad Ayyoub
- Muhammad Jibreel
- Ibrahim Walk (English)

## Implementation Details

The reciter selection is managed through React Context API, which provides the selected reciter state to all components that need it. 

Key components:
- `ReciterContext.js`: Manages reciter state and provides context
- `ReciterSettingsScreen.js`: UI for selecting reciters
- `SurahDetailScreen.js`: Uses selected reciter for audio playback

## API Usage

We exclusively use the alquran.cloud API for audio playback to ensure reliability. The app avoids using CDN links directly due to potential connectivity issues.

### API Endpoints

For individual ayahs (used for both single ayah and surah playback):
```
https://api.alquran.cloud/v1/ayah/${ayahNumber}/${reciterId}
```

The API returns the audio URL in the response, which we then use for playback:
```json
{
  "code": 200,
  "status": "OK",
  "data": {
    "number": 1,
    "audio": "https://audio.example.com/ayah.mp3",
    "text": "...",
    "edition": {
      "identifier": "ar.alafasy",
      "language": "ar",
      "name": "Mishary Rashid Alafasy",
      ...
    }
  }
}
```

### Audio Playback Implementation

For individual ayahs:
1. Fetch the ayah data from the API with the selected reciter
2. Extract the audio URL from the response
3. Create an Audio sound object and play it

For full surahs:
1. Calculate the first ayah number of the surah
2. Fetch the first ayah data from the API
3. Play the audio URL from the response
   
Note: Full surah playback currently only plays the first ayah. Future updates may implement continuous playback of all ayahs in a surah.

## Future Improvements

- Implement continuous playback of all ayahs in a surah
- Add downloading capability for offline listening
- Add more reciters based on user feedback
- Allow users to set default playback speed
- Implement audio caching for frequently played ayahs 