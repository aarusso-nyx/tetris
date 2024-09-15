// generateWordLists.js

const fs = require('fs');

// Load the raw word list from 'pt_BR.dic'
const rawWords = fs.readFileSync('pt_BR.dic', 'utf-8');

// Split the content into lines and process each line
let words = rawWords
  .split('\n')
  .map(line => {
    // Remove any carriage return characters (for Windows compatibility)
    line = line.replace('\r', '').trim();

    // Ignore empty lines
    if (!line) return null;

    // Split the line at the slash and take the first part
    const [word] = line.split('/');

    // Normalize the word to lowercase and trim whitespace
    return word.trim().toLowerCase();
  })
  .filter(word => word && /^[a-zà-ú]+$/.test(word)); // Filter out nulls and non-alphabetic entries

// Remove duplicates
words = Array.from(new Set(words));

// Filter words by length
const words5 = words.filter(word => word.length === 5);
const words6 = words.filter(word => word.length === 6);
const words7 = words.filter(word => word.length === 7);

// Save the filtered lists to JSON files
fs.writeFileSync('words5.json', JSON.stringify(words5, null, 2), 'utf-8');
fs.writeFileSync('words6.json', JSON.stringify(words6, null, 2), 'utf-8');
fs.writeFileSync('words7.json', JSON.stringify(words7, null, 2), 'utf-8');

console.log('Word lists have been generated and saved as JSON files.');