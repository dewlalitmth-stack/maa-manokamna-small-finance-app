# माँ मनोकामना स्मॉल फाइनेंस — Windows Desktop

यह नया खाली (fresh) ऑफलाइन डेस्कटॉप प्रोजेक्ट है। पुराने ग्राहक/ऋण/भुगतान डेटा को इसमें कॉपी नहीं किया जाता।

## Windows EXE बनाना
1. इस पूरे प्रोजेक्ट को अपने GitHub repository में अपलोड करें (root में `package.json` और `.github` होना चाहिए)।
2. GitHub में **Actions** खोलें → **Build Windows EXE** → **Run workflow** दबाएं।
3. सफल होने पर workflow के नीचे **Artifacts** में `Maa-Manokamna-Windows-Installer` ZIP डाउनलोड करें।
4. ZIP खोलकर `Maa-Manokamna-Small-Finance-Setup-1.0.0.exe` चलाएं।

## डेटा और बैकअप
- मुख्य डेटा Windows के Electron user-data फ़ोल्डर में `data/ledger.json` में रहता है।
- बैकअप: `Documents\Maa Manokamna Backup`।
- ऐप बंद होने पर और हर 15 मिनट में बैकअप बनता है।
- Restore चुनी हुई JSON बैकअप फाइल को वर्तमान डेटा के स्थान पर रखता है। Restore से पहले वर्तमान डेटा का बैकअप बनता है।
- इस शुरुआती संस्करण में PIN सामान्य सुरक्षा लॉक है; संवेदनशील बैंक/आधार जानकारी इसमें न रखें।
