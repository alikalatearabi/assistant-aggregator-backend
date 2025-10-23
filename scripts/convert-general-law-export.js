const fs = require('fs');

function convertGeneralLawExport() {
  // Read the existing new-documents-export.json file
  const jsonData = JSON.parse(fs.readFileSync('new-documents-export.json', 'utf8'));
  
  // Convert to the custom format with filename, id, MinIO path, and dataset_id
  const customFormat = jsonData.map(doc => ({
    filename: doc.filename,
    id: doc._id,
    minioPath: `/documents/${doc._id}/${doc.filename.replace(/\s+/g, '_')}`,
    dataset_id: '68fa953c7a5728a95624fe7a' // general_law dataset ID
  }));
  
  // Write the updated JSON to a new file
  fs.writeFileSync('general-law-documents-export.json', JSON.stringify(customFormat, null, 2));
  
  console.log(`Converted ${customFormat.length} General Law documents with dataset_id: 68fa953c7a5728a95624fe7a`);
  console.log('Sample converted document:');
  console.log(JSON.stringify(customFormat[0], null, 2));
}

convertGeneralLawExport();
