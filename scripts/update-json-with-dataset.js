const fs = require('fs');

function updateJsonWithDataset() {
  // Read the existing JSON file
  const jsonData = JSON.parse(fs.readFileSync('vezarat-documents-export.json', 'utf8'));
  
  // Add dataset_id to each document
  const updatedData = jsonData.map(doc => ({
    ...doc,
    dataset_id: '68fa953c7a5728a95624fe7b' // vezarat_olom dataset ID
  }));
  
  // Write the updated JSON back to the file
  fs.writeFileSync('vezarat-documents-export.json', JSON.stringify(updatedData, null, 2));
  
  console.log(`Updated ${updatedData.length} documents with dataset_id: 68fa953c7a5728a95624fe7b`);
  console.log('Sample updated document:');
  console.log(JSON.stringify(updatedData[0], null, 2));
}

updateJsonWithDataset();
